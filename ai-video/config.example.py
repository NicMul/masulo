"""
Example configuration file for RunPod endpoint
Copy this to config.py and fill in your actual values
"""

# RunPod Configuration
RUNPOD_ENDPOINT_ID = "your-endpoint-id-here"
RUNPOD_API_KEY = "your-api-key-here"

# Default video generation settings
DEFAULT_VIDEO_SETTINGS = {
    "width": 480,
    "height": 832,
    "length": 81,  # Number of frames
    "steps": 10,
    "seed": 42,
    "cfg": 2.0,
    "context_overlap": 48
}

# Default prompts
DEFAULT_PROMPT = "running man, grab the gun"
DEFAULT_NEGATIVE_PROMPT = "blurry, low quality, distorted"

# Network Volume paths (if using)
NETWORK_VOLUME_BASE = "/runpod-volume"
LORAS_PATH = f"{NETWORK_VOLUME_BASE}/loras"
MODELS_PATH = f"{NETWORK_VOLUME_BASE}/models"

