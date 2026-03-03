"""Dynamic Question Engine: gap analysis + question generation (LLM phrasing or rule-based)."""

from __future__ import annotations

from backend.engines.questions.gap_analyzer import GapAnalyzer
from backend.engines.questions.models import Gap, StructuredQuestion, UserInputState
from backend.engines.questions.phrase_llm import phrase_questions_with_llm

MAX_QUESTIONS_PER_ROUND = 5
VALID_TYPES = frozenset({"single_choice", "multi_choice", "numeric", "text", "boolean"})


class QuestionEngine:
    """Generates structured questions from user state and gaps. LLM used only for phrasing."""

    def __init__(self) -> None:
        self._gap_analyzer = GapAnalyzer()

    def generate_questions(
        self,
        user_input: UserInputState,
        score_breakdown: dict[str, float] | None = None,
        max_questions: int = MAX_QUESTIONS_PER_ROUND,
    ) -> list[StructuredQuestion]:
        """
        Input: UserInputState, optional scoring breakdown, optional gap list (if None, run GapAnalyzer).
        Output: List[StructuredQuestion]. Deterministic except for LLM phrasing; fallback is rule-based.
        """
        gaps = self._gap_analyzer.analyze(user_input, score_breakdown)
        if not gaps:
            return []

        # Try LLM phrasing first (optional)
        raw = phrase_questions_with_llm(gaps, max_questions=max_questions)
        if raw:
            structured = self._validate_and_structure(raw, gaps)
        else:
            structured = self._fallback_phrase(gaps)

        prioritized = self._prioritize(structured)
        return prioritized[:max_questions]

    def _validate_and_structure(
        self,
        raw: list[dict],
        gaps: list[Gap],
    ) -> list[StructuredQuestion]:
        """Convert LLM output to StructuredQuestion; fix ids and types."""
        out: list[StructuredQuestion] = []
        for i, r in enumerate(raw):
            qid = (r.get("id") or "").strip() or f"q_gap_{i}"
            if not qid.startswith("q_"):
                qid = f"q_{qid}"
            qtype = (r.get("type") or "single_choice").lower()
            if qtype not in VALID_TYPES:
                qtype = "single_choice"
            text = (r.get("text") or "").strip() or "Would you like to specify a preference?"
            options = list(r.get("options") or [])
            default = r.get("default")
            category = (r.get("category") or "").strip()
            why = (r.get("why_it_matters") or "").strip()
            impact = list(r.get("constraint_impact") or [])
            priority = int(r.get("priority", 3))
            priority = max(1, min(5, priority))
            out.append(
                StructuredQuestion(
                    id=qid,
                    text=text,
                    type=qtype,
                    options=options,
                    default=default,
                    category=category,
                    why_it_matters=why,
                    constraint_impact=impact,
                    priority=priority,
                )
            )
        return out

    def _fallback_phrase(self, gaps: list[Gap]) -> list[StructuredQuestion]:
        """Rule-based phrasing. Fully deterministic."""
        out: list[StructuredQuestion] = []
        for i, g in enumerate(gaps):
            qid = f"q_{g.category}_{i}"
            text = g.question_hint or g.detail
            severity_priority = {"critical": 5, "high": 4, "medium": 3, "low": 2}
            priority = severity_priority.get(g.severity, 3)
            options = []
            default = None
            if g.category == "missing_adjacency_preferences":
                options = ["Living next to kitchen", "Bedrooms near bathroom", "Open plan living-dining", "No preference"]
                default = "No preference"
            elif g.category == "orientation_ambiguity":
                options = ["Toward street (gate side)", "Toward back/garden", "No strong preference"]
                default = "No strong preference"
            elif g.category == "high_circulation_penalty":
                options = ["Prefer shorter paths from entrance", "Current layout is fine", "Minimize corridors"]
                default = "Prefer shorter paths from entrance"
            elif g.category == "privacy_vs_light_tradeoff":
                options = ["Prioritize privacy", "Prioritize natural light", "Balance both"]
                default = "Balance both"
            elif g.category == "large_unused_area":
                options = ["Add more rooms later", "Keep as open/flex space", "No change"]
                default = "Keep as open/flex space"
            elif g.category == "overpacked_area":
                options = ["Prioritize key rooms only", "Keep all rooms", "Reduce some room sizes"]
                default = "Keep all rooms"
            else:
                options = ["Yes", "No", "No preference"]
                default = "No preference"
            out.append(
                StructuredQuestion(
                    id=qid,
                    text=text,
                    type="single_choice",
                    options=options,
                    default=default,
                    category=g.category,
                    why_it_matters=g.detail[:200] if g.detail else "",
                    constraint_impact=list(g.constraint_impact),
                    priority=priority,
                )
            )
        return out

    def _prioritize(self, questions: list[StructuredQuestion]) -> list[StructuredQuestion]:
        """Sort by priority (desc), then by id for determinism."""
        return sorted(questions, key=lambda q: (-q.priority, q.id))
