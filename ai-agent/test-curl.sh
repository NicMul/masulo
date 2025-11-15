#!/bin/bash

# Example curl command to test the AI Agent /api/process endpoint
# Replace the values with your actual data

curl -X POST http://localhost:3001/api/process \
  -H "Content-Type: application/json" \
  -H "X-API-Key: WArVErMKUtzc84GP7cDF" \
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

