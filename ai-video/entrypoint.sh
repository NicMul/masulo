#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Start ComfyUI in the background with output logging
echo "Starting ComfyUI in the background..."
cd /ComfyUI
python main.py --listen --use-sage-attention > /tmp/comfyui.log 2>&1 &
COMFYUI_PID=$!

# Function to check if ComfyUI process is still running
check_comfyui_process() {
    if ! kill -0 $COMFYUI_PID 2>/dev/null; then
        echo "ERROR: ComfyUI process died!"
        echo "Last 50 lines of ComfyUI log:"
        tail -50 /tmp/comfyui.log || true
        return 1
    fi
    return 0
}

# Wait for ComfyUI to be ready
echo "Waiting for ComfyUI to be ready..."
max_wait=300  # Increased to 5 minutes (models may need to load from network volume)
wait_count=0
while [ $wait_count -lt $max_wait ]; do
    # Check if process is still running
    if ! check_comfyui_process; then
        exit 1
    fi
    
    # Check if HTTP endpoint is responding
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
    echo "ComfyUI process status:"
    ps aux | grep -i comfy || echo "ComfyUI process not found"
    echo ""
    echo "Last 100 lines of ComfyUI log:"
    tail -100 /tmp/comfyui.log || true
    exit 1
fi

# Start the handler in the foreground
echo "Starting the handler..."
exec python /handler.py