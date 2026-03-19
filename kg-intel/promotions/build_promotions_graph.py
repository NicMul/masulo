"""
Adds promotion data to the existing Neo4j knowledge graph.
Does NOT wipe the graph — AB test and analytics data stays intact.
Clears only promotion-specific nodes (Promotion, PromoGame) before rebuilding.

Usage:
    python build_promotions_graph.py
"""

import os
from urllib.parse import quote_plus
from dotenv import load_dotenv
from neo4j import GraphDatabase
from pymongo import MongoClient
from langchain_neo4j import Neo4jGraph

ENV_PATH = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(ENV_PATH)

NEO4J_URI = os.environ["NEO4J_URI"]
NEO4J_USERNAME = os.environ["NEO4J_USERNAME"]
NEO4J_PASSWORD = os.environ["NEO4J_PASSWORD"]
NEO4J_AUTH = (NEO4J_USERNAME, NEO4J_PASSWORD)

DB_USER = os.environ["DB_USER"]
DB_PASSWORD = os.environ["DB_PASSWORD"]
DB_HOST = os.environ["DB_HOST"]
DB_NAME = os.environ["DB_NAME"]

OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]
OPENAI_ENDPOINT = os.getenv("OPENAI_ENDPOINT")

MONGO_URI = f"mongodb+srv://{DB_USER}:{quote_plus(DB_PASSWORD)}@{DB_HOST}/{DB_NAME}"


def connect_mongo():
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    print(f"Connected to MongoDB ({DB_HOST}/{DB_NAME})")
    return client, db


def connect_neo4j():
    driver = GraphDatabase.driver(NEO4J_URI, auth=NEO4J_AUTH)
    driver.verify_connectivity()
    print(f"Connected to Neo4j ({NEO4J_URI})")
    return driver


def run_cypher(driver, query, parameters=None):
    with driver.session() as session:
        result = session.run(query, parameters or {})
        return [record.data() for record in result]


# ── Step 1: Clear promotion nodes only ───────────────────────────────────────

def clear_promotion_nodes(driver):
    print("\n── Clearing existing promotion nodes ──")

    run_cypher(driver, "MATCH (pg:PromoGame) DETACH DELETE pg")
    run_cypher(driver, "MATCH (p:Promotion) DETACH DELETE p")

    indexes = run_cypher(driver, "SHOW VECTOR INDEXES")
    for idx in indexes:
        name = idx.get("name", "")
        if name.startswith("promo_"):
            run_cypher(driver, f"DROP INDEX `{name}` IF EXISTS")
            print(f"  Dropped index: {name}")

    print("  Cleared Promotion and PromoGame nodes")


# ── Step 2: Ensure Game nodes exist ──────────────────────────────────────────

def ensure_game_nodes(driver, db):
    print("\n── Ensuring Game nodes ──")
    existing = run_cypher(driver, "MATCH (g:Game) RETURN count(g) AS count")
    print(f"  {existing[0]['count']} Game nodes already exist")

    games = list(db.game.find({}))
    for game in games:
        run_cypher(driver, """
            MERGE (g:Game {cmsId: $cmsId})
            SET g.friendlyName = $friendlyName,
                g.group = $group,
                g.publishedType = $publishedType,
                g.animate = $animate,
                g.hover = $hover,
                g.analytics = $analytics
        """, {
            "cmsId": game.get("cmsId", game.get("id", "")),
            "friendlyName": game.get("friendlyName", ""),
            "group": game.get("group", ""),
            "publishedType": game.get("publishedType", "default"),
            "animate": game.get("animate", False),
            "hover": game.get("hover", False),
            "analytics": game.get("analytics", False),
        })

    count = run_cypher(driver, "MATCH (g:Game) RETURN count(g) AS count")
    print(f"  {count[0]['count']} Game nodes total")


# ── Step 3: Create Promotion + PromoGame nodes ───────────────────────────────

