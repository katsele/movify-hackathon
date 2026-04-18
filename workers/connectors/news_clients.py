"""Target-client alias list for news-intelligence entity matching.

Tier D matching per `docs/research/per-source-heuristics.md §8`: regex scan of
lowercased headline + summary against each alias. First client hit wins.
Aliases include legal name, short form, and common NL/FR/EN press variants.

The roster is the named-account universe defined in
`docs/research/market-opportunity-belgium.md` — ~70 Belgian organisations with
2,000+ FTE that are the realistic addressable market for Movify. Adding a new
entry here automatically turns every mention of that company into a candidate
signal; the `industry` column determines the fallback priors it hits when no
client-specific rule is registered in `news_priors.py`.

`industry` values MUST match the keys used in `news_priors.PRIORS`. Currently
supported: banking, insurance, telecom, media, retail, energy, transport_operator,
logistics, healthcare, pharma, chemicals, industrial_manufacturing, education,
food_manufacturing, public_sector.

Below-threshold orgs explicitly excluded (see doc): Degroof Petercam, Sibelga,
Fluxys, De Watergroep, Vivaqua, SWDE, Aquafin, UPS Belgium, TUI fly, Covestro,
Evonik, Lotus Bakeries, Mondelēz Belgium, Barry Callebaut, FOD BOSA. ICT vendors
that compete for the same work (Accenture, Deloitte, Capgemini, Cegeka, Proximus
NXT, NRB, Sopra Steria, EY, KPMG, PwC) are also omitted by design.
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
    # ---- Banking ---------------------------------------------------------
    TargetClient("kbc", "KBC Group", ("KBC", "KBC Group", "KBC Bank", "KBC Verzekeringen"), "banking"),
    TargetClient("bnpp_fortis", "BNP Paribas Fortis", ("BNP Paribas Fortis", "BNPP Fortis", "Fortis", "BNPPF"), "banking"),
    TargetClient("belfius", "Belfius", ("Belfius", "Belfius Bank", "Belfius Verzekeringen"), "banking"),
    TargetClient("ing_be", "ING Belgium", ("ING Belgium", "ING België", "ING Belgique"), "banking"),
    TargetClient("argenta", "Argenta", ("Argenta", "Argenta Bank"), "banking"),
    TargetClient("crelan", "Crelan", ("Crelan", "Crelan Bank", "AXA Bank Belgium", "AXA Bank"), "banking"),
    TargetClient("euroclear", "Euroclear", ("Euroclear",), "banking"),
    TargetClient("swift", "SWIFT", ("SWIFT", "S.W.I.F.T.", "Society for Worldwide Interbank Financial Telecommunication"), "banking"),
    TargetClient("worldline_be", "Worldline Belgium", ("Worldline", "Worldline Belgium", "Bancontact", "Bancontact Payconiq", "Payconiq"), "banking"),

    # ---- Insurance -------------------------------------------------------
    TargetClient("ag_insurance", "AG Insurance", ("AG Insurance", "AG Insurances"), "insurance"),
    TargetClient("axa_be", "AXA Belgium", ("AXA Belgium", "AXA België", "AXA Belgique"), "insurance"),
    TargetClient("ethias", "Ethias", ("Ethias",), "insurance"),
    TargetClient("pv_vivium", "P&V / Vivium", ("P&V", "PV Group", "Vivium", "P&V Group"), "insurance"),
    TargetClient("kbc_insurance", "KBC Insurance", ("KBC Insurance", "KBC Verzekeringen"), "insurance"),
    TargetClient("allianz_benelux", "Allianz Benelux", ("Allianz Benelux", "Allianz Belgium", "Allianz België", "Allianz Belgique"), "insurance"),

    # ---- Telecom ---------------------------------------------------------
    TargetClient("proximus", "Proximus", ("Proximus", "Proximus Group", "Proximus Ada"), "telecom"),
    TargetClient("telenet", "Telenet", ("Telenet", "Telenet Group", "NetCo", "Wyre"), "telecom"),
    TargetClient("orange_be", "Orange Belgium", ("Orange Belgium", "Orange België", "VOO"), "telecom"),

    # ---- Media -----------------------------------------------------------
    TargetClient("dpg_media", "DPG Media", ("DPG Media", "De Persgroep", "HLN", "VTM"), "media"),
    TargetClient("mediahuis", "Mediahuis", ("Mediahuis",), "media"),
    TargetClient("rossel", "Rossel", ("Rossel", "Le Soir", "Sudinfo", "L'Avenir"), "media"),
    TargetClient("vrt", "VRT", ("VRT", "VRT MAX", "Vlaamse Radio- en Televisieomroep"), "media"),
    TargetClient("rtbf", "RTBF", ("RTBF", "Auvio"), "media"),

    # ---- Retail ----------------------------------------------------------
    TargetClient("colruyt", "Colruyt", ("Colruyt", "Colruyt Group", "Collect&Go", "Xtra", "SmartWithFood"), "retail"),
    TargetClient("delhaize", "Delhaize", ("Delhaize", "Ahold Delhaize"), "retail"),
    TargetClient("carrefour_be", "Carrefour Belgium", ("Carrefour Belgium", "Carrefour België", "Carrefour Belgique"), "retail"),
    TargetClient("aldi_be", "Aldi Belgium", ("Aldi Belgium", "Aldi België", "Aldi Belgique"), "retail"),
    TargetClient("lidl_be", "Lidl Belgium", ("Lidl Belgium", "Lidl België", "Lidl Belgique"), "retail"),
    TargetClient("action_be", "Action Belgium", ("Action Belgium", "Action België", "Action Belgique"), "retail"),
    TargetClient("ikea_be", "IKEA Belgium", ("IKEA Belgium", "IKEA België", "IKEA Belgique"), "retail"),
    TargetClient("decathlon_be", "Decathlon Belgium", ("Decathlon Belgium", "Decathlon België", "Decathlon Belgique"), "retail"),
    TargetClient("brico_hubo", "Brico/Hubo/Gamma", ("Brico", "Hubo", "Gamma", "Maxeda"), "retail"),
    TargetClient("bol", "bol", ("bol.com", "bol",), "retail"),
    TargetClient("coolblue", "Coolblue", ("Coolblue",), "retail"),

    # ---- Energy ----------------------------------------------------------
    TargetClient("engie_electrabel", "Engie Electrabel", ("Engie", "Electrabel", "Engie Electrabel"), "energy"),
    TargetClient("luminus", "Luminus", ("Luminus", "EDF Luminus"), "energy"),
    TargetClient("elia", "Elia", ("Elia", "Elia Group"), "energy"),
    TargetClient("fluvius", "Fluvius", ("Fluvius",), "energy"),
    TargetClient("ores", "ORES", ("ORES",), "energy"),

    # ---- Transport operators --------------------------------------------
    TargetClient("sncb", "SNCB", ("SNCB", "NMBS", "SNCB/NMBS"), "transport_operator"),
    TargetClient("infrabel", "Infrabel", ("Infrabel",), "transport_operator"),
    TargetClient("stib_mivb", "STIB-MIVB", ("STIB", "MIVB", "STIB-MIVB"), "transport_operator"),
    TargetClient("de_lijn", "De Lijn", ("De Lijn",), "transport_operator"),
    TargetClient("tec", "TEC", ("TEC", "OTW", "Opérateur de Transport de Wallonie"), "transport_operator"),
    TargetClient("brussels_airlines", "Brussels Airlines", ("Brussels Airlines",), "transport_operator"),
    TargetClient("brussels_airport", "Brussels Airport Company", ("Brussels Airport", "Brussels Airport Company", "BRU"), "transport_operator"),
    TargetClient("port_antwerp_bruges", "Port of Antwerp-Bruges", ("Port of Antwerp", "Port of Antwerp-Bruges", "Haven van Antwerpen"), "transport_operator"),

    # ---- Logistics -------------------------------------------------------
    TargetClient("bpost", "bpost", ("bpost", "Bpost", "BPost"), "logistics"),
    TargetClient("dhl_be", "DHL Belgium", ("DHL Express", "DHL Belgium", "DHL Global Forwarding"), "logistics"),
    TargetClient("fedex_liege", "FedEx Liège", ("FedEx", "FedEx Liège", "FedEx Liege"), "logistics"),
    TargetClient("kuehne_nagel_be", "Kuehne+Nagel Belgium", ("Kuehne+Nagel", "Kuehne + Nagel", "Kuehne-Nagel"), "logistics"),
    TargetClient("h_essers", "H.Essers", ("H.Essers", "H. Essers", "Essers"), "logistics"),
    TargetClient("katoen_natie", "Katoen Natie", ("Katoen Natie",), "logistics"),
    TargetClient("jost_group", "Jost Group", ("Jost Group", "Jost"), "logistics"),
    TargetClient("sea_invest", "Sea-Invest", ("Sea-Invest", "Sea Invest", "SeaInvest"), "logistics"),

    # ---- Healthcare (mutualities + university hospitals) ----------------
    TargetClient("cm_mc", "Christelijke Mutualiteit / Mutualité Chrétienne", ("CM", "Christelijke Mutualiteit", "Mutualité Chrétienne", "MC"), "healthcare"),
    TargetClient("solidaris", "Solidaris", ("Solidaris",), "healthcare"),
    TargetClient("helan", "Helan", ("Helan",), "healthcare"),
    TargetClient("neutrale_ziekenfondsen", "Neutrale Ziekenfondsen", ("Neutrale Ziekenfondsen", "Mutualités Neutres"), "healthcare"),
    TargetClient("uz_leuven", "UZ Leuven", ("UZ Leuven", "Universitair Ziekenhuis Leuven"), "healthcare"),
    TargetClient("uz_gent", "UZ Gent", ("UZ Gent", "Universitair Ziekenhuis Gent"), "healthcare"),
    TargetClient("chu_liege", "CHU de Liège", ("CHU de Liège", "CHU Liège", "CHU Liege"), "healthcare"),
    TargetClient("ucl_saint_luc", "UCL Saint-Luc", ("Saint-Luc", "UCL Saint-Luc", "Cliniques universitaires Saint-Luc"), "healthcare"),
    TargetClient("erasme_ulb", "Erasme / ULB Hôpital", ("Erasme", "Hôpital Erasme", "ULB Hôpital"), "healthcare"),
    TargetClient("uz_brussel", "UZ Brussel", ("UZ Brussel",), "healthcare"),
    TargetClient("uza", "UZA", ("UZA", "Universitair Ziekenhuis Antwerpen"), "healthcare"),
    TargetClient("az_sint_jan_brugge", "AZ Sint-Jan Brugge", ("AZ Sint-Jan", "AZ Sint-Jan Brugge"), "healthcare"),
    TargetClient("az_delta", "AZ Delta", ("AZ Delta",), "healthcare"),
    TargetClient("zas_antwerp", "ZAS Antwerp", ("ZAS", "ZAS Antwerp", "Ziekenhuis aan de Stroom"), "healthcare"),

    # ---- Pharma ----------------------------------------------------------
    TargetClient("gsk_be", "GSK Belgium", ("GSK", "GlaxoSmithKline", "GSK Wavre", "GSK Rixensart"), "pharma"),
    TargetClient("janssen_beerse", "Janssen / J&J Innovative Medicine", ("Janssen", "Janssen Pharmaceutica", "Johnson & Johnson Innovative Medicine", "J&J Innovative Medicine"), "pharma"),
    TargetClient("pfizer_puurs", "Pfizer Puurs", ("Pfizer Puurs", "Pfizer Belgium", "Pfizer België"), "pharma"),
    TargetClient("ucb", "UCB", ("UCB", "UCB Pharma"), "pharma"),
    TargetClient("takeda_lessines", "Takeda Lessines", ("Takeda", "Takeda Lessines"), "pharma"),

    # ---- Chemicals -------------------------------------------------------
    TargetClient("basf_antwerp", "BASF Antwerpen", ("BASF", "BASF Antwerpen", "BASF Antwerp"), "chemicals"),
    TargetClient("ineos_be", "INEOS Belgium", ("INEOS", "INEOS Belgium", "INEOS Antwerp"), "chemicals"),
    TargetClient("solvay", "Solvay", ("Solvay",), "chemicals"),
    TargetClient("umicore", "Umicore", ("Umicore",), "chemicals"),

    # ---- Industrial manufacturing ---------------------------------------
    TargetClient("arcelormittal_be", "ArcelorMittal Belgium", ("ArcelorMittal", "ArcelorMittal Belgium", "ArcelorMittal Gent"), "industrial_manufacturing"),
    TargetClient("volvo_car_gent", "Volvo Car Gent", ("Volvo Car Gent", "Volvo Cars Gent", "Volvo Ghent"), "industrial_manufacturing"),
    TargetClient("volvo_trucks_gent", "Volvo Group Trucks Gent", ("Volvo Group Trucks", "Volvo Trucks Gent", "Volvo Group Belgium"), "industrial_manufacturing"),

    # ---- Food manufacturing ---------------------------------------------
    TargetClient("ab_inbev", "AB InBev", ("AB InBev", "Anheuser-Busch InBev", "InBev"), "food_manufacturing"),
    TargetClient("puratos", "Puratos", ("Puratos",), "food_manufacturing"),
    TargetClient("agristo", "Agristo", ("Agristo",), "food_manufacturing"),
    TargetClient("clarebout", "Clarebout", ("Clarebout", "Clarebout Potatoes"), "food_manufacturing"),
    TargetClient("mydibel", "Mydibel", ("Mydibel",), "food_manufacturing"),

    # ---- Education ------------------------------------------------------
    TargetClient("ku_leuven", "KU Leuven", ("KU Leuven", "Katholieke Universiteit Leuven"), "education"),
    TargetClient("ugent", "UGent", ("UGent", "Ghent University", "Universiteit Gent"), "education"),
    TargetClient("uclouvain", "UCLouvain", ("UCLouvain", "UCL", "Université catholique de Louvain"), "education"),
    TargetClient("ulb", "ULB", ("ULB", "Université libre de Bruxelles"), "education"),
    TargetClient("vub", "VUB", ("VUB", "Vrije Universiteit Brussel"), "education"),
    TargetClient("uliege", "ULiège", ("ULiège", "ULiege", "Université de Liège"), "education"),

    # ---- Public sector --------------------------------------------------
    TargetClient("smals", "Smals", ("Smals",), "public_sector"),
    TargetClient("armed_forces_be", "Belgian Armed Forces", ("Belgian Armed Forces", "Défense", "Defensie", "Belgian Defence"), "public_sector"),
    TargetClient("federal_police", "Federal Police", ("Federal Police", "Police Fédérale", "Federale Politie"), "public_sector"),
    TargetClient("fod_financien", "FOD Financiën / SPF Finances", ("FOD Financiën", "SPF Finances", "Belgian Finance Ministry"), "public_sector"),
    TargetClient("rsz_onss", "RSZ / ONSS", ("RSZ", "ONSS"), "public_sector"),
    TargetClient("rva_onem", "RVA / ONEM", ("RVA", "ONEM"), "public_sector"),
    TargetClient("flemish_government", "Flemish Government", ("Flemish Government", "Vlaamse Overheid", "MijnBurgerprofiel"), "public_sector"),
    TargetClient("walloon_government", "Walloon Government", ("Walloon Government", "Service Public de Wallonie", "SPW", "MonEspace"), "public_sector"),
    TargetClient("brussels_government", "Brussels Regional Government", ("Brussels Regional Government", "Région de Bruxelles-Capitale", "Brussels Hoofdstedelijk Gewest", "IRISbox"), "public_sector"),
]
