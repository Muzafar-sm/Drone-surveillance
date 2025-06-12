
import asyncio
from typing import List, Dict, Any, Optional
from PIL import Image
import numpy as np
import logging
from transformers import DetrImageProcessor, DetrForObjectDetection
import torch
from datetime import datetime
import cv2

from app.config import settings
from app.models.schema import Detection, BoundingBox

logger = logging.getLogger(__name__)

class ObjectDetectionService:
    def __init__(self):
        self.models = {}
        self.processors = {}
        self.initialized = False
        # Define target classes we want to detect
        self.target_classes = {
            'person': ['person', 'people'],
            'vehicle': ['car', 'truck', 'bus', 'motorcycle', 'bicycle', 'vehicle'],
            'fire': ['fire', 'flame', 'smoke']
        }
        # COCO class names for DETR model
        self.coco_classes = [
            'N/A', 'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus',
            'train', 'truck', 'boat', 'traffic light', 'fire hydrant', 'N/A',
            'stop sign', 'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse',
            'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'N/A', 'backpack',
            'umbrella', 'N/A', 'N/A', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis',
            'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove',
            'skateboard', 'surfboard', 'tennis racket', 'bottle', 'N/A', 'wine glass',
            'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple', 'sandwich',
            'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake',
            'chair', 'couch', 'potted plant', 'bed', 'N/A', 'dining table', 'N/A',
            'N/A', 'toilet', 'N/A', 'tv', 'laptop', 'mouse', 'remote', 'keyboard',
            'cell phone', 'microwave', 'oven', 'toaster', 'sink', 'refrigerator',
            'N/A', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier',
            'toothbrush'
        ]
    
    async def initialize(self):
        """Initialize object detection model (DETR only)"""
        try:
            logger.info("Initializing object detection model (DETR)...")
            # Load DETR model for general detection
            detr_model_name = "facebook/detr-resnet-50"
            self.processors[detr_model_name] = DetrImageProcessor.from_pretrained(detr_model_name)
            self.models[detr_model_name] = DetrForObjectDetection.from_pretrained(detr_model_name)
            logger.info(f"Loaded model: {detr_model_name}")
            self.initialized = True
            logger.info("Object detection service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize object detection service: {e}")
            raise
    
    async def detect(
        self,
        image: Image.Image,
        model_name: str = "facebook/detr-resnet-50",
        confidence_threshold: float = 0.7
    ) -> List[Detection]:
        """Perform object detection on image using only the general model (DETR)"""
        if not self.initialized:
            await self.initialize()
        try:
            logger.info(f"Running detection with model: {model_name}, threshold: {confidence_threshold}")
            # Run general model (DETR)
            general_detections = await self._run_inference(image, "facebook/detr-resnet-50", self.coco_classes, self._map_to_target_class)
            # Filter by confidence
            detections = [
                self._convert_to_detection(det, f"det_{i:03d}")
                for i, det in enumerate(general_detections)
                if det and det["confidence"] >= confidence_threshold
            ]
            detections = [d for d in detections if d is not None]
            logger.info(f"Found {len(detections)} valid detections above threshold")
            for det in detections:
                logger.info(f"Detection: {det.label} ({det.confidence:.2f}) at {det.bounding_box}")
            return detections
        except Exception as e:
            logger.error(f"Object detection failed: {e}")
            raise
    
    async def _run_inference(self, image: Image.Image, model_name: str, class_names: List[str], class_mapper) -> List[Dict[str, Any]]:
        """Run actual model inference"""
        try:
            processor = self.processors[model_name]
            model = self.models[model_name]
            inputs = processor(images=image, return_tensors="pt")
            with torch.no_grad():
                outputs = model(**inputs)
            # Post-process results
            if hasattr(processor, 'post_process_object_detection'):
                target_sizes = torch.tensor([image.size[::-1]])
                results = processor.post_process_object_detection(
                    outputs, target_sizes=target_sizes, threshold=0.3
                )[0]
                detections = []
                for score, label, box in zip(results["scores"], results["labels"], results["boxes"]):
                    class_name = class_names[label.item()] if label.item() < len(class_names) else str(label.item())
                    target_label = class_mapper(class_name)
                    if target_label:
                        detections.append({
                            "label": target_label,
                            "confidence": score.item(),
                            "bbox": box.tolist()
                        })
                return detections
            else:
                logger.warning(f"Processor for {model_name} does not support post_process_object_detection")
                return []
        except Exception as e:
            logger.error(f"Inference failed: {e}")
            return []
    
    def _map_to_target_class(self, detected_class: str) -> Optional[str]:
        detected_class = detected_class.lower()
        for target, aliases in self.target_classes.items():
            if detected_class in aliases:
                return target.capitalize()
        return None
    
    def _convert_to_detection(self, raw_detection: Dict[str, Any], detection_id: str) -> Optional[Detection]:
        try:
            bbox = raw_detection["bbox"]
            label = raw_detection["label"]
            confidence = raw_detection["confidence"]
            if confidence < 0.5:
                return None
            x1, y1, x2, y2 = bbox
            x, y = int(x1), int(y1)
            width, height = int(x2 - x1), int(y2 - y1)
            if width <= 0 or height <= 0:
                return None
            return Detection(
                id=detection_id,
                label=label,
                confidence=confidence,
                bounding_box=BoundingBox(
                    x=x,
                    y=y,
                    width=width,
                    height=height
                ),
                severity=self._determine_severity(label, confidence),
                timestamp=datetime.now().isoformat()
            )
        except Exception as e:
            logger.error(f"Failed to convert detection: {e}")
            return None
    
    def _determine_severity(self, label: str, confidence: float) -> str:
        label_lower = label.lower()
        if label_lower in ['fire', 'flame', 'smoke']:
            return "high"
        elif label_lower in ['person', 'people'] and confidence > 0.8:
            return "medium"
        elif label_lower in ['vehicle', 'car', 'truck', 'bus'] and confidence > 0.8:
            return "medium"
        else:
            return "low"