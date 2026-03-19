"""
Lightweight visualization server for the knowledge graph.
Serves the 3D graph HTML and proxies Cypher queries to Neo4j.

Usage:
    python visualize_server.py
    Open http://localhost:7474 in your browser
"""

import os
import json
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from dotenv import load_dotenv
from neo4j import GraphDatabase
from openai import OpenAI

ENV_PATH = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(ENV_PATH)

NEO4J_URI = os.environ["NEO4J_URI"]
NEO4J_USERNAME = os.environ["NEO4J_USERNAME"]
NEO4J_PASSWORD = os.environ["NEO4J_PASSWORD"]
OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]

openai_client = OpenAI(api_key=OPENAI_API_KEY)

PORT = 7475

driver = None


def get_driver():
    global driver
    if driver is None:
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USERNAME, NEO4J_PASSWORD))
        driver.verify_connectivity()
        print(f"Connected to Neo4j ({NEO4J_URI})")
    return driver


def run_cypher(query, params=None):
    d = get_driver()
    with d.session() as session:
        result = session.run(query, params or {})
        return [record.data() for record in result]


def fetch_full_graph():
    """Fetch all nodes and relationships for 3D visualization."""
    nodes_raw = run_cypher("""
        MATCH (n)
        RETURN id(n) AS id, labels(n) AS labels, properties(n) AS props
    """)

    rels_raw = run_cypher("""
        MATCH (a)-[r]->(b)
        RETURN id(a) AS source, id(b) AS target, type(r) AS type
    """)

    nodes = []
    for n in nodes_raw:
        label = n["labels"][0] if n["labels"] else "Unknown"
        props = n["props"]

        # Strip embedding vectors from props (they're huge float arrays)
        props = {k: v for k, v in props.items()
                 if not k.endswith("Embedding")}

        if label == "Session":
            sid = props.get("sessionId", "")
            display_name = sid[:24] + "..." if len(sid) > 24 else sid
        else:
            display_name = (
                props.get("friendlyName")
                or props.get("name")
                or props.get("type")
                or props.get("eventType")
                or label
            )

        nodes.append({
            "id": n["id"],
            "label": label,
            "name": display_name,
            "props": props,
        })

    links = []
    for r in rels_raw:
        links.append({
            "source": r["source"],
            "target": r["target"],
            "type": r["type"],
        })

    return {"nodes": nodes, "links": links}


GRAPH_SCHEMA = """
You are a Cypher query generator for a Neo4j knowledge graph.

NODE TYPES AND PROPERTIES:
- (:Game {cmsId, friendlyName, group, publishedType, animate, hover, analytics})
- (:ABTest {testId, name, description, startDate, endDate, startTime, endTime, published, group})
- (:Variant {testId, type, image, video})  — type is 'A' or 'B'
- (:ABTestEvent {eventId, eventType, device, timestamp, distributionWeight})
  eventType values: impression, hover_start, hover_end, video_click
  device values: desktop, mobile

RELATIONSHIPS (A/B Tests):
- (ABTest)-[:TESTS]->(Game)
- (ABTest)-[:HAS_VARIANT]->(Variant)
- (ABTestEvent)-[:FOR_TEST]->(ABTest)
- (ABTestEvent)-[:FOR_VARIANT]->(Variant)
- (ABTestEvent)-[:ON_GAME]->(Game)

ANALYTICS NODE TYPES AND PROPERTIES:
- (:Session {sessionId, userId, accountId, firstEvent, lastEvent, eventCount, device})
- (:AnalyticsEvent {eventId, eventType, assetType, assetUrl, timestamp, device})
  eventType values: video_play, video_pause, video_click, button_click, impression, image_impression
  assetType values: video, image, button
  device values: desktop, mobile, unknown

RELATIONSHIPS (Analytics):
- (AnalyticsEvent)-[:ON_GAME]->(Game)
- (AnalyticsEvent)-[:IN_SESSION]->(Session)
- (Session)-[:VISITED]->(Game)

PROMOTION NODE TYPES AND PROPERTIES:
- (:Promotion {promoId, name, description, group, startDate, endDate, published})
- (:PromoGame {promoId, gameCmsId, friendlyName, promoVideo})

RELATIONSHIPS (Promotions):
- (Promotion)-[:INCLUDES]->(PromoGame)
- (PromoGame)-[:FOR_GAME]->(Game)

RULES:
- Return ONLY the Cypher query, no explanation, no markdown fences.
- Use friendlyName for display (not cmsId) when showing game names.
- For variant comparisons, group by variant type (A vs B).
- Keep queries efficient — use LIMIT when returning many rows.
- For "which variant won/performed better", compare event counts.
- NEVER use GROUP BY — Cypher does NOT have GROUP BY. Aggregation is implicit via non-aggregated columns in RETURN.
- NEVER use SQL syntax. Use only valid Neo4j Cypher.
- Use WITH for intermediate aggregations when needed.
- Example pattern: RETURN v.type AS variant, count(e) AS events ORDER BY events DESC
""".strip()


def nl_to_cypher(question, error_context=None):
    messages = [
        {"role": "system", "content": GRAPH_SCHEMA},
        {"role": "user", "content": question},
    ]
    if error_context:
        messages.append({"role": "assistant", "content": error_context["cypher"]})
        messages.append({"role": "user", "content":
            f"That Cypher query failed with error: {error_context['error']}\n"
            "Please fix the query. Return ONLY the corrected Cypher."
        })

    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0,
        messages=messages,
    )
    return response.choices[0].message.content.strip()


class GraphHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(
            *args,
            directory=os.path.dirname(os.path.abspath(__file__)),
            **kwargs,
        )

    def do_GET(self):
        parsed = urlparse(self.path)

        if parsed.path == "/":
            self.path = "/visualize.html"
            return super().do_GET()

        if parsed.path == "/api/graph":
            data = fetch_full_graph()
            self._json_response(data)
            return

        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length)) if length else {}

        if parsed.path == "/api/query":
            cypher = body.get("query", "")
            params = body.get("params", {})

            try:
                results = run_cypher(cypher, params)
                self._json_response({"results": results})
            except Exception as e:
                self._json_response({"error": str(e)}, status=400)
            return

        if parsed.path == "/api/nl-query":
            question = body.get("question", "")
            if not question:
                self._json_response({"error": "No question provided"}, status=400)
                return

            cypher = None
            try:
                cypher = nl_to_cypher(question)
                try:
                    results = run_cypher(cypher)
                except Exception as first_err:
                    # Auto-retry: ask OpenAI to fix the broken Cypher
                    cypher = nl_to_cypher(question, error_context={
                        "cypher": cypher,
                        "error": str(first_err),
                    })
                    results = run_cypher(cypher)

                self._json_response({
                    "cypher": cypher,
                    "results": results,
                })
            except Exception as e:
                self._json_response({
                    "error": str(e),
                    "cypher": cypher,
                }, status=400)
            return

    def _json_response(self, data, status=200):
        payload = json.dumps(data, default=str).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", len(payload))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, format, *args):
        if "/api/" in str(args[0]) if args else False:
            super().log_message(format, *args)


def main():
    get_driver()
    server = HTTPServer(("0.0.0.0", PORT), GraphHandler)
    print(f"Visualization server running at http://localhost:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        if driver:
            driver.close()
        server.server_close()


if __name__ == "__main__":
    main()
