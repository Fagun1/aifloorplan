from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any, Dict, List

import httpx

from backend.api.v1.schemas.layout import LayoutCandidate
from backend.engines.llm.improvement_prompt_builder import (
    LayoutImprovementFeatures,
    build_improvement_prompt,
    extract_improvement_features,
)
from backend.engines.llm.prompt_builder import LayoutFeatures, build_analysis_prompt, extract_layout_features


@dataclass(frozen=True)
class LLMAnalysisResult:
    summary: str
    strengths: List[str]
    weaknesses: List[str]
    suggestions: List[str]
    architectural_notes: List[str]


@dataclass(frozen=True)
class LLMImprovementResult:
    summary: str
    key_changes: List[str]
    why_score_improved: List[str]
    tradeoffs: List[str]
    rooms_most_affected: List[str]


class LLMArchitecturalAssistant:
    def __init__(
        self,
        model: str | None = None,
        api_base: str | None = None,
        api_key: str | None = None,
    ) -> None:
        self._model = model or os.getenv("LLM_MODEL", "gpt-4o-mini")
        self._api_base = api_base or os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
        self._api_key = api_key or os.getenv("OPENAI_API_KEY")
        self._temperature = 0.2

    def analyze(self, layout: LayoutCandidate, gate_direction: str) -> LLMAnalysisResult:
        features = extract_layout_features(layout, gate_direction)
        system_prompt, user_prompt = build_analysis_prompt(features)

        if not self._api_key:
            return self._fallback_analysis(features)

        payload = {
            "model": self._model,
            "temperature": self._temperature,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "response_format": {"type": "json_object"},
        }

        try:
            with httpx.Client(timeout=20.0) as client:
                resp = client.post(
                    f"{self._api_base}/chat/completions",
                    headers={"Authorization": f"Bearer {self._api_key}"},
                    json=payload,
                )
                resp.raise_for_status()
                data: Dict[str, Any] = resp.json()
        except Exception:
            return self._fallback_analysis(features)

        try:
            content = data["choices"][0]["message"]["content"]
            parsed = json.loads(content)
        except Exception:
            return self._fallback_analysis(features)

        return LLMAnalysisResult(
            summary=str(parsed.get("summary", "")),
            strengths=_ensure_str_list(parsed.get("strengths", [])),
            weaknesses=_ensure_str_list(parsed.get("weaknesses", [])),
            suggestions=_ensure_str_list(parsed.get("suggestions", [])),
            architectural_notes=_ensure_str_list(parsed.get("architectural_notes", [])),
        )

    def analyze_improvement(
        self,
        original: LayoutCandidate,
        improved: LayoutCandidate,
        gate_direction: str,
    ) -> LLMImprovementResult:
        features = extract_improvement_features(original, improved, gate_direction)
        system_prompt, user_prompt = build_improvement_prompt(features)

        if not self._api_key:
            return self._fallback_improvement(features)

        payload = {
            "model": self._model,
            "temperature": self._temperature,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "response_format": {"type": "json_object"},
        }

        try:
            with httpx.Client(timeout=20.0) as client:
                resp = client.post(
                    f"{self._api_base}/chat/completions",
                    headers={"Authorization": f"Bearer {self._api_key}"},
                    json=payload,
                )
                resp.raise_for_status()
                data: Dict[str, Any] = resp.json()
        except Exception:
            return self._fallback_improvement(features)

        try:
            content = data["choices"][0]["message"]["content"]
            parsed = json.loads(content)
        except Exception:
            return self._fallback_improvement(features)

        return LLMImprovementResult(
            summary=str(parsed.get("summary", "")),
            key_changes=_ensure_str_list(parsed.get("key_changes", [])),
            why_score_improved=_ensure_str_list(parsed.get("why_score_improved", [])),
            tradeoffs=_ensure_str_list(parsed.get("tradeoffs", [])),
            rooms_most_affected=_ensure_str_list(parsed.get("rooms_most_affected", [])),
        )

    def _fallback_analysis(self, features: LayoutFeatures) -> LLMAnalysisResult:
        rooms = features.rooms

        strengths: List[str] = []
        weaknesses: List[str] = []
        suggestions: List[str] = []
        notes: List[str] = []

        strengths.append(
            f"Overall score {features.scores['total']:.2f} with "
            f"space utilization {features.scores['space_utilization']:.2f}, "
            f"natural light {features.scores['natural_light']:.2f}, "
            f"privacy {features.scores['privacy']:.2f}."
        )

        num_front_bedrooms = sum(
            1 for r in rooms if r.category.lower() == "private" and r.zone == "front"
        )
        if num_front_bedrooms > 0:
            weaknesses.append("Some bedrooms are in the front zone, which may reduce privacy.")
            suggestions.append(
                "Consider moving one or more bedrooms towards the middle or rear zones for better acoustic and visual privacy."
            )

        if any("kitchen_not_on_boundary" in r.violations for r in rooms):
            weaknesses.append("Kitchen does not clearly sit on an outer boundary.")
            suggestions.append(
                "Place the kitchen along an external wall to simplify ventilation and service runs."
            )

        if any("living_not_in_front_zone" in r.violations for r in rooms):
            suggestions.append(
                "Consider relocating the living room closer to the front zone to align with entry and daylight."
            )

        notes.append(
            "This analysis is heuristic and based only on the provided areas, aspect ratios, zones, and adjacency patterns."
        )

        summary = (
            "Heuristic architectural analysis based on the provided layout features, "
            "without modifying geometry or introducing new rooms."
        )

        return LLMAnalysisResult(
            summary=summary,
            strengths=strengths,
            weaknesses=weaknesses,
            suggestions=suggestions,
            architectural_notes=notes,
        )

    def _fallback_improvement(
        self,
        features: LayoutImprovementFeatures,
    ) -> LLMImprovementResult:
        key_changes: List[str] = []
        why: List[str] = []
        tradeoffs: List[str] = []
        affected: List[str] = []

        total_delta = features.score_deltas["total"]
        if total_delta > 0:
            why.append(
                f"Total score improved by {total_delta:+.2f}, driven by "
                f"space utilization Δ={features.score_deltas['space_utilization']:+.2f}, "
                f"natural light Δ={features.score_deltas['natural_light']:+.2f}, "
                f"privacy Δ={features.score_deltas['privacy']:+.2f}."
            )
        elif total_delta < 0:
            why.append(
                f"Total score decreased by {total_delta:+.2f}; one or more components regressed."
            )

        for r in features.room_changes:
            if abs(r.area_delta) > 0.5 or abs(r.aspect_ratio_delta) > 0.1:
                key_changes.append(
                    f"{r.name}: area Δ={r.area_delta:+.1f} m², aspect_ratio Δ={r.aspect_ratio_delta:+.2f}."
                )
                affected.append(r.name)
            if r.zone_before != r.zone_after:
                key_changes.append(
                    f"{r.name}: moved from {r.zone_before} zone to {r.zone_after} zone."
                )
                affected.append(r.name)
            if r.boundary_before != r.boundary_after or r.front_before != r.front_after:
                key_changes.append(
                    f"{r.name}: boundary/front exposure changed "
                    f"({r.boundary_before}/{r.front_before} → {r.boundary_after}/{r.front_after})."
                )
                affected.append(r.name)
            if r.adjacency_added or r.adjacency_removed:
                key_changes.append(
                    f"{r.name}: adjacency changed; "
                    f"added [{', '.join(r.adjacency_added)}], "
                    f"removed [{', '.join(r.adjacency_removed)}]."
                )
                affected.append(r.name)

        # simple tradeoff hint if any component decreased
        for comp in ("space_utilization", "natural_light", "privacy"):
            delta = features.score_deltas[comp]
            if delta < -0.05:
                tradeoffs.append(
                    f"{comp.replace('_', ' ').title()} decreased by {delta:+.2f}, "
                    "suggesting a tradeoff in the optimization."
                )

        summary = (
            "Heuristic explanation of optimization effects, derived solely from score deltas "
            "and per-room changes in area, aspect ratio, zone, exposure, and adjacency."
        )

        # de-duplicate affected rooms while preserving order
        seen = set()
        rooms_most_affected = []
        for name in affected:
            if name not in seen:
                seen.add(name)
                rooms_most_affected.append(name)

        return LLMImprovementResult(
            summary=summary,
            key_changes=key_changes,
            why_score_improved=why,
            tradeoffs=tradeoffs,
            rooms_most_affected=rooms_most_affected,
        )


def _ensure_str_list(value: Any) -> List[str]:
    if isinstance(value, list):
        return [str(v) for v in value]
    if isinstance(value, str):
        return [value]
    return []

