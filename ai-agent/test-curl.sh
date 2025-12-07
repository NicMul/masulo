#!/bin/bash

# Example curl command to test the AI Agent /api/process endpoint
# Replace the values with your actual data

# Get API key from environment variable
API_KEY="${AI_AGENT_API_KEY}"

if [ -z "$API_KEY" ]; then
    echo "❌ Error: AI_AGENT_API_KEY environment variable is required"
    echo ""
    echo "Please set the API key:"
    echo "  export AI_AGENT_API_KEY=your_api_key"
    exit 1
fi

curl -X POST http://localhost:3001/api/process \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${API_KEY}" \
  -d '{
    "imageUrl": "https://mesulo.b-cdn.net/hades.jpg",
    "imagePrompt": "Turn this character into a zombie. it is a scary scene. he is holding a mobile pbone and remember the flames are still important",
    "videoPrompt": "the zombie points to the phone an screams. The camera can not see what is on the phone screen.",
    "theme": "casino",
    "assetType": "current",
    "gameId": "game-123",
    "generateImage": true,
    "generateVideo": true,
    "userId": "user-123",
    "accountId": "account-123"
  }'

