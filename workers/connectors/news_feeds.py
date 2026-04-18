"""Belgian + European business/tech RSS feeds for the news-intelligence connector.

Roster sourced from `docs/research/rss-feed-list.md` §A (Belgian business and
tech media) + §B (European tech/business news with Belgian coverage). Every URL
below is a verified pattern from that research doc — either a WordPress
`/feed/`, a section-level `.xml`, or a Feedburner endpoint.

Each feed must:
  - expose headline + abstract without authentication (free/public)
  - be update-frequent enough to produce fresh hits on a daily run
  - cover Belgian enterprise, public sector, or Brussels-institution news
    that moves named-account buying decisions

`optional=True` is a soft-flag for feeds that are paywalled, truncated on the
free tier, occasionally 403 to unauthenticated clients, or broad enough to
sometimes return nothing useful. The connector downgrades their empty-response
logs from WARNING to INFO (see `news_intelligence.py`).

Paywalled / deprecated sources deliberately omitted: FT, Reuters public RSS,
Bloomberg, Indeed XML, LinkedIn Jobs, Meetup, Eventbrite, Twitter/X,
Channelweb.be, References.be, ICTjob.be, Trends-Business-Information API.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class NewsFeed:
    outlet: str
    url: str
    language: str
    optional: bool = False


NEWS_FEEDS: list[NewsFeed] = [
    # ---- Block 1 — Belgian business press (NL + FR) -----------------------
    NewsFeed(outlet="De Tijd",          url="https://www.tijd.be/rss/ondernemen.xml",                language="nl"),
    NewsFeed(outlet="L'Echo",           url="https://www.lecho.be/rss/entreprises.xml",              language="fr", optional=True),
    NewsFeed(outlet="Trends",           url="https://trends.knack.be/feed/",                         language="nl"),
    NewsFeed(outlet="Trends-Tendances", url="https://trends.levif.be/feed/",                         language="fr"),
    NewsFeed(outlet="Business AM",      url="https://businessam.be/feed/",                           language="nl"),
    NewsFeed(outlet="Bloovi",           url="https://www.bloovi.be/rss",                             language="nl", optional=True),
    NewsFeed(outlet="Le Soir — Éco",    url="https://www.lesoir.be/rss/17836.xml",                   language="fr", optional=True),
    NewsFeed(outlet="De Standaard — Economie", url="https://www.standaard.be/rss/section/economie.xml", language="nl", optional=True),
    NewsFeed(outlet="De Morgen — Economie",    url="https://www.demorgen.be/economie/rss.xml",       language="nl"),
    NewsFeed(outlet="HLN — Geld",       url="https://www.hln.be/geld/rss.xml",                       language="nl", optional=True),

    # ---- Block 2 — Belgian tech / IT press --------------------------------
    NewsFeed(outlet="Data News",        url="https://datanews.knack.be/feed/",                       language="nl"),
    NewsFeed(outlet="ITdaily.be",       url="https://itdaily.be/feed/",                              language="nl"),
    NewsFeed(outlet="Computable.be",    url="https://www.computable.be/feed/",                       language="nl"),
    NewsFeed(outlet="Tweakers.be",      url="https://feeds.feedburner.com/tweakers/mixed",           language="nl"),
    NewsFeed(outlet="Geeko (Le Soir)",  url="https://geeko.lesoir.be/feed/",                         language="fr", optional=True),
    NewsFeed(outlet="Le Soir — Tech",   url="https://www.lesoir.be/rss/17838.xml",                   language="fr", optional=True),

    # ---- Block 3 — European tech / startup / policy -----------------------
    NewsFeed(outlet="Tech.eu",          url="https://tech.eu/feed/",                                 language="en"),
    NewsFeed(outlet="EU-Startups (BE)", url="https://www.eu-startups.com/tag/belgium/feed",          language="en"),
    NewsFeed(outlet="Sifted",           url="https://sifted.eu/feed/?post_type=article",             language="en"),
    NewsFeed(outlet="Silicon Canals",   url="https://siliconcanals.com/feed/",                       language="en"),
    NewsFeed(outlet="Politico Europe — Tech",  url="https://www.politico.eu/section/technology/feed/", language="en"),
    NewsFeed(outlet="Euractiv — Digital",      url="https://www.euractiv.com/section/digital/feed/",  language="en", optional=True),
    NewsFeed(outlet="TechCrunch Europe", url="https://techcrunch.com/tag/europe/feed/",              language="en", optional=True),
    NewsFeed(outlet="The Next Web",     url="https://feeds.feedburner.com/thenextweb",               language="en", optional=True),

    # ---- Block 4 — Regional / Walloon press -------------------------------
    NewsFeed(outlet="L'Avenir",         url="https://www.lavenir.net/arc/outboundfeeds/rss/",        language="fr", optional=True),
]
