import cv2
import numpy as np
from typing import List, Generator, Optional
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class FrameExtractor:
    def __init__(self, video_path: str):
        self.video_path = video_path
        self.cap = None
        self.total_frames = 0
        self.fps = 0
        self.duration = 0
    
    def __enter__(self):
        self.cap = cv2.VideoCapture(self.video_path)
        if not self.cap.isOpened():
            raise ValueError(f"Could not open video file: {self.video_path}")
        
        self.total_frames = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
        self.fps = self.cap.get(cv2.CAP_PROP_FPS)
        self.duration = self.total_frames / self.fps if self.fps > 0 else 0
        
        logger.info(f"Video loaded: {self.total_frames} frames, {self.fps} FPS, {self.duration:.2f}s")
        
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.cap:
            self.cap.release()
    
    def extract_frames(
        self,
        interval: int = 1,
        max_frames: Optional[int] = None
    ) -> Generator[np.ndarray, None, None]:
        """Extract frames at specified interval"""
        
        frame_count = 0
        extracted_count = 0
        
        while True:
            ret, frame = self.cap.read()
            if not ret:
                break
            
            if frame_count % interval == 0:
                yield cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                extracted_count += 1
                
                if max_frames and extracted_count >= max_frames:
                    break
            
            frame_count += 1
        
        logger.info(f"Extracted {extracted_count} frames from {frame_count} total frames")
    
    def extract_frame_at_time(self, timestamp: float) -> Optional[np.ndarray]:
        """Extract frame at specific timestamp (in seconds)"""
        
        if timestamp > self.duration:
            logger.warning(f"Timestamp {timestamp}s exceeds video duration {self.duration}s")
            return None
        
        frame_number = int(timestamp * self.fps)
        self.cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
        
        ret, frame = self.cap.read()
        if ret:
            return cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        return None
    
    def extract_keyframes(self, threshold: float = 0.3) -> List[np.ndarray]:
        """Extract keyframes based on scene changes"""
        
        keyframes = []
        prev_frame = None
        
        for frame in self.extract_frames(interval=1):
            if prev_frame is not None:
                # Calculate frame difference
                diff = cv2.absdiff(
                    cv2.cvtColor(prev_frame, cv2.COLOR_RGB2GRAY),
                    cv2.cvtColor(frame, cv2.COLOR_RGB2GRAY)
                )
                
                # Calculate mean difference
                mean_diff = np.mean(diff) / 255.0
                
                if mean_diff > threshold:
                    keyframes.append(frame)
            else:
                # Always include first frame
                keyframes.append(frame)
            
            prev_frame = frame
        
        logger.info(f"Extracted {len(keyframes)} keyframes")
        return keyframes
    
    def get_video_info(self) -> dict:
        """Get video metadata"""
        
        return {
            "total_frames": self.total_frames,
            "fps": self.fps,
            "duration": self.duration,
            "width": int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
            "height": int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
            "codec": int(self.cap.get(cv2.CAP_PROP_FOURCC))
        }

def extract_frames_from_video(
    video_path: str,
    output_dir: str,
    interval: int = 30,
    max_frames: Optional[int] = None
) -> List[str]:
    """Extract frames from video and save as images"""
    
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    saved_frames = []
    
    with FrameExtractor(video_path) as extractor:
        for i, frame in enumerate(extractor.extract_frames(interval, max_frames)):
            frame_filename = output_path / f"frame_{i:06d}.jpg"
            
            # Convert RGB to BGR for OpenCV
            bgr_frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
            cv2.imwrite(str(frame_filename), bgr_frame)
            
            saved_frames.append(str(frame_filename))
    
    logger.info(f"Saved {len(saved_frames)} frames to {output_dir}")
    return saved_frames
