from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class VideoMetadata(Base):
    __tablename__ = "video_metadata"
    
    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String, unique=True, index=True)
    filename = Column(String, nullable=False)
    original_filename = Column(String)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer)  # in bytes
    
    # Video properties
    duration = Column(Float)  # in seconds
    fps = Column(Float)
    width = Column(Integer)
    height = Column(Integer)
    codec = Column(String)
    bitrate = Column(Integer)
    
    # Processing status
    status = Column(String, default="uploaded")  # uploaded, processing, processed, failed
    processing_started_at = Column(DateTime, nullable=True)
    processing_completed_at = Column(DateTime, nullable=True)
    processing_error = Column(Text, nullable=True)
    
    # Metadata
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Analysis results
    total_detections = Column(Integer, default=0)
    total_frames_analyzed = Column(Integer, default=0)
    analysis_summary = Column(Text, nullable=True)  # JSON string
    
    # Flags
    is_live_stream = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)
    requires_retention = Column(Boolean, default=True)
