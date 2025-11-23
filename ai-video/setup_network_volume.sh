#!/bin/bash

# Setup script to download all models to RunPod Network Volume
# This script should be run ONCE on the network volume
# 
# Usage:
#   1. SSH into a RunPod instance with the network volume mounted
#   2. Navigate to the network volume directory (e.g., cd /runpod-volume)
#   3. Run this script: bash setup_network_volume.sh
#
# Total download size: ~50GB
# Estimated time: 30-60 minutes (depends on network speed)

set -e

# Configuration
VOLUME_PATH="${VOLUME_PATH:-/workspace}"
MODELS_DIR="${VOLUME_PATH}/models"
LORAS_DIR="${VOLUME_PATH}/loras"
CLIP_VISION_DIR="${MODELS_DIR}/clip_vision"
TEXT_ENCODERS_DIR="${MODELS_DIR}/text_encoders"
VAE_DIR="${MODELS_DIR}/vae"

echo "================================================"
echo "🚀 RunPod Network Volume - Model Setup"
echo "================================================"
echo ""
echo "This script will download ~50GB of model files to:"
echo "  Volume Path: ${VOLUME_PATH}"
echo ""
echo "Directory structure:"
echo "  - ${MODELS_DIR}/ (diffusion models)"
echo "  - ${LORAS_DIR}/ (LoRA models)"
echo "  - ${CLIP_VISION_DIR}/"
echo "  - ${TEXT_ENCODERS_DIR}/"
echo "  - ${VAE_DIR}/"
echo ""
echo "================================================"
echo ""

# Check if volume is mounted
if [ ! -d "${VOLUME_PATH}" ]; then
    echo "❌ Error: Volume path ${VOLUME_PATH} does not exist!"
    echo "Please ensure the network volume is mounted."
    exit 1
fi

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p "${MODELS_DIR}"
mkdir -p "${LORAS_DIR}"
mkdir -p "${CLIP_VISION_DIR}"
mkdir -p "${TEXT_ENCODERS_DIR}"
mkdir -p "${VAE_DIR}"
echo "✅ Directories created"
echo ""

# Function to download a model file
download_model() {
    local url=$1
    local output_path=$2
    local description=$3
    local filename=$(basename "${output_path}")
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📥 Downloading: ${description}"
    echo "   File: ${filename}"
    echo "   URL: ${url}"
    echo "   Output: ${output_path}"
    echo ""
    
    # Check if file already exists
    if [ -f "${output_path}" ]; then
        echo "⚠️  File already exists. Skipping download."
        echo "   To re-download, delete the file first: rm ${output_path}"
        echo ""
        return 0
    fi
    
    # Download with wget showing progress
    if wget --show-progress --progress=bar:force:noscroll \
           "${url}" -O "${output_path}"; then
        echo "✅ Download completed: ${filename}"
        
        # Show file size
        if command -v du &> /dev/null; then
            local size=$(du -h "${output_path}" | cut -f1)
            echo "   Size: ${size}"
        fi
        echo ""
    else
        echo "❌ Download failed: ${filename}"
        echo "   Please check your network connection and try again."
        exit 1
    fi
}

echo "🎬 Starting model downloads..."
echo "This will take 30-60 minutes depending on your network speed."
echo ""

# Download diffusion models (HIGH and LOW)
download_model \
    "https://huggingface.co/Kijai/WanVideo_comfy_fp8_scaled/resolve/main/I2V/Wan2_2-I2V-A14B-HIGH_fp8_e4m3fn_scaled_KJ.safetensors" \
    "${MODELS_DIR}/Wan2_2-I2V-A14B-HIGH_fp8_e4m3fn_scaled_KJ.safetensors" \
    "Wan2.2 HIGH Diffusion Model (~24GB)"

download_model \
    "https://huggingface.co/Kijai/WanVideo_comfy_fp8_scaled/resolve/main/I2V/Wan2_2-I2V-A14B-LOW_fp8_e4m3fn_scaled_KJ.safetensors" \
    "${MODELS_DIR}/Wan2_2-I2V-A14B-LOW_fp8_e4m3fn_scaled_KJ.safetensors" \
    "Wan2.2 LOW Diffusion Model (~24GB)"

# Download LoRA models
download_model \
    "https://huggingface.co/lightx2v/Wan2.2-Lightning/resolve/main/Wan2.2-I2V-A14B-4steps-lora-rank64-Seko-V1/high_noise_model.safetensors" \
    "${LORAS_DIR}/high_noise_model.safetensors" \
    "High Noise LoRA Model"

download_model \
    "https://huggingface.co/lightx2v/Wan2.2-Lightning/resolve/main/Wan2.2-I2V-A14B-4steps-lora-rank64-Seko-V1/low_noise_model.safetensors" \
    "${LORAS_DIR}/low_noise_model.safetensors" \
    "Low Noise LoRA Model"

# Download CLIP vision model
download_model \
    "https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/clip_vision/clip_vision_h.safetensors" \
    "${CLIP_VISION_DIR}/clip_vision_h.safetensors" \
    "CLIP Vision Model"

# Download text encoder
download_model \
    "https://huggingface.co/Kijai/WanVideo_comfy/resolve/main/umt5-xxl-enc-bf16.safetensors" \
    "${TEXT_ENCODERS_DIR}/umt5-xxl-enc-bf16.safetensors" \
    "UMT5 Text Encoder Model"

# Download VAE
download_model \
    "https://huggingface.co/Kijai/WanVideo_comfy/resolve/main/Wan2_1_VAE_bf16.safetensors" \
    "${VAE_DIR}/Wan2_1_VAE_bf16.safetensors" \
    "Wan2.1 VAE Model"

echo "================================================"
echo "🎉 All models downloaded successfully!"
echo "================================================"
echo ""
echo "📊 Summary:"
echo "  Location: ${VOLUME_PATH}"
echo "  Diffusion Models: 2 files in ${MODELS_DIR}/"
echo "  LoRA Models: 2 files in ${LORAS_DIR}/"
echo "  CLIP Vision: 1 file in ${CLIP_VISION_DIR}/"
echo "  Text Encoders: 1 file in ${TEXT_ENCODERS_DIR}/"
echo "  VAE: 1 file in ${VAE_DIR}/"
echo ""
echo "Total storage used:"
if command -v du &> /dev/null; then
    du -sh "${VOLUME_PATH}"
fi
echo ""
echo "✅ Network volume is ready for use with RunPod endpoint!"
echo ""
echo "📝 Next steps:"
echo "  1. Verify files are in place: ls -lh ${MODELS_DIR}/"
echo "  2. Configure your RunPod endpoint to use this network volume"
echo "  3. Set the volume mount path to: /runpod-volume"
echo "  4. Deploy your endpoint and start generating videos!"
echo ""

