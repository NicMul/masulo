# RunPod RTX 5090 Setup Guide

This guide will help you deploy the Wan2.2 video generation service on your RunPod RTX 5090.

## Prerequisites

- RunPod account with RTX 5090 access
- RunPod API key (get it from https://www.runpod.io/console/user/settings)
- Git repository access to this codebase

## Step 1: Deploy Docker Image

### Option A: Deploy from Private Registry (Recommended)

If you have a private Docker registry:

1. **Build and push the image:**
   ```bash
   ./build_and_push.sh <registry-url> <image-name> <tag> <username> <password>
   ```
   See [PRIVATE_REGISTRY_SETUP.md](PRIVATE_REGISTRY_SETUP.md) for detailed instructions.

2. **Create RunPod Serverless Endpoint:**
   - Go to RunPod Console: https://www.runpod.io/console/serverless
   - Click "New Endpoint"
   - Select "Custom Docker Image"
   - Enter your image: `<registry-url>/<image-name>:<tag>`
   - Configure registry credentials if using private registry
   - **GPU**: Select RTX 5090 (32GB VRAM)
   - **Container Disk**: At least 50GB (models are large)
   - **Volume**: Create or attach a Network Volume for models/LoRAs (optional but recommended)
   - Click "Deploy"

### Option B: Build from Repository

1. Go to RunPod Console: https://www.runpod.io/console/serverless
2. Click "New Endpoint"
3. Configure the endpoint:
   - **Template**: Use this repository (connect your GitHub or upload the code)
   - **GPU**: Select RTX 5090 (32GB VRAM)
   - **Container Disk**: At least 50GB (models are large)
   - **Volume**: Create or attach a Network Volume for models/LoRAs (optional but recommended)
4. Click "Deploy" and wait for the build to complete (this may take 10-20 minutes)

## Step 2: Get Your Endpoint ID

1. Once deployed, go to your endpoint details
2. Copy the **Endpoint ID** (it will look like: `abc123def456...`)
3. Copy your **API Key** from https://www.runpod.io/console/user/settings

## Step 3: Configure the Client

Update the configuration in `generate_video_client.py` or use environment variables:

```python
ENDPOINT_ID = "your-actual-endpoint-id"
RUNPOD_API_KEY = "your-actual-api-key"
```

Or set environment variables:
```bash
export RUNPOD_ENDPOINT_ID="your-actual-endpoint-id"
export RUNPOD_API_KEY="your-actual-api-key"
```

## Step 4: Test the Setup

Run the test script:
```bash
python generate_video_client.py
```

Or use the client in your code:
```python
from generate_video_client import GenerateVideoClient

client = GenerateVideoClient(
    runpod_endpoint_id="your-endpoint-id",
    runpod_api_key="your-api-key"
)

result = client.create_video_from_image(
    image_path="./example_image.png",
    prompt="a beautiful landscape",
    width=480,
    height=832
)
```

## Network Volume Setup (Optional but Recommended)

If you want to use LoRA models or large images:

1. Create a Network Volume in RunPod
2. Mount it to your endpoint
3. Upload LoRA files to `/loras/` folder in the volume
4. Use `image_path` with full volume path in your requests

## RTX 5090 Specifications

- **VRAM**: 32GB (excellent for this workload)
- **Performance**: Should handle high-resolution videos and multiple LoRA pairs
- **Recommended Settings**:
  - Width: Up to 1024px
  - Height: Up to 1024px
  - Length: Up to 161 frames
  - LoRA pairs: Up to 4 pairs simultaneously

## Troubleshooting

- **Build fails**: Check Dockerfile and ensure all dependencies are available
- **Out of memory**: Reduce video resolution or frame count
- **Slow generation**: RTX 5090 should be fast, but check GPU utilization in RunPod dashboard
- **Connection errors**: Verify endpoint ID and API key are correct

## Next Steps

- Integrate with Mesulo platform
- Set up monitoring and logging
- Configure auto-scaling if needed
- Set up network volumes for production use

