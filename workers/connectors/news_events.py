"""Event-type lexicon for news-intelligence Pass 1.

Each event type maps to a list of surface keywords that, when present in a
headline or summary, mark the item as signalling that event. Keywords are
multilingual (EN / NL / FR) because Belgian coverage routinely mixes languages.

Matching is case-insensitive whole-word against the concatenated title +
summary. Multiple event types can match the same item — the connector keeps
all of them and the priors lookup treats them as independent signals.

Event vocabulary matches `docs/epic-breakdown.md` §Story 3:
  investment, hire, launch, m_and_a, layoff, partnership, restructuring, regulatory.
"""
from __future__ import annotations

EventType = str

EVENT_KEYWORDS: dict[EventType, tuple[str, ...]] = {
    "investment": (
        "invests", "investment", "funding", "raises", "capital", "funded",
        "investeert", "investering", "kapitaal", "miljardendeal",
        "investit", "investissement", "financement", "levée", "injecte", "injection",
    ),
    "hire": (
        "appoints", "appointment", "hires", "names", "new CTO", "new CEO",
        "chief technology officer", "chief information officer", "CIO", "CDO",
        "benoemt", "aanwerving", "nieuwe CEO", "nieuwe CTO",
        "nomme", "nomination", "recrute", "recrutement", "nouveau directeur",
    ),
    "launch": (
        "launches", "rolls out", "unveils", "releases", "debuts", "go-live",
        "wins contract", "awarded contract", "selected for",
        "lanceert", "introduceert", "stelt voor", "rolt uit",
        "lance", "déploie", "dévoile", "mise en service", "décroche",
        "remporte", "sélectionné", "sélectionnés", "mettre sur pied",
    ),
    "m_and_a": (
        "acquires", "acquisition", "merger", "merges", "takeover", "buys",
        "neemt over", "overname", "overnemen", "fusie", "lijft in", "lijft",
        "rachète", "reprend", "reprise", "acquisition", "fusion", "fusionne",
    ),
    "layoff": (
        "lays off", "layoffs", "job cuts", "cuts jobs", "redundancies",
        "ontslaat", "ontslagen", "herstructurering",
        "licencie", "licenciement", "suppression d'emplois",
    ),
    "partnership": (
        "partners with", "partnership", "teams up", "alliance", "joint venture",
        "supplier", "selected as",
        "samenwerking", "partnerschap", "alliantie", "leverancier",
        "partenariat", "s'associe", "alliance", "fournisseur", "sélectionnés par",
    ),
    "restructuring": (
        "restructures", "restructuring", "reorganisation", "reorganizes",
        "herstructureert", "reorganisatie",
        "réorganise", "réorganisation",
    ),
    "regulatory": (
        "regulator", "compliance", "GDPR", "DORA", "NIS2", "fine", "sanction",
        "toezichthouder", "regelgeving", "boete",
        "régulateur", "conformité", "amende",
    ),
}
