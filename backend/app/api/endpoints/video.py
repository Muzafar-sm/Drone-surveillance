from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
import os
import uuid
import cv2
import numpy as np
from io import BytesIO
import asyncio
from datetime import datetime
import json
from PIL import Image
import logging

from app.api.deps import get_db, get_settings
from app.models.schema import VideoUploadResponse, VideoMetadata
from app.utils.video_io import save_video, validate_video
from app.config import Settings
from app.services.inference.object_detection import ObjectDetectionService
from app.models.video_meta import VideoMetadata as VideoMetadataDB
from app.services.redis import get_redis_client

router = APIRouter()
logger = logging.getLogger(__name__)
object_detection_service = ObjectDetectionService()

# Store active processing tasks
active_processing_tasks = {}

async def process_video_detection(video_id: str, file_path: str, db: Session, settings: Settings):
    """Background task to process video detection"""
    try:
        # Update video status to processing
        video_meta = db.query(VideoMetadataDB).filter(VideoMetadataDB.external_id == video_id).first()
        if video_meta:
            video_meta.status = "processing"
            video_meta.processing_started_at = datetime.utcnow()
            db.commit()

        # Initialize Redis client for storing detection results
        redis_client = await get_redis_client()
        
        cap = cv2.VideoCapture(file_path)
        if not cap.isOpened():
            raise Exception("Could not open video file")

        frame_count = 0
        fps = cap.get(cv2.CAP_PROP_FPS)
        # Process every frame for real-time detection
        frame_skip = 1  # Changed from fps/2 to 1 for real-time processing
        
        # Store processing status in Redis
        await redis_client.hset(
            f"video_processing:{video_id}",
            mapping={
                "status": "processing",
                "current_frame": "0",
                "total_frames": str(int(cap.get(cv2.CAP_PROP_FRAME_COUNT))),
                "start_time": datetime.utcnow().isoformat()
            }
        )
        
        # Pre-allocate frame buffer for better performance
        frame_buffer = []
        buffer_size = 5  # Process 5 frames at a time
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_count % frame_skip != 0:
                frame_count += 1
                continue

            # Convert frame to RGB
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pil_image = Image.fromarray(frame_rgb)
            
            # Add frame to buffer
            frame_buffer.append((frame_count, pil_image))
            
            # Process buffer when it's full
            if len(frame_buffer) >= buffer_size:
                # Process frames in parallel
                detection_tasks = []
                for frame_num, img in frame_buffer:
                    detection_tasks.append(
                        object_detection_service.detect(
                            image=img,
                            model_name=settings.DEFAULT_DETECTION_MODEL,
                            confidence_threshold=0.5
                        )
                    )
                
                # Wait for all detections to complete
                detection_results = await asyncio.gather(*detection_tasks)
                
                # Store results
                for (frame_num, _), detections in zip(frame_buffer, detection_results):
                    detection_data = {
                        "frame_number": frame_num,
                        "timestamp": frame_num / fps,
                        "detections": [
                            {
                                "id": f"det_{video_id}_{frame_num}_{i}",
                                "label": d.label,
                                "confidence": d.confidence,
                                "bounding_box": {
                                    "x": d.bounding_box.x,
                                    "y": d.bounding_box.y,
                                    "width": d.bounding_box.width,
                                    "height": d.bounding_box.height
                                }
                            } for i, d in enumerate(detections)
                        ]
                    }
                    
                    # Store in Redis with frame number as key
                    await redis_client.hset(
                        f"video_detections:{video_id}",
                        str(frame_num),
                        json.dumps(detection_data)
                    )
                    
                    # Update processing status
                    await redis_client.hset(
                        f"video_processing:{video_id}",
                        "current_frame",
                        str(frame_num)
                    )
                
                # Clear buffer
                frame_buffer = []
            
            frame_count += 1
            
            # Small delay to prevent overwhelming the system
            await asyncio.sleep(0.01)  # Reduced delay for faster processing

        # Process any remaining frames in buffer
        if frame_buffer:
            detection_tasks = []
            for frame_num, img in frame_buffer:
                detection_tasks.append(
                    object_detection_service.detect(
                        image=img,
                        model_name=settings.DEFAULT_DETECTION_MODEL,
                        confidence_threshold=0.5
                    )
                )
            
            detection_results = await asyncio.gather(*detection_tasks)
            
            for (frame_num, _), detections in zip(frame_buffer, detection_results):
                detection_data = {
                    "frame_number": frame_num,
                    "timestamp": frame_num / fps,
                    "detections": [
                        {
                            "id": f"det_{video_id}_{frame_num}_{i}",
                            "label": d.label,
                            "confidence": d.confidence,
                            "bounding_box": {
                                "x": d.bounding_box.x,
                                "y": d.bounding_box.y,
                                "width": d.bounding_box.width,
                                "height": d.bounding_box.height
                            }
                        } for i, d in enumerate(detections)
                    ]
                }
                
                await redis_client.hset(
                    f"video_detections:{video_id}",
                    str(frame_num),
                    json.dumps(detection_data)
                )

        cap.release()

        # Update video status to processed
        if video_meta:
            video_meta.status = "processed"
            video_meta.processing_completed_at = datetime.utcnow()
            video_meta.total_frames_analyzed = frame_count
            db.commit()
            
        # Update final processing status in Redis
        await redis_client.hset(
            f"video_processing:{video_id}",
            mapping={
                "status": "completed",
                "current_frame": str(frame_count),
                "end_time": datetime.utcnow().isoformat()
            }
        )

    except Exception as e:
        logger.error(f"Error processing video {video_id}: {str(e)}")
        # Update video status to failed
        if video_meta:
            video_meta.status = "failed"
            video_meta.processing_error = str(e)
            db.commit()
            
        # Update processing status in Redis
        await redis_client.hset(
            f"video_processing:{video_id}",
            "status",
            "failed"
        )
        raise

