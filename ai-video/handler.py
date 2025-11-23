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
import binascii  # Base64 error handling
import subprocess
import time
import requests  # For Bunny CDN upload
# Logging configuration
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


server_address = os.getenv('SERVER_ADDRESS', '127.0.0.1')
client_id = str(uuid.uuid4())
def to_nearest_multiple_of_16(value):
    """Adjust given value to nearest multiple of 16, minimum 16"""
    try:
        numeric_value = float(value)
    except Exception:
        raise Exception(f"width/height value is not a number: {value}")
    adjusted = int(round(numeric_value / 16.0) * 16)
    if adjusted < 16:
        adjusted = 16
    return adjusted
def process_input(input_data, temp_dir, output_filename, input_type):
    """Process input data and return file path"""
    if input_type == "path":
        # Return path as-is
        logger.info(f"📁 Processing path input: {input_data}")
        return input_data
    elif input_type == "url":
        # Download from URL
        logger.info(f"🌐 Processing URL input: {input_data}")
        os.makedirs(temp_dir, exist_ok=True)
        file_path = os.path.abspath(os.path.join(temp_dir, output_filename))
        return download_file_from_url(input_data, file_path)
    elif input_type == "base64":
        # Decode and save Base64 data
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
        
        logger.info(f"✅ Saved Base64 input to file: '{file_path}'")
        return file_path
    except (binascii.Error, ValueError) as e:
        logger.error(f"❌ Base64 decoding failed: {e}")
        raise Exception(f"Base64 decoding failed: {e}")
    
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
    logger.info("🎬 Starting video generation...")
    prompt_id = queue_prompt(prompt)['prompt_id']
    logger.info(f"📝 Prompt ID: {prompt_id}")
    
    output_videos = {}
    logger.debug("⏳ Waiting for video generation to complete...")
    
    while True:
        out = ws.recv()
        if isinstance(out, str):
            message = json.loads(out)
            logger.debug(f"WebSocket message: {message.get('type', 'unknown')}")
            if message['type'] == 'executing':
                data = message['data']
                if data['node'] is None and data['prompt_id'] == prompt_id:
                    logger.info("✅ Video generation completed!")
                    break
        else:
            continue

    logger.debug("📊 Fetching generation history...")
    history = get_history(prompt_id)[prompt_id]
    logger.debug(f"History nodes: {list(history['outputs'].keys())}")
    
    for node_id in history['outputs']:
        node_output = history['outputs'][node_id]
        videos_output = []
        if 'gifs' in node_output:
            logger.info(f"🎥 Found {len(node_output['gifs'])} video(s) in node {node_id}")
            for idx, video in enumerate(node_output['gifs']):
                video_path = video['fullpath']
                logger.info(f"📁 Video {idx + 1} path: {video_path}")
                
                # Check if file exists and get size
                if os.path.exists(video_path):
                    file_size_mb = os.path.getsize(video_path) / (1024 * 1024)
                    logger.info(f"📊 Video file size: {file_size_mb:.2f} MB")
                else:
                    logger.error(f"❌ Video file not found: {video_path}")
                
                # Return the file path instead of base64
                videos_output.append(video_path)
        output_videos[node_id] = videos_output

    return output_videos

def load_workflow(workflow_path):
    with open(workflow_path, 'r') as file:
        return json.load(file)

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

