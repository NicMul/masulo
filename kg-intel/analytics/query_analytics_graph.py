"""
Example queries for the analytics knowledge graph.

Usage:
    python query_analytics_graph.py
"""

import os
from dotenv import load_dotenv
from langchain_neo4j import Neo4jGraph

ENV_PATH = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(ENV_PATH)

NEO4J_URI = os.environ["NEO4J_URI"]
NEO4J_USERNAME = os.environ["NEO4J_USERNAME"]
NEO4J_PASSWORD = os.environ["NEO4J_PASSWORD"]


def run_query(kg, title, cypher, params=None):
    print(f"\n{'─' * 60}")
    print(f"  {title}")
    print(f"{'─' * 60}")
    results = kg.query(cypher, params=params or {})
    if not results:
        print("  (no results)")
    for row in results:
        print(f"  {row}")
    return results


def main():
    kg = Neo4jGraph(
        url=NEO4J_URI,
        username=NEO4J_USERNAME,
        password=NEO4J_PASSWORD,
    )

    # ── 1. Analytics overview ──

    run_query(kg, "Analytics node counts", """
        MATCH (n)
        WHERE n:AnalyticsEvent OR n:Session
        RETURN labels(n)[0] AS label, count(n) AS count
        ORDER BY count DESC
    """)

    # ── 2. Events per game ──

    run_query(kg, "Events per game (top 10)", """
        MATCH (e:AnalyticsEvent)-[:ON_GAME]->(g:Game)
        RETURN g.friendlyName AS game, count(e) AS events
        ORDER BY events DESC
        LIMIT 10
    """)

    # ── 3. Event type breakdown ──

    run_query(kg, "Event type breakdown", """
        MATCH (e:AnalyticsEvent)
        RETURN e.eventType AS eventType, count(e) AS count
        ORDER BY count DESC
    """)

    # ── 4. Asset type breakdown ──

    run_query(kg, "Asset type breakdown", """
        MATCH (e:AnalyticsEvent)
        RETURN e.assetType AS assetType, count(e) AS count
        ORDER BY count DESC
    """)

    # ── 5. Sessions per game ──

    run_query(kg, "Sessions per game", """
        MATCH (s:Session)-[:VISITED]->(g:Game)
        RETURN g.friendlyName AS game, count(s) AS sessions
        ORDER BY sessions DESC
    """)

    # ── 6. Device breakdown ──

    run_query(kg, "Device breakdown across all events", """
        MATCH (e:AnalyticsEvent)
        RETURN e.device AS device, count(e) AS events
        ORDER BY events DESC
    """)

    # ── 7. User journey: events per session ──

    run_query(kg, "Avg events per session (top sessions)", """
        MATCH (s:Session)
        RETURN s.sessionId AS session,
               s.eventCount AS events,
               s.device AS device,
               s.firstEvent AS started,
               s.lastEvent AS ended
        ORDER BY s.eventCount DESC
        LIMIT 10
    """)

    # ── 8. Video engagement funnel ──

    run_query(kg, "Video engagement funnel per game", """
        MATCH (e:AnalyticsEvent)-[:ON_GAME]->(g:Game)
        WHERE e.eventType IN ['video_play', 'video_pause', 'video_click']
        RETURN g.friendlyName AS game,
               e.eventType AS eventType,
               count(e) AS count
        ORDER BY game, count DESC
    """)

    # ── 9. Games visited together in the same session ──

    run_query(kg, "Games visited together in same session", """
        MATCH (g1:Game)<-[:VISITED]-(s:Session)-[:VISITED]->(g2:Game)
        WHERE g1.cmsId < g2.cmsId
        RETURN g1.friendlyName AS game1,
               g2.friendlyName AS game2,
               count(s) AS sharedSessions
        ORDER BY sharedSessions DESC
        LIMIT 10
    """)

    # ── 10. Impression to click conversion by game ──

    run_query(kg, "Impression to click conversion by game", """
        MATCH (e:AnalyticsEvent)-[:ON_GAME]->(g:Game)
        WHERE e.eventType IN ['impression', 'image_impression', 'video_click', 'button_click']
        WITH g.friendlyName AS game,
             sum(CASE WHEN e.eventType IN ['impression', 'image_impression'] THEN 1 ELSE 0 END) AS impressions,
             sum(CASE WHEN e.eventType IN ['video_click', 'button_click'] THEN 1 ELSE 0 END) AS clicks
        WHERE impressions > 0
        RETURN game, impressions, clicks,
               round(toFloat(clicks) / impressions * 100, 1) AS conversionRate
        ORDER BY conversionRate DESC
    """)

    print(f"\n{'─' * 60}")
    print("  All queries complete.")
    print(f"{'─' * 60}")


if __name__ == "__main__":
    main()
