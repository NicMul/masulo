#!/bin/bash

# Script to extract Socket.IO client for CDN hosting
# Run this from the server directory after npm install

echo "Extracting Socket.IO client for CDN hosting..."

# Check if node_modules exists
if [ ! -d "node_modules/socket.io/client-dist" ]; then
    echo "Error: Socket.IO client not found. Run 'npm install' first."
    exit 1
fi

# Create SDK directory if it doesn't exist
mkdir -p ../sdk/cdn

# Copy Socket.IO client to SDK directory (using minified version)
cp node_modules/socket.io/client-dist/socket.io.min.js ../sdk/cdn/socket.io.min.js

echo "✅ Socket.IO client extracted to ../sdk/cdn/socket.io.min.js"
echo ""
echo "Next steps:"
echo "1. Upload ../sdk/cdn/socket.io.min.js to your CDN at:"
echo "   https://mesulo.b-cdn.net/socket.io.min.js"
echo ""
echo "2. Test the SDK with the new single-script approach"
echo ""
echo "3. Update your CDN when Socket.IO version changes"
