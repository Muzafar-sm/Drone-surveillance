from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import time

from app.api.deps import get_db, get_settings
from app.models.schema import ClassificationRequest, ClassificationResponse
from app.services.inference.video_classification import VideoClassificationService
from app.config import Settings

router = APIRouter()

# Initialize services
video_classification_service = VideoClassificationService()

@router.post("/video/{video_id}", response_model=ClassificationResponse)
async def classify_video(
    video_id: str,
    request: ClassificationRequest,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings)
):
    """Classify video content"""
    
    try:
        # Get video path
        video_path = os.path.join(settings.UPLOAD_DIR, f"{video_id}.mp4")
        
        if not os.path.exists(video_path):
            for ext in ['.avi', '.mov', '.mkv', '.webm']:
                alt_path = os.path.join(settings.UPLOAD_DIR, f"{video_id}{ext}")
                if os.path.exists(alt_path):
                    video_path = alt_path
                    break
            else:
                raise HTTPException(status_code=404, detail=f"Video file not found: {video_id}")

        # Start timing
        start_time = time.time()

        # Perform classification
        classifications = await video_classification_service.classify_video(
            video_path=video_path,
            model_name=request.model_name or settings.DEFAULT_CLASSIFICATION_MODEL
        )

        # Calculate processing time
        processing_time = time.time() - start_time
        
        return ClassificationResponse(
            video_id=video_id,
            classifications=classifications,
            model_used=request.model_name or settings.DEFAULT_CLASSIFICATION_MODEL,
            processing_time=processing_time
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Classification failed: {str(e)}")

@router.post("/frame", response_model=ClassificationResponse)
async def classify_frame(
    file: UploadFile = File(...),
    model_name: Optional[str] = None,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings)
):
    """Classify single frame/image"""
    
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Start timing
        start_time = time.time()

        # Read image content
        contents = await file.read()
        
        # Save temporarily
        temp_path = f"temp_{file.filename}"
        with open(temp_path, "wb") as f:
            f.write(contents)

        # Perform classification
        classifications = await video_classification_service.classify_video(
            video_path=temp_path,
            model_name=model_name or settings.DEFAULT_CLASSIFICATION_MODEL
        )

        # Clean up
        os.remove(temp_path)

        # Calculate processing time
        processing_time = time.time() - start_time
        
        return ClassificationResponse(
            classifications=classifications,
            model_used=model_name or settings.DEFAULT_CLASSIFICATION_MODEL,
            processing_time=processing_time
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Frame classification failed: {str(e)}")

@router.get("/models")
async def list_classification_models():
    """List available classification models"""
    
    return {
        "models": [
            {
                "name": "MCG-NJU/videomae-base",
                "description": "VideoMAE for video understanding and classification",
                "type": "video_classification",
                "supported_tasks": ["action_recognition", "scene_classification"]
            },
            {
                "name": "openai/clip-vit-base-patch32",
                "description": "CLIP for zero-shot image and video classification",
                "type": "multimodal_classification",
                "supported_tasks": ["zero_shot_classification", "image_text_matching"]
            }
        ]
    }

@router.get("/categories")
async def get_classification_categories():
    """Get available classification categories"""
    
    return {
        "categories": {
            "hazard": ["fire", "smoke", "flood", "structural_damage"],
            "security": ["intrusion", "unauthorized_vehicle", "suspicious_activity"],
            "environment": ["outdoor", "indoor", "urban", "rural"],
            "time": ["daytime", "nighttime", "dawn", "dusk"],
            "weather": ["clear", "cloudy", "rainy", "foggy"]
        }
    }
