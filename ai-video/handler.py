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
import glob
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
        # Download file using curl
        result = subprocess.run([
            'curl', '-L', '-o', output_path, '--silent', '--show-error', url
        ], capture_output=True, text=True, timeout=300)
        
        if result.returncode == 0:
            logger.info(f"✅ Successfully downloaded file from URL: {url} -> {output_path}")
            return output_path
        else:
            logger.error(f"❌ curl download failed: {result.stderr}")
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
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    try:
        response = urllib.request.urlopen(req)
        return json.loads(response.read())
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        logger.error(f"ComfyUI HTTP Error {e.code}: {error_body}")
        logger.error(f"Prompt keys: {list(prompt.keys())[:10]}...")  # Log first 10 node IDs
        raise Exception(f"ComfyUI HTTP Error {e.code}: {error_body}")

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

def get_queue_status():
    """Get current queue status from ComfyUI"""
    url = f"http://{server_address}:8188/queue"
    logger.info(f"Getting queue status from: {url}")
    try:
        with urllib.request.urlopen(url) as response:
            return json.loads(response.read())
    except Exception as e:
        logger.error(f"Error getting queue status: {e}")
        return None

def get_videos(ws, prompt):
    logger.info("🎬 Starting get_videos function")
    
    # Verify critical nodes are in the prompt
    critical_nodes = ['131', '612', '540']
    for node_id in critical_nodes:
        if node_id in prompt:
            logger.info(f"✅ Node {node_id} ({prompt[node_id].get('class_type', 'unknown')}) is in workflow")
        else:
            logger.error(f"❌ Node {node_id} is MISSING from workflow!")
    
    prompt_id = queue_prompt(prompt)['prompt_id']
    logger.info(f"📋 Prompt queued with ID: {prompt_id}")
    output_videos = {}
    
    logger.info("⏳ Waiting for workflow execution to complete...")
    execution_complete = False
    wait_count = 0
    max_wait = 600  # 10 minutes max wait
    
    while not execution_complete and wait_count < max_wait:
        try:
            out = ws.recv()
            wait_count += 1
            if isinstance(out, str):
                message = json.loads(out)
                message_type = message.get('type', 'unknown')
                logger.debug(f"📨 Received WebSocket message type: {message_type}")
                
                if message_type == 'executing':
                    data = message.get('data', {})
                    if data:
                        node_info = data.get('node', 'Unknown')
                        prompt_id_in_msg = data.get('prompt_id', '')
                        logger.info(f"🔄 Executing node: {node_info}, prompt_id: {prompt_id_in_msg}")
                        if data.get('node') is None and prompt_id_in_msg == prompt_id:
                            logger.info("✅ Workflow execution completed!")
                            # Wait longer for file system to finish writing (VHS_VideoCombine may need more time)
                            logger.info("⏳ Waiting 5 seconds for file system to finish writing...")
                            time.sleep(5)
                            
                            # Check queue status for any errors
                            queue_status = get_queue_status()
                            if queue_status:
                                logger.info(f"📊 Queue status: {json.dumps(queue_status, indent=2)[:500]}")
                            
                            execution_complete = True
                            break
                        # Track which nodes are executing
                        if isinstance(node_info, (int, str)) and str(node_info) in ['131', '612']:
                            logger.info(f"🎯 CRITICAL: Node {node_info} is executing!")
                    else:
                        logger.warning("⚠️ 'executing' message has no 'data' field")
                elif message_type == 'progress':
                    progress_data = message.get('data', {})
                    logger.info(f"📊 Progress: {progress_data}")
                elif message_type == 'status':
                    status_data = message.get('data', {})
                    logger.info(f"📈 Status: {status_data}")
                else:
                    logger.debug(f"📨 Other message type: {message_type}")
            else:
                logger.debug(f"📦 Received binary message (size: {len(out) if hasattr(out, '__len__') else 'unknown'})")
        except json.JSONDecodeError as e:
            logger.warning(f"⚠️ Failed to parse WebSocket message as JSON: {e}")
            continue
        except Exception as e:
            logger.error(f"❌ Error receiving WebSocket message: {e}")
            logger.exception("Full error traceback:")
            # Don't break on error, continue waiting
            continue
    
    if not execution_complete:
        logger.warning(f"⚠️ Workflow execution did not complete within {max_wait} seconds")
    
    logger.info(f"📖 Retrieving execution history for prompt_id: {prompt_id}")
    history_data = get_history(prompt_id)
    logger.info(f"📚 History data keys: {list(history_data.keys())}")
    
    if prompt_id not in history_data:
        logger.error(f"❌ Prompt ID {prompt_id} not found in history")
        return output_videos
    
    history = history_data[prompt_id]
    logger.info(f"📚 History structure keys: {list(history.keys())}")
    logger.info(f"📚 Output nodes: {list(history.get('outputs', {}).keys())}")
    
    # Check for errors in status
    if 'status' in history:
        status = history['status']
        logger.info(f"📊 Workflow status: {status}")
        if 'messages' in status:
            logger.info(f"📨 Status messages: {status['messages']}")
        if 'completed' in status:
            logger.info(f"✅ Workflow completed: {status['completed']}")
    
    # Log full history structure for debugging (truncated)
    history_str = json.dumps(history, indent=2)
    logger.info(f"📚 Full history structure (first 2000 chars): {history_str[:2000]}")
    
    # Also check if node 131 or 612 have any output data
    if 'outputs' in history:
        for node_id in ['131', '612', '130']:
            if node_id in history['outputs']:
                logger.info(f"🔍 Found output for node {node_id}: {list(history['outputs'][node_id].keys())}")
                logger.info(f"📦 Node {node_id} full output: {json.dumps(history['outputs'][node_id], indent=2)[:1000]}")
            else:
                logger.warning(f"⚠️ Node {node_id} has no output in history")
    
    # Check all nodes in outputs
    for node_id in history.get('outputs', {}):
        logger.info(f"🔍 Processing output node: {node_id}")
        node_output = history['outputs'][node_id]
        videos_output = []
        logger.info(f"📦 Node {node_id} output keys: {list(node_output.keys())}")
        logger.info(f"📦 Node {node_id} full output: {json.dumps(node_output, indent=2)[:500]}")
        
        # Check for 'gifs' key (VideoHelperSuite format)
        if 'gifs' in node_output:
            logger.info(f"🎥 Found {len(node_output['gifs'])} video(s) in node {node_id}")
            for idx, video in enumerate(node_output['gifs']):
                video_path = video.get('fullpath', 'unknown')
                logger.info(f"  Video {idx + 1}: {video_path}")
                videos_output.append(video_path)
        # Check for other video output formats
        elif 'mp4' in node_output:
            logger.info(f"🎥 Found mp4 output in node {node_id}")
            videos_output.append(node_output['mp4'])
        elif 'video' in node_output:
            logger.info(f"🎥 Found video output in node {node_id}")
            videos_output.append(node_output['video'])
        else:
            logger.warning(f"⚠️ No video key found in node {node_id} output. Available keys: {list(node_output.keys())}")
        
        output_videos[node_id] = videos_output
    
    # If no videos found in outputs, check ComfyUI output directory
    if not any(output_videos.values()):
        logger.info("🔍 No videos in history outputs, checking ComfyUI output directory...")
        output_dir = "/ComfyUI/output"
        if os.path.exists(output_dir):
            logger.info(f"📁 Output directory exists: {output_dir}")
            # Look for recently created video files
            try:
                current_time = time.time()
                files = os.listdir(output_dir)
                logger.info(f"📁 All files in output directory: {files}")
                
                # Filter out placeholder files
                actual_files = [f for f in files if not f.startswith('_')]
                logger.info(f"📁 Actual files (excluding placeholders): {actual_files}")
                
                # Check ALL files in the directory, not just .mp4
                all_file_info = []
                for filename in actual_files:
                    filepath = os.path.join(output_dir, filename)
                    if os.path.isfile(filepath):
                        file_mtime = os.path.getmtime(filepath)
                        file_age = current_time - file_mtime
                        file_size = os.path.getsize(filepath)
                        file_ext = os.path.splitext(filename)[1].lower()
                        logger.info(f"  📄 File: {filename}, age: {file_age:.1f} seconds, size: {file_size / (1024*1024):.2f} MB, ext: {file_ext}")
                        all_file_info.append((filename, filepath, file_mtime, file_age, file_size, file_ext))
                
                # Look for video files (.mp4, .mov, .avi, .mkv), prioritizing those with WanVideo prefix
                video_files = []
                for filename, filepath, file_mtime, file_age, file_size, file_ext in all_file_info:
                    if file_ext in ['.mp4', '.mov', '.avi', '.mkv']:
                        logger.info(f"  📹 Found video file: {filename}, age: {file_age:.1f} seconds, size: {file_size / (1024*1024):.2f} MB")
                        # If file was modified in the last 5 minutes, it's likely our video
                        if file_age < 300:
                            # Prioritize files with WanVideo prefix
                            priority = 0 if 'WanVideo' in filename or 'X264' in filename else 1
                            video_files.append((priority, file_mtime, filepath, filename))
                
                # Also check for files matching the WanVideo_X264 pattern (case-insensitive, multiple extensions)
                pattern_files = glob.glob(os.path.join(output_dir, "WanVideo_X264*.mp4"))
                pattern_files.extend(glob.glob(os.path.join(output_dir, "WanVideo_X264*.MP4")))
                pattern_files.extend(glob.glob(os.path.join(output_dir, "WanVideo_X264*.mov")))
                pattern_files.extend(glob.glob(os.path.join(output_dir, "WanVideo_X264*.MOV")))
                logger.info(f"🔍 Files matching WanVideo_X264 pattern: {[os.path.basename(f) for f in pattern_files]}")
                for pattern_file in pattern_files:
                    if pattern_file not in [v[2] for v in video_files]:
                        if os.path.isfile(pattern_file):
                            file_mtime = os.path.getmtime(pattern_file)
                            file_age = current_time - file_mtime
                            file_size = os.path.getsize(pattern_file)
                            logger.info(f"  📹 Pattern match: {os.path.basename(pattern_file)}, age: {file_age:.1f} seconds, size: {file_size / (1024*1024):.2f} MB")
                            if file_age < 300:
                                video_files.append((0, file_mtime, pattern_file, os.path.basename(pattern_file)))
                
                # Also check subdirectories in output folder
                for item in files:
                    item_path = os.path.join(output_dir, item)
                    if os.path.isdir(item_path):
                        logger.info(f"📁 Checking subdirectory: {item}")
                        sub_files = glob.glob(os.path.join(item_path, "*.mp4"))
                        sub_files.extend(glob.glob(os.path.join(item_path, "*.MP4")))
                        sub_files.extend(glob.glob(os.path.join(item_path, "*.mov")))
                        for sub_file in sub_files:
                            if os.path.isfile(sub_file):
                                file_mtime = os.path.getmtime(sub_file)
                                file_age = current_time - file_mtime
                                file_size = os.path.getsize(sub_file)
                                logger.info(f"  📹 Found in subdirectory: {os.path.basename(sub_file)}, age: {file_age:.1f} seconds, size: {file_size / (1024*1024):.2f} MB")
                                if file_age < 300:
                                    priority = 0 if 'WanVideo' in os.path.basename(sub_file) else 1
                                    video_files.append((priority, file_mtime, sub_file, os.path.basename(sub_file)))
                
                # Sort by priority first (WanVideo files first), then by modification time (newest first)
                video_files.sort(key=lambda x: (x[0], -x[1]))
                
                if video_files:
                    # Use the highest priority, most recent video file
                    priority, _, video_path, filename = video_files[0]
                    logger.info(f"🎥 Using video file: {filename} ({video_path}), priority: {priority}")
                    output_videos['output_dir'] = [video_path]
                else:
                    logger.warning("⚠️ No recent .mp4 files found in output directory")
                    
            except Exception as e:
                logger.error(f"❌ Error checking output directory: {e}")
                logger.exception("Full error traceback:")
        else:
            logger.warning(f"⚠️ Output directory does not exist: {output_dir}")
    
    logger.info(f"🎬 get_videos complete. Found videos in {len([v for v in output_videos.values() if v])} node(s)")
    return output_videos

