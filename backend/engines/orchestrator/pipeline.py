from __future__ import annotations

from dataclasses import dataclass

from backend.api.v1.schemas.common import BBox
from backend.api.v1.schemas.layout import (
    DoorModel,
    GenerateLayoutsRequest,
    GenerateLayoutsResponse,
    LayoutCandidate,
    RoomPlacement,
    StructuredQuestionOut,
)
from backend.engines.constraints import ConstraintEngine
from backend.engines.geometry.engine import GeometryEngine
from backend.engines.layout.door_placer import DoorPlacer
from backend.engines.layout.generator import LayoutGenerator
from backend.engines.layout.hard_constraints import HardConstraintConfig, validate_layout_hard
from backend.engines.layout.models import Door
from backend.engines.building import BuildingGenerator, StairPlacer, VerticalConstraintEngine
from backend.engines.questions import QuestionEngine
from backend.engines.questions.answer_processor import AnswerProcessor
from backend.engines.questions.models import UserInputState
from backend.engines.scoring.scorer import ScoringEngine
from backend.utils.geo_utils import polygon_to_coords


def _user_input_from_request(req: GenerateLayoutsRequest, buildable_area: float) -> UserInputState:
    room_specs = [
        {"name": r.name, "target_area": float(r.target_area), "category": getattr(r, "category", "public")}
        for r in req.rooms
    ]
    total_req = sum(float(r.target_area) for r in req.rooms)
    user_answers = req.user_answers or {}
    answered_ids = frozenset(user_answers.keys())
    answered_cats = frozenset()
    for qid in answered_ids:
        if qid.startswith("q_") and "_" in qid[2:]:
            cat = qid[2:].rsplit("_", 1)[0]
            answered_cats = answered_cats | {cat}
    return UserInputState(
        gate_direction=req.plot.gate_direction or "south",
        room_specs=room_specs,
        setback_m=float(req.setback_m),
        buildable_area_m2=buildable_area,
        total_requested_area_m2=total_req,
        answered_question_ids=answered_ids,
        answered_categories=answered_cats,
        user_answers=dict(user_answers),
    )


def _to_structured_out(q) -> StructuredQuestionOut:
    return StructuredQuestionOut(
        id=q.id,
        text=q.text,
        type=q.type,
        options=list(q.options),
        default=q.default,
        category=q.category,
        why_it_matters=q.why_it_matters,
        constraint_impact=list(q.constraint_impact),
        priority=q.priority,
    )


