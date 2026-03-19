import os
import sys
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


# ── Step 1: Wipe Neo4j ──────────────────────────────────────────────────────

def wipe_neo4j(driver):
    print("\n── Wiping Neo4j ──")

    indexes = run_cypher(driver, "SHOW VECTOR INDEXES")
    for idx in indexes:
        name = idx.get("name")
        if name:
            run_cypher(driver, f"DROP INDEX `{name}` IF EXISTS")
            print(f"  Dropped vector index: {name}")

    run_cypher(driver, "MATCH (n) DETACH DELETE n")
    remaining = run_cypher(driver, "MATCH (n) RETURN count(n) AS count")
    print(f"  Nodes remaining: {remaining[0]['count']}")


# ── Step 2: Create Game nodes ────────────────────────────────────────────────

def create_game_nodes(driver, db):
    print("\n── Creating Game nodes ──")
    games = list(db.game.find({}))
    print(f"  Found {len(games)} games in MongoDB")

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
    print(f"  Created {count[0]['count']} Game nodes")
    return games


# ── Step 3: Create ABTest + Variant nodes ────────────────────────────────────

def create_abtest_nodes(driver, db):
    print("\n── Creating ABTest + Variant nodes ──")
    abtests = list(db.abtest.find({}))
    print(f"  Found {len(abtests)} AB tests in MongoDB")

    for test in abtests:
        test_id = test.get("id", "")

        run_cypher(driver, """
            MERGE (t:ABTest {testId: $testId})
            SET t.name = $name,
                t.description = $description,
                t.startDate = $startDate,
                t.endDate = $endDate,
                t.startTime = $startTime,
                t.endTime = $endTime,
                t.published = $published,
                t.group = $group
        """, {
            "testId": test_id,
            "name": test.get("name", ""),
            "description": test.get("description", ""),
            "startDate": test.get("startDate", ""),
            "endDate": test.get("endDate", ""),
            "startTime": test.get("startTime", ""),
            "endTime": test.get("endTime", ""),
            "published": test.get("published", False),
            "group": test.get("group", ""),
        })

        run_cypher(driver, """
            MERGE (v:Variant {testId: $testId, type: 'A'})
            SET v.image = $imageA, v.video = $videoA
        """, {
            "testId": test_id,
            "imageA": test.get("imageVariantA", ""),
            "videoA": test.get("videoVariantA", ""),
        })

        run_cypher(driver, """
            MERGE (v:Variant {testId: $testId, type: 'B'})
            SET v.image = $imageB, v.video = $videoB
        """, {
            "testId": test_id,
            "imageB": test.get("imageVariantB", ""),
            "videoB": test.get("videoVariantB", ""),
        })

        # ABTest -[:TESTS]-> Game (gameId matches game.cmsId)
        run_cypher(driver, """
            MATCH (t:ABTest {testId: $testId}), (g:Game {cmsId: $gameId})
            MERGE (t)-[:TESTS]->(g)
        """, {
            "testId": test_id,
            "gameId": test.get("gameId", ""),
        })

        # ABTest -[:HAS_VARIANT]-> Variant
        run_cypher(driver, """
            MATCH (t:ABTest {testId: $testId}), (v:Variant {testId: $testId})
            MERGE (t)-[:HAS_VARIANT]->(v)
        """, {
            "testId": test_id,
        })

    test_count = run_cypher(driver, "MATCH (t:ABTest) RETURN count(t) AS count")
    variant_count = run_cypher(driver, "MATCH (v:Variant) RETURN count(v) AS count")
    print(f"  Created {test_count[0]['count']} ABTest nodes, {variant_count[0]['count']} Variant nodes")
    return abtests


# ── Step 4: Create ABTestEvent nodes ─────────────────────────────────────────