def load_workflow(workflow_path):
    with open(workflow_path, 'r') as file:
        return json.load(file)

def handler(job):
    logger.info("=" * 60)
    logger.info("🚀 Handler started - Processing new job")
    logger.info("=" * 60)
    
    job_input = job.get("input", {})
    logger.info(f"📥 Received job input: {job_input}")
    task_id = f"task_{uuid.uuid4()}"
    logger.info(f"🆔 Generated task ID: {task_id}")

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
    logger.info(f"📄 Using {'FLF2V' if end_image_path_local else 'single'} workflow: {workflow_file}")
    logger.info(f"🎨 LoRA pairs configured: {lora_count}")
    
    logger.info(f"📖 Loading workflow from: {workflow_file}")
    prompt = load_workflow(workflow_file)
    logger.info(f"✅ Workflow loaded. Contains {len(prompt)} nodes")
    
    length = job_input.get("length", 81)
    steps = job_input.get("steps", 10)
    logger.info(f"⚙️ Generation parameters - Length: {length} frames, Steps: {steps}")

    # Validate required nodes exist
    logger.info("🔍 Validating workflow nodes...")
    required_nodes = ["244", "541", "135", "220", "540", "235", "236", "498"]
    missing_nodes = [node for node in required_nodes if node not in prompt]
    if missing_nodes:
        logger.error(f"❌ Missing required workflow nodes: {missing_nodes}")
        raise Exception(f"Workflow is missing required nodes: {missing_nodes}")
    logger.info("✅ All required workflow nodes present")
    
    logger.info("🔧 Configuring workflow parameters...")
    prompt["244"]["inputs"]["image"] = image_path
    logger.info(f"  📷 Image path set to node 244: {image_path}")
    
    prompt["541"]["inputs"]["num_frames"] = length
    logger.info(f"  🎬 Frame count set to node 541: {length}")
    
    prompt["135"]["inputs"]["positive_prompt"] = job_input["prompt"]
    logger.info(f"  ✍️ Positive prompt set to node 135: {job_input['prompt'][:50]}...")
    
    prompt["135"]["inputs"]["negative_prompt"] = job_input.get("negative_prompt", "bright tones, overexposed, static, blurred details, subtitles, style, works, paintings, images, static, overall gray, worst quality, low quality, JPEG compression residue, ugly, incomplete, extra fingers, poorly drawn hands, poorly drawn faces, deformed, disfigured, misshapen limbs, fused fingers, still picture, messy background, three legs, many people in the background, walking backwards")
    logger.info(f"  🚫 Negative prompt set to node 135")
    
    seed = job_input.get("seed", 42)
    prompt["220"]["inputs"]["seed"] = seed
    prompt["540"]["inputs"]["seed"] = seed
    logger.info(f"  🎲 Seed set to nodes 220, 540: {seed}")
    
    cfg = job_input.get("cfg", 2.0)
    prompt["540"]["inputs"]["cfg"] = cfg
    logger.info(f"  ⚙️ CFG scale set to node 540: {cfg}")
    
    # Adjust resolution (width/height) to multiples of 16
    original_width = job_input.get("width", 480)
    original_height = job_input.get("height", 832)
    adjusted_width = to_nearest_multiple_of_16(original_width)
    adjusted_height = to_nearest_multiple_of_16(original_height)
    if adjusted_width != original_width:
        logger.info(f"  📐 Width adjusted to nearest multiple of 16: {original_width} -> {adjusted_width}")
    if adjusted_height != original_height:
        logger.info(f"  📐 Height adjusted to nearest multiple of 16: {original_height} -> {adjusted_height}")
    prompt["235"]["inputs"]["value"] = adjusted_width
    prompt["236"]["inputs"]["value"] = adjusted_height
    logger.info(f"  📐 Resolution set to nodes 235, 236: {adjusted_width}x{adjusted_height}")
    
    context_overlap = job_input.get("context_overlap", 48)
    prompt["498"]["inputs"]["context_overlap"] = context_overlap
    logger.info(f"  🔄 Context overlap set to node 498: {context_overlap}")
    
    # Apply step configuration (optional nodes)
    if "834" in prompt:
        prompt["834"]["inputs"]["steps"] = steps
        logger.info(f"Steps set to: {steps}")
        if "829" in prompt:
            lowsteps = int(steps*0.6)
            prompt["829"]["inputs"]["step"] = lowsteps
            logger.info(f"LowSteps set to: {lowsteps}")

    # Apply end image path to node 617 if present (FLF2V only)
    if end_image_path_local:
        prompt["617"]["inputs"]["image"] = end_image_path_local
    
    # Apply LoRA configuration - HIGH LoRA is node 279, LOW LoRA is node 553
    if lora_count > 0:
        logger.info(f"🎨 Configuring {lora_count} LoRA pair(s)...")
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
                    logger.info(f"  🎨 LoRA {i+1} HIGH applied to node 279: {lora_high} with weight {lora_high_weight}")
                
                # Configure LOW LoRA (node 553, starting from lora_1)
                if lora_low:
                    prompt[low_lora_node_id]["inputs"][f"lora_{i+1}"] = lora_low
                    prompt[low_lora_node_id]["inputs"][f"strength_{i+1}"] = lora_low_weight
                    logger.info(f"  🎨 LoRA {i+1} LOW applied to node 553: {lora_low} with weight {lora_low_weight}")
    else:
        logger.info("ℹ️ No LoRA pairs configured")

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
    logger.info("🎬 Starting video generation process...")
    videos = get_videos(ws, prompt)
    logger.info(f"📹 Videos retrieved: {videos}")
    ws.close()
    logger.info("🔌 WebSocket connection closed")

    # Handle case when video is not found
    logger.info(f"🔍 Processing {len(videos)} output source(s) for videos...")
    video_found = False
    
    for source_id in videos:
        logger.info(f"🔍 Checking source {source_id} for videos...")
        if videos[source_id]:
            video_path = videos[source_id][0]
            logger.info(f"✅ Video found at path: {video_path}")
            
            # Check if file exists
            if os.path.exists(video_path):
                file_size = os.path.getsize(video_path)
                logger.info(f"📊 Video file exists. Size: {file_size / (1024*1024):.2f} MB")
            else:
                logger.error(f"❌ Video file does not exist at path: {video_path}")
                continue
            
            # Generate unique filename
            unique_filename = f"{task_id}.mp4"
            folder = "ai-videos"  # You can change this folder name
            logger.info(f"📤 Preparing to upload video to Bunny CDN: {folder}/{unique_filename}")
            
            # Upload to Bunny CDN
            try:
                logger.info("⬆️ Starting Bunny CDN upload...")
                cdn_url = upload_to_bunny_storage(video_path, folder, unique_filename)
                logger.info(f"✅ Upload successful! CDN URL: {cdn_url}")
                video_found = True
                return {"video_url": cdn_url}
            except Exception as e:
                logger.error(f"❌ Failed to upload video: {str(e)}")
                logger.exception("Full upload error traceback:")
                return {"error": f"Failed to upload video: {str(e)}"}
        else:
            logger.warning(f"⚠️ No videos found in node {node_id}")
    
    if not video_found:
        logger.error("❌ No videos found in any output node")
        logger.error(f"📋 Available nodes: {list(videos.keys())}")
        for node_id, node_videos in videos.items():
            logger.error(f"  Node {node_id}: {node_videos}")
        return {"error": "Video not found."}

runpod.serverless.start({"handler": handler})