"""Target-client alias list for news-intelligence entity matching.

Tier D matching per `docs/research/per-source-heuristics.md §8`: regex scan of
lowercased headline + summary against each alias. First client hit wins.
Aliases include legal name, short form, and common press variants. Kept
deliberately small (~20 entries) so the regex pass stays cheap and we can
hand-maintain priors to match.

`industry` is used as a fallback lookup when the (client, event_type) pair has
no prior. Keep values aligned with the industries used as keys in
`news_priors.py`.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class TargetClient:
    key: str
    legal_name: str
    aliases: tuple[str, ...]
    industry: str


TARGET_CLIENTS: list[TargetClient] = [
    TargetClient("kbc", "KBC Group", ("KBC", "KBC Group", "KBC Bank", "KBC Verzekeringen"), "banking"),
    TargetClient("bnpp_fortis", "BNP Paribas Fortis", ("BNP Paribas Fortis", "BNPP Fortis", "Fortis"), "banking"),
    TargetClient("belfius", "Belfius", ("Belfius", "Belfius Bank", "Belfius Verzekeringen"), "banking"),
    TargetClient("ing_be", "ING Belgium", ("ING Belgium", "ING België", "ING Belgique"), "banking"),
    TargetClient("argenta", "Argenta", ("Argenta", "Argenta Bank"), "banking"),
    TargetClient("ag_insurance", "AG Insurance", ("AG Insurance", "AG Insurances"), "insurance"),
    TargetClient("ethias", "Ethias", ("Ethias",), "insurance"),
    TargetClient("proximus", "Proximus", ("Proximus", "Proximus Group"), "telecom"),
    TargetClient("telenet", "Telenet", ("Telenet", "Telenet Group"), "telecom"),
    TargetClient("orange_be", "Orange Belgium", ("Orange Belgium", "Orange België"), "telecom"),
    TargetClient("ucb", "UCB", ("UCB", "UCB Pharma"), "pharma"),
    TargetClient("solvay", "Solvay", ("Solvay",), "chemicals"),
    TargetClient("bpost", "bpost", ("bpost", "Bpost", "BPost"), "logistics"),
    TargetClient("delhaize", "Delhaize", ("Delhaize", "Ahold Delhaize"), "retail"),
    TargetClient("colruyt", "Colruyt", ("Colruyt", "Colruyt Group"), "retail"),
    TargetClient("elia", "Elia", ("Elia", "Elia Group"), "energy"),
    TargetClient("engie_electrabel", "Engie Electrabel", ("Engie", "Electrabel", "Engie Electrabel"), "energy"),
    TargetClient("smals", "Smals", ("Smals",), "public_sector"),
    TargetClient("sncb", "SNCB", ("SNCB", "NMBS"), "public_sector"),
    TargetClient("stib_mivb", "STIB-MIVB", ("STIB", "MIVB", "STIB-MIVB"), "public_sector"),
    TargetClient("euroclear", "Euroclear", ("Euroclear",), "banking"),
]
