# Inference services package

from .object_detection import ObjectDetectionService
from .video_classification import VideoClassificationService
from .depth_estimation import DepthEstimationService
from .clip_zero_shot import CLIPZeroShotService

__all__ = [
    "ObjectDetectionService",
    "VideoClassificationService",
    "DepthEstimationService",
    "CLIPZeroShotService"
]
