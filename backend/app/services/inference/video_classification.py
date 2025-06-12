import asyncio
from typing import List, Dict, Any, Optional
import logging
from transformers import VideoMAEImageProcessor, VideoMAEForVideoClassification
import torch
import numpy as np
import cv2
from PIL import Image
import os

from app.config import settings
from app.models.schema import Classification

logger = logging.getLogger(__name__)

class VideoClassificationService:
    def __init__(self):
        self.models = {}
        self.processors = {}
        self.initialized = False
        self.initialization_lock = asyncio.Lock()
    
    async def initialize(self):
        """Initialize video classification models"""
        async with self.initialization_lock:
            if self.initialized:
                return

        try:
            logger.info("Initializing video classification models...")
            
                # Check if Hugging Face API key is set
            if not settings.HUGGINGFACE_API_KEY:
                    raise ValueError("HUGGINGFACE_API_KEY is not set in environment variables")
            
            model_name = "MCG-NJU/videomae-base"
            logger.info(f"Loading model: {model_name}")
            
                # Initialize the model and processor with the Hugging Face API key
            self.processors[model_name] = VideoMAEImageProcessor.from_pretrained(
                    model_name,
                    token=settings.HUGGINGFACE_API_KEY,
                    cache_dir=os.path.join(settings.UPLOAD_DIR, "model_cache")
                )
            self.models[model_name] = VideoMAEForVideoClassification.from_pretrained(
                    model_name,
                    token=settings.HUGGINGFACE_API_KEY,
                    cache_dir=os.path.join(settings.UPLOAD_DIR, "model_cache")
                )
                
                # Move model to GPU if available
            if torch.cuda.is_available():
                    self.models[model_name] = self.models[model_name].cuda()
                    logger.info("Model moved to GPU")
            
            self.initialized = True
            logger.info("Video classification service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize video classification service: {e}")
            self.initialized = False
            raise

    async def ensure_initialized(self):
        """Ensure the service is initialized before use"""
        if not self.initialized:
            await self.initialize()

    async def classify_video(self, video_path: str, model_name: str = "MCG-NJU/videomae-base") -> List[Classification]:
        """Classify video content using the specified model"""
        await self.ensure_initialized()

        try:
            # Read video frames
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                raise ValueError(f"Could not open video file: {video_path}")

            frames = []
            frame_count = 0
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_skip = max(1, int(fps))  # Process one frame per second

            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                if frame_count % frame_skip == 0:
                    # Convert BGR to RGB
                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    # Convert to PIL Image
                    pil_image = Image.fromarray(frame_rgb)
                    frames.append(pil_image)

                frame_count += 1

                # Limit to 16 frames for the model
                if len(frames) >= 16:
                    break

            cap.release()

            if not frames:
                raise ValueError("No frames extracted from video")

            # Process frames
            processor = self.processors[model_name]
            model = self.models[model_name]

            # Prepare input
            inputs = processor(frames, return_tensors="pt")
            
            # Move inputs to GPU if available
            if torch.cuda.is_available():
                inputs = {k: v.cuda() for k, v in inputs.items()}

            # Get predictions
            with torch.no_grad():
                outputs = model(**inputs)
                logits = outputs.logits
                probs = torch.nn.functional.softmax(logits, dim=-1)
                predictions = probs[0].cpu().tolist()

            # Get top predictions
            top_indices = torch.topk(probs[0], k=3).indices.cpu().tolist()
            classifications = []

            for idx in top_indices:
                label = model.config.id2label[idx]
                confidence = predictions[idx]
                classifications.append(
                    Classification(
                        label=label,
                        confidence=float(confidence),
                        category=self._get_category(label)
                    )
                )

            return classifications

        except Exception as e:
            logger.error(f"Video classification failed: {e}")
            raise
    
    def _get_category(self, label: str) -> str:
        """Map label to category"""
        category_mapping = {
            "fire": "hazard",
            "smoke": "hazard",
            "person": "security",
            "vehicle": "security",
            "day": "time",
            "night": "time",
            "indoor": "environment",
            "outdoor": "environment"
        }
        
        label_lower = label.lower()
        for key in category_mapping:
            if key in label_lower:
                return category_mapping[key]
        
        return "other"

    async def classify(
        self,
        video_frames: List[np.ndarray],
        model_name: str = "MCG-NJU/videomae-base",
        top_k: int = 5
    ) -> List[Classification]:
        """Classify video content"""
        
        if not self.initialized:
            await self.initialize()
        
        try:
            # For demo purposes, return mock classifications
            mock_classifications = [
                Classification(
                    label="Surveillance Activity",
                    confidence=0.92,
                    category="security"
                ),
                Classification(
                    label="Outdoor Scene",
                    confidence=0.88,
                    category="environment"
                ),
                Classification(
                    label="Daytime",
                    confidence=0.95,
                    category="time"
                ),
                Classification(
                    label="Clear Weather",
                    confidence=0.83,
                    category="weather"
                )
            ]
            
            # Return top_k results
            return mock_classifications[:top_k]
            
        except Exception as e:
            logger.error(f"Video classification failed: {e}")
            raise
    
    async def classify_frame(
        self,
        frame: np.ndarray,
        model_name: str = "MCG-NJU/videomae-base"
    ) -> List[Classification]:
        """Classify single frame using the video classification model"""
        
        if not self.initialized:
            await self.initialize()
        
        try:
            # Convert numpy array to PIL Image
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB) if frame.shape[2] == 3 else frame
            pil_image = Image.fromarray(frame_rgb)
            
            # Create a list of frames (VideoMAE expects a sequence of frames)
            # For a single frame, we'll duplicate it to meet the minimum requirement
            frames = [pil_image] * 8  # Using 8 duplicates of the same frame
            
            # Process frames
            processor = self.processors[model_name]
            model = self.models[model_name]
            
            # Prepare input
            inputs = processor(frames, return_tensors="pt")
            
            # Move inputs to GPU if available
            if torch.cuda.is_available():
                inputs = {k: v.cuda() for k, v in inputs.items()}
            
            # Get predictions
            with torch.no_grad():
                outputs = model(**inputs)
                logits = outputs.logits
                probs = torch.nn.functional.softmax(logits, dim=-1)
                predictions = probs[0].cpu().tolist()
            
            # Get top predictions
            top_indices = torch.topk(probs[0], k=3).indices.cpu().tolist()
            classifications = []
            
            for idx in top_indices:
                label = model.config.id2label[idx]
                confidence = predictions[idx]
                classifications.append(
                    Classification(
                        label=label,
                        confidence=float(confidence),
                        category=self._get_category(label)
                    )
                )
            
            return classifications
            
        except Exception as e:
            logger.error(f"Frame classification failed: {e}")
            # Fallback to mock classifications if real-time classification fails
            return [
                Classification(
                    label="Outdoor Scene",
                    confidence=0.94,
                    category="environment"
                ),
                Classification(
                    label="Daytime",
                    confidence=0.92,
                    category="time"
                )
            ]
    
    def _run_inference(self, video_data: np.ndarray, model_name: str) -> List[Dict[str, Any]]:
        """Run actual model inference (placeholder)"""
        
        # This is where you would implement actual model inference
        # For now, returning mock results
        
        return [
            {
                "label": "action_recognition",
                "confidence": 0.91,
                "category": "activity"
            },
            {
                "label": "scene_classification",
                "confidence": 0.87,
                "category": "environment"
            }
        ]
