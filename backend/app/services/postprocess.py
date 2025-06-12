from typing import List, Dict, Any, Optional
import numpy as np
from app.models.schema import Detection
import logging

logger = logging.getLogger(__name__)

class PostProcessingService:
    def __init__(self):
        self.confidence_threshold = 0.5
        self.nms_threshold = 0.4
    
    def filter_detections(
        self,
        detections: List[Detection],
        confidence_threshold: Optional[float] = None
    ) -> List[Detection]:
        """Filter detections by confidence threshold"""
        
        threshold = confidence_threshold or self.confidence_threshold
        
        filtered = [
            detection for detection in detections
            if detection.confidence >= threshold
        ]
        
        logger.info(f"Filtered {len(detections)} detections to {len(filtered)} above threshold {threshold}")
        
        return filtered
    
    def apply_non_max_suppression(
        self,
        detections: List[Detection],
        iou_threshold: Optional[float] = None
    ) -> List[Detection]:
        """Apply Non-Maximum Suppression to remove overlapping detections"""
        
        if len(detections) <= 1:
            return detections
        
        threshold = iou_threshold or self.nms_threshold
        
        # Group detections by class to apply NMS per class
        by_class = {}
        for detection in detections:
            if detection.label not in by_class:
                by_class[detection.label] = []
            by_class[detection.label].append(detection)
        
        # Apply NMS per class
        final_detections = []
        
        for class_name, class_detections in by_class.items():
            # Sort by confidence (highest first)
            sorted_detections = sorted(class_detections, key=lambda x: x.confidence, reverse=True)
            
            # Apply NMS within this class
            keep = []
            
            while sorted_detections:
                # Take the detection with highest confidence
                current = sorted_detections.pop(0)
                keep.append(current)
                
                # Remove detections with high IoU with current detection
                remaining = []
                for detection in sorted_detections:
                    iou = self._calculate_iou(current, detection)
                    if iou < threshold:
                        remaining.append(detection)
                
                sorted_detections = remaining
            
            final_detections.extend(keep)
        
        logger.info(f"NMS reduced {len(detections)} detections to {len(final_detections)}")
        
        return final_detections
    
    def aggregate_detections(
        self,
        detections: List[Detection],
        time_window: int = 5
    ) -> Dict[str, Any]:
        """Aggregate detections over time window"""
        
        # Group by detection type
        by_type = {}
        for detection in detections:
            if detection.label not in by_type:
                by_type[detection.label] = []
            by_type[detection.label].append(detection)
        
        # Calculate statistics
        aggregated = {
            "total_detections": len(detections),
            "by_type": {},
            "confidence_stats": self._calculate_confidence_stats(detections),
            "severity_distribution": self._calculate_severity_distribution(detections)
        }
        
        for label, label_detections in by_type.items():
            aggregated["by_type"][label] = {
                "count": len(label_detections),
                "avg_confidence": np.mean([d.confidence for d in label_detections]),
                "max_confidence": max([d.confidence for d in label_detections]),
                "min_confidence": min([d.confidence for d in label_detections])
            }
        
        return aggregated
    
    def _calculate_iou(self, det1: Detection, det2: Detection) -> float:
        """Calculate Intersection over Union (IoU) between two detections"""
        
        box1 = det1.bounding_box
        box2 = det2.bounding_box
        
        # Calculate intersection
        x1 = max(box1.x, box2.x)
        y1 = max(box1.y, box2.y)
        x2 = min(box1.x + box1.width, box2.x + box2.width)
        y2 = min(box1.y + box1.height, box2.y + box2.height)
        
        if x2 <= x1 or y2 <= y1:
            return 0.0
        
        intersection = (x2 - x1) * (y2 - y1)
        
        # Calculate union
        area1 = box1.width * box1.height
        area2 = box2.width * box2.height
        union = area1 + area2 - intersection
        
        return intersection / union if union > 0 else 0.0
    
    def _calculate_confidence_stats(self, detections: List[Detection]) -> Dict[str, float]:
        """Calculate confidence statistics"""
        
        if not detections:
            return {"mean": 0.0, "std": 0.0, "min": 0.0, "max": 0.0}
        
        confidences = [d.confidence for d in detections]
        
        return {
            "mean": float(np.mean(confidences)),
            "std": float(np.std(confidences)),
            "min": float(np.min(confidences)),
            "max": float(np.max(confidences))
        }
    
    def _calculate_severity_distribution(self, detections: List[Detection]) -> Dict[str, int]:
        """Calculate severity distribution"""
        
        distribution = {"low": 0, "medium": 0, "high": 0, "critical": 0}
        
        for detection in detections:
            if detection.severity in distribution:
                distribution[detection.severity] += 1
        
        return distribution
