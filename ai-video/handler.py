# Import with error handling to catch import failures early
try:
    import runpod
    from runpod.serverless.utils import rp_upload
except ImportError as e:
    print(f"CRITICAL: Failed to import runpod: {e}")
    print("This is a fatal error - handler cannot start without runpod")
    raise

import os
import sys
import websocket
import base64
import json
import uuid
import logging
import urllib.request
import urllib.parse
import binascii
import subprocess
import time
import requests

# Logging configuration
logging.basicConfig(
    level=logging.DEBUG, 
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.StreamHandler(sys.stderr)
    ]
)
logger = logging.getLogger(__name__)
logger.info("All imports successful")

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
        logger.info(f"📁 Processing path input: {input_data}")
        return input_data
    elif input_type == "url":
        logger.info(f"🌐 Processing URL input: {input_data}")
        os.makedirs(temp_dir, exist_ok=True)
        file_path = os.path.abspath(os.path.join(temp_dir, output_filename))
        return download_file_from_url(input_data, file_path)
    elif input_type == "base64":
        logger.info(f"🔢 Processing Base64 input")
        return save_base64_to_file(input_data, temp_dir, output_filename)
    else:
        raise Exception(f"Unsupported input type: {input_type}")

def download_file_from_url(url, output_path):
    """Download file from URL"""
    try:
        result = subprocess.run([
            'wget', '-O', output_path, '--no-verbose', url
        ], capture_output=True, text=True, timeout=120)
        
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
        raise

def save_base64_to_file(base64_data, temp_dir, output_filename):
    """Save Base64 data to file"""
    try:
        decoded_data = base64.b64decode(base64_data)
        os.makedirs(temp_dir, exist_ok=True)
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
                
                if os.path.exists(video_path):
                    file_size_mb = os.path.getsize(video_path) / (1024 * 1024)
                    logger.info(f"📊 Video file size: {file_size_mb:.2f} MB")
                else:
                    logger.error(f"❌ Video file not found: {video_path}")
                
                videos_output.append(video_path)
        output_videos[node_id] = videos_output

    return output_videos

def load_workflow(workflow_path):
    with open(workflow_path, 'r') as file:
        return json.load(file)