@router.post("/upload", response_model=VideoUploadResponse)
async def upload_video(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    file: UploadFile = File(...)
):
    """Upload video file and trigger automatic detection"""
    
    # Validate file
    if not file.content_type.startswith('video/'):
        raise HTTPException(status_code=400, detail="File must be a video")
    
    # Generate unique filename
    file_id = str(uuid.uuid4())
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"{file_id}{file_extension}"
    
    try:
        # Save file
        file_path = await save_video(file, filename, settings.UPLOAD_DIR)
        
        # Validate video
        is_valid, metadata = validate_video(file_path)
        if not is_valid:
            os.remove(file_path)
            raise HTTPException(status_code=400, detail="Invalid video file")
        
        # Store metadata in database
        video_metadata = VideoMetadataDB(
            external_id=file_id,
            filename=filename,
            original_filename=file.filename,
            file_path=file_path,
            file_size=metadata.get("size", 0),
            duration=metadata.get("duration", 0),
            fps=metadata.get("fps", 0),
            width=metadata.get("width", 0),
            height=metadata.get("height", 0),
            codec=str(metadata.get("codec", "")),
            status="uploaded"
        )
        db.add(video_metadata)
        db.commit()
        
        # Create and store the background task
        task = asyncio.create_task(
            process_video_detection(file_id, file_path, db, settings)
        )
        active_processing_tasks[file_id] = task
        
        return VideoUploadResponse(
            video_id=file_id,
            filename=file.filename,
            status="uploaded",
            metadata={
                "id": file_id,
                "filename": file.filename,
                "file_path": file_path,
                "duration": metadata.get("duration", 0),
                "fps": metadata.get("fps", 0),
                "width": metadata.get("width", 0),
                "height": metadata.get("height", 0),
                "size": metadata.get("size", 0)
            }
        )
        
    except Exception as e:
        logger.error(f"Upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("/processing-status/{video_id}")
async def get_processing_status(video_id: str):
    """Get the current processing status of a video"""
    try:
        redis_client = await get_redis_client()
        status = await redis_client.hgetall(f"video_processing:{video_id}")
        
        if not status:
            return {"status": "not_found"}
            
        return {
            "video_id": video_id,
            "status": status.get("status", "unknown"),
            "current_frame": int(status.get("current_frame", 0)),
            "total_frames": int(status.get("total_frames", 0)),
            "start_time": status.get("start_time"),
            "end_time": status.get("end_time")
        }
    except Exception as e:
        logger.error(f"Error getting processing status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stream/{video_id}")
async def stream_video(video_id: str, db: Session = Depends(get_db)):
    """Stream video file"""
    
    # In a real implementation, you'd fetch the file path from database
    file_path = f"uploads/{video_id}.mp4"
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Video not found")
    
    def generate():
        with open(file_path, "rb") as video_file:
            while True:
                chunk = video_file.read(8192)
                if not chunk:
                    break
                yield chunk
    
    return StreamingResponse(
        generate(),
        media_type="video/mp4",
        headers={"Content-Disposition": f"inline; filename={video_id}.mp4"}
    )

@router.get("/metadata/{video_id}", response_model=VideoMetadata)
async def get_video_metadata(video_id: str, db: Session = Depends(get_db)):
    """Get video metadata"""
    
    # Mock metadata - in real implementation, fetch from database
    return VideoMetadata(
        id=video_id,
        filename=f"{video_id}.mp4",
        duration=120.5,
        fps=30,
        width=1920,
        height=1080,
        size=50000000,
        upload_time="2023-06-15T14:32:10Z"
    )

@router.delete("/delete/{video_id}")
async def delete_video(video_id: str, db: Session = Depends(get_db)):
    """Delete video file"""
    
    file_path = f"uploads/{video_id}.mp4"
    
    if os.path.exists(file_path):
        os.remove(file_path)
        return {"message": "Video deleted successfully"}
    else:
        raise HTTPException(status_code=404, detail="Video not found")

@router.get("/list")
async def list_videos(db: Session = Depends(get_db)):
    """List all uploaded videos"""
    
    # Mock data - in real implementation, fetch from database
    return {
        "videos": [
            {
                "id": "video_001",
                "filename": "drone_footage_1.mp4",
                "upload_time": "2023-06-15T14:32:10Z",
                "duration": 120.5,
                "status": "processed"
            },
            {
                "id": "video_002",
                "filename": "surveillance_feed.mp4",
                "upload_time": "2023-06-15T15:45:20Z",
                "duration": 300.0,
                "status": "processing"
            }
        ]
    }
