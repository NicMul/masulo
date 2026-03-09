#!/bin/bash

# Script to download, upload, verify, and clean up supporting models for S3 storage
# This reduces Docker image size by moving models to network volume

set -e

# S3 Configuration from environment variables
S3_BUCKET="${S3_BUCKET:-i5oxk2vdao}"
S3_REGION="${S3_REGION:-eu-ro-1}"
S3_ENDPOINT="${S3_ENDPOINT:-https://s3api-eu-ro-1.runpod.io}"
AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}"
AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}"

# Validate required environment variables
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "❌ Error: AWS credentials environment variables are required"
    echo ""
    echo "Please set the following environment variables:"
    echo "  export AWS_ACCESS_KEY_ID=your_access_key"
    echo "  export AWS_SECRET_ACCESS_KEY=your_secret_key"
    echo "  export S3_BUCKET=i5oxk2vdao  # optional, defaults to i5oxk2vdao"
    echo "  export S3_REGION=eu-ro-1  # optional, defaults to eu-ro-1"
    echo "  export S3_ENDPOINT=https://s3api-eu-ro-1.runpod.io  # optional"
    exit 1
fi

# Export AWS credentials for aws cli
export AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🚀 Starting model upload to S3..."
echo "=========================================="
echo ""

# Function to process a model
process_model() {
    local model_name=$1
    local download_url=$2
    local s3_path=$3
    local local_file=$(basename "$s3_path")
    
    echo -e "${YELLOW}📦 Processing: ${model_name}${NC}"
    echo "   Download URL: ${download_url}"
    echo "   S3 Path: s3://${S3_BUCKET}/${s3_path}"
    echo ""
    
    # Step 1: Download
    echo "   [1/4] Downloading ${model_name}..."
    if [ -f "$local_file" ]; then
        echo -e "   ${YELLOW}⚠️  File already exists locally, skipping download${NC}"
    else
        # Use curl for macOS compatibility (wget not available by default)
        curl -L --progress-bar "$download_url" -o "$local_file"
        if [ $? -eq 0 ]; then
            echo -e "   ${GREEN}✅ Download complete${NC}"
        else
            echo -e "   ${RED}❌ Download failed${NC}"
            return 1
        fi
    fi
    echo ""
    
    # Step 2: Upload to S3
    echo "   [2/4] Uploading to S3..."
    aws s3 cp "$local_file" \
        "s3://${S3_BUCKET}/${s3_path}" \
        --region "$S3_REGION" \
        --endpoint-url "$S3_ENDPOINT" \
        --no-progress
    
    if [ $? -eq 0 ]; then
        echo -e "   ${GREEN}✅ Upload complete${NC}"
    else
        echo -e "   ${RED}❌ Upload failed${NC}"
        return 1
    fi
    echo ""
    
    # Step 3: Verify upload
    echo "   [3/4] Verifying upload..."
    if aws s3 ls "s3://${S3_BUCKET}/${s3_path}" \
        --region "$S3_REGION" \
        --endpoint-url "$S3_ENDPOINT" > /dev/null 2>&1; then
        local s3_size=$(aws s3 ls "s3://${S3_BUCKET}/${s3_path}" \
            --region "$S3_REGION" \
            --endpoint-url "$S3_ENDPOINT" \
            --human-readable \
            --summarize | grep "Total Size" | awk '{print $3, $4}')
        local local_size=$(du -h "$local_file" | cut -f1)
        echo -e "   ${GREEN}✅ Verification passed${NC}"
        echo "      Local size: ${local_size}"
        echo "      S3 size: ${s3_size}"
    else
        echo -e "   ${RED}❌ Verification failed - file not found in S3${NC}"
        return 1
    fi
    echo ""
    
    # Step 4: Delete local file
    echo "   [4/4] Cleaning up local file..."
    rm -f "$local_file"
    if [ $? -eq 0 ]; then
        echo -e "   ${GREEN}✅ Local file deleted${NC}"
    else
        echo -e "   ${YELLOW}⚠️  Warning: Could not delete local file${NC}"
    fi
    echo ""
    
    echo -e "${GREEN}✅ ${model_name} completed successfully!${NC}"
    echo "=========================================="
    echo ""
}

# Process Clip Vision model
process_model \
    "Clip Vision" \
    "https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/clip_vision/clip_vision_h.safetensors" \
    "models/clip_vision/clip_vision_h.safetensors"

# Process Text Encoder (XXL - this is the big one!)
process_model \
    "Text Encoder (XXL)" \
    "https://huggingface.co/Kijai/WanVideo_comfy/resolve/main/umt5-xxl-enc-bf16.safetensors" \
    "models/text_encoders/umt5-xxl-enc-bf16.safetensors"

# Process VAE
process_model \
    "VAE" \
    "https://huggingface.co/Kijai/WanVideo_comfy/resolve/main/Wan2_1_VAE_bf16.safetensors" \
    "models/vae/Wan2_1_VAE_bf16.safetensors"

# Final verification - list all uploaded models
echo -e "${GREEN}📋 Final Verification - Listing all models in S3:${NC}"
echo "=========================================="
aws s3 ls --recursive "s3://${S3_BUCKET}/models/" \
    --region "$S3_REGION" \
    --endpoint-url "$S3_ENDPOINT" \
    --human-readable

echo ""
echo -e "${GREEN}🎉 All models uploaded successfully!${NC}"
echo ""
echo "📦 Summary:"
echo "   ✅ Clip Vision model uploaded"
echo "   ✅ Text Encoder (XXL) uploaded"
echo "   ✅ VAE model uploaded"
echo ""
echo "💡 Next steps:"
echo "   1. Rebuild your Docker image (it will be much smaller now!)"
echo "   2. Ensure your RunPod network volume is synced with S3"
echo "   3. Test the endpoint to verify models load correctly"
echo ""

