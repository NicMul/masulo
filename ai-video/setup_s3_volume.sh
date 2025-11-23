#!/bin/bash

# Setup script to download models and upload to RunPod S3 Network Volume
# This script downloads models locally then uploads to S3
# 
# Usage:
#   ./setup_s3_volume.sh
#
# Total download size: ~50GB
# Estimated time: 1-2 hours (depends on network speed)

set -e

# S3 Configuration
S3_ENDPOINT="https://s3api-eu-ro-1.runpod.io"
S3_REGION="eu-ro-1"
S3_BUCKET="i5oxk2vdao"

# Local temporary directory
TEMP_DIR="/tmp/runpod-models"
MODELS_DIR="${TEMP_DIR}/models"
LORAS_DIR="${TEMP_DIR}/loras"
CLIP_VISION_DIR="${MODELS_DIR}/clip_vision"
TEXT_ENCODERS_DIR="${MODELS_DIR}/text_encoders"
VAE_DIR="${MODELS_DIR}/vae"

echo "================================================"
echo "🚀 RunPod S3 Network Volume - Model Setup"
echo "================================================"
echo ""
echo "This script will:"
echo "  1. Download ~50GB of model files locally to ${TEMP_DIR}"
echo "  2. Upload them to S3 bucket: s3://${S3_BUCKET}"
echo ""
echo "S3 Endpoint: ${S3_ENDPOINT}"
echo "S3 Region: ${S3_REGION}"
echo ""
echo "================================================"
echo ""

# Check if AWS CLI is configured
if ! aws --version &> /dev/null; then
    echo "❌ Error: AWS CLI is not installed!"
    echo "Install it with: brew install awscli"
    exit 1
fi

# Test S3 connection
echo "🔍 Testing S3 connection..."
if aws s3 ls --region ${S3_REGION} --endpoint-url ${S3_ENDPOINT} s3://${S3_BUCKET}/ &> /dev/null; then
    echo "✅ S3 connection successful"
    echo ""
else
    echo "❌ Error: Cannot connect to S3 bucket!"
    echo ""
    echo "Please configure AWS CLI with your RunPod credentials:"
    echo "  aws configure"
    echo ""
    echo "When prompted, enter:"
    echo "  AWS Access Key ID: [Your RunPod Access Key]"
    echo "  AWS Secret Access Key: [Your RunPod Secret Key]"
    echo "  Default region name: ${S3_REGION}"
    echo "  Default output format: json"
    echo ""
    exit 1
fi

# Create directory structure
echo "📁 Creating local directory structure..."
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
    echo "   Output: ${output_path}"
    echo ""
    
    # Check if file already exists locally
    if [ -f "${output_path}" ]; then
        echo "⚠️  File already exists locally. Skipping download."
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

# Function to upload to S3
upload_to_s3() {
    local local_path=$1
    local s3_path=$2
    local description=$3
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📤 Uploading to S3: ${description}"
    echo "   Local: ${local_path}"
    echo "   S3: s3://${S3_BUCKET}/${s3_path}"
    echo ""
    
    if aws s3 cp "${local_path}" "s3://${S3_BUCKET}/${s3_path}" \
        --region ${S3_REGION} \
        --endpoint-url ${S3_ENDPOINT}; then
        echo "✅ Upload completed"
        echo ""
    else
        echo "❌ Upload failed"
        exit 1
    fi
}

echo "🎬 Starting model downloads..."
echo "This will take 1-2 hours depending on your network speed."
echo ""

# Download and upload diffusion models (HIGH and LOW)
download_model \
    "https://huggingface.co/Kijai/WanVideo_comfy_fp8_scaled/resolve/main/I2V/Wan2_2-I2V-A14B-HIGH_fp8_e4m3fn_scaled_KJ.safetensors" \
    "${MODELS_DIR}/Wan2_2-I2V-A14B-HIGH_fp8_e4m3fn_scaled_KJ.safetensors" \
    "Wan2.2 HIGH Diffusion Model (~24GB)"

upload_to_s3 \
    "${MODELS_DIR}/Wan2_2-I2V-A14B-HIGH_fp8_e4m3fn_scaled_KJ.safetensors" \
    "models/Wan2_2-I2V-A14B-HIGH_fp8_e4m3fn_scaled_KJ.safetensors" \
    "Wan2.2 HIGH Diffusion Model"