def create_abtest_event_nodes(driver, db):
    print("\n── Creating ABTestEvent nodes ──")
    events = list(db.abtestdata.find({}))
    print(f"  Found {len(events)} AB test events in MongoDB")

    BATCH_SIZE = 100
    for i in range(0, len(events), BATCH_SIZE):
        batch = events[i:i + BATCH_SIZE]
        params_list = []
        for evt in batch:
            variant_type = "A" if evt.get("variant") == "variantA" else "B"
            params_list.append({
                "eventId": evt.get("id", ""),
                "eventType": evt.get("eventType", ""),
                "device": evt.get("device", ""),
                "timestamp": evt.get("timestamp", ""),
                "distributionWeight": evt.get("distributionWeight", 0),
                "variantType": variant_type,
                "gameId": evt.get("gameId", ""),
            })

        run_cypher(driver, """
            UNWIND $events AS evt
            MERGE (e:ABTestEvent {eventId: evt.eventId})
            SET e.eventType = evt.eventType,
                e.device = evt.device,
                e.timestamp = evt.timestamp,
                e.distributionWeight = evt.distributionWeight

            WITH e, evt
            MATCH (g:Game {cmsId: evt.gameId})
            MERGE (e)-[:ON_GAME]->(g)

            WITH e, evt
            MATCH (t:ABTest)-[:TESTS]->(:Game {cmsId: evt.gameId})
            MERGE (e)-[:FOR_TEST]->(t)

            WITH e, evt, t
            MATCH (v:Variant {testId: t.testId, type: evt.variantType})
            MERGE (e)-[:FOR_VARIANT]->(v)
        """, {"events": params_list})

        print(f"  Processed events {i+1}-{min(i+BATCH_SIZE, len(events))}")

    event_count = run_cypher(driver, "MATCH (e:ABTestEvent) RETURN count(e) AS count")
    print(f"  Created {event_count[0]['count']} ABTestEvent nodes")
    return events


# ── Step 5: Vector indexes and embeddings ────────────────────────────────────

def create_vector_indexes_and_embeddings(driver):
    print("\n── Creating vector indexes and embeddings ──")

    kg = Neo4jGraph(
        url=NEO4J_URI,
        username=NEO4J_USERNAME,
        password=NEO4J_PASSWORD,
    )

    kg.query("""
        CREATE VECTOR INDEX game_name_embeddings IF NOT EXISTS
        FOR (g:Game) ON (g.nameEmbedding)
        OPTIONS {
            indexConfig: {
                `vector.dimensions`: 1536,
                `vector.similarity_function`: 'cosine'
            }
        }
    """)
    print("  Created vector index: game_name_embeddings")

    kg.query("""
        CREATE VECTOR INDEX abtest_desc_embeddings IF NOT EXISTS
        FOR (t:ABTest) ON (t.descriptionEmbedding)
        OPTIONS {
            indexConfig: {
                `vector.dimensions`: 1536,
                `vector.similarity_function`: 'cosine'
            }
        }
    """)
    print("  Created vector index: abtest_desc_embeddings")

    embed_params = {
        "openAiApiKey": OPENAI_API_KEY,
        "openAiEndpoint": OPENAI_ENDPOINT,
    }

    # Embed game friendly names
    game_count = kg.query("MATCH (g:Game) WHERE g.friendlyName IS NOT NULL RETURN count(g) AS count")
    print(f"  Embedding {game_count[0]['count']} game names...")

    kg.query("""
        MATCH (g:Game)
        WHERE g.friendlyName IS NOT NULL AND g.friendlyName <> ''
        WITH g, ai.text.embed(
            g.friendlyName,
            "OpenAI",
            {
                token: $openAiApiKey,
                endpoint: $openAiEndpoint,
                model: "text-embedding-3-small"
            }) AS vector
        WHERE vector IS NOT NULL
        CALL db.create.setNodeVectorProperty(g, "nameEmbedding", vector)
    """, params=embed_params)
    print("  Embedded game friendly names")

    # Embed AB test descriptions (name + description)
    test_count = kg.query("MATCH (t:ABTest) WHERE t.description IS NOT NULL RETURN count(t) AS count")
    print(f"  Embedding {test_count[0]['count']} AB test descriptions...")

    kg.query("""
        MATCH (t:ABTest)
        WHERE t.description IS NOT NULL AND t.description <> ''
        WITH t, ai.text.embed(
            t.name + ' ' + t.description,
            "OpenAI",
            {
                token: $openAiApiKey,
                endpoint: $openAiEndpoint,
                model: "text-embedding-3-small"
            }) AS vector
        WHERE vector IS NOT NULL
        CALL db.create.setNodeVectorProperty(t, "descriptionEmbedding", vector)
    """, params=embed_params)
    print("  Embedded AB test descriptions")

    indexes = kg.query("SHOW VECTOR INDEXES")
    for idx in indexes:
        print(f"  Index: {idx.get('name')} — state: {idx.get('state')}")


# ── Step 6: Print summary ────────────────────────────────────────────────────

def print_summary(driver):
    print("\n── Graph Summary ──")

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
        wipe_neo4j(neo4j_driver)
        create_game_nodes(neo4j_driver, mongo_db)
        create_abtest_nodes(neo4j_driver, mongo_db)
        create_abtest_event_nodes(neo4j_driver, mongo_db)
        create_vector_indexes_and_embeddings(neo4j_driver)
        print_summary(neo4j_driver)
    finally:
        neo4j_driver.close()
        mongo_client.close()


if __name__ == "__main__":
    main()
