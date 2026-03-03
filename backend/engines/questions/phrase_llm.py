"""LLM-based question phrasing only. No geometry or constraint mutation."""

from __future__ import annotations

import json
import os
from typing import Any

import httpx

from backend.engines.questions.models import Gap, StructuredQuestion


QUESTION_SYSTEM_PROMPT = """You are an expert architectural consultant. Your only job is to turn design information gaps into clear, natural-language questions.

Rules:
1. Output valid JSON only. No markdown, no explanation outside JSON.
2. Each question must map to exactly one gap. Use the gap's detail and question_hint.
3. Prefer multiple-choice when possible. Use "options" array and "default".
4. Never invent geometry, dimensions, or room positions. Only ask about preferences and priorities.
5. question id must be: q_<category>_<index> (e.g. q_missing_adjacency_preferences_0).
6. type must be one of: single_choice, multi_choice, numeric, text, boolean.
7. Include "why_it_matters" in one short sentence.
8. constraint_impact: list of constraint IDs from the gap.

Output format:
{"questions": [{"id": "q_...", "text": "...", "type": "single_choice", "options": ["A", "B"], "default": "A", "category": "...", "why_it_matters": "...", "constraint_impact": [], "priority": 3}]}"""


def phrase_questions_with_llm(gaps: list[Gap], max_questions: int = 5) -> list[dict[str, Any]]:
    """Call LLM to phrase gaps as questions. Returns list of dicts matching StructuredQuestion fields."""
    if not gaps:
        return []
    api_key = os.getenv("OPENAI_API_KEY")
    api_base = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
    model = os.getenv("LLM_MODEL", "gpt-4o-mini")
    if not api_key:
        return []
    gap_context = [
        {
            "category": g.category,
            "severity": g.severity,
            "detail": g.detail,
            "question_hint": g.question_hint,
            "constraint_impact": list(g.constraint_impact),
        }
        for g in gaps[:10]
    ]
    user_content = f"Turn these design gaps into follow-up questions. Output JSON only.\n\nGaps:\n{json.dumps(gap_context, indent=2)}"
    payload = {
        "model": model,
        "temperature": 0.3,
        "messages": [
            {"role": "system", "content": QUESTION_SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
        "response_format": {"type": "json_object"},
    }
    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.post(
                f"{api_base}/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
    except Exception:
        return []
    try:
        content = data["choices"][0]["message"]["content"]
        parsed = json.loads(content)
        questions = parsed.get("questions", [])
        return questions[:max_questions]
    except (KeyError, json.JSONDecodeError):
        return []
