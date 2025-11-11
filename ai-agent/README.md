# AI Agent Server

Standalone Express server for processing agentic tasks using OpenAI with custom function tools. Handles the complete media pipeline: prompt enrichment, image generation, video generation, storage, and database persistence.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your configuration:
```bash
cp .env.example .env
```

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoint

### POST `/api/process`

Processes media generation tasks with OpenAI agentic orchestration.

**Headers:**
- `X-API-Key`: Your AI_AGENT_API_KEY

**Request Body:**
```json
{
  "imageUrl": "https://example.com/image.jpg",
  "imagePrompt": "Custom image prompt",
  "videoPrompt": "Custom video prompt",
  "userId": "user-id",
  "accountId": "account-id",
  "gameId": "game-id",
  "generateImage": true,
  "generateVideo": true,
  "assetType": "current"
}
```

**Response:**
```json
{
  "data": {
    "assetType": "current",
    "imageUrl": "https://cdn.example.com/test/test-current-abc123.jpg",
    "videoUrl": "https://cdn.example.com/test/test-current-abc123.mp4"
  }
}
```

## Flow

1. Validates parameters
2. Gets or creates CDN configuration
3. Downloads and processes original image
4. Builds and enriches prompts
5. Generates image (if requested)
6. Generates video (if requested)
7. Optimizes video for web
8. Uploads to BunnyCDN
9. Updates MongoDB
10. Cleans up temporary files

All steps and prompts are comprehensively logged.

