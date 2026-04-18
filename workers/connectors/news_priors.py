"""Client-industry priors for news-intelligence Pass 2.

When Pass 1 has matched a (client, event_type) pair on a news item, Pass 2
looks up the likely skill demand in this table. Entries are hand-authored —
not extracted — because the inference chain "this announcement → these skills
will see demand in 6–8 weeks" is judgement, not text matching.

Confidence lives in `[0.5, 0.65]` per `per-source-heuristics.md §8`: the
extraction is cheap but the inference chain is long, so even a confident
authorial judgement caps at 0.65.

Key lookup strategy used by the connector:
  1. `PRIORS[(client_key, event_type)]` — most specific, highest confidence
  2. `PRIORS[(industry, event_type)]` — fallback when no client-specific rule

Skill names MUST match entries in the `skills` table exactly (see
`supabase/migrations/001_initial_schema.sql` and `003_skill_taxonomy.sql`).
Unresolved names are silently dropped at the name-to-id resolution step.

Maintenance note: review these mappings with Sebastiaan quarterly. When an
entry fires but the downstream forecast proves wrong, trim the skill list or
lower the confidence — don't add more entries to compensate.
"""
from __future__ import annotations

PriorsKey = tuple[str, str]  # (client_key or industry, event_type)
Prior = tuple[str, float]    # (skill_name, confidence)

PRIORS: dict[PriorsKey, list[Prior]] = {
    # ---- Client-specific priors (canonical demo cases) --------------------
    ("kbc", "investment"): [
        ("AI Engineering", 0.65),
        ("LLM Ops", 0.60),
        ("Machine Learning", 0.60),
        ("Data Engineering", 0.55),
    ],
    ("kbc", "partnership"): [
        ("AI Engineering", 0.55),
        ("Data Engineering", 0.55),
    ],
    ("proximus", "partnership"): [
        ("AWS", 0.60),
        ("Kubernetes", 0.55),
        ("Data Engineering", 0.55),
    ],
    ("proximus", "launch"): [
        ("AI Engineering", 0.55),
        ("Product Management", 0.50),
    ],
    ("bpost", "launch"): [
        ("Data Engineering", 0.60),
        ("Node.js", 0.50),
        ("Product Management", 0.50),
    ],
    ("solvay", "investment"): [
        ("Data Science", 0.55),
        ("Machine Learning", 0.55),
    ],
    ("ucb", "investment"): [
        ("Data Science", 0.60),
        ("Machine Learning", 0.55),
    ],
    ("colruyt", "launch"): [
        ("Data Engineering", 0.55),
        ("dbt", 0.50),
    ],
    ("smals", "launch"): [
        ("AI Strategy", 0.60),
        ("AI Engineering", 0.55),
        ("Web Accessibility", 0.55),
    ],
    ("sncb", "launch"): [
        ("Product Management", 0.50),
        ("Service Design", 0.50),
    ],

    # ---- Industry fallbacks (only consulted if no client-specific rule) ---
    ("banking", "investment"): [
        ("AI Engineering", 0.55),
        ("Data Engineering", 0.50),
    ],
    ("banking", "regulatory"): [
        ("AI Strategy", 0.55),
        ("Data Engineering", 0.50),
    ],
    ("insurance", "investment"): [
        ("Data Science", 0.55),
        ("Data Engineering", 0.50),
    ],
    ("telecom", "partnership"): [
        ("AWS", 0.55),
        ("Kubernetes", 0.50),
    ],
    ("retail", "launch"): [
        ("Data Engineering", 0.55),
        ("Product Management", 0.50),
    ],
    ("energy", "investment"): [
        ("Data Engineering", 0.55),
        ("Machine Learning", 0.50),
    ],
    ("public_sector", "launch"): [
        ("AI Strategy", 0.55),
        ("Web Accessibility", 0.55),
    ],
    ("pharma", "investment"): [
        ("Data Science", 0.60),
        ("Machine Learning", 0.55),
    ],
    ("chemicals", "investment"): [
        ("Data Science", 0.55),
        ("Machine Learning", 0.50),
    ],
    ("logistics", "launch"): [
        ("Data Engineering", 0.55),
        ("Node.js", 0.50),
    ],

    # ---- Generic event priors (any client, catch-all) ---------------------
    # Used when a client isn't in TARGET_CLIENTS but an event fired, or when
    # both client- and industry-specific lookups miss. Triage-tier confidence
    # is capped at 0.4 by the connector since there's no target-account context.
    ("*", "hire"): [
        ("AWS", 0.50),
        ("Product Management", 0.50),
    ],
    ("*", "m_and_a"): [
        ("Data Engineering", 0.50),
        ("Product Management", 0.50),
    ],
    ("*", "regulatory"): [
        ("AI Strategy", 0.55),
    ],
    ("*", "investment"): [
        ("AI Engineering", 0.50),
        ("Data Engineering", 0.50),
    ],
    ("*", "launch"): [
        ("Product Management", 0.50),
        ("Data Engineering", 0.50),
    ],
    ("*", "partnership"): [
        ("AWS", 0.50),
        ("Data Engineering", 0.50),
    ],
    ("*", "layoff"): [
        ("Product Management", 0.45),
    ],
    ("*", "restructuring"): [
        ("Product Management", 0.50),
        ("AI Strategy", 0.45),
    ],
}