def handler(job):
    logger.info("="*60)
    logger.info("🚀 NEW JOB STARTED")
    logger.info("="*60)
    
    job_input = job.get("input", {})
    logger.info(f"📥 Job input received:")
    logger.debug(json.dumps(job_input, indent=2))
    
    # Skip test jobs to prevent infinite loops
    # Test jobs are identified by prompt="test" and are used for local testing only
    prompt = job_input.get("prompt", "")
    if prompt == "test" and job_input.get("image_path") == "/example_image.png":
        logger.info("⏭️  Skipping test job (test_input.json) - this is a startup test job")
        logger.info("="*60)
        return {
            "status": "skipped",
            "message": "Test job skipped - worker is ready for real jobs"
        }
    
    task_id = f"task_{uuid.uuid4()}"
    logger.info(f"🆔 Task ID: {task_id}")

    # Process image input (use only one of image_path, image_url, image_base64)
    logger.info("🖼️  Processing input image...")
    image_path = None
    if "image_path" in job_input:
        logger.info("📁 Using image_path input")
        image_path = process_input(job_input["image_path"], task_id, "input_image.jpg", "path")
    elif "image_url" in job_input:
        logger.info("🌐 Using image_url input")
        image_path = process_input(job_input["image_url"], task_id, "input_image.jpg", "url")
    elif "image_base64" in job_input:
        logger.info("🔢 Using image_base64 input")
        image_path = process_input(job_input["image_base64"], task_id, "input_image.jpg", "base64")
    else:
        # Use default
        image_path = "/example_image.png"
        logger.info("⚠️  No image input provided, using default: /example_image.png")

    # Process end image input (use only one of end_image_path, end_image_url, end_image_base64)
    end_image_path_local = None
    if "end_image_path" in job_input:
        end_image_path_local = process_input(job_input["end_image_path"], task_id, "end_image.jpg", "path")
    elif "end_image_url" in job_input:
        end_image_path_local = process_input(job_input["end_image_url"], task_id, "end_image.jpg", "url")
    elif "end_image_base64" in job_input:
        end_image_path_local = process_input(job_input["end_image_base64"], task_id, "end_image.jpg", "base64")
    
    # Validate LoRA configuration - process as array
    logger.info("🎨 Processing LoRA configuration...")
    lora_pairs = job_input.get("lora_pairs", [])
    logger.debug(f"LoRA pairs provided: {len(lora_pairs)}")
    
    # Support up to 4 LoRA pairs
    lora_count = min(len(lora_pairs), 4)
    if len(lora_pairs) > 4:
        logger.warning(f"⚠️  LoRA count is {len(lora_pairs)}. Only up to 4 LoRA pairs are supported. Using first 4 only.")
        lora_pairs = lora_pairs[:4]
    
    # Select workflow file (use FLF2V workflow if end_image_* is present)
    workflow_file = "/new_Wan22_flf2v_api.json" if end_image_path_local else "/new_Wan22_api.json"
    logger.info(f"📋 Workflow: {'FLF2V (first-last-frame)' if end_image_path_local else 'Single image'}")
    logger.info(f"🎨 LoRA pairs: {lora_count}")
    
    logger.debug(f"Loading workflow from: {workflow_file}")
    prompt = load_workflow(workflow_file)
    logger.info("✅ Workflow loaded successfully")
    
    length = job_input.get("length", 81)
    steps = job_input.get("steps", 10)
    logger.info(f"⚙️  Video length: {length} frames")
    logger.info(f"⚙️  Denoising steps: {steps}")

    logger.info("🔧 Configuring workflow parameters...")
    prompt["244"]["inputs"]["image"] = image_path
    logger.debug(f"Image path set: {image_path}")
    
    prompt["541"]["inputs"]["num_frames"] = length
    logger.debug(f"Number of frames: {length}")
    
    positive_prompt = job_input["prompt"]
    negative_prompt = job_input.get("negative_prompt", "bright tones, overexposed, static, blurred details, subtitles, style, works, paintings, images, static, overall gray, worst quality, low quality, JPEG compression residue, ugly, incomplete, extra fingers, poorly drawn hands, poorly drawn faces, deformed, disfigured, misshapen limbs, fused fingers, still picture, messy background, three legs, many people in the background, walking backwards")
    prompt["135"]["inputs"]["positive_prompt"] = positive_prompt
    prompt["135"]["inputs"]["negative_prompt"] = negative_prompt
    logger.info(f"💬 Positive prompt: {positive_prompt[:100]}...")
    logger.debug(f"💬 Negative prompt: {negative_prompt[:100]}...")
    
    seed = job_input["seed"]
    cfg = job_input["cfg"]
    prompt["220"]["inputs"]["seed"] = seed
    prompt["540"]["inputs"]["seed"] = seed
    prompt["540"]["inputs"]["cfg"] = cfg
    logger.info(f"🎲 Seed: {seed}")
    logger.info(f"⚙️  CFG scale: {cfg}")
    # Adjust resolution (width/height) to nearest multiple of 16
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
    
    # Apply step settings
    if "834" in prompt:
        prompt["834"]["inputs"]["steps"] = steps
        logger.info(f"Steps set to: {steps}")
        lowsteps = int(steps*0.6)
        prompt["829"]["inputs"]["step"] = lowsteps
        logger.info(f"LowSteps set to: {lowsteps}")

    # Apply end image path to node 617 if present (FLF2V only)
    if end_image_path_local:
        prompt["617"]["inputs"]["image"] = end_image_path_local
    
    # Apply LoRA settings - HIGH LoRA uses node 279, LOW LoRA uses node 553
    if lora_count > 0:
        # HIGH LoRA node (279)
        high_lora_node_id = "279"
        
        # LOW LoRA node (553)
        low_lora_node_id = "553"
        
        # Apply LoRA pairs from input (starting from lora_1)
        for i, lora_pair in enumerate(lora_pairs):
            if i < 4:  # Maximum 4 pairs
                lora_high = lora_pair.get("high")
                lora_low = lora_pair.get("low")
                lora_high_weight = lora_pair.get("high_weight", 1.0)
                lora_low_weight = lora_pair.get("low_weight", 1.0)
                
                # HIGH LoRA settings (node 279, starting from lora_1)
                if lora_high:
                    prompt[high_lora_node_id]["inputs"][f"lora_{i+1}"] = lora_high
                    prompt[high_lora_node_id]["inputs"][f"strength_{i+1}"] = lora_high_weight
                    logger.info(f"LoRA {i+1} HIGH applied to node 279: {lora_high} with weight {lora_high_weight}")
                
                # LOW LoRA settings (node 553, starting from lora_1)
                if lora_low:
                    prompt[low_lora_node_id]["inputs"][f"lora_{i+1}"] = lora_low
                    prompt[low_lora_node_id]["inputs"][f"strength_{i+1}"] = lora_low_weight
                    logger.info(f"LoRA {i+1} LOW applied to node 553: {lora_low} with weight {lora_low_weight}")

    ws_url = f"ws://{server_address}:8188/ws?clientId={client_id}"
    logger.info(f"Connecting to WebSocket: {ws_url}")
    
    # First check if HTTP connection is available
    http_url = f"http://{server_address}:8188/"
    logger.info(f"Checking HTTP connection to: {http_url}")
    
    # Check HTTP connection (max 1 minute)
    max_http_attempts = 180
    for http_attempt in range(max_http_attempts):
        try:
            import urllib.request
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
    max_attempts = int(180/5)  # 3 minutes (attempt every 5 seconds)
    for attempt in range(max_attempts):
        import time
        try:
            ws.connect(ws_url)
            logger.info(f"WebSocket connection successful (attempt {attempt+1})")
            break
        except Exception as e:
            logger.warning(f"WebSocket connection failed (attempt {attempt+1}/{max_attempts}): {e}")
            if attempt == max_attempts - 1:
                raise Exception("WebSocket connection timeout (3 minutes)")
            time.sleep(5)
    logger.info("🎬 Generating video with ComfyUI...")
    videos = get_videos(ws, prompt)
    ws.close()
    logger.info("🔌 WebSocket connection closed")

    # Handle case when no video is found
    logger.info("🔍 Checking for generated videos...")
    for node_id in videos:
        if videos[node_id]:
            video_path = videos[node_id][0]
            logger.info(f"✅ Video found in node {node_id}")
            logger.info(f"📁 Video path: {video_path}")
            
            # Generate unique filename for CDN
            video_filename = f"{task_id}_{uuid.uuid4().hex[:8]}.mp4"
            logger.info(f"📝 Generated filename: {video_filename}")
            
            try:
                # Upload to Bunny CDN
                logger.info("📤 Uploading video to Bunny CDN...")
                cdn_url = upload_to_bunny_storage(video_path, "runpod", video_filename)
                logger.info(f"✅ Upload successful!")
                logger.info(f"🔗 Video URL: {cdn_url}")
                
                logger.info("="*60)
                logger.info("🎉 JOB COMPLETED SUCCESSFULLY")
                logger.info("="*60)
                
                return {
                    "video_url": cdn_url,
                    "task_id": task_id,
                    "filename": video_filename
                }
            except Exception as e:
                logger.error(f"❌ Failed to upload to CDN: {str(e)}")
                logger.exception("Full exception:")
                return {
                    "error": f"Video generated but CDN upload failed: {str(e)}",
                    "task_id": task_id
                }
    
    logger.error("❌ No video found in generation output")
    logger.info("="*60)
    logger.info("❌ JOB FAILED")
    logger.info("="*60)
    return {"error": "Video not found.", "task_id": task_id}

runpod.serverless.start({"handler": handler})