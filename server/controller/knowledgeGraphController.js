const { OpenAI } = require('openai');
const neo4jModel = require('../model/neo4j');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const GRAPH_SCHEMA = `
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
`.trim();

async function nlToCypher(question, errorContext) {
  const messages = [
    { role: 'system', content: GRAPH_SCHEMA },
    { role: 'user', content: question },
  ];

  if (errorContext) {
    messages.push({ role: 'assistant', content: errorContext.cypher });
    messages.push({
      role: 'user',
      content: `That Cypher query failed with error: ${errorContext.error}\nPlease fix the query. Return ONLY the corrected Cypher.`
    });
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    messages,
  });

  return response.choices[0].message.content.trim();
}

exports.getGraph = async function (req, res) {
  const data = await neo4jModel.fetchFullGraph();
  return res.status(200).json({ data });
};

exports.runQuery = async function (req, res) {
  const { query, params } = req.body;

  if (!query) {
    return res.status(400).json({ data: { error: 'No query provided' } });
  }

  try {
    const results = await neo4jModel.runCypher(query, params || {});
    return res.status(200).json({ data: { results } });
  }
  catch (err) {
    return res.status(400).json({ data: { error: err.message } });
  }
};

exports.nlQuery = async function (req, res) {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ data: { error: 'No question provided' } });
  }

  let cypher = null;
  try {
    cypher = await nlToCypher(question);

    let results;
    try {
      results = await neo4jModel.runCypher(cypher);
    }
    catch (firstErr) {
      cypher = await nlToCypher(question, {
        cypher,
        error: firstErr.message,
      });
      results = await neo4jModel.runCypher(cypher);
    }

    return res.status(200).json({ data: { cypher, results } });
  }
  catch (err) {
    return res.status(400).json({ data: { error: err.message, cypher } });
  }
};
