"""LLM-based skill tagger — grounds signal tags in the actual text via Claude Haiku.

Replaces the regex/priors-only pipeline for text-heavy connectors (news,
procurement, trends). The taxonomy and news PRIORS table are baked into a
cached system prompt so Haiku inherits the domain expertise but picks skills
based on the signal's real content.

The extractor is strict: Haiku returns skill *names*, we resolve them to
`skills.id` via the taxonomy loaded at init; unknown names are dropped.
"""
from __future__ import annotations

import json
import logging
import os
from typing import Any

from supabase import Client

from .news_priors import PRIORS

log = logging.getLogger(__name__)

MODEL = "claude-haiku-4-5-20251001"
MAX_TOKENS = 600


class LLMSkillExtractor:
    def __init__(self, db: Client) -> None:
        self._db = db
        self._skills = self._load_skills()
        self._name_to_id: dict[str, str] = {
            s["name"].lower(): s["id"] for s in self._skills
        }
        self._system_prompt = self._build_system_prompt()
        self._client = self._make_client()
        self._warned_missing_key = False
        self._warned_missing_sdk = False

    # -- init helpers -------------------------------------------------------

    def _load_skills(self) -> list[dict]:
        response = self._db.table("skills").select("id, name, discipline, aliases").execute()
        return response.data or []

    @staticmethod
    def _make_client() -> Any | None:
        key = os.environ.get("ANTHROPIC_API_KEY")
        if not key:
            return None
        try:
            from anthropic import Anthropic
        except ImportError:
            return "sdk_missing"
        return Anthropic(api_key=key)

    def _build_system_prompt(self) -> str:
        taxonomy_lines: list[str] = []
        for skill in sorted(self._skills, key=lambda s: (s["discipline"], s["name"])):
            aliases = skill.get("aliases") or []
            alias_txt = f" — aliases: {', '.join(aliases)}" if aliases else ""
            taxonomy_lines.append(f"- {skill['name']} ({skill['discipline']}){alias_txt}")
        taxonomy_block = "\n".join(taxonomy_lines)

        priors_lines: list[str] = []
        for (key, event_type), entries in sorted(PRIORS.items()):
            skill_names = ", ".join(name for name, _ in entries)
            priors_lines.append(f"- key={key} | event={event_type} → {skill_names}")
        priors_block = "\n".join(priors_lines)

        return f"""You are a skill-tagging assistant for a demand-forecasting tool that tracks IT consultancy skill demand in Belgium (Movify staffing).

Given one signal (news headline+summary, procurement notice, or Google Trends term) you must pick which skills from the fixed taxonomy below are most likely to be in demand as a consequence of that signal.

## Skill taxonomy — STRICT ALLOWLIST

Return only skill names from this list (exact spelling, case-insensitive). Do NOT invent skills.

{taxonomy_block}

## Interpretive priors (for news signals)

These hand-authored patterns map (client or industry, event_type) → likely-demand skills, based on Movify's market research. Use them as Bayesian priors — they are *guidance*, not ground truth. If the text explicitly names a technology or capability, prefer that direct signal over the prior.

"key=*" means industry-agnostic. When an event fires for a company outside the named roster, the wildcard row is the only usable prior and confidence should stay low (≤0.45).

{priors_block}

## Source-specific guidance

- **news** — context supplies `client`, `industry`, `event_type`, `outlet`. Combine the priors with the article text. If the text names specific tech (e.g. "AI assistant", "Kubernetes migration", "data platform"), tag those skills directly and raise confidence.
- **procurement** — context supplies `cpv_code`, `cpv_label`, `buyer`, `notice_type`. TED procurement notices are high-signal; favour skills concretely implied by the notice description. CPV label is a category hint.
- **trend** — context supplies a single Google Trends search `term` (e.g. "React developer"). Match it directly to one taxonomy skill with high confidence (≥0.75). Usually exactly one skill.

## Confidence scale

- 0.80–0.95 — skill explicitly named/described in the text
- 0.55–0.75 — skill strongly implied by domain + event + prior
- 0.35–0.50 — speculative, based on weak prior only (e.g. wildcard prior, off-roster client)
- <0.35 — do not emit

## Output format

Return ONLY a JSON object, no prose, no markdown, no code fences:

{{"skills": [{{"skill": "<exact name from taxonomy>", "confidence": <0.0-1.0>, "reasoning": "<≤15 words>"}}]}}

Return 0–5 skills. Empty list `{{"skills": []}}` is valid when the signal is off-topic. Never include a skill that is not in the taxonomy above.
"""

    # -- public API ---------------------------------------------------------

    def extract(self, text: str, context: dict[str, Any]) -> list[dict]:
        """Return `[{skill_id, confidence}, …]`. Never raises; returns `[]` on any failure."""
        if self._client is None:
            if not self._warned_missing_key:
                log.warning(
                    "LLMSkillExtractor: ANTHROPIC_API_KEY not set — skill tagging disabled"
                )
                self._warned_missing_key = True
            return []
        if self._client == "sdk_missing":
            if not self._warned_missing_sdk:
                log.warning(
                    "LLMSkillExtractor: `anthropic` package not installed — skill tagging disabled"
                )
                self._warned_missing_sdk = True
            return []
        if not text and not any(context.values()):
            return []

        try:
            response = self._client.messages.create(
                model=MODEL,
                max_tokens=MAX_TOKENS,
                system=[
                    {
                        "type": "text",
                        "text": self._system_prompt,
                        "cache_control": {"type": "ephemeral"},
                    }
                ],
                messages=[
                    {
                        "role": "user",
                        "content": self._build_user_message(text, context),
                    }
                ],
            )
        except Exception as err:
            log.warning("LLM skill extraction request failed: %s", err)
            return []

        raw = "".join(
            getattr(block, "text", "")
            for block in response.content
            if getattr(block, "type", None) == "text"
        )
        return self._parse_and_validate(raw)

    # -- internals ----------------------------------------------------------

    @staticmethod
    def _build_user_message(text: str, context: dict[str, Any]) -> str:
        lines: list[str] = []
        source_type = context.get("source_type", "unknown")
        lines.append(f"Signal source: {source_type}")
        for key, value in context.items():
            if key == "source_type" or value in (None, "", [], {}):
                continue
            lines.append(f"{key}: {value}")
        if text:
            lines.append("")
            lines.append("Text:")
            lines.append(text[:4000])
        return "\n".join(lines)

    def _parse_and_validate(self, raw: str) -> list[dict]:
        stripped = raw.strip()
        # Tolerate accidental code fences even though the prompt forbids them.
        if stripped.startswith("```"):
            stripped = stripped.strip("`")
            if "\n" in stripped:
                stripped = stripped.split("\n", 1)[1]
            if stripped.endswith("```"):
                stripped = stripped[:-3]
            stripped = stripped.strip()

        try:
            payload = json.loads(stripped)
        except json.JSONDecodeError as err:
            log.warning("LLM returned malformed JSON (%s): %r", err, raw[:200])
            return []

        skills = payload.get("skills") if isinstance(payload, dict) else None
        if not isinstance(skills, list):
            return []

        out: list[dict] = []
        seen: set[str] = set()
        for item in skills:
            if not isinstance(item, dict):
                continue
            name = item.get("skill")
            if not isinstance(name, str):
                continue
            skill_id = self._name_to_id.get(name.strip().lower())
            if skill_id is None or skill_id in seen:
                if skill_id is None:
                    log.debug("LLM returned skill %r not in taxonomy; dropped", name)
                continue
            try:
                confidence = float(item.get("confidence", 0.5))
            except (TypeError, ValueError):
                confidence = 0.5
            confidence = max(0.0, min(1.0, confidence))
            if confidence < 0.35:
                continue
            out.append({"skill_id": skill_id, "confidence": confidence})
            seen.add(skill_id)
        return out


