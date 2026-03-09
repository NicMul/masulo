# Interaction Processor – Technical Specification
_Converts raw UI events into interaction vectors_

The **Interaction Processor** is the Mesulo pipeline component responsible for:

1. **Consuming raw interaction events** from `stream:interactions`
2. **Maintaining a sliding window of events per session** in Redis
3. **Aggregating behaviour into an interaction vector**
4. **Publishing interaction vectors** to `stream:vectors` for the AI Contextual Engine

This is the layer that turns noisy UI events into structured behavioural signals.

---

## 1. Inputs & Outputs

### Consumes
**Redis Stream:** `stream:interactions`  

Messages are produced by the **gateway** when the SDK sends `interaction_event` messages.

Message shape (payload):

```json
{
  "messageId": "msg-123",
  "type": "interaction_event",
  "sessionId": "sess-abc",
  "userId": "user-42",
  "timestamp": "2025-12-07T10:00:00.000Z",
  "componentId": "hero-banner-123",
  "pageContext": "/home",
  "eventType": "click",
  "metadata": {
    "scrollDepth": 0.72,
    "hoverDurationMs": 300,
    "x": 320,
    "y": 540,
    "viewportHeight": 1080,
    "viewportWidth": 1920
  }
}
```

The raw Redis entry uses a single `payload` field:

```text
XADD stream:interactions * payload "<json>"
```

---

### Produces
**Redis Stream:** `stream:vectors`

Message shape (interaction vector):

```json
{
  "messageId": "vec-456",
  "type": "interaction_vector",
  "sessionId": "sess-abc",
  "userId": "user-42",
  "timestamp": "2025-12-07T10:00:01.000Z",
  "features": {
    "scrollDepth": 0.72,
    "clickRatePerMin": 1.2,
    "hoverIntensity": 0.34,
    "timeOnPageSec": 14.2,
    "componentAttention": 0.61,
    "engagementVelocity": 0.15,
    "frustrationScore": 0.02,
    "deviceType": "desktop",
    "geoRegion": "CA",
    "currentComponentId": "hero-banner-123",
    "previousComponentIds": ["game-card-5"]
  }
}
```

---

## 2. Core Responsibilities

### 2.1 Sliding Window Management

For each `sessionId`, the processor maintains a **sliding window** of recent events:

- Window type: **time-based**
- Default window size: **N seconds** (e.g. 15–30 seconds)
- Stored in Redis under key:

```text
vec:window:{sessionId}
```

Implementation options:

1. **Store raw events** (easiest to reason about)
2. **Store aggregated counters** (more memory efficient)

For v1, the processor can:

- Append each event as a JSON string in a Redis list
- Trim list to a fixed number of entries or time horizon

Example:

```text
LPUSH vec:window:sess-abc "<json event>"
LTRIM vec:window:sess-abc 0 199
```

Optionally, timestamps are checked to drop events older than the horizon.

---

### 2.2 Vector Aggregation

Given a window of events for a session, the processor computes:

- `scrollDepth` – maximum scroll depth in the window (`0.0–1.0`)
- `clickRatePerMin` – click count / (windowSeconds / 60)
- `hoverIntensity` – total hover ms / (windowSeconds * 1000) clamped `0–1`
- `timeOnPageSec` – time between first event and now
- `componentAttention` – normalized hover share for the most-focused component
- `engagementVelocity` – change in click activity (`-1.0–1.0`)
- `frustrationScore` – heuristic derived from excessive clicks + low hover
- `deviceType`, `geoRegion` – passed through from context
- `currentComponentId` – component with highest hover / focus
- `previousComponentIds` – previous components encountered in the window

Vector construction uses the logic defined in the interaction vector spec.

---

### 2.3 Publishing Interaction Vectors

For each processed window, the service publishes a `interaction_vector` to:

```text
stream:vectors
```

Example:

```text
XADD stream:vectors * payload "<json interaction_vector>"
```

These vectors are then consumed by the **AI Contextual Engine**.

---

## 3. Redis Consumer Group Setup

**Group name:**

```text
cg:interactions
```

**Consumers:**

```text
processor-1, processor-2, ...
```

Consumption pattern:

```text
XREADGROUP GROUP cg:interactions processor-1 COUNT 50 BLOCK 5000 STREAMS stream:interactions >
```

After successful processing of a message:

```text
XACK stream:interactions cg:interactions <messageId>
```

If a message repeatedly fails, it can be moved to a dead-letter queue (DLQ) or logged.

---

## 4. Redis Key Strategy

Window key per session:

```text
vec:window:{sessionId}
```

Possible structures:

- `LIST` of JSON events (for v1, simplest)
- `HASH` of aggregated counters (for later optimisation)

Suggested v1:

- `LIST` with a max length (e.g. 200)
- Processor trims with `LTRIM` after `LPUSH`
- When constructing the vector, processor:
  - Reads the list
  - Parses relevant fields
  - Filters out stale events by timestamp

---

## 5. Error Handling & Fallback Rules

### Malformed event payload
- Log to `errors:interaction-processor`
- `XACK` the original message
- Do **not** publish a vector

### Empty or trivial window
- If there are too few events to construct a meaningful vector:
  - Option 1: skip publishing
  - Option 2: publish a low-signal vector with default values (e.g. `scrollDepth=0`, `hoverIntensity=0`)

### Redis failures
- On transient Redis errors:
  - Retry with backoff
- On extended Redis outage:
  - Process stops consuming and logs errors
  - No local buffering beyond what Redis already has in the stream

---

## 6. Performance Expectations

- Target **< 20ms** to process a batch of events into a vector.
- Batch size from `XREADGROUP`: ~50 messages.
- Memory footprint low: most state is in Redis, not in-process.
- Horizontal scaling:
  - Add more `processor-*` consumers to `cg:interactions`.

---

## 7. Local Development Setup

With `docker-compose`:

```bash
docker-compose up redis interaction-processor
```

Environment variables:

```text
REDIS_URL=redis://redis:6379
WINDOW_SECONDS=20               # configurable sliding window size
MAX_EVENTS_PER_WINDOW=200
NODE_ENV=development
```

---

## 8. File Structure

Suggested structure for this service:

```text
interaction-processor/
├── src/
│   ├── index.js                # service entrypoint
│   ├── consumers/
│   │   └── interactionConsumer.js
│   ├── vectorizer/
│   │   ├── buildInteractionVector.js
│   │   └── helpers.js
│   ├── redis-window/
│   │   ├── windowStore.js      # get/set/trim events per session
│   ├── utils/
│   │   ├── logger.js
│   │   └── config.js
├── package.json
└── README.md
```

---

## 9. Example Flow

1. Gateway receives `interaction_event` from SDK.
2. Gateway writes it to `stream:interactions`.
3. Interaction Processor:
   - Reads from `stream:interactions` via `cg:interactions`.
   - Appends event to `vec:window:{sessionId}`.
   - Rebuilds the sliding window for that session.
   - Calls `buildInteractionVector()` to create an `interaction_vector`.
   - Publishes `interaction_vector` to `stream:vectors`.
4. AI Contextual Engine consumes from `stream:vectors` and continues the pipeline.

---

End of document.
