import runpod
from runpod.serverless.utils import rp_upload
import os
import websocket
import base64
import json
import uuid
import logging
import urllib.request
import urllib.parse
import binascii # Import for Base64 error handling
import subprocess
import time
import requests
# Logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


server_address = os.getenv('SERVER_ADDRESS', '127.0.0.1')
client_id = str(uuid.uuid4())
def to_nearest_multiple_of_16(value):
    """Round the given value to the nearest multiple of 16, minimum 16 guaranteed"""
    try:
        numeric_value = float(value)
    except Exception:
        raise Exception(f"width/height value is not numeric: {value}")
    adjusted = int(round(numeric_value / 16.0) * 16)
    if adjusted < 16:
        adjusted = 16
    return adjusted
def process_input(input_data, temp_dir, output_filename, input_type):
    """Process input data and return file path"""
    if input_type == "path":
        # Return path as is
        logger.info(f"📁 Processing path input: {input_data}")
        return input_data
    elif input_type == "url":
        # Download from URL
        logger.info(f"🌐 Processing URL input: {input_data}")
        os.makedirs(temp_dir, exist_ok=True)
        file_path = os.path.abspath(os.path.join(temp_dir, output_filename))
        return download_file_from_url(input_data, file_path)
    elif input_type == "base64":
        # Decode and save Base64
        logger.info(f"🔢 Processing Base64 input")
        return save_base64_to_file(input_data, temp_dir, output_filename)
    else:
        raise Exception(f"Unsupported input type: {input_type}")

        
