import os
import shutil
from pathlib import Path
from typing import Dict, Any, Tuple
import cv2
from fastapi import UploadFile
import logging

logger = logging.getLogger(__name__)

async def save_video(file: UploadFile, filename: str, upload_dir: str) -> str:
    """Save uploaded video file"""
    
    # Create upload directory if it doesn't exist
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = os.path.join(upload_dir, filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"Video saved to: {file_path}")
        return file_path
        
    except Exception as e:
        logger.error(f"Failed to save video: {e}")
        raise

def validate_video(file_path: str) -> Tuple[bool, Dict[str, Any]]:
    """Validate video file and extract metadata"""
    
    try:
        cap = cv2.VideoCapture(file_path)
        
        if not cap.isOpened():
            return False, {}
        
        # Extract metadata
        metadata = {
            "width": int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
            "height": int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
            "fps": cap.get(cv2.CAP_PROP_FPS),
            "frame_count": int(cap.get(cv2.CAP_PROP_FRAME_COUNT)),
            "codec": int(cap.get(cv2.CAP_PROP_FOURCC)),
            "size": os.path.getsize(file_path)
        }
        
        # Calculate duration
        if metadata["fps"] > 0:
            metadata["duration"] = metadata["frame_count"] / metadata["fps"]
        else:
            metadata["duration"] = 0
        
        cap.release()
        
        # Basic validation
        if metadata["width"] <= 0 or metadata["height"] <= 0:
            return False, metadata
        
        if metadata["frame_count"] <= 0:
            return False, metadata
        
        logger.info(f"Video validation successful: {metadata}")
        return True, metadata
        
    except Exception as e:
        logger.error(f"Video validation failed: {e}")
        return False, {}

def get_video_thumbnail(video_path: str, timestamp: float = 1.0) -> str:
    """Generate thumbnail from video at specified timestamp"""
    
    try:
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            raise ValueError("Could not open video file")
        
        # Set position to timestamp
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_number = int(timestamp * fps)
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
        
        ret, frame = cap.read()
        if not ret:
            raise ValueError("Could not read frame at timestamp")
        
        # Save thumbnail
        thumbnail_path = video_path.replace('.mp4', '_thumbnail.jpg')
        cv2.imwrite(thumbnail_path, frame)
        
        cap.release()
        
        logger.info(f"Thumbnail generated: {thumbnail_path}")
        return thumbnail_path
        
    except Exception as e:
        logger.error(f"Thumbnail generation failed: {e}")
        raise

def compress_video(
    input_path: str,
    output_path: str,
    quality: str = "medium"
) -> bool:
    """Compress video file"""
    
    quality_settings = {
        "low": "-crf 28",
        "medium": "-crf 23",
        "high": "-crf 18"
    }
    
    crf = quality_settings.get(quality, quality_settings["medium"])
    
    try:
        # This would use ffmpeg in a real implementation
        # For now, just copy the file
        shutil.copy2(input_path, output_path)
        
        logger.info(f"Video compressed: {input_path} -> {output_path}")
        return True
        
    except Exception as e:
        logger.error(f"Video compression failed: {e}")
        return False

def cleanup_old_videos(upload_dir: str, max_age_days: int = 7) -> int:
    """Clean up old video files"""
    
    import time
    
    current_time = time.time()
    max_age_seconds = max_age_days * 24 * 60 * 60
    
    deleted_count = 0
    
    try:
        for filename in os.listdir(upload_dir):
            file_path = os.path.join(upload_dir, filename)
            
            if os.path.isfile(file_path):
                file_age = current_time - os.path.getmtime(file_path)
                
                if file_age > max_age_seconds:
                    os.remove(file_path)
                    deleted_count += 1
                    logger.info(f"Deleted old video: {filename}")
        
        logger.info(f"Cleanup completed: {deleted_count} files deleted")
        return deleted_count
        
    except Exception as e:
        logger.error(f"Cleanup failed: {e}")
        return 0
