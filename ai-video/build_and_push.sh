#!/bin/bash

# Build and push Docker image to private registry
# Usage: ./build_and_push.sh <registry-url> <image-name> <tag> [username] [password]
# 
# For GHCR (GitHub Container Registry):
#   ./build_and_push.sh ghcr.io <github-username>/mesulo-ai-video v1.0.0 <github-username> <github-pat>
#   Or use environment variables:
#   GITHUB_USERNAME=user GITHUB_TOKEN=token ./build_and_push.sh ghcr.io user/mesulo-ai-video v1.0.0

set -e

if [ $# -lt 3 ]; then
    echo "Usage: ./build_and_push.sh <registry-url> <image-name> <tag> [username] [password]"
    echo ""
    echo "Examples:"
    echo "  # GHCR (GitHub Container Registry):"
    echo "  ./build_and_push.sh ghcr.io mesulo/ai-video v1.0.0 <github-user> <github-pat>"
    echo ""
    echo "  # Docker Hub:"
    echo "  ./build_and_push.sh docker.io mesulo/ai-video v1.0.0 <docker-user> <docker-pass>"
    echo ""
    echo "  # Custom registry:"
    echo "  ./build_and_push.sh registry.example.com mesulo/ai-video latest <user> <pass>"
    echo ""
    echo "Environment variables (alternative to arguments):"
    echo "  GITHUB_USERNAME, GITHUB_TOKEN - for GHCR"
    echo "  DOCKER_USERNAME, DOCKER_PASSWORD - for Docker Hub"
    echo ""
    exit 1
fi

REGISTRY=$1
IMAGE_NAME=$2
TAG=$3

# Support environment variables for common registries
if [ "$REGISTRY" = "ghcr.io" ]; then
    USERNAME=${4:-${GITHUB_USERNAME:-""}}
    PASSWORD=${5:-${GITHUB_TOKEN:-""}}
elif [ "$REGISTRY" = "docker.io" ]; then
    USERNAME=${4:-${DOCKER_USERNAME:-""}}
    PASSWORD=${5:-${DOCKER_PASSWORD:-""}}
else
    USERNAME=${4:-""}
    PASSWORD=${5:-""}
fi

FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}:${TAG}"

echo "🐳 Building Docker image: ${FULL_IMAGE_NAME}"
echo "=========================================="

# Build the image
docker build -t ${FULL_IMAGE_NAME} .

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""

# Login to registry if credentials provided
if [ -n "$USERNAME" ] && [ -n "$PASSWORD" ]; then
    echo "🔐 Logging in to registry..."
    echo "$PASSWORD" | docker login ${REGISTRY} -u "$USERNAME" --password-stdin
    
    if [ $? -ne 0 ]; then
        echo "❌ Login failed!"
        exit 1
    fi
    echo "✅ Login successful!"
    echo ""
fi

# Push the image
echo "📤 Pushing image to registry..."
docker push ${FULL_IMAGE_NAME}

if [ $? -ne 0 ]; then
    echo "❌ Push failed!"
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