def download_file_from_url(url, output_path):
    """Download file from URL"""
    try:
        # Download file using wget
        result = subprocess.run([
            'wget', '-O', output_path, '--no-verbose', url
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            logger.info(f"✅ Successfully downloaded file from URL: {url} -> {output_path}")
            return output_path
        else:
            logger.error(f"❌ wget download failed: {result.stderr}")
            raise Exception(f"URL download failed: {result.stderr}")
    except subprocess.TimeoutExpired:
        logger.error("❌ Download timeout")
        raise Exception("Download timeout")
    except Exception as e:
        logger.error(f"❌ Error during download: {e}")
        raise Exception(f"Error during download: {e}")


def save_base64_to_file(base64_data, temp_dir, output_filename):
    """Save Base64 data to file"""
    try:
        # Decode Base64 string
        decoded_data = base64.b64decode(base64_data)
        
        # Create directory if it doesn't exist
        os.makedirs(temp_dir, exist_ok=True)
        
        # Save to file
        file_path = os.path.abspath(os.path.join(temp_dir, output_filename))
        with open(file_path, 'wb') as f:
            f.write(decoded_data)
        
        logger.info(f"✅ Saved Base64 input to file '{file_path}'.")
        return file_path
    except (binascii.Error, ValueError) as e:
        logger.error(f"❌ Base64 decoding failed: {e}")
        raise Exception(f"Base64 decoding failed: {e}")

def upload_to_bunny_storage(video_path, folder, filename):
    """
    Upload video file to Bunny CDN storage
    Hardcoded credentials for testing purposes
    """
    logger.info(f"📤 Starting Bunny CDN upload...")
    logger.debug(f"Video path: {video_path}")
    logger.debug(f"Folder: {folder}")
    logger.debug(f"Filename: {filename}")
    
    try:
        # Hardcoded Bunny CDN credentials (TESTING ONLY)
        STORAGE_ZONE_NAME = "mesulo"
        STORAGE_KEY = "c624d050-d61f-4306-968c05d196ba-bd76-40e8"
        CDN_URL = "mesulo.b-cdn.net"
        
        logger.info(f"📦 Storage Zone: {STORAGE_ZONE_NAME}")
        logger.info(f"🌐 CDN URL: {CDN_URL}")
        
        # Read the video file
        logger.debug(f"Reading video file: {video_path}")
        with open(video_path, 'rb') as f:
            file_data = f.read()
        
        file_size_mb = len(file_data) / (1024 * 1024)
        logger.info(f"📊 File size: {file_size_mb:.2f} MB")
        
        # Construct upload URL
        upload_url = f"https://storage.bunnycdn.com/{STORAGE_ZONE_NAME}/{folder}/{filename}"
        logger.debug(f"Upload URL: {upload_url}")
        
        # Upload to Bunny storage
        logger.info(f"⬆️  Uploading to Bunny CDN...")
        response = requests.put(
            upload_url,
            data=file_data,
            headers={
                'AccessKey': STORAGE_KEY,
                'Content-Type': 'video/mp4'
            },
            timeout=300  # 5 minute timeout
        )
        
        logger.debug(f"Response status code: {response.status_code}")
        logger.debug(f"Response text: {response.text}")
        
        if response.status_code in [200, 201]:
            # Construct CDN URL
            cdn_url = f"https://{CDN_URL}/{folder}/{filename}"
            logger.info(f"✅ Upload successful!")
            logger.info(f"🔗 CDN URL: {cdn_url}")
            return cdn_url
        else:
            error_msg = f"Upload failed with status code {response.status_code}: {response.text}"
            logger.error(f"❌ {error_msg}")
            raise Exception(error_msg)
            
    except Exception as e:
        logger.error(f"❌ Upload to Bunny CDN failed: {str(e)}")
        logger.exception("Full exception details:")
        raise
    
def queue_prompt(prompt):
    url = f"http://{server_address}:8188/prompt"
    logger.info(f"Queueing prompt to: {url}")
    p = {"prompt": prompt, "client_id": client_id}
    data = json.dumps(p).encode('utf-8')
    req = urllib.request.Request(url, data=data)
    return json.loads(urllib.request.urlopen(req).read())

def get_image(filename, subfolder, folder_type):
    url = f"http://{server_address}:8188/view"
    logger.info(f"Getting image from: {url}")
    data = {"filename": filename, "subfolder": subfolder, "type": folder_type}
    url_values = urllib.parse.urlencode(data)
    with urllib.request.urlopen(f"{url}?{url_values}") as response:
        return response.read()

def get_history(prompt_id):
    url = f"http://{server_address}:8188/history/{prompt_id}"
    logger.info(f"Getting history from: {url}")
    with urllib.request.urlopen(url) as response:
        return json.loads(response.read())

def get_videos(ws, prompt):
    prompt_id = queue_prompt(prompt)['prompt_id']
    output_videos = {}
    while True:
        out = ws.recv()
        if isinstance(out, str):
            message = json.loads(out)
            if message['type'] == 'executing':
                data = message['data']
                if data['node'] is None and data['prompt_id'] == prompt_id:
                    break
        else:
            continue

    history = get_history(prompt_id)[prompt_id]
    for node_id in history['outputs']:
        node_output = history['outputs'][node_id]
        videos_output = []
        if 'gifs' in node_output:
            for video in node_output['gifs']:
                # Return the full path instead of base64 encoding
                videos_output.append(video['fullpath'])
        output_videos[node_id] = videos_output

    return output_videos

def load_workflow(workflow_path):
    with open(workflow_path, 'r') as file:
        return json.load(file)

def handler(job):
    job_input = job.get("input", {})

    logger.info(f"Received job input: {job_input}")
    task_id = f"task_{uuid.uuid4()}"

    # Process image input (use only one of: image_path, image_url, image_base64)
    image_path = None
    if "image_path" in job_input:
        # Check if image_path is actually a URL
        input_value = job_input["image_path"]
        if input_value.startswith(("http://", "https://")):
            # It's a URL, treat it as such
            logger.info(f"🌐 Detected URL in image_path, treating as URL: {input_value}")
            image_path = process_input(input_value, task_id, "input_image.jpg", "url")
        else:
            # It's a local path
            image_path = process_input(input_value, task_id, "input_image.jpg", "path")
    elif "image_url" in job_input:
        image_path = process_input(job_input["image_url"], task_id, "input_image.jpg", "url")
    elif "image_base64" in job_input:
        image_path = process_input(job_input["image_base64"], task_id, "input_image.jpg", "base64")
    else:
        # Use default value
        image_path = "/example_image.png"
        logger.info("Using default image file: /example_image.png")

    # Process end image input (use only one of: end_image_path, end_image_url, end_image_base64)
    end_image_path_local = None
    if "end_image_path" in job_input:
        # Check if end_image_path is actually a URL
        input_value = job_input["end_image_path"]
        if input_value.startswith(("http://", "https://")):
            # It's a URL, treat it as such
            logger.info(f"🌐 Detected URL in end_image_path, treating as URL: {input_value}")
            end_image_path_local = process_input(input_value, task_id, "end_image.jpg", "url")
        else:
            # It's a local path
            end_image_path_local = process_input(input_value, task_id, "end_image.jpg", "path")
    elif "end_image_url" in job_input:
        end_image_path_local = process_input(job_input["end_image_url"], task_id, "end_image.jpg", "url")
    elif "end_image_base64" in job_input:
        end_image_path_local = process_input(job_input["end_image_base64"], task_id, "end_image.jpg", "base64")
    
    # Check LoRA configuration - process as array
    lora_pairs = job_input.get("lora_pairs", [])
    
    # Support up to 4 LoRAs
    lora_count = min(len(lora_pairs), 4)
    if lora_count > len(lora_pairs):
        logger.warning(f"LoRA count is {len(lora_pairs)}. Only up to 4 LoRAs are supported. Using first 4 only.")
        lora_pairs = lora_pairs[:4]
    
    # Select workflow file (use FLF2V workflow if end_image_* is present)
    workflow_file = "/new_Wan22_flf2v_api.json" if end_image_path_local else "/new_Wan22_api.json"
    logger.info(f"Using {'FLF2V' if end_image_path_local else 'single'} workflow with {lora_count} LoRA pairs")
    
    prompt = load_workflow(workflow_file)
    
    length = job_input.get("length", 81)
    steps = job_input.get("steps", 10)

    prompt["244"]["inputs"]["image"] = image_path
    prompt["541"]["inputs"]["num_frames"] = length
    prompt["135"]["inputs"]["positive_prompt"] = job_input["prompt"]
    prompt["135"]["inputs"]["negative_prompt"] = job_input.get("negative_prompt", "bright tones, overexposed, static, blurred details, subtitles, style, works, paintings, images, static, overall gray, worst quality, low quality, JPEG compression residue, ugly, incomplete, extra fingers, poorly drawn hands, poorly drawn faces, deformed, disfigured, misshapen limbs, fused fingers, still picture, messy background, three legs, many people in the background, walking backwards")
    prompt["220"]["inputs"]["seed"] = job_input["seed"]
    prompt["540"]["inputs"]["seed"] = job_input["seed"]
    prompt["540"]["inputs"]["cfg"] = job_input["cfg"]
    # Adjust resolution (width/height) to multiples of 16
    original_width = job_input["width"]
    original_height = job_input["height"]
    adjusted_width = to_nearest_multiple_of_16(original_width)
    adjusted_height = to_nearest_multiple_of_16(original_height)
    if adjusted_width != original_width:
        logger.info(f"Width adjusted to nearest multiple of 16: {original_width} -> {adjusted_width}")
    if adjusted_height != original_height:
        logger.info(f"Height adjusted to nearest multiple of 16: {original_height} -> {adjusted_height}")
    prompt["235"]["inputs"]["value"] = adjusted_width
    prompt["236"]["inputs"]["value"] = adjusted_height
    prompt["498"]["inputs"]["context_overlap"] = job_input.get("context_overlap", 48)
    
    # Apply step configuration
    if "834" in prompt:
        prompt["834"]["inputs"]["steps"] = steps
        logger.info(f"Steps set to: {steps}")
        lowsteps = int(steps*0.6)
        prompt["829"]["inputs"]["step"] = lowsteps
        logger.info(f"LowSteps set to: {lowsteps}")

    # Apply end image path to node 617 if present (FLF2V only)
    if end_image_path_local:
        prompt["617"]["inputs"]["image"] = end_image_path_local
    
    # Apply LoRA configuration - HIGH LoRA is node 279, LOW LoRA is node 553
    if lora_count > 0:
        # HIGH LoRA node (279)
        high_lora_node_id = "279"
        
        # LOW LoRA node (553)
        low_lora_node_id = "553"
        
        # Apply received LoRA pairs (starting from lora_1)
        for i, lora_pair in enumerate(lora_pairs):
            if i < 4:  # Maximum 4 only
                lora_high = lora_pair.get("high")
                lora_low = lora_pair.get("low")
                lora_high_weight = lora_pair.get("high_weight", 1.0)
                lora_low_weight = lora_pair.get("low_weight", 1.0)
                
                # Configure HIGH LoRA (node 279, starting from lora_1)
                if lora_high:
                    prompt[high_lora_node_id]["inputs"][f"lora_{i+1}"] = lora_high
                    prompt[high_lora_node_id]["inputs"][f"strength_{i+1}"] = lora_high_weight
                    logger.info(f"LoRA {i+1} HIGH applied to node 279: {lora_high} with weight {lora_high_weight}")
                
                # Configure LOW LoRA (node 553, starting from lora_1)
                if lora_low:
                    prompt[low_lora_node_id]["inputs"][f"lora_{i+1}"] = lora_low
                    prompt[low_lora_node_id]["inputs"][f"strength_{i+1}"] = lora_low_weight
                    logger.info(f"LoRA {i+1} LOW applied to node 553: {lora_low} with weight {lora_low_weight}")

    ws_url = f"ws://{server_address}:8188/ws?clientId={client_id}"
    logger.info(f"Connecting to WebSocket: {ws_url}")
    
    # First check if HTTP connection is possible
    http_url = f"http://{server_address}:8188/"
    logger.info(f"Checking HTTP connection to: {http_url}")
    
    # Check HTTP connection (max 1 minute)
    max_http_attempts = 180
    for http_attempt in range(max_http_attempts):
        try:
            response = urllib.request.urlopen(http_url, timeout=5)
            logger.info(f"HTTP connection successful (attempt {http_attempt+1})")
            break
        except Exception as e:
            logger.warning(f"HTTP connection failed (attempt {http_attempt+1}/{max_http_attempts}): {e}")
            if http_attempt == max_http_attempts - 1:
                raise Exception("Cannot connect to ComfyUI server. Please check if the server is running.")
            time.sleep(1)
    
    ws = websocket.WebSocket()
    # Attempt WebSocket connection (max 3 minutes)
    max_attempts = int(180/5)  # 3 minutes (try once per second)
    for attempt in range(max_attempts):
        try:
            ws.connect(ws_url)
            logger.info(f"WebSocket connection successful (attempt {attempt+1})")
            break
        except Exception as e:
            logger.warning(f"WebSocket connection failed (attempt {attempt+1}/{max_attempts}): {e}")
            if attempt == max_attempts - 1:
                raise Exception("WebSocket connection timeout (3 minutes)")
            time.sleep(5)
    videos = get_videos(ws, prompt)
    ws.close()

    # Handle case when video is not found
    for node_id in videos:
        if videos[node_id]:
            video_path = videos[node_id][0]
            
            # Generate unique filename
            unique_filename = f"{task_id}.mp4"
            folder = "ai-videos"  # You can change this folder name
            
            # Upload to Bunny CDN
            try:
                cdn_url = upload_to_bunny_storage(video_path, folder, unique_filename)
                return {"video_url": cdn_url}
            except Exception as e:
                logger.error(f"Failed to upload video: {str(e)}")
                return {"error": f"Failed to upload video: {str(e)}"}
    
    return {"error": "Video not found."}

runpod.serverless.start({"handler": handler})