def upload_to_bunny_storage(video_path, folder, filename):
    """Upload video file to Bunny CDN storage"""
    logger.info(f"📤 Starting Bunny CDN upload...")
    
    try:
        STORAGE_ZONE_NAME = "mesulo"
        STORAGE_KEY = "c624d050-d61f-4306-968c05d196ba-bd76-40e8"
        CDN_URL = "mesulo.b-cdn.net"
        
        with open(video_path, 'rb') as f:
            file_data = f.read()
        
        file_size_mb = len(file_data) / (1024 * 1024)
        logger.info(f"📊 File size: {file_size_mb:.2f} MB")
        
        upload_url = f"https://storage.bunnycdn.com/{STORAGE_ZONE_NAME}/{folder}/{filename}"
        
        logger.info(f"⬆️  Uploading to Bunny CDN...")
        response = requests.put(
            upload_url,
            data=file_data,
            headers={
                'AccessKey': STORAGE_KEY,
                'Content-Type': 'video/mp4'
            },
            timeout=300
        )
        
        if response.status_code in [200, 201]:
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
    """
    Main job handler - wrapped with comprehensive error handling
    This function should NEVER raise unhandled exceptions
    """
    try:
        logger.info("="*60)
        logger.info("🚀 NEW JOB STARTED")
        logger.info("="*60)
        
        job_input = job.get("input", {})
        logger.debug(f"📥 Job input: {json.dumps(job_input, indent=2)}")
        
        # Skip test jobs
        prompt = job_input.get("prompt", "")
        if prompt == "test" and job_input.get("image_path") == "/example_image.png":
            logger.info("⏭️  Skipping test job (test_input.json)")
            return {
                "status": "skipped",
                "message": "Test job skipped - worker is ready for real jobs"
            }
        
        task_id = f"task_{uuid.uuid4()}"
        logger.info(f"🆔 Task ID: {task_id}")

        # Process image input
        image_path = None
        if "image_path" in job_input:
            image_path = process_input(job_input["image_path"], task_id, "input_image.jpg", "path")
        elif "image_url" in job_input:
            image_path = process_input(job_input["image_url"], task_id, "input_image.jpg", "url")
        elif "image_base64" in job_input:
            image_path = process_input(job_input["image_base64"], task_id, "input_image.jpg", "base64")
        else:
            image_path = "/example_image.png"

        # Process end image
        end_image_path_local = None
        if "end_image_path" in job_input:
            end_image_path_local = process_input(job_input["end_image_path"], task_id, "end_image.jpg", "path")
        elif "end_image_url" in job_input:
            end_image_path_local = process_input(job_input["end_image_url"], task_id, "end_image.jpg", "url")
        elif "end_image_base64" in job_input:
            end_image_path_local = process_input(job_input["end_image_base64"], task_id, "end_image.jpg", "base64")
        
        # Process LoRA
        lora_pairs = job_input.get("lora_pairs", [])
        lora_count = min(len(lora_pairs), 4)
        if len(lora_pairs) > 4:
            logger.warning(f"⚠️  Using first 4 LoRA pairs only")
            lora_pairs = lora_pairs[:4]
        
        # Load workflow
        workflow_file = "/new_Wan22_flf2v_api.json" if end_image_path_local else "/new_Wan22_api.json"
        prompt = load_workflow(workflow_file)
        
        length = job_input.get("length", 81)
        steps = job_input.get("steps", 10)
        
        # Configure workflow
        prompt["244"]["inputs"]["image"] = image_path
        prompt["541"]["inputs"]["num_frames"] = length
        
        positive_prompt = job_input["prompt"]
        negative_prompt = job_input.get("negative_prompt", "bright tones, overexposed, static, blurred details, subtitles, style, works, paintings, images, static, overall gray, worst quality, low quality, JPEG compression residue, ugly, incomplete, extra fingers, poorly drawn hands, poorly drawn faces, deformed, disfigured, misshapen limbs, fused fingers, still picture, messy background, three legs, many people in the background, walking backwards")
        prompt["135"]["inputs"]["positive_prompt"] = positive_prompt
        prompt["135"]["inputs"]["negative_prompt"] = negative_prompt
        
        seed = job_input["seed"]
        cfg = job_input["cfg"]
        prompt["220"]["inputs"]["seed"] = seed
        prompt["540"]["inputs"]["seed"] = seed
        prompt["540"]["inputs"]["cfg"] = cfg
        
        # Adjust resolution
        original_width = job_input["width"]
        original_height = job_input["height"]
        adjusted_width = to_nearest_multiple_of_16(original_width)
        adjusted_height = to_nearest_multiple_of_16(original_height)
        prompt["235"]["inputs"]["value"] = adjusted_width
        prompt["236"]["inputs"]["value"] = adjusted_height
        prompt["498"]["inputs"]["context_overlap"] = job_input.get("context_overlap", 48)
        
        # Apply step settings
        if "834" in prompt:
            prompt["834"]["inputs"]["steps"] = steps
            lowsteps = int(steps*0.6)
            prompt["829"]["inputs"]["step"] = lowsteps

        # Apply end image
        if end_image_path_local:
            prompt["617"]["inputs"]["image"] = end_image_path_local
        
        # Apply LoRA settings
        if lora_count > 0:
            high_lora_node_id = "279"
            low_lora_node_id = "553"
            
            for i, lora_pair in enumerate(lora_pairs):
                if i < 4:
                    lora_high = lora_pair.get("high")
                    lora_low = lora_pair.get("low")
                    lora_high_weight = lora_pair.get("high_weight", 1.0)
                    lora_low_weight = lora_pair.get("low_weight", 1.0)
                    
                    if lora_high:
                        prompt[high_lora_node_id]["inputs"][f"lora_{i+1}"] = lora_high
                        prompt[high_lora_node_id]["inputs"][f"strength_{i+1}"] = lora_high_weight
                    
                    if lora_low:
                        prompt[low_lora_node_id]["inputs"][f"lora_{i+1}"] = lora_low
                        prompt[low_lora_node_id]["inputs"][f"strength_{i+1}"] = lora_low_weight

        # Connect to WebSocket
        ws_url = f"ws://{server_address}:8188/ws?clientId={client_id}"
        
        # Wait for ComfyUI to be ready
        max_wait_time = 180  # 3 minutes
        start_time = time.time()
        while time.time() - start_time < max_wait_time:
            try:
                urllib.request.urlopen(f"http://{server_address}:8188/", timeout=5)
                logger.info("✅ ComfyUI is ready")
                break
            except Exception as e:
                logger.debug(f"Waiting for ComfyUI... ({int(time.time() - start_time)}s)")
                time.sleep(2)
        else:
            raise Exception("ComfyUI not ready after 3 minutes")
        
        ws = websocket.WebSocket()
        ws.connect(ws_url)
        logger.info("🎬 Generating video...")
        
        videos = get_videos(ws, prompt)
        ws.close()

        # Process results
        for node_id in videos:
            if videos[node_id]:
                video_path = videos[node_id][0]
                video_filename = f"{task_id}_{uuid.uuid4().hex[:8]}.mp4"
                
                cdn_url = upload_to_bunny_storage(video_path, "runpod", video_filename)
                
                logger.info("🎉 JOB COMPLETED SUCCESSFULLY")
                return {
                    "video_url": cdn_url,
                    "task_id": task_id,
                    "filename": video_filename
                }
        
        logger.error("❌ No video found")
        return {"error": "Video not found", "task_id": task_id}
        
    except Exception as e:
        # CRITICAL: Never let exceptions propagate - always return error response
        logger.error("="*60)
        logger.error("❌ JOB FAILED WITH EXCEPTION")
        logger.error("="*60)
        logger.error(f"Error: {str(e)}")
        logger.exception("Full traceback:")
        
        return {
            "error": str(e),
            "error_type": type(e).__name__,
            "task_id": locals().get('task_id', 'unknown')
        }

# CRITICAL FIX: Only call start_worker() once, in the main block
if __name__ == "__main__":
    try:
        logger.info("="*60)
        logger.info("🚀 Starting RunPod Serverless Worker")
        logger.info("="*60)
        logger.info(f"Server address: {server_address}")
        logger.info(f"Client ID: {client_id}")
        
        # Verify ComfyUI (non-blocking check)
        try:
            urllib.request.urlopen(f"http://{server_address}:8188/", timeout=5)
            logger.info("✅ ComfyUI is accessible")
        except Exception as e:
            logger.warning(f"⚠️  ComfyUI check failed (will retry on job): {e}")
        
        logger.info("Starting handler...")
        logger.info("="*60)
        
        # This should block indefinitely
        runpod.serverless.start({"handler": handler})
        
        # If we reach here, something went wrong
        logger.error("⚠️  runpod.serverless.start() returned unexpectedly!")
        logger.error("Worker will exit and container will restart")
        
    except KeyboardInterrupt:
        logger.info("Shutting down gracefully...")
        sys.exit(0)
    except Exception as e:
        logger.error("FATAL ERROR during startup")
        logger.exception(f"Exception: {e}")
        # Sleep before exit to avoid rapid restart loops
        time.sleep(10)
        sys.exit(1)