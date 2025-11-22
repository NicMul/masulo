# Private Registry Deployment Guide

This guide explains how to build, push, and deploy the Docker image from a private registry to RunPod.

## Prerequisites

- Docker installed and running
- Access to a private Docker registry (Docker Hub, GitHub Container Registry, AWS ECR, etc.)
- RunPod account with API access
- Registry credentials (username/password or access token)

## Step 1: Build and Push to Private Registry

### Option A: Using the Build Script

```bash
# Make script executable
chmod +x build_and_push.sh

# Build and push (with credentials)
./build_and_push.sh <registry-url> <image-name> <tag> <username> <password>

# Examples:
./build_and_push.sh ghcr.io mesulo/ai-video v1.0.0 myuser mytoken
./build_and_push.sh registry.example.com mesulo/ai-video latest
./build_and_push.sh docker.io mesulo/ai-video v1.0.0 dockeruser dockerpass
```

### Option B: Manual Build and Push

```bash
# 1. Build the image
docker build -t <registry-url>/<image-name>:<tag> .

# 2. Login to registry (if private)
docker login <registry-url> -u <username> -p <password>
# Or use token:
echo "<token>" | docker login <registry-url> -u <username> --password-stdin

# 3. Push the image
docker push <registry-url>/<image-name>:<tag>
```

### Common Registry Examples

**GitHub Container Registry (GHCR):**
```bash
# Login with GitHub token
echo $GITHUB_TOKEN | docker login ghcr.io -u <github-username> --password-stdin
docker build -t ghcr.io/<github-username>/mesulo-ai-video:v1.0.0 .
docker push ghcr.io/<github-username>/mesulo-ai-video:v1.0.0
```

For detailed GHCR setup, see [GHCR_SETUP.md](GHCR_SETUP.md).

**Docker Hub:**
```bash
docker login docker.io -u <username> -p <password>
docker build -t <username>/mesulo-ai-video:v1.0.0 .
docker push <username>/mesulo-ai-video:v1.0.0
```

**AWS ECR:**
```bash
# Get login command
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com
docker build -t <account-id>.dkr.ecr.<region>.amazonaws.com/mesulo-ai-video:v1.0.0 .
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/mesulo-ai-video:v1.0.0
```

**Google Container Registry (GCR):**
```bash
gcloud auth configure-docker
docker build -t gcr.io/<project-id>/mesulo-ai-video:v1.0.0 .
docker push gcr.io/<project-id>/mesulo-ai-video:v1.0.0
```

## Step 2: Configure RunPod to Use Private Registry

### Method 1: Using RunPod Console (Recommended)

1. Go to RunPod Console: https://www.runpod.io/console/serverless
2. Click "New Endpoint" or edit existing endpoint
3. In the **Container Image** section:
   - Select "Custom Docker Image"
   - Enter your image URL: `<registry-url>/<image-name>:<tag>`
4. If using a private registry, configure credentials:
   - **Registry URL**: Your registry URL (e.g., `ghcr.io`, `docker.io`)
   - **Username**: Your registry username
   - **Password/Token**: Your registry password or access token
5. Configure other settings:
   - **GPU**: RTX 5090 (32GB VRAM)
   - **Container Disk**: At least 50GB
   - **Volume**: Attach Network Volume if needed
6. Click "Deploy"

### Method 2: Using RunPod API

```bash
# Create endpoint with private registry image
curl -X POST https://api.runpod.io/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RUNPOD_API_KEY" \
  -d '{
    "query": "mutation { endpointCreate(input: { name: \"mesulo-ai-video\", containerImage: \"<registry-url>/<image-name>:<tag>\", gpuTypeId: \"<gpu-id>\", dockerArgs: \"\", env: [] }) { id } }"
  }'
```

### Method 3: Using RunPod Terraform/Infrastructure as Code

If using infrastructure as code, configure the image and registry credentials in your configuration.

## Step 3: Verify Deployment

1. Check endpoint status in RunPod console
2. Wait for the container to pull and start (may take a few minutes)
3. Test the endpoint using the client:

```python
from generate_video_client import GenerateVideoClient
import os

client = GenerateVideoClient(
    runpod_endpoint_id=os.getenv("RUNPOD_ENDPOINT_ID"),
    runpod_api_key=os.getenv("RUNPOD_API_KEY")
)

result = client.create_video_from_image(
    image_path="./example_image.png",
    prompt="test video generation",
    width=480,
    height=832
)
```

## Registry Credentials Management

### Environment Variables

Store credentials securely:

```bash
# .env file (don't commit this!)
REGISTRY_URL=ghcr.io
REGISTRY_USERNAME=your-username
REGISTRY_PASSWORD=your-token
REGISTRY_IMAGE=mesulo/ai-video
REGISTRY_TAG=v1.0.0
```

### Using Secrets Management

- **GitHub Actions**: Use GitHub Secrets
- **CI/CD**: Use your CI/CD platform's secret management
- **Local**: Use environment variables or Docker credential helpers

## Troubleshooting

### Image Pull Errors

- **401 Unauthorized**: Check registry credentials
- **404 Not Found**: Verify image name and tag are correct
- **Network Error**: Check registry URL and network connectivity

### RunPod Deployment Issues

- **Build Timeout**: Large images may take time to pull
- **Registry Access**: Ensure RunPod can access your private registry
- **Credentials**: Double-check username/password or token

### Common Solutions

1. **Verify image exists:**
   ```bash
   docker pull <registry-url>/<image-name>:<tag>
   ```

2. **Test registry access:**
   ```bash
   docker login <registry-url> -u <username> -p <password>
   ```

3. **Check RunPod logs:**
   - Go to endpoint details in RunPod console
   - Check "Logs" tab for pull errors

## Best Practices

1. **Use tags for versions**: Don't rely on `latest` tag in production
2. **Tag with commit SHA**: Include git commit in image tag for traceability
3. **Use access tokens**: Prefer tokens over passwords for better security
4. **Rotate credentials**: Regularly update registry credentials
5. **Monitor image size**: Keep images optimized to reduce pull time
6. **Use multi-stage builds**: Reduce final image size

## Example CI/CD Integration

```yaml
# GitHub Actions example
name: Build and Push
on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Login to GHCR
        uses: docker/login-action@v2
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Build and push
        run: |
          docker build -t ghcr.io/${{ github.repository }}/ai-video:${{ github.ref_name }} .
          docker push ghcr.io/${{ github.repository }}/ai-video:${{ github.ref_name }}
```

## Next Steps

- Set up automated builds on code changes
- Configure image scanning for security
- Set up monitoring for image pulls
- Document your registry access policies

