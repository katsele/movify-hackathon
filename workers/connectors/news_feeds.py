"""Belgian business-news RSS feeds for the news intelligence connector.

Keep this list short and trustworthy. Each feed must:
  - expose headline + abstract without authentication
  - be update-frequent enough to produce fresh hits in a one-day hackathon window
  - cover Belgian enterprise / public sector coverage

L'Echo is a stretch feed — included but marked optional; it frequently returns
403 to unauthenticated clients.
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
    NewsFeed(
        outlet="De Tijd",
        url="https://www.tijd.be/rss/ondernemen.xml",
        language="nl",
    ),
    NewsFeed(
        outlet="L'Echo",
        url="https://www.lecho.be/rss/entreprises.xml",
        language="fr",
    ),
    NewsFeed(
        outlet="Data News",
        url="https://datanews.knack.be/feed/",
        language="nl",
    ),
]
