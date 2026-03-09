#!/bin/bash

# Build and push Docker image to Docker Hub
# Usage: ./build_and_push.sh <image-name> <tag>
# Example: ./build_and_push.sh mesulo/ai-video v1.0.0

set -e

if [ $# -lt 2 ]; then
    echo "Usage: ./build_and_push.sh <image-name> <tag>"
    echo ""
    echo "Example:"
    echo "  ./build_and_push.sh mesulo/ai-video v1.0.0"
    echo ""
    exit 1
fi

# Docker Hub credentials from environment variables
REGISTRY="${DOCKER_REGISTRY:-docker.io}"
USERNAME="${DOCKER_USERNAME:-mesulo}"
PASSWORD="${DOCKER_PASSWORD}"

# Validate required environment variables
if [ -z "$PASSWORD" ]; then
    echo "❌ Error: DOCKER_PASSWORD environment variable is required"
    echo ""
    echo "Please set the following environment variables:"
    echo "  export DOCKER_USERNAME=mesulo"
    echo "  export DOCKER_PASSWORD=your_docker_token"
    echo "  export DOCKER_REGISTRY=docker.io  # optional, defaults to docker.io"
    exit 1
fi

IMAGE_NAME=$1
TAG=$2

# Construct full image name with proper Docker Hub format
# For Docker Hub, we don't need docker.io prefix, but we'll use it for clarity
FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}:${TAG}"

echo "🐳 Building Docker image with buildx: ${FULL_IMAGE_NAME}"
echo "=========================================="

# Login to Docker Hub
echo "🔐 Logging in to Docker Hub..."
echo "$PASSWORD" | docker login ${REGISTRY} -u "$USERNAME" --password-stdin

if [ $? -ne 0 ]; then
    echo "❌ Login failed!"
    exit 1
fi
echo "✅ Login successful!"
echo ""

# Build and push the image using buildx
echo "🔨 Building and pushing image..."
docker buildx build --platform linux/amd64 -t ${FULL_IMAGE_NAME} --push .

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "🎉 Successfully pushed ${FULL_IMAGE_NAME}"
echo ""
echo "📋 Next steps:"
echo "   1. Configure RunPod to use this image: ${FULL_IMAGE_NAME}"
echo "   2. Set up registry credentials in RunPod if using private registry"
echo "   3. Create/update your Serverless endpoint with this image"
echo ""