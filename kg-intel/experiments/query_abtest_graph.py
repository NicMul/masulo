import os
from dotenv import load_dotenv
from langchain_neo4j import Neo4jGraph

ENV_PATH = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(ENV_PATH)

NEO4J_URI = os.environ["NEO4J_URI"]
NEO4J_USERNAME = os.environ["NEO4J_USERNAME"]
NEO4J_PASSWORD = os.environ["NEO4J_PASSWORD"]
OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]
OPENAI_ENDPOINT = os.getenv("OPENAI_ENDPOINT")


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

    # ── 1. Node and relationship counts ──

    run_query(kg, "Node counts by label", """
        MATCH (n)
        RETURN labels(n)[0] AS label, count(n) AS count
        ORDER BY count DESC
    """)

    run_query(kg, "Relationship counts by type", """
        MATCH ()-[r]->()
        RETURN type(r) AS type, count(r) AS count
        ORDER BY count DESC
    """)

    # ── 2. Games with their A/B tests ──

    run_query(kg, "Games with their A/B tests", """
        MATCH (t:ABTest)-[:TESTS]->(g:Game)
        RETURN g.friendlyName AS game,
               t.name AS test,
               t.published AS published,
               t.startDate AS startDate,
               t.endDate AS endDate
        ORDER BY g.friendlyName
    """)

    # ── 3. Variant performance comparison ──

    run_query(kg, "Variant performance: event counts by variant and type", """
        MATCH (e:ABTestEvent)-[:FOR_VARIANT]->(v:Variant),
              (e)-[:FOR_TEST]->(t:ABTest)-[:TESTS]->(g:Game)
        RETURN g.friendlyName AS game,
               t.name AS test,
               v.type AS variant,
               e.eventType AS eventType,
               count(e) AS events
        ORDER BY game, test, variant, events DESC
    """)

    # ── 4. Device breakdown per variant ──

    run_query(kg, "Device breakdown per variant", """
        MATCH (e:ABTestEvent)-[:FOR_VARIANT]->(v:Variant),
              (e)-[:FOR_TEST]->(t:ABTest)-[:TESTS]->(g:Game)
        RETURN g.friendlyName AS game,
               t.name AS test,
               v.type AS variant,
               e.device AS device,
               count(e) AS events
        ORDER BY game, test, variant, device
    """)

    # ── 5. Games with the most A/B test activity ──

    run_query(kg, "Games ranked by total A/B test events", """
        MATCH (e:ABTestEvent)-[:ON_GAME]->(g:Game)
        RETURN g.friendlyName AS game,
               g.cmsId AS cmsId,
               count(e) AS totalEvents
        ORDER BY totalEvents DESC
    """)

    # ── 6. Head-to-head: Variant A vs B win rate by event type ──

    run_query(kg, "Head-to-head: Variant A vs B per test", """
        MATCH (e:ABTestEvent)-[:FOR_VARIANT]->(v:Variant),
              (e)-[:FOR_TEST]->(t:ABTest)-[:TESTS]->(g:Game)
        WITH g.friendlyName AS game, t.name AS test, v.type AS variant, count(e) AS events
        ORDER BY game, test, variant
        RETURN game, test,
               collect({variant: variant, events: events}) AS variants
    """)

    # ── 7. Semantic search: find tests by meaning ──

    question = "find tests related to video engagement"
    print(f"\n{'─' * 60}")
    print(f"  Semantic search: \"{question}\"")
    print(f"{'─' * 60}")

    embed_params = {
        "openAiApiKey": OPENAI_API_KEY,
        "openAiEndpoint": OPENAI_ENDPOINT,
        "question": question,
        "top_k": 5,
    }

    results = kg.query("""
        WITH ai.text.embed(
            $question,
            "OpenAI",
            {
                token: $openAiApiKey,
                endpoint: $openAiEndpoint,
                model: "text-embedding-3-small"
            }) AS question_embedding
        CALL db.index.vector.queryNodes(
            'abtest_desc_embeddings',
            $top_k,
            question_embedding
        ) YIELD node AS abtest, score
        RETURN abtest.name AS name,
               abtest.description AS description,
               score
    """, params=embed_params)

    for row in results:
        print(f"  [{row['score']:.4f}] {row['name']}: {row['description']}")

    # ── 8. Semantic search: find games by name similarity ──

    game_question = "slot machine games"
    print(f"\n{'─' * 60}")
    print(f"  Semantic search (games): \"{game_question}\"")
    print(f"{'─' * 60}")

    game_results = kg.query("""
        WITH ai.text.embed(
            $question,
            "OpenAI",
            {
                token: $openAiApiKey,
                endpoint: $openAiEndpoint,
                model: "text-embedding-3-small"
            }) AS question_embedding
        CALL db.index.vector.queryNodes(
            'game_name_embeddings',
            $top_k,
            question_embedding
        ) YIELD node AS game, score
        RETURN game.friendlyName AS name,
               game.cmsId AS cmsId,
               score
    """, params={
        "openAiApiKey": OPENAI_API_KEY,
        "openAiEndpoint": OPENAI_ENDPOINT,
        "question": game_question,
        "top_k": 5,
    })

    for row in game_results:
        print(f"  [{row['score']:.4f}] {row['name']} ({row['cmsId']})")

    print(f"\n{'─' * 60}")
    print("  All queries complete.")
    print(f"{'─' * 60}")


if __name__ == "__main__":
    main()
