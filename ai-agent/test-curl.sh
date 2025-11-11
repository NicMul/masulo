#!/bin/bash

# Example curl command to test the AI Agent /api/process endpoint
# Replace the values with your actual data

curl -X POST http://localhost:3001/api/process \
  -H "Content-Type: application/json" \
  -H "X-API-Key: WArVErMKUtzc84GP7cDF" \
  -d '{
    "imageUrl": "https://mesulo.b-cdn.net/hades.jpg",
    "imagePrompt": "Make it more vibrant and exciting",
    "videoPrompt": "Add smooth animations",
    "theme": "casino",
    "assetType": "current",
    "gameId": "game-123",
    "generateImage": true,
    "generateVideo": true,
    "userId": "user-123",
    "accountId": "account-123"
  }'

