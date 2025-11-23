#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Validate network volume and models
echo "================================================"
echo "🔍 Validating Network Volume Setup"
echo "================================================"

VOLUME_PATH="/workspace"
REQUIRED_MODELS=(
    "${VOLUME_PATH}/models/Wan2_2-I2V-A14B-HIGH_fp8_e4m3fn_scaled_KJ.safetensors"
    "${VOLUME_PATH}/models/Wan2_2-I2V-A14B-LOW_fp8_e4m3fn_scaled_KJ.safetensors"
    "${VOLUME_PATH}/loras/high_noise_model.safetensors"
    "${VOLUME_PATH}/loras/low_noise_model.safetensors"
    "${VOLUME_PATH}/models/clip_vision/clip_vision_h.safetensors"
    "${VOLUME_PATH}/models/text_encoders/umt5-xxl-enc-bf16.safetensors"
    "${VOLUME_PATH}/models/vae/Wan2_1_VAE_bf16.safetensors"
)

# Check if network volume is mounted
if [ ! -d "${VOLUME_PATH}" ]; then
    echo "⚠️  WARNING: Network volume not found at ${VOLUME_PATH}"
    echo "   The container will start but model loading may fail."
    echo "   Please ensure the network volume is properly mounted."
    echo ""
else
    echo "✅ Network volume mounted at ${VOLUME_PATH}"
    
    # Check for required model files
    MISSING_MODELS=()
    for model_file in "${REQUIRED_MODELS[@]}"; do
        if [ ! -f "${model_file}" ]; then
            MISSING_MODELS+=("${model_file}")
        fi
    done
    
    if [ ${#MISSING_MODELS[@]} -eq 0 ]; then
        echo "✅ All required model files found (7/7)"
    else
        echo "⚠️  WARNING: ${#MISSING_MODELS[@]} model file(s) missing:"
        for missing in "${MISSING_MODELS[@]}"; do
            echo "   ❌ ${missing}"
        done
        echo ""
        echo "📝 To set up models, run setup commands on the network volume."
        echo "   See NETWORK_VOLUME_SETUP.md for detailed instructions."
        echo ""
        echo "⚠️  Container will continue but video generation will likely fail."
        echo ""
    fi
fi

echo "================================================"
echo ""

# Start ComfyUI in the background
echo "Starting ComfyUI in the background..."
python /ComfyUI/main.py --listen --use-sage-attention &

# Wait for ComfyUI to be ready
echo "Waiting for ComfyUI to be ready..."
max_wait=120  # Maximum 2 minutes wait
wait_count=0
while [ $wait_count -lt $max_wait ]; do
    if curl -s http://127.0.0.1:8188/ > /dev/null 2>&1; then
        echo "ComfyUI is ready!"
        break
    fi
    echo "Waiting for ComfyUI... ($wait_count/$max_wait)"
    sleep 2
    wait_count=$((wait_count + 2))
done

if [ $wait_count -ge $max_wait ]; then
    echo "Error: ComfyUI failed to start within $max_wait seconds"
    exit 1
fi

# Start the handler in the foreground
# This script becomes the main process of the container
echo "Starting the handler..."
exec python handler.py