# -- smoke test ---------------------------------------------------------------

if __name__ == "__main__":
    # Hand-run: `python -m workers.connectors.llm_skill_extractor` from repo root,
    # after `pip install -r workers/requirements.txt` and exporting the env vars.
    import sys
    from pathlib import Path

    from dotenv import load_dotenv
    from supabase import create_client

    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")

    repo_root = Path(__file__).resolve().parents[2]
    for name in (".env.local", ".env"):
        p = repo_root / name
        if p.exists():
            load_dotenv(p, override=False)

    url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY")
        sys.exit(1)

    extractor = LLMSkillExtractor(create_client(url, key))

    cases = [
        (
            "KBC launches 200M AI innovation fund to accelerate customer-facing AI products",
            {
                "source_type": "news",
                "client": "KBC Group",
                "industry": "banking",
                "event_type": "investment",
                "outlet": "De Tijd",
            },
        ),
        (
            "Ontwikkeling van een data-platform voor de Vlaamse Overheid — dbt, Snowflake, Airflow",
            {
                "source_type": "procurement",
                "cpv_code": "72000000",
                "cpv_label": "IT services",
                "buyer": "Vlaamse Overheid",
                "notice_type": "cn-standard",
            },
        ),
        (
            "React developer",
            {"source_type": "trend", "term": "React developer", "spike_pct": 42.0},
        ),
    ]

    for text, ctx in cases:
        print(f"\n--- {ctx['source_type']}: {text[:80]} ---")
        for match in extractor.extract(text, ctx):
            print(f"  {match['skill_id']}  conf={match['confidence']:.2f}")
