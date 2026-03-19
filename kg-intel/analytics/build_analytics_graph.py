"""
Adds analytics data to the existing Neo4j knowledge graph.
Does NOT wipe the graph — AB test data stays intact.
Clears only analytics-specific nodes (AnalyticsEvent, Session) before rebuilding.

Usage:
    python build_analytics_graph.py
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


# ── Step 1: Clear analytics nodes only ───────────────────────────────────────

def clear_analytics_nodes(driver):
    print("\n── Clearing existing analytics nodes ──")

    run_cypher(driver, "MATCH (e:AnalyticsEvent) DETACH DELETE e")
    run_cypher(driver, "MATCH (s:Session) DETACH DELETE s")

    indexes = run_cypher(driver, "SHOW VECTOR INDEXES")
    for idx in indexes:
        name = idx.get("name", "")
        if name.startswith("analytics_"):
            run_cypher(driver, f"DROP INDEX `{name}` IF EXISTS")
            print(f"  Dropped index: {name}")

    print("  Cleared AnalyticsEvent and Session nodes")


# ── Step 2: Ensure Game nodes exist ──────────────────────────────────────────

def ensure_game_nodes(driver, db):
    """Create Game nodes if they don't already exist (from AB test build)."""
    print("\n── Ensuring Game nodes ──")
    existing = run_cypher(driver, "MATCH (g:Game) RETURN count(g) AS count")
    existing_count = existing[0]["count"]

    if existing_count > 0:
        print(f"  {existing_count} Game nodes already exist, merging any new ones")

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


# ── Step 3: Create Session nodes ─────────────────────────────────────────────

def create_session_nodes(driver, db):
    print("\n── Creating Session nodes ──")

    pipeline = [
        {"$group": {
            "_id": "$sessionId",
            "userId": {"$first": "$userId"},
            "accountId": {"$first": "$accountId"},
            "firstEvent": {"$min": "$timestamp"},
            "lastEvent": {"$max": "$timestamp"},
            "eventCount": {"$sum": 1},
            "gameIds": {"$addToSet": "$gameId"},
            "device": {"$first": "$metadata.device_type"},
        }},
    ]
    sessions = list(db.analytics.aggregate(pipeline))
    print(f"  Found {len(sessions)} unique sessions")

    BATCH_SIZE = 50
    for i in range(0, len(sessions), BATCH_SIZE):
        batch = sessions[i:i + BATCH_SIZE]
        params_list = []
        for s in batch:
            params_list.append({
                "sessionId": s["_id"] or "",
                "userId": s.get("userId", ""),
                "accountId": s.get("accountId", ""),
                "firstEvent": s.get("firstEvent", ""),
                "lastEvent": s.get("lastEvent", ""),
                "eventCount": s.get("eventCount", 0),
                "device": s.get("device", "unknown"),
                "gameIds": s.get("gameIds", []),
            })

        run_cypher(driver, """
            UNWIND $sessions AS s
            MERGE (sess:Session {sessionId: s.sessionId})
            SET sess.userId = s.userId,
                sess.accountId = s.accountId,
                sess.firstEvent = s.firstEvent,
                sess.lastEvent = s.lastEvent,
                sess.eventCount = s.eventCount,
                sess.device = s.device

            WITH sess, s
            UNWIND s.gameIds AS gId
            MATCH (g:Game {cmsId: gId})
            MERGE (sess)-[:VISITED]->(g)
        """, {"sessions": params_list})

    count = run_cypher(driver, "MATCH (s:Session) RETURN count(s) AS count")
    print(f"  Created {count[0]['count']} Session nodes")


# ── Step 4: Create AnalyticsEvent nodes ──────────────────────────────────────

def create_analytics_event_nodes(driver, db):
    print("\n── Creating AnalyticsEvent nodes ──")
    events = list(db.analytics.find({}))
    print(f"  Found {len(events)} analytics events in MongoDB")

    BATCH_SIZE = 200
    for i in range(0, len(events), BATCH_SIZE):
        batch = events[i:i + BATCH_SIZE]
        params_list = []
        for evt in batch:
            meta = evt.get("metadata", {})
            params_list.append({
                "eventId": evt.get("id", ""),
                "eventType": evt.get("eventType", ""),
                "assetType": evt.get("assetType", ""),
                "assetUrl": evt.get("assetUrl", ""),
                "timestamp": evt.get("timestamp", ""),
                "device": meta.get("device_type", "unknown"),
                "gameId": evt.get("gameId", ""),
                "sessionId": evt.get("sessionId", ""),
            })

        run_cypher(driver, """
            UNWIND $events AS evt
            MERGE (e:AnalyticsEvent {eventId: evt.eventId})
            SET e.eventType = evt.eventType,
                e.assetType = evt.assetType,
                e.assetUrl = evt.assetUrl,
                e.timestamp = evt.timestamp,
                e.device = evt.device

            WITH e, evt
            MATCH (g:Game {cmsId: evt.gameId})
            MERGE (e)-[:ON_GAME]->(g)

            WITH e, evt
            MATCH (s:Session {sessionId: evt.sessionId})
            MERGE (e)-[:IN_SESSION]->(s)
        """, {"events": params_list})

        print(f"  Processed events {i+1}-{min(i+BATCH_SIZE, len(events))}")

    count = run_cypher(driver, "MATCH (e:AnalyticsEvent) RETURN count(e) AS count")
    print(f"  Created {count[0]['count']} AnalyticsEvent nodes")


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
        clear_analytics_nodes(neo4j_driver)
        ensure_game_nodes(neo4j_driver, mongo_db)
        create_session_nodes(neo4j_driver, mongo_db)
        create_analytics_event_nodes(neo4j_driver, mongo_db)
        print_summary(neo4j_driver)
    finally:
        neo4j_driver.close()
        mongo_client.close()


if __name__ == "__main__":
    main()
