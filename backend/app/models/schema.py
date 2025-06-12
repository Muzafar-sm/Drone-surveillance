from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

# Video Models
class VideoMetadata(BaseModel):
    id: str
    filename: str
    duration: float
    fps: int
    width: int
    height: int
    size: int
    upload_time: str

class VideoUploadResponse(BaseModel):
    video_id: str
    filename: str
    status: str
    metadata: Dict[str, Any]

# Classification Models
class Classification(BaseModel):
    label: str
    confidence: float
    category: str
    id: Optional[str] = None
    frame_number: Optional[int] = None

# Detection Models
class BoundingBox(BaseModel):
    x: int
    y: int
    width: int
    height: int

class Detection(BaseModel):
    id: str
    label: str
    confidence: float
    bounding_box: BoundingBox
    severity: str
    timestamp: str
    frame_number: Optional[int] = None
    context: Optional[Dict[str, Any]] = None

class DetectionRequest(BaseModel):
    model_name: Optional[str] = None
    confidence_threshold: float = 0.5
    max_detections: int = 100

class DetectionResponse(BaseModel):
    detections: List[Detection]
    model_used: str
    processing_time: float
    video_id: Optional[str] = None
    image_dimensions: Optional[Dict[str, int]] = None
    classifications: Optional[List[Classification]] = None

class ClassificationRequest(BaseModel):
    model_name: Optional[str] = None
    top_k: int = 5

class ClassificationResponse(BaseModel):
    classifications: List[Classification]
    model_used: str
    processing_time: float
    video_id: Optional[str] = None

# Alert Models
class Coordinates(BaseModel):
    lat: float
    lng: float

class Alert(BaseModel):
    id: str
    title: str
    description: str
    timestamp: datetime
    severity: str  # critical, high, medium, low
    confidence: int
    location: str
    status: str  # new, acknowledged, resolved
    type: str
    coordinates: Optional[Coordinates] = None

class AlertCreate(BaseModel):
    title: str
    description: str
    severity: str
    confidence: int
    location: str
    type: str
    coordinates: Optional[Coordinates] = None

class AlertUpdate(BaseModel):
    status: Optional[str] = None
    severity: Optional[str] = None

# Analytics Models
class ProcessingMetrics(BaseModel):
    average_latency: float
    frames_processed: int
    cpu_utilization: int
    gpu_utilization: int
    memory_usage: int

class DetectionStats(BaseModel):
    total_detections: int
    hazards_by_type: Dict[str, int]
    confidence_distribution: Dict[str, int]
    false_positive_rate: float

class SystemPerformance(BaseModel):
    uptime: float
    active_models: List[str]
    queued_tasks: int
    error_rate: float
