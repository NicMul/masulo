# RunPod Network Volume Setup Guide

This guide explains how to set up a RunPod Network Volume to store the ~50GB of model files, eliminating the need to download them every time you rebuild your Docker image.

## Benefits

- ✅ **Fast Docker builds**: Reduced from 30+ minutes to 2-3 minutes
- ✅ **No repeated downloads**: Models persist across deployments
- ✅ **Easy updates**: Update models independently from code
- ✅ **Cost effective**: Save on build time and bandwidth

## Prerequisites

- A RunPod account
- `runpodctl` CLI installed (see Installation section below)
- ~50GB of storage space for models

---

## Step 1: Install runpodctl CLI

### macOS (using Homebrew)

```bash
brew install runpod/runpodctl/runpodctl
```

### Linux / macOS (manual installation)

```bash
# Download the latest release
wget https://github.com/runpod/runpodctl/releases/latest/download/runpodctl-linux-amd64 -O runpodctl

# Make it executable
chmod +x runpodctl

# Move to PATH
sudo mv runpodctl /usr/local/bin/

# Verify installation
runpodctl version
```

### Windows

Download the Windows executable from the [RunPod releases page](https://github.com/runpod/runpodctl/releases).

---

## Step 2: Configure runpodctl

Set up your RunPod API key:

```bash
# Set your API key (get it from RunPod dashboard > Settings > API Keys)
runpodctl config --apiKey YOUR_RUNPOD_API_KEY
```

---

## Step 3: Create a Network Volume

### Option A: Using RunPod Web Dashboard (Recommended for first-time users)

1. Go to [RunPod Dashboard](https://www.runpod.io/console/user/storage)
2. Navigate to **Storage** → **Network Volumes**
3. Click **Create Network Volume**
4. Configure:
   - **Name**: `mesulo-ai-video-models` (or your preferred name)
   - **Size**: 60GB minimum (50GB for models + buffer)
   - **Data Center**: Choose closest to your region
5. Click **Create**
6. Note the **Volume ID** for later use

### Option B: Using runpodctl CLI

```bash
# Create a 60GB network volume
runpodctl create volume \
  --name mesulo-ai-video-models \
  --size 60 \
  --dataCenterId YOUR_DATACENTER_ID
```

---

## Step 4: Upload Models to Network Volume

You have two options to populate your network volume with models:

### Option A: Launch a Pod and Run Setup Script (Recommended)

This is the easiest method - launch a temporary pod, run the setup script, then terminate the pod.

#### 4A.1: Launch a Temporary Pod

```bash
# Launch a pod with the network volume attached
runpodctl create pod \
  --name model-setup-temp \
  --gpuType "NVIDIA RTX A4000" \
  --imageName "ubuntu:22.04" \
  --volumeId YOUR_VOLUME_ID \
  --volumeMountPath /runpod-volume \
  --containerDiskSize 20
```

Or via the web dashboard:
1. Go to **Pods** → **Deploy**
2. Select any GPU (cheapest is fine for setup)
3. Under **Storage**, attach your network volume
4. Mount path will be: `/workspace` (RunPod's standard path)
5. Deploy the pod

#### 4A.2: SSH into the Pod

```bash
# Get pod ID
runpodctl get pod

# SSH into the pod
runpodctl ssh YOUR_POD_ID
```

Or use the **Connect** button in the web dashboard.

#### 4A.3: Run the Setup Script

```bash
# Inside the pod, install required tools
apt-get update && apt-get install -y wget

# Download the setup script
wget https://raw.githubusercontent.com/YOUR_USERNAME/mesolu/agent_update/ai-video/setup_network_volume.sh

# Or if you have the repo cloned locally, use runpodctl to send it:
# (Run this from your local machine, not in the pod)
runpodctl send /local/path/to/setup_network_volume.sh YOUR_POD_ID:/workspace/

# Make it executable
chmod +x setup_network_volume.sh

# Run the setup script (this will take 30-60 minutes)
bash setup_network_volume.sh
```

The script will:
- Create the proper directory structure
- Download all 7 model files (~50GB total)
- Verify successful downloads
- Show progress for each file

#### 4A.4: Verify Models

```bash
# Check that all models were downloaded
ls -lh /workspace/models/
ls -lh /workspace/loras/
ls -lh /workspace/models/clip_vision/
ls -lh /workspace/models/text_encoders/
ls -lh /workspace/models/vae/

# Check total size
du -sh /workspace/
```

You should see 7 model files totaling ~50GB.

#### 4A.5: Terminate the Temporary Pod

Once setup is complete, you can terminate the setup pod:

```bash
# Via CLI
runpodctl stop pod YOUR_POD_ID

# Or via web dashboard: Pods → [Your Pod] → Terminate
```

The network volume persists after the pod is terminated!

### Option B: Use runpodctl to Send Files (If you have models locally)

If you've already downloaded the models locally:

```bash
# Send files directly to the volume via a running pod
runpodctl send /local/path/to/model.safetensors POD_ID:/runpod-volume/models/
```

---

## Step 5: Configure Your Serverless Endpoint

Now that your network volume is set up with models, configure your serverless endpoint to use it.

### 5.1: Via Web Dashboard

1. Go to **Serverless** → **Endpoints**
2. Create new endpoint or edit existing one
3. Under **Source**:
   - Select **GitHub** as source
   - Connect your repository
   - Select branch: `agent_update` (or your branch)
   - Docker path: `ai-video/Dockerfile`
4. Under **Storage**:
   - Click **Attach Network Volume**
   - Select your volume: `mesulo-ai-video-models`
   - Mount path: `/workspace` (RunPod's default network volume mount)
5. Configure other settings (GPU, workers, etc.)
6. Click **Deploy**

### 5.2: Via CLI

```bash
runpodctl create endpoint \
  --name mesulo-ai-video \
  --gpuTypes "NVIDIA RTX 5090" \
  --volumeId YOUR_VOLUME_ID \
  --volumeMountPath /runpod-volume \
  --dockerImage YOUR_REGISTRY/mesulo-ai-video:latest
```

---

## Step 6: Verify Endpoint Startup

When your endpoint starts, it will automatically validate the network volume:

### Expected Startup Logs

```
================================================
🔍 Validating Network Volume Setup
================================================
✅ Network volume mounted at /workspace
✅ All required model files found (7/7)
================================================

Starting ComfyUI in the background...
Waiting for ComfyUI to be ready...
ComfyUI is ready!
Starting the handler...
```

### If Models Are Missing

If you see warnings about missing models:

```
⚠️  WARNING: 7 model file(s) missing:
   ❌ /workspace/models/Wan2_2-I2V-A14B-HIGH_fp8_e4m3fn_scaled_KJ.safetensors
   ...
```

This means the models weren't properly downloaded. Return to Step 4 and run the setup script.

---

## Updating Models

To update models in the future:

1. Launch a temporary pod with the volume attached
2. SSH into the pod
3. Delete old models: `rm /runpod-volume/models/old_model.safetensors`
4. Download new models: `wget URL -O /runpod-volume/models/new_model.safetensors`
5. Terminate the pod

Your serverless endpoints will automatically use the updated models on next cold start.

---

## Troubleshooting

### Volume Not Mounted

**Symptoms**: Error message "Network volume not found at /workspace"

**Solutions**:
- Verify the volume is attached in endpoint configuration
- Check mount path is set to `/runpod-volume`
- Restart the endpoint

### Models Not Found

**Symptoms**: Warning messages about missing model files

**Solutions**:
- SSH into a pod with the volume and verify files exist
- Re-run the model download commands if files are missing
- Check file permissions: `chmod -R 755 /workspace/models/`

### Slow Model Loading

**Symptoms**: ComfyUI takes a long time to start

**Solutions**:
- This is normal on first start (~2-3 minutes)
- Ensure network volume is in the same data center as your endpoint
- Consider using a larger network volume with higher IOPS

### Download Script Fails

**Symptoms**: wget errors during setup

**Solutions**:
- Check internet connectivity: `ping google.com`
- Verify Hugging Face is accessible
- Try downloading individual files manually
- Some files are 24GB+, ensure you have enough disk space

---

## Cost Considerations

### Network Volume Costs

- **Storage**: ~$0.10-0.20 per GB/month
- **50GB volume**: ~$5-10/month
- **Worth it**: Saves 25+ minutes per build × number of builds

### Optimization Tips

1. **Share volumes**: Multiple endpoints can use the same network volume
2. **Regular cleanup**: Remove unused models and old versions
3. **Right-size**: Don't over-provision storage

---

## Directory Structure Reference

After setup, your network volume should have this structure:

```
/workspace/
├── models/
│   ├── Wan2_2-I2V-A14B-HIGH_fp8_e4m3fn_scaled_KJ.safetensors (~24GB)
│   ├── Wan2_2-I2V-A14B-LOW_fp8_e4m3fn_scaled_KJ.safetensors (~24GB)
│   ├── clip_vision/
│   │   └── clip_vision_h.safetensors
│   ├── text_encoders/
│   │   └── umt5-xxl-enc-bf16.safetensors
│   └── vae/
│       └── Wan2_1_VAE_bf16.safetensors
└── loras/
    ├── high_noise_model.safetensors
    ├── low_noise_model.safetensors
    └── [your custom LoRAs...]
```

---

## Next Steps

Once your network volume is set up:

1. ✅ Commit your code changes
2. ✅ Push to GitHub
3. ✅ RunPod will auto-rebuild (2-3 minutes instead of 30+)
4. ✅ Your endpoint will load models from the volume
5. ✅ Start generating videos!

---

## Additional Resources

- [RunPod Network Volumes Documentation](https://docs.runpod.io/pods/storage/network-volumes)
- [runpodctl GitHub Repository](https://github.com/runpod/runpodctl)
- [ComfyUI Model Management](https://github.com/comfyanonymous/ComfyUI#models)

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review RunPod logs in the dashboard
3. Verify volume is properly mounted and accessible
4. Check that all 7 model files exist in the correct locations

For Mesulo-specific issues, refer to the main README.md or contact support.

