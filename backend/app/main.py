from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import json
import asyncio
from typing import List
import logging

from app.config import settings
from app.core.events import lifespan
from app.api.endpoints import video, detect, classify, weather, alerts
from app.core.logging_config import setup_logging
from app.services.inference.video_classification import VideoClassificationService
from app.services.redis import get_redis_client

logging.basicConfig(
    level=logging.INFO,  # Or DEBUG for more detail
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

# Setup logging
setup_logging()

# Create FastAPI app with lifespan events
app = FastAPI(
    title="SkyGuard AI Surveillance API",
    description="Real-time AI-powered drone surveillance system",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(video.router, prefix="/api/v1/video", tags=["video"])
app.include_router(detect.router, prefix="/api/v1/detect", tags=["detection"])
app.include_router(classify.router, prefix="/api/v1/classify", tags=["classification"])
app.include_router(weather.router, prefix="/api/v1/weather", tags=["weather"])
app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["alerts"])

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                # Remove dead connections
                self.active_connections.remove(connection)

manager = ConnectionManager()

@app.websocket("/ws/live-feed")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Simulate live data streaming
            data = {
                "type": "detection_update",
                "detections": [
                    {
                        "id": "det_001",
                        "label": "Fire",
                        "confidence": 0.94,
                        "boundingBox": {"x": 120, "y": 80, "width": 100, "height": 80},
                        "severity": "high",
                        "timestamp": "2023-06-15T14:32:10Z"
                    }
                ],
                "timestamp": "2023-06-15T14:32:10Z"
            }
            await manager.send_personal_message(json.dumps(data), websocket)
            await asyncio.sleep(2)  # Send updates every 2 seconds
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.websocket("/ws/detections/{video_id}")
async def websocket_detections(websocket: WebSocket, video_id: str):
    await manager.connect(websocket)
    try:
        # Get Redis client
        redis_client = await get_redis_client()
        detection_key = f"video_detections:{video_id}"
        processing_key = f"video_processing:{video_id}"
        
        # Track last frame sent
        last_frame = 0
        last_status_update = 0
        status_update_interval = 10  # Update status every 10 frames
        
        while True:
            # Get processing status
            processing_status = await redis_client.hgetall(processing_key)
            if processing_status:
                status = processing_status.get("status", "unknown")
                current_frame = int(processing_status.get("current_frame", 0))
                
                # Send status updates less frequently
                if current_frame - last_status_update >= status_update_interval:
                    await manager.send_personal_message(
                        json.dumps({
                            "type": "status",
                            "status": status,
                            "current_frame": current_frame,
                            "total_frames": int(processing_status.get("total_frames", 0))
                        }),
                        websocket
                    )
                    last_status_update = current_frame
                
                if status == "completed":
                    # Send completion message
                    await manager.send_personal_message(
                        json.dumps({
                            "type": "status",
                            "status": "completed",
                            "total_frames": processing_status.get("total_frames", 0)
                        }),
                        websocket
                    )
                    break
                elif status == "failed":
                    # Send error message
                    await manager.send_personal_message(
                        json.dumps({
                            "type": "status",
                            "status": "failed",
                            "error": processing_status.get("error", "Unknown error")
                        }),
                        websocket
                    )
                    break
            
            # Get new detections since last frame
            all_detections = await redis_client.hgetall(detection_key)
            if all_detections:
                frame_numbers = [int(k) for k in all_detections.keys()]
                frame_numbers.sort()
                
                # Filter for new frames
                new_frames = [f for f in frame_numbers if f > last_frame]
                
                if new_frames:
                    # Batch process frames for better performance
                    batch_size = 5
                    for i in range(0, len(new_frames), batch_size):
                        batch_frames = new_frames[i:i + batch_size]
                        batch_data = []
                        
                        for frame_num in batch_frames:
                            detection_data = json.loads(all_detections[str(frame_num)])
                            batch_data.append({
                                "type": "detection",
                                "frame_number": frame_num,
                                "data": detection_data
                            })
                        
                        # Send batch of detections
                        await manager.send_personal_message(
                            json.dumps({
                                "type": "batch",
                                "frames": batch_data
                            }),
                            websocket
                        )
                        last_frame = max(batch_frames)
            
            # Reduced sleep time for faster updates
            await asyncio.sleep(0.05)  # Check every 50ms
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await manager.send_personal_message(
            json.dumps({
                "type": "error",
                "error": str(e)
            }),
            websocket
        )
        manager.disconnect(websocket)

@app.get("/")
async def root():
    return {"message": "SkyGuard AI Surveillance API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": "2023-06-15T14:32:10Z"}

# Initialize services
video_classification_service = VideoClassificationService()

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    try:
        logger.info("Initializing services...")
        await video_classification_service.initialize()
        logger.info("Services initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize services: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down services...")
    # Add any cleanup code here if needed

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )
