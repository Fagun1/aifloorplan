"""Pareto non-dominated ranking for multi-objective layout comparison."""

from __future__ import annotations

from backend.engines.scoring.scorer import ScoredLayout


# Objectives used for Pareto comparison (all higher is better).
PARETO_OBJECTIVES = [
    "space_utilization",
    "adjacency_satisfaction",
    "natural_light_access",
    "privacy_score",
]


def pareto_rank(scored: list[ScoredLayout]) -> list[ScoredLayout]:
    """Assign Pareto front ranks and sort by (pareto_rank, -total_score). Deterministic."""
    n = len(scored)
    if n == 0:
        return []
    # Build objective matrix from dimension_scores; missing dims treated as 0
    obj_matrix = []
    for s in scored:
        ds = getattr(s.scores, "dimension_scores", None) or {}
        row = [float(ds.get(o, 0.0)) for o in PARETO_OBJECTIVES]
        obj_matrix.append(row)

    ranks = [0] * n
    remaining = set(range(n))
    current_rank = 1

    while remaining:
        front = []
        for i in remaining:
            dominated = False
            for j in remaining:
                if i == j:
                    continue
                # j dominates i iff j >= i on all objectives and j > i on at least one
                all_ge = all(obj_matrix[j][k] >= obj_matrix[i][k] for k in range(len(PARETO_OBJECTIVES)))
                any_gt = any(obj_matrix[j][k] > obj_matrix[i][k] for k in range(len(PARETO_OBJECTIVES)))
                if all_ge and any_gt:
                    dominated = True
                    break
            if not dominated:
                front.append(i)
        for idx in front:
            ranks[idx] = current_rank
            remaining.discard(idx)
        current_rank += 1

    # Build new list with pareto_rank set on each ScoreBreakdown (ScoredLayout is frozen)
    result = []
    for i, s in enumerate(scored):
        new_scores = s.scores.model_copy(update={"pareto_rank": ranks[i]})
        result.append(ScoredLayout(layout=s.layout, scores=new_scores))

    # Sort by (pareto_rank, -total) then by candidate_id for determinism
    return sorted(
        result,
        key=lambda c: (c.scores.pareto_rank or 0, -float(c.scores.total), int(c.layout.candidate_id)),
    )
