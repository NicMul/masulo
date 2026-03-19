const neo4j = require('neo4j-driver');

let driver = null;

exports.connect = async () => {
  try {
    const uri = process.env.NEO4J_URI;
    const username = process.env.NEO4J_USERNAME;
    const password = process.env.NEO4J_PASSWORD;

    if (!uri || !username || !password) {
      console.warn('⚠️  Neo4j credentials not configured — knowledge graph features disabled');
      return;
    }

    driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
    await driver.verifyConnectivity();
    console.log(`✅ Connected to Neo4j (${uri})`);
  }
  catch (err) {
    console.error('❌ Neo4j connection failed:', err.message);
  }
};

exports.getDriver = () => driver;

exports.runCypher = async (query, params = {}) => {
  if (!driver) throw new Error('Neo4j is not connected');

  const session = driver.session();
  try {
    const result = await session.run(query, params);
    return result.records.map(record => {
      const obj = {};
      record.keys.forEach(key => {
        obj[key] = toPlainValue(record.get(key));
      });
      return obj;
    });
  }
  finally {
    await session.close();
  }
};

exports.fetchFullGraph = async () => {
  const nodesRaw = await exports.runCypher(`
    MATCH (n)
    RETURN id(n) AS id, labels(n) AS labels, properties(n) AS props
  `);

  const relsRaw = await exports.runCypher(`
    MATCH (a)-[r]->(b)
    RETURN id(a) AS source, id(b) AS target, type(r) AS type
  `);

  const nodes = nodesRaw.map(n => {
    const label = n.labels?.[0] || 'Unknown';
    const props = {};

    for (const [k, v] of Object.entries(n.props || {})) {
      if (k.endsWith('Embedding')) continue;
      props[k] = v;
    }

    let displayName;
    if (label === 'Session') {
      const sid = props.sessionId || '';
      displayName = sid.length > 24 ? sid.slice(0, 24) + '...' : sid;
    } else {
      displayName =
        props.friendlyName ||
        props.name ||
        props.type ||
        props.eventType ||
        label;
    }

    return { id: n.id, label, name: displayName, props };
  });

  const links = relsRaw.map(r => ({
    source: r.source,
    target: r.target,
    type: r.type,
  }));

  return { nodes, links };
};

function toPlainValue(val) {
  if (val === null || val === undefined) return val;
  if (neo4j.isInt(val)) return val.toNumber();
  if (Array.isArray(val)) return val.map(toPlainValue);
  if (typeof val === 'object' && val.constructor === Object) {
    const out = {};
    for (const [k, v] of Object.entries(val)) {
      out[k] = toPlainValue(v);
    }
    return out;
  }
  return val;
}