download_model \
    "https://huggingface.co/Kijai/WanVideo_comfy_fp8_scaled/resolve/main/I2V/Wan2_2-I2V-A14B-LOW_fp8_e4m3fn_scaled_KJ.safetensors" \
    "${MODELS_DIR}/Wan2_2-I2V-A14B-LOW_fp8_e4m3fn_scaled_KJ.safetensors" \
    "Wan2.2 LOW Diffusion Model (~24GB)"

upload_to_s3 \
    "${MODELS_DIR}/Wan2_2-I2V-A14B-LOW_fp8_e4m3fn_scaled_KJ.safetensors" \
    "models/Wan2_2-I2V-A14B-LOW_fp8_e4m3fn_scaled_KJ.safetensors" \
    "Wan2.2 LOW Diffusion Model"

# Download and upload LoRA models
download_model \
    "https://huggingface.co/lightx2v/Wan2.2-Lightning/resolve/main/Wan2.2-I2V-A14B-4steps-lora-rank64-Seko-V1/high_noise_model.safetensors" \
    "${LORAS_DIR}/high_noise_model.safetensors" \
    "High Noise LoRA Model"

upload_to_s3 \
    "${LORAS_DIR}/high_noise_model.safetensors" \
    "loras/high_noise_model.safetensors" \
    "High Noise LoRA Model"

download_model \
    "https://huggingface.co/lightx2v/Wan2.2-Lightning/resolve/main/Wan2.2-I2V-A14B-4steps-lora-rank64-Seko-V1/low_noise_model.safetensors" \
    "${LORAS_DIR}/low_noise_model.safetensors" \
    "Low Noise LoRA Model"

upload_to_s3 \
    "${LORAS_DIR}/low_noise_model.safetensors" \
    "loras/low_noise_model.safetensors" \
    "Low Noise LoRA Model"

# Download and upload CLIP vision model
download_model \
    "https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/clip_vision/clip_vision_h.safetensors" \
    "${CLIP_VISION_DIR}/clip_vision_h.safetensors" \
    "CLIP Vision Model"

upload_to_s3 \
    "${CLIP_VISION_DIR}/clip_vision_h.safetensors" \
    "models/clip_vision/clip_vision_h.safetensors" \
    "CLIP Vision Model"

# Download and upload text encoder
download_model \
    "https://huggingface.co/Kijai/WanVideo_comfy/resolve/main/umt5-xxl-enc-bf16.safetensors" \
    "${TEXT_ENCODERS_DIR}/umt5-xxl-enc-bf16.safetensors" \
    "UMT5 Text Encoder Model"

upload_to_s3 \
    "${TEXT_ENCODERS_DIR}/umt5-xxl-enc-bf16.safetensors" \
    "models/text_encoders/umt5-xxl-enc-bf16.safetensors" \
    "UMT5 Text Encoder Model"

# Download and upload VAE
download_model \
    "https://huggingface.co/Kijai/WanVideo_comfy/resolve/main/Wan2_1_VAE_bf16.safetensors" \
    "${VAE_DIR}/Wan2_1_VAE_bf16.safetensors" \
    "Wan2.1 VAE Model"

upload_to_s3 \
    "${VAE_DIR}/Wan2_1_VAE_bf16.safetensors" \
    "models/vae/Wan2_1_VAE_bf16.safetensors" \
    "Wan2.1 VAE Model"

echo "================================================"
echo "🎉 All models downloaded and uploaded successfully!"
echo "================================================"
echo ""
echo "📊 Summary:"
echo "  S3 Bucket: s3://${S3_BUCKET}"
echo "  Diffusion Models: 2 files in models/"
echo "  LoRA Models: 2 files in loras/"
echo "  CLIP Vision: 1 file in models/clip_vision/"
echo "  Text Encoders: 1 file in models/text_encoders/"
echo "  VAE: 1 file in models/vae/"
echo ""
echo "🧹 Cleanup local files..."
read -p "Do you want to delete the local downloaded files? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "${TEMP_DIR}"
    echo "✅ Local files cleaned up"
fi
echo ""
echo "✅ Network volume is ready for use with RunPod endpoint!"
echo ""
echo "📝 Verify upload with:"
echo "  aws s3 ls --region ${S3_REGION} --endpoint-url ${S3_ENDPOINT} s3://${S3_BUCKET}/models/ --recursive --human-readable"
echo ""