@dataclass(frozen=True)
class LayoutPipeline:
    geometry: GeometryEngine
    layout: LayoutGenerator
    scoring: ScoringEngine
    constraints: ConstraintEngine
    door_placer: DoorPlacer
    question_engine: QuestionEngine
    answer_processor: AnswerProcessor
    building_generator: BuildingGenerator
    stair_placer: StairPlacer
    vertical_constraints: VerticalConstraintEngine

    def execute(self, req: GenerateLayoutsRequest) -> GenerateLayoutsResponse:
        plot_valid = self.geometry.validate_polygon(req.plot.points)
        plot_area = self.geometry.area(plot_valid)
        plot_bbox = self.geometry.bounding_box(plot_valid)

        buildable_valid = self.geometry.setback(plot_valid, req.setback_m)
        buildable = buildable_valid.polygon
        buildable_area = float(buildable.area)
        min_x, min_y, max_x, max_y = buildable.bounds
        buildable_bbox = BBox(
            min_x=float(min_x),
            min_y=float(min_y),
            max_x=float(max_x),
            max_y=float(max_y),
        )

        # QUESTION_GENERATION stage (before constraint compilation / layout)
        user_input = _user_input_from_request(req, buildable_area)
        score_breakdown = getattr(req, "last_score_breakdown", None) or {}
        pending = self.question_engine.generate_questions(
            user_input,
            score_breakdown=score_breakdown if score_breakdown else None,
        )
        pending_out = [_to_structured_out(q) for q in pending]
        user_answers = req.user_answers or {}
        all_answered = len(pending) == 0 or all(q.id in user_answers for q in pending)
        if pending and not all_answered:
            return GenerateLayoutsResponse(
                plot_area_m2=float(plot_area),
                plot_bbox=plot_bbox,
                buildable_area_m2=buildable_area,
                buildable_bbox=buildable_bbox,
                buildable_polygon=polygon_to_coords(buildable),
                candidates=[],
                pending_questions=pending_out,
            )

        # Optional: apply answer-derived weight adjustments when proceeding to layout
        weights_override = None
        if user_answers:
            update = self.answer_processor.process_answers(user_answers)
            if update.scoring_weight_adjustments:
                base = dict(self.scoring.DEFAULT_WEIGHTS)
                for dim, delta in update.scoring_weight_adjustments.items():
                    base[dim] = max(0.0, base.get(dim, 0) + delta)
                total_w = sum(base.values())
                if total_w > 0:
                    scale = 100.0 / total_w
                    weights_override = {k: v * scale for k, v in base.items()}

        # Deterministic seeding: same input + generation_seed => same candidate stream
        base_seed = int(req.generation_seed)

        # Hard constraints pass before scoring; generate extra attempts deterministically
        attempt_multiplier = 10
        attempt_count = int(req.num_candidates) * attempt_multiplier
        raw_layouts = self.layout.generate_candidates(
            buildable=buildable,
            room_specs=req.rooms,
            num_candidates=attempt_count,
            seed=base_seed,
        )

        cfg = HardConstraintConfig(min_room_dim_m=2.0, min_room_area_m2=4.0)
        layouts_with_doors: list[tuple[object, list[Door]]] = []
        for lay in raw_layouts:
            ok, _reasons = validate_layout_hard(lay, buildable=buildable, cfg=cfg)
            if not ok:
                continue

            doors = self.door_placer.place_doors(
                layout=lay,
                buildable_polygon=buildable,
                gate_direction=req.plot.gate_direction,
                floor_number=0,
            )

            hc_ok, _violations = self.constraints.check_connectivity(lay, doors)
            if not hc_ok:
                continue

            layouts_with_doors.append((lay, doors))
            if len(layouts_with_doors) >= int(req.num_candidates):
                break

        if not layouts_with_doors:
            return GenerateLayoutsResponse(
                plot_area_m2=float(plot_area),
                plot_bbox=plot_bbox,
                buildable_area_m2=float(buildable_area),
                buildable_bbox=buildable_bbox,
                buildable_polygon=polygon_to_coords(buildable),
                candidates=[],
                pending_questions=[],
            )

        num_floors = max(1, int(getattr(req, "num_floors", 1)))
        buildings_for_scoring: list | None = None
        if num_floors > 1:
            buildings_for_scoring = []
            for lay, doors in layouts_with_doors:
                b = self.building_generator.generate_building(
                    lay,
                    doors,
                    buildable,
                    num_floors,
                    req.plot.gate_direction or "south",
                )
                self.stair_placer.place_stairs(b)
                buildings_for_scoring.append(b)
        scored = self.scoring.score(
            layouts_with_doors,
            buildable=buildable,
            gate_direction=req.plot.gate_direction,
            weights=weights_override,
            num_floors=num_floors,
            buildings=buildings_for_scoring,
        )
        scored = scored[: int(req.num_candidates)]

        door_map = {
            lay.candidate_id: doors for lay, doors in layouts_with_doors
        }

        # BUILDING_GENERATION stage (validation; best candidate already built above)
        if num_floors > 1 and scored and buildings_for_scoring:
            building = buildings_for_scoring[0]
            _ok, _violations = self.vertical_constraints.validate(building)
            # Reject best candidate if validation fails (optional: filter all by validate)
            if not _ok and _violations:
                pass

        candidates: list[LayoutCandidate] = []
        for s in scored:
            rooms: list[RoomPlacement] = []
            for r in s.layout.rooms:
                poly_coords = polygon_to_coords(r.polygon)
                centroid = (float(r.polygon.centroid.x), float(r.polygon.centroid.y))
                rooms.append(
                    RoomPlacement(
                        name=r.name,
                        category=r.category,
                        target_area=float(r.target_area),
                        area_m2=float(r.polygon.area),
                        centroid=centroid,
                        polygon=poly_coords,
                    )
                )

            rb = [rp for rp in rooms]
            # candidate bbox from union bounds (cheaper than unary_union)
            if rb:
                xs = [x for room in rb for (x, _) in room.polygon]
                ys = [y for room in rb for (_, y) in room.polygon]
                cand_bbox = BBox(
                    min_x=min(xs),
                    min_y=min(ys),
                    max_x=max(xs),
                    max_y=max(ys),
                )
            else:
                cand_bbox = buildable_bbox

            adjacency_matrix: dict[str, list[str]] = {rp.name: [] for rp in rooms}
            for a, b in s.layout.adjacency:
                adjacency_matrix.setdefault(a, []).append(b)
                adjacency_matrix.setdefault(b, []).append(a)
            for k in list(adjacency_matrix.keys()):
                adjacency_matrix[k] = sorted(set(adjacency_matrix[k]))

            centroid_by_name = {rp.name: rp.centroid for rp in rooms}
            circulation_paths: list[list[tuple[float, float]]] = []
            for a, b in s.layout.adjacency:
                ca = centroid_by_name.get(a)
                cb = centroid_by_name.get(b)
                if ca is None or cb is None:
                    continue
                circulation_paths.append([ca, cb])

            door_objs = door_map.get(s.layout.candidate_id, [])
            doors_api: list[DoorModel] = [
                DoorModel(
                    id=d.id,
                    room_a=d.room_a,
                    room_b=d.room_b,
                    position=d.position,
                    angle=d.angle,
                    width=d.width,
                    floor_number=d.floor_number,
                )
                for d in door_objs
            ]

            candidates.append(
                LayoutCandidate(
                    candidate_id=int(s.layout.candidate_id),
                    rooms=rooms,
                    adjacency=s.layout.adjacency,
                    adjacency_matrix=adjacency_matrix,
                    circulation_paths=circulation_paths,
                    doors=doors_api,
                    bbox=cand_bbox,
                    scores=s.scores,
                )
            )

        return GenerateLayoutsResponse(
            plot_area_m2=float(plot_area),
            plot_bbox=plot_bbox,
            buildable_area_m2=float(buildable_area),
            buildable_bbox=buildable_bbox,
            buildable_polygon=polygon_to_coords(buildable),
            candidates=candidates,
            pending_questions=[],
        )

