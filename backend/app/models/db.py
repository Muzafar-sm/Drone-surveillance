from sqlalchemy import Column, String, Float, DateTime, Integer
from app.database.base_class import Base
from datetime import datetime

class Detection(Base):
    __tablename__ = "detections"

    id = Column(String, primary_key=True, index=True)
    label = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    location = Column(String, default="Unknown")
    severity = Column(String, default="medium")
    status = Column(String, default="active")
    video_id = Column(String, nullable=True)
    frame_number = Column(Integer, nullable=True)