def create_promotion_nodes(driver, db):
    print("\n── Creating Promotion + PromoGame nodes ──")
    promos = list(db.promotion.find({}))
    print(f"  Found {len(promos)} promotions in MongoDB")

    for promo in promos:
        promo_id = promo.get("id", "")

        run_cypher(driver, """
            MERGE (p:Promotion {promoId: $promoId})
            SET p.name = $name,
                p.description = $description,
                p.group = $group,
                p.startDate = $startDate,
                p.endDate = $endDate,
                p.published = $published
        """, {
            "promoId": promo_id,
            "name": promo.get("name", ""),
            "description": promo.get("description", ""),
            "group": promo.get("group", ""),
            "startDate": str(promo.get("startDate", "")),
            "endDate": str(promo.get("endDate", "")),
            "published": promo.get("published", False),
        })

        for game_entry in promo.get("games", []):
            cms_id = game_entry.get("gameCmsId", "")

            run_cypher(driver, """
                MERGE (pg:PromoGame {promoId: $promoId, gameCmsId: $gameCmsId})
                SET pg.friendlyName = $friendlyName,
                    pg.promoVideo = $promoVideo
            """, {
                "promoId": promo_id,
                "gameCmsId": cms_id,
                "friendlyName": game_entry.get("friendlyName", ""),
                "promoVideo": game_entry.get("promoVideo", ""),
            })

            # Promotion -[:INCLUDES]-> PromoGame
            run_cypher(driver, """
                MATCH (p:Promotion {promoId: $promoId}),
                      (pg:PromoGame {promoId: $promoId, gameCmsId: $gameCmsId})
                MERGE (p)-[:INCLUDES]->(pg)
            """, {
                "promoId": promo_id,
                "gameCmsId": cms_id,
            })

            # PromoGame -[:FOR_GAME]-> Game
            run_cypher(driver, """
                MATCH (pg:PromoGame {promoId: $promoId, gameCmsId: $gameCmsId}),
                      (g:Game {cmsId: $gameCmsId})
                MERGE (pg)-[:FOR_GAME]->(g)
            """, {
                "promoId": promo_id,
                "gameCmsId": cms_id,
            })

    promo_count = run_cypher(driver, "MATCH (p:Promotion) RETURN count(p) AS count")
    pg_count = run_cypher(driver, "MATCH (pg:PromoGame) RETURN count(pg) AS count")
    print(f"  Created {promo_count[0]['count']} Promotion nodes, {pg_count[0]['count']} PromoGame nodes")


# ── Step 4: Vector embeddings for promotions ─────────────────────────────────

def create_promotion_embeddings(driver):
    print("\n── Creating promotion vector embeddings ──")

    kg = Neo4jGraph(
        url=NEO4J_URI,
        username=NEO4J_USERNAME,
        password=NEO4J_PASSWORD,
    )

    kg.query("""
        CREATE VECTOR INDEX promo_desc_embeddings IF NOT EXISTS
        FOR (p:Promotion) ON (p.descriptionEmbedding)
        OPTIONS {
            indexConfig: {
                `vector.dimensions`: 1536,
                `vector.similarity_function`: 'cosine'
            }
        }
    """)
    print("  Created vector index: promo_desc_embeddings")

    embed_params = {
        "openAiApiKey": OPENAI_API_KEY,
        "openAiEndpoint": OPENAI_ENDPOINT,
    }

    promo_count = kg.query("MATCH (p:Promotion) WHERE p.description IS NOT NULL RETURN count(p) AS count")
    print(f"  Embedding {promo_count[0]['count']} promotion descriptions...")

    kg.query("""
        MATCH (p:Promotion)
        WHERE p.description IS NOT NULL AND p.description <> ''
        WITH p, ai.text.embed(
            p.name + ' ' + p.description,
            "OpenAI",
            {
                token: $openAiApiKey,
                endpoint: $openAiEndpoint,
                model: "text-embedding-3-small"
            }) AS vector
        WHERE vector IS NOT NULL
        CALL db.create.setNodeVectorProperty(p, "descriptionEmbedding", vector)
    """, params=embed_params)
    print("  Embedded promotion descriptions")


# ── Step 5: Print summary ────────────────────────────────────────────────────

def print_summary(driver):
    print("\n── Graph Summary (full graph) ──")

    labels = run_cypher(driver, """
        MATCH (n)
        RETURN labels(n)[0] AS label, count(n) AS count
        ORDER BY count DESC
    """)
    for row in labels:
        print(f"  {row['label']}: {row['count']} nodes")

    rels = run_cypher(driver, """
        MATCH ()-[r]->()
        RETURN type(r) AS type, count(r) AS count
        ORDER BY count DESC
    """)
    for row in rels:
        print(f"  {row['type']}: {row['count']} relationships")

    print("\nDone.")


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    neo4j_driver = connect_neo4j()
    mongo_client, mongo_db = connect_mongo()

    try:
        clear_promotion_nodes(neo4j_driver)
        ensure_game_nodes(neo4j_driver, mongo_db)
        create_promotion_nodes(neo4j_driver, mongo_db)
        create_promotion_embeddings(neo4j_driver)
        print_summary(neo4j_driver)
    finally:
        neo4j_driver.close()
        mongo_client.close()


if __name__ == "__main__":
    main()
