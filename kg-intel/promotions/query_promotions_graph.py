"""
Example queries for the promotions knowledge graph.

Usage:
    python query_promotions_graph.py
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

    run_query(kg, "All promotions", """
        MATCH (p:Promotion)
        RETURN p.name AS name,
               p.description AS description,
               p.published AS published,
               p.startDate AS startDate,
               p.endDate AS endDate
        ORDER BY p.startDate
    """)

    run_query(kg, "Games in each promotion", """
        MATCH (p:Promotion)-[:INCLUDES]->(pg:PromoGame)-[:FOR_GAME]->(g:Game)
        RETURN p.name AS promotion,
               g.friendlyName AS game,
               pg.promoVideo AS promoVideo
        ORDER BY promotion, game
    """)

    run_query(kg, "Games appearing in multiple promotions", """
        MATCH (g:Game)<-[:FOR_GAME]-(pg:PromoGame)<-[:INCLUDES]-(p:Promotion)
        WITH g.friendlyName AS game, collect(DISTINCT p.name) AS promotions, count(DISTINCT p) AS promoCount
        WHERE promoCount > 1
        RETURN game, promotions, promoCount
        ORDER BY promoCount DESC
    """)

    run_query(kg, "Games in promotions that also have A/B tests", """
        MATCH (p:Promotion)-[:INCLUDES]->(pg:PromoGame)-[:FOR_GAME]->(g:Game)<-[:TESTS]-(t:ABTest)
        RETURN p.name AS promotion,
               g.friendlyName AS game,
               t.name AS abTest
        ORDER BY promotion, game
    """)

    run_query(kg, "Promotion games with analytics engagement", """
        MATCH (p:Promotion)-[:INCLUDES]->(pg:PromoGame)-[:FOR_GAME]->(g:Game)<-[:ON_GAME]-(e:AnalyticsEvent)
        RETURN p.name AS promotion,
               g.friendlyName AS game,
               count(e) AS analyticsEvents,
               collect(DISTINCT e.eventType) AS eventTypes
        ORDER BY analyticsEvents DESC
    """)

    print(f"\n{'─' * 60}")
    print("  All queries complete.")
    print(f"{'─' * 60}")


if __name__ == "__main__":
    main()
