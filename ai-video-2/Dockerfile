# Use specific version of nvidia cuda image
# FROM wlsdml1114/my-comfy-models:v1 as model_provider
FROM nvidia/cuda:12.1.0-runtime-ubuntu22.04

# Install Python, pip, and ffmpeg (required for VideoHelperSuite)
RUN apt-get update && apt-get install -y python3 python3-pip git curl ffmpeg && rm -rf /var/lib/apt/lists/*
# Create symlinks for python and pip (remove existing if they exist)
RUN rm -f /usr/bin/python /usr/bin/pip && \
    ln -s /usr/bin/python3 /usr/bin/python && \
    ln -s /usr/bin/pip3 /usr/bin/pip

RUN pip install -U "huggingface_hub[hf_transfer]"
RUN pip install runpod websocket-client requests
# Install sageattention for WanVideo model (required for sageattn attention mode)
RUN pip install sageattention

WORKDIR /

RUN git clone --depth 1 https://github.com/comfyanonymous/ComfyUI.git && \
    cd /ComfyUI && \
    pip install --no-cache-dir -r requirements.txt && \
    pip cache purge && \
    rm -rf .git

RUN cd /ComfyUI/custom_nodes && \
    git clone --depth 1 https://github.com/Comfy-Org/ComfyUI-Manager.git && \
    cd ComfyUI-Manager && \
    pip install --no-cache-dir -r requirements.txt && \
    pip cache purge && \
    rm -rf .git
    
RUN cd /ComfyUI/custom_nodes && \
    git clone --depth 1 https://github.com/city96/ComfyUI-GGUF && \
    cd ComfyUI-GGUF && \
    pip install --no-cache-dir -r requirements.txt && \
    pip cache purge && \
    rm -rf .git

RUN cd /ComfyUI/custom_nodes && \
    git clone --depth 1 https://github.com/kijai/ComfyUI-KJNodes && \
    cd ComfyUI-KJNodes && \
    pip install --no-cache-dir -r requirements.txt && \
    pip cache purge && \
    rm -rf .git

RUN cd /ComfyUI/custom_nodes && \
    git clone --depth 1 https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite && \
    cd ComfyUI-VideoHelperSuite && \
    pip install --no-cache-dir -r requirements.txt && \
    pip cache purge && \
    rm -rf .git && \
    echo "VideoHelperSuite installed successfully"
    
RUN cd /ComfyUI/custom_nodes && \
    git clone --depth 1 https://github.com/orssorbit/ComfyUI-wanBlockswap && \
    rm -rf ComfyUI-wanBlockswap/.git

RUN cd /ComfyUI/custom_nodes && \
    git clone --depth 1 https://github.com/kijai/ComfyUI-WanVideoWrapper && \
    cd ComfyUI-WanVideoWrapper && \
    pip install --no-cache-dir -r requirements.txt && \
    pip cache purge && \
    rm -rf .git

    
RUN cd /ComfyUI/custom_nodes && \
    git clone --depth 1 https://github.com/eddyhhlure1Eddy/IntelligentVRAMNode && \
    rm -rf IntelligentVRAMNode/.git && \
    git clone --depth 1 https://github.com/eddyhhlure1Eddy/auto_wan2.2animate_freamtowindow_server && \
    rm -rf auto_wan2.2animate_freamtowindow_server/.git && \
    git clone --depth 1 https://github.com/eddyhhlure1Eddy/ComfyUI-AdaptiveWindowSize && \
    cd ComfyUI-AdaptiveWindowSize/ComfyUI-AdaptiveWindowSize && \
    mv * ../ && \
    cd /ComfyUI/custom_nodes && \
    rm -rf ComfyUI-AdaptiveWindowSize/.git

# All models are now loaded from /runpod-volume/ network volume
# This reduces Docker image size significantly and allows sharing models across instances
# 
# Required models on network volume:
# - /runpod-volume/models/Wan2_2-I2V-A14B-HIGH_fp8_e4m3fn_scaled_KJ.safetensors
# - /runpod-volume/models/Wan2_2-I2V-A14B-LOW_fp8_e4m3fn_scaled_KJ.safetensors
# - /runpod-volume/models/clip_vision/clip_vision_h.safetensors
# - /runpod-volume/models/text_encoders/umt5-xxl-enc-bf16.safetensors
# - /runpod-volume/models/vae/Wan2_1_VAE_bf16.safetensors
# - /runpod-volume/loras/high_noise_model.safetensors
# - /runpod-volume/loras/low_noise_model.safetensors
# - /runpod-volume/loras/ (your custom LoRA files)

# All models are loaded from network volume - no downloads in image

# Final cleanup: remove pip cache, git, and other unnecessary files
RUN pip cache purge && \
    rm -rf /root/.cache/pip && \
    rm -rf /root/.cache/huggingface && \
    find /ComfyUI -type d -name ".git" -exec rm -rf {} + 2>/dev/null || true && \
    find /ComfyUI -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true && \
    find /ComfyUI -type f -name "*.pyc" -delete 2>/dev/null || true

COPY handler.py /handler.py
COPY entrypoint.sh /entrypoint.sh
COPY new_Wan22_api.json /new_Wan22_api.json
COPY new_Wan22_flf2v_api.json /new_Wan22_flf2v_api.json
COPY extra_model_paths.yaml /ComfyUI/extra_model_paths.yaml
COPY example_image.png /example_image.png
RUN chmod +x /entrypoint.sh

CMD ["/entrypoint.sh"]