from contextlib import asynccontextmanager
from fastapi import FastAPI
import logging
from app.config import settings
from app.services.inference.object_detection import ObjectDetectionService
from app.services.inference.video_classification import VideoClassificationService

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown events"""
    
    # Startup
    logger.info("Starting SkyGuard AI Surveillance API...")
    
    try:
        # Initialize AI models
        logger.info("Loading AI models...")
        
        # Initialize object detection service
        object_detection_service = ObjectDetectionService()
        await object_detection_service.initialize()
        
        # Initialize video classification service
        video_classification_service = VideoClassificationService()
        await video_classification_service.initialize()
        
        # Create upload directory
        import os
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        
        logger.info("AI models loaded successfully")
        logger.info(f"Upload directory created: {settings.UPLOAD_DIR}")
        logger.info("SkyGuard API startup complete")
        
    except Exception as e:
        logger.error(f"Failed to initialize services: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down SkyGuard AI Surveillance API...")
    
    try:
        # Cleanup resources
        logger.info("Cleaning up resources...")
        
        # Here you would cleanup model resources, close connections, etc.
        
        logger.info("Shutdown complete")
        
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")
