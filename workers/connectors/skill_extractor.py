"""Multilingual skill extractor — tiered matching against the taxonomy.

Tier 1: exact match against skill name / aliases (fast, high precision).
Tier 2: regex patterns for common multilingual skill expressions (NL/FR/EN).
Tier 3 (V2): spaCy/JobBERT for fuzzy extraction.
"""
from __future__ import annotations

import re
from typing import Iterable

from supabase import Client


class SkillExtractor:
    def __init__(self, db: Client) -> None:
        self._db = db
        self._index: dict[str, str] = {}
        self._reload()

    def _reload(self) -> None:
        response = self._db.table("skills").select("id, name, aliases").execute()
        self._index = {}
        for skill in response.data or []:
            terms: Iterable[str] = [skill["name"]] + (skill.get("aliases") or [])
            for term in terms:
                self._index[term.lower()] = skill["id"]

    def extract(self, text: str) -> list[dict]:
        if not text:
            return []
        text_lower = text.lower()
        matches: list[dict] = []
        seen: set[str] = set()

        # Tier 1: whole-word exact match
        for term, skill_id in self._index.items():
            if skill_id in seen:
                continue
            pattern = rf"(?<![A-Za-z]){re.escape(term)}(?![A-Za-z])"
            if re.search(pattern, text_lower):
                matches.append({"skill_id": skill_id, "confidence": 0.9})
                seen.add(skill_id)

        return matches
