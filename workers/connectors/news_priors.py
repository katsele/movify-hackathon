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

Client-specific rows below trace to the "Likely consulting hook" column of
`docs/research/market-opportunity-belgium.md`. Industry-fallback rows are the
safety net when a new company comes into the roster without a handcrafted rule.

Maintenance note: review these mappings with Sebastiaan quarterly. When an
entry fires but the downstream forecast proves wrong, trim the skill list or
lower the confidence — don't add more entries to compensate.
"""
from __future__ import annotations

PriorsKey = tuple[str, str]  # (client_key or industry, event_type)
Prior = tuple[str, float]    # (skill_name, confidence)

PRIORS: dict[PriorsKey, list[Prior]] = {
    # =========================================================================
    # Client-specific priors — top buying centres per market-opportunity doc
    # =========================================================================

    # ---- Banking ---------------------------------------------------------
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
    ("bnpp_fortis", "m_and_a"): [
        ("Data Engineering", 0.60),
        ("Product Management", 0.55),
        ("AI Engineering", 0.55),
    ],
    ("bnpp_fortis", "launch"): [
        ("AI Engineering", 0.60),
        ("UX Design", 0.55),
        ("Product Management", 0.55),
    ],
    ("belfius", "launch"): [
        ("AI Engineering", 0.60),
        ("UX Design", 0.55),
        ("Product Management", 0.55),
    ],
    ("ing_be", "launch"): [
        ("AI Engineering", 0.60),
        ("Product Management", 0.55),
        ("UX Design", 0.55),
    ],
    ("argenta", "launch"): [
        ("UX Design", 0.55),
        ("Product Management", 0.55),
        ("AI Engineering", 0.50),
    ],
    ("crelan", "m_and_a"): [
        ("Data Engineering", 0.60),
        ("Product Management", 0.55),
    ],
    ("euroclear", "launch"): [
        ("Data Engineering", 0.60),
        ("AI Engineering", 0.55),
        ("AI Strategy", 0.55),
    ],
    ("swift", "regulatory"): [
        ("Data Engineering", 0.60),
        ("AI Strategy", 0.55),
    ],

    # ---- Insurance -------------------------------------------------------
    ("ag_insurance", "launch"): [
        ("AI Engineering", 0.60),
        ("Data Engineering", 0.55),
        ("Service Design", 0.55),
    ],
    ("axa_be", "investment"): [
        ("AI Engineering", 0.60),
        ("Data Science", 0.60),
        ("Machine Learning", 0.55),
    ],
    ("ethias", "investment"): [
        ("AI Strategy", 0.60),
        ("Data Engineering", 0.55),
        ("Product Management", 0.50),
    ],

    # ---- Telecom ---------------------------------------------------------
    ("proximus", "partnership"): [
        ("AWS", 0.60),
        ("Kubernetes", 0.55),
        ("Data Engineering", 0.55),
    ],
    ("proximus", "launch"): [
        ("AI Engineering", 0.55),
        ("Product Management", 0.50),
    ],
    ("proximus", "restructuring"): [
        ("AI Engineering", 0.60),
        ("AI Strategy", 0.55),
        ("Data Engineering", 0.55),
    ],
    ("telenet", "restructuring"): [
        ("Product Management", 0.55),
        ("Data Engineering", 0.55),
    ],

    # ---- Media -----------------------------------------------------------
    ("vrt", "launch"): [
        ("Product Management", 0.60),
        ("UX Design", 0.55),
        ("AI Engineering", 0.55),
    ],
    ("dpg_media", "launch"): [
        ("AI Engineering", 0.60),
        ("Product Management", 0.55),
        ("Data Engineering", 0.55),
    ],

    # ---- Retail / e-commerce --------------------------------------------
    ("colruyt", "launch"): [
        ("Data Engineering", 0.55),
        ("dbt", 0.50),
    ],
    ("delhaize", "launch"): [
        ("Product Management", 0.60),
        ("Data Engineering", 0.55),
        ("UX Design", 0.50),
    ],
    ("carrefour_be", "launch"): [
        ("Machine Learning", 0.60),
        ("Data Engineering", 0.55),
        ("Product Management", 0.50),
    ],

    # ---- Energy / grid ---------------------------------------------------
    ("elia", "investment"): [
        ("Data Engineering", 0.60),
        ("Machine Learning", 0.55),
        ("AI Engineering", 0.55),
    ],
    ("fluvius", "launch"): [
        ("Data Engineering", 0.65),
        ("Machine Learning", 0.55),
        ("AI Engineering", 0.55),
    ],
    ("engie_electrabel", "launch"): [
        ("Product Management", 0.55),
        ("Data Engineering", 0.55),
    ],

    # ---- Transport operators --------------------------------------------
    ("sncb", "launch"): [
        ("Product Management", 0.55),
        ("Service Design", 0.55),
    ],
    ("sncb", "investment"): [
        ("Machine Learning", 0.60),
        ("Data Engineering", 0.55),
        ("Product Management", 0.50),
    ],
    ("stib_mivb", "launch"): [
        ("Service Design", 0.60),
        ("Product Management", 0.55),
        ("UX Design", 0.55),
    ],
    ("de_lijn", "launch"): [
        ("Service Design", 0.55),
        ("Data Engineering", 0.55),
        ("Machine Learning", 0.50),
    ],

    # ---- Logistics -------------------------------------------------------
    ("bpost", "launch"): [
        ("Data Engineering", 0.60),
        ("Node.js", 0.50),
        ("Product Management", 0.50),
    ],
    ("bpost", "investment"): [
        ("Data Engineering", 0.60),
        ("AI Engineering", 0.55),
        ("Product Management", 0.55),
    ],

    # ---- Healthcare ------------------------------------------------------
    ("uz_leuven", "investment"): [
        ("AI Engineering", 0.60),
        ("Service Design", 0.55),
        ("Data Engineering", 0.55),
    ],

    # ---- Pharma ----------------------------------------------------------
    ("solvay", "investment"): [
        ("Data Science", 0.55),
        ("Machine Learning", 0.55),
    ],
    ("ucb", "investment"): [
        ("Data Science", 0.60),
        ("Machine Learning", 0.55),
    ],
    ("ucb", "launch"): [
        ("Data Science", 0.60),
        ("Machine Learning", 0.55),
        ("AI Engineering", 0.55),
    ],
    ("gsk_be", "investment"): [
        ("Data Science", 0.60),
        ("Machine Learning", 0.55),
        ("Data Engineering", 0.55),
    ],
    ("janssen_beerse", "investment"): [
        ("Data Science", 0.60),
        ("Machine Learning", 0.55),
        ("Data Engineering", 0.55),
    ],

    # ---- Public sector ---------------------------------------------------
    ("smals", "launch"): [
        ("AI Strategy", 0.60),
        ("AI Engineering", 0.55),
        ("Web Accessibility", 0.55),
    ],
    ("ku_leuven", "launch"): [
        ("AI Strategy", 0.55),
        ("Web Accessibility", 0.55),
        ("Data Engineering", 0.50),
    ],

    # =========================================================================
    # Industry fallbacks — consulted only if no client-specific rule matched
    # =========================================================================
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

    # ---- New industry fallbacks added with the Belgian named-account roster
    ("media", "launch"): [
        ("Product Management", 0.55),
        ("AI Engineering", 0.55),
        ("Data Engineering", 0.50),
    ],
    ("media", "partnership"): [
        ("AI Engineering", 0.55),
        ("Data Engineering", 0.50),
    ],
    ("media", "investment"): [
        ("Data Engineering", 0.55),
        ("AI Engineering", 0.50),
    ],
    ("healthcare", "launch"): [
        ("Service Design", 0.55),
        ("Web Accessibility", 0.55),
        ("Journey Mapping", 0.50),
        ("Product Management", 0.50),
    ],
    ("healthcare", "investment"): [
        ("AI Engineering", 0.55),
        ("Data Engineering", 0.55),
        ("AI Strategy", 0.50),
    ],
    ("healthcare", "regulatory"): [
        ("Web Accessibility", 0.55),
        ("AI Strategy", 0.50),
    ],
    ("transport_operator", "launch"): [
        ("Service Design", 0.55),
        ("Product Management", 0.55),
        ("UX Design", 0.50),
        ("Data Engineering", 0.50),
    ],
    ("transport_operator", "investment"): [
        ("Data Engineering", 0.55),
        ("Machine Learning", 0.55),
        ("Product Management", 0.50),
    ],
    ("transport_operator", "partnership"): [
        ("Data Engineering", 0.55),
        ("Product Management", 0.50),
    ],
    ("industrial_manufacturing", "investment"): [
        ("Data Engineering", 0.55),
        ("Machine Learning", 0.55),
        ("Data Science", 0.50),
    ],
    ("industrial_manufacturing", "launch"): [
        ("Data Engineering", 0.55),
        ("Machine Learning", 0.50),
    ],
    ("education", "investment"): [
        ("AI Strategy", 0.55),
        ("Data Engineering", 0.55),
        ("Machine Learning", 0.50),
    ],
    ("education", "launch"): [
        ("Web Accessibility", 0.55),
        ("Service Design", 0.50),
        ("AI Engineering", 0.50),
    ],
    ("food_manufacturing", "investment"): [
        ("Data Engineering", 0.55),
        ("Machine Learning", 0.55),
        ("Data Science", 0.50),
    ],
    ("food_manufacturing", "launch"): [
        ("Data Engineering", 0.55),
        ("Product Management", 0.50),
    ],

    # =========================================================================
    # Generic event priors (any client, catch-all). Used when a client isn't
    # in TARGET_CLIENTS but an event fired, or when both client- and industry-
    # specific lookups miss. Triage-tier confidence is capped at 0.4 by the
    # connector since there's no target-account context.
    # =========================================================================
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
