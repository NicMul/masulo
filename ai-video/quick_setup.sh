#!/bin/bash

# Quick setup script for RunPod RTX 5090 deployment

echo "🚀 RunPod RTX 5090 Setup for Mesulo Video Generation"
echo "======================================================"
echo ""

# Check if endpoint ID is provided
if [ -z "$1" ]; then
    echo "Usage: ./quick_setup.sh <endpoint-id> <api-key>"
    echo ""
    echo "Or set environment variables:"
    echo "  export RUNPOD_ENDPOINT_ID='your-endpoint-id'"
    echo "  export RUNPOD_API_KEY='your-api-key'"
    echo "  ./quick_setup.sh"
    exit 1
fi

ENDPOINT_ID=$1
API_KEY=$2

if [ -z "$API_KEY" ]; then
    API_KEY=$RUNPOD_API_KEY
fi

if [ -z "$ENDPOINT_ID" ]; then
    ENDPOINT_ID=$RUNPOD_ENDPOINT_ID
fi

if [ -z "$ENDPOINT_ID" ] || [ -z "$API_KEY" ]; then
    echo "❌ Error: Endpoint ID and API Key are required"
    exit 1
fi

echo "✅ Configuration:"
echo "   Endpoint ID: $ENDPOINT_ID"
echo "   API Key: ${API_KEY:0:10}..."
echo ""

# Create .env file
cat > .env << EOF
RUNPOD_ENDPOINT_ID=$ENDPOINT_ID
RUNPOD_API_KEY=$API_KEY
EOF

echo "✅ Created .env file"
echo ""

# Test connection
echo "🧪 Testing connection to RunPod endpoint..."
python3 -c "
import os
from generate_video_client import GenerateVideoClient

os.environ['RUNPOD_ENDPOINT_ID'] = '$ENDPOINT_ID'
os.environ['RUNPOD_API_KEY'] = '$API_KEY'

try:
    client = GenerateVideoClient(
        runpod_endpoint_id='$ENDPOINT_ID',
        runpod_api_key='$API_KEY'
    )
    print('✅ Client initialized successfully!')
    print('   Ready to generate videos!')
except Exception as e:
    print(f'❌ Error: {e}')
    exit(1)
"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Setup complete! You can now use the client:"
    echo ""
    echo "   from generate_video_client import GenerateVideoClient"
    echo "   import os"
    echo ""
    echo "   client = GenerateVideoClient("
    echo "       runpod_endpoint_id=os.getenv('RUNPOD_ENDPOINT_ID'),"
    echo "       runpod_api_key=os.getenv('RUNPOD_API_KEY')"
    echo "   )"
    echo ""
else
    echo ""
    echo "❌ Setup failed. Please check your endpoint ID and API key."
    exit 1
fi

