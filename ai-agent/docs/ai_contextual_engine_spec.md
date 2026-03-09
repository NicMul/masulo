# AI Contextual Engine – Technical Specification
_Real-time intent inference + variant selection_

The **AI Contextual Engine** is the Mesulo pipeline component responsible for:

1. **Consuming interaction vectors** from `stream:vectors`
2. **Computing user intent** (rule-based or ML-based)
3. **Selecting the optimal UI variant** for the observed behaviour
4. **Publishing candidate UI deltas** to `stream:candidate-deltas`

It is the “brain” of the contextual UI system.

---

## 1. Inputs & Outputs

### Consumes
**Redis Stream:** `stream:vectors`

Message shape:
```json
{
  "messageId": "vec-123",
  "sessionId": "sess-abc",
  "userId": "user-42",
  "timestamp": "2025-12-07T10:00:00Z",
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

### Produces
**Redis Stream:** `stream:candidate-deltas`

```json
{
  "messageId": "cand-789",
  "sessionId": "sess-abc",
  "userId": "user-42",
  "componentId": "hero-banner-123",
  "delta": {
    "variantId": "promo-high-intent",
    "props": { },
    "styleOverrides": { }
  },
  "meta": {
    "intentScore": 0.73,
    "intentLabel": "HIGH_INTENT",
    "modelVersion": "rule-based-v1"
  },
  "timestamp": "2025-12-07T10:00:01.000Z"
}
```

---

## 2. Core Responsibilities

### 2.1 Vector → Intent Computation
Rule-based v1 formula:
```
z = 0.2·scrollDepth
  + 0.4·hoverIntensity
  + 0.6·componentAttention
  + 0.3·engagementVelocity
  - 0.7·frustrationScore

intentScore = sigmoid(z)
```

Intent bands:
| Score | Intent |
|-------|--------|
| 0–0.2 | IDLE |
| 0.2–0.4 | SKIMMING |
| 0.4–0.6 | EXPLORING |
| 0.6–0.8 | INTERESTED |
| 0.8–1.0 | HIGH_INTENT |

### 2.2 Intent → Variant Mapping

Config service retrieves variants:
```
GET /v1/components/:componentId/variants
```

Mapping rules:
| Intent | Variant Tag Priority |
|--------|----------------------|
| HIGH_INTENT | high-intent → default → fallback |
| INTERESTED | mid-intent → default |
| EXPLORING | simple → default |
| SKIMMING | simple |
| IDLE | simple or no-op |

---

## 3. External Integrations

### 3.1 Config Service
Variant definitions cached under:
```
variants:{componentId}
```

### 3.2 Vector Store (Optional)
`src/vector-store/` for MongoDB Vector Search or Pinecone.

---

## 4. Redis Consumer Group Setup

```
Group: cg:vectors
Consumers: engine-1, engine-2, ...
```

Consume:
```
XREADGROUP GROUP cg:vectors engine-1 COUNT 50 BLOCK 5000 STREAMS stream:vectors >
```

Acknowledge:
```
XACK stream:vectors cg:vectors <messageId>
```

---

## 5. Error Handling & Fallback Rules

### If vector malformed
- Skip & XACK  
- Log to `errors:ai-contextual-engine`

### If config-service fails
- Use cached variants  
- If no cache → emit no-op delta

### If no valid variant
- Fallback to first available variant

### If intent computation fails
- Set `intentLabel = "UNKNOWN"`  
- Use default variant

---

## 6. Performance Expectations

- Vector → intent → delta pipeline should run **<40ms**
- Cache config responses for **60–120 seconds**
- Batch read **50 vectors** per XREADGROUP
- Small footprint (<150MB RAM)  
- Horizontal scaling: add more consumers

---

## 7. Upgrade Path (ML Integration)

### Phase 1 – Rule-Based (current)
✓ Simple  
✓ Deterministic  
✓ Fast  

### Phase 2 – Model-Assisted  
Use ONNX model via `onnxruntime-web`.

### Phase 3 – Embeddings  
Vector store → nearest neighbours → better variant ranking.

### Phase 4 – Full Policy Model  
Predict directly:
- Best next variant  
- Expected CTR  
- Navigation difficulty  

---

## 8. Local Development Setup

```
docker-compose up redis mongo config-service ai-contextual-engine
```

Environment:
```
REDIS_URL=redis://redis:6379
CONFIG_SERVICE_URL=http://config-service:3001
MONGO_URL=mongodb://mongo:27017/mesulo
MODEL_MODE=rule-based
```

---

## 9. File Structure

```
ai-contextual-engine/
├── src/
│   ├── index.js
│   ├── consumers/
│   ├── intent/
│   ├── variant-selector/
│   ├── config-client/
│   ├── vector-store/
│   ├── publishers/
└── README.md
```

---

## 10. Example Output

```json
{
  "messageId": "cand-00123",
  "sessionId": "sess-abc",
  "userId": "user-42",
  "componentId": "hero-banner-123",
  "delta": {
    "variantId": "promo-high-intent",
    "props": {
      "title": "🔥 50 Free Spins – Today Only",
      "ctaLabel": "Claim Bonus",
      "imageUrl": "https://cdn.mesulo.com/banners/50spins.png"
    },
    "styleOverrides": {
      "animation": "pulse",
      "highlightIntensity": 0.9
    }
  },
  "meta": {
    "intentScore": 0.73,
    "intentLabel": "HIGH_INTENT",
    "modelVersion": "rule-based-v1"
  },
  "timestamp": "2025-12-07T10:00:01Z"
}
```

---

End of document.
