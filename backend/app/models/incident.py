from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Incident(Base):
    __tablename__ = "incidents"
    
    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String, unique=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    incident_type = Column(String, nullable=False)  # fire, intrusion, crowd, etc.
    severity = Column(String, nullable=False)  # critical, high, medium, low
    confidence = Column(Float, nullable=False)
    location = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    status = Column(String, default="new")  # new, acknowledged, resolved
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    
    # Detection metadata
    model_used = Column(String)
    frame_number = Column(Integer, nullable=True)
    video_id = Column(String, nullable=True)
    bounding_box_x = Column(Integer, nullable=True)
    bounding_box_y = Column(Integer, nullable=True)
    bounding_box_width = Column(Integer, nullable=True)
    bounding_box_height = Column(Integer, nullable=True)
    
    # Additional flags
    is_false_positive = Column(Boolean, default=False)
    requires_human_review = Column(Boolean, default=False)
