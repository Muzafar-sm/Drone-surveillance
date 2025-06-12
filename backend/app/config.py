from pydantic_settings import BaseSettings
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # API Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost/skyguard"
    
    # Redis for Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Hugging Face API
    HUGGINGFACE_API_KEY: Optional[str] = None
    
    # OpenWeather API
    OPENWEATHER_API_KEY: Optional[str] = None
    
    # FIRMS API (NASA Fire Information)
    FIRMS_API_KEY: Optional[str] = None
    
    # File Storage
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 100 * 1024 * 1024  # 100MB
    
    # AI Model Settings
    DEFAULT_DETECTION_MODEL: str = "facebook/detr-resnet-50"
    DEFAULT_CLASSIFICATION_MODEL: str = "MCG-NJU/videomae-base"
    DEFAULT_DEPTH_MODEL: str = "damo/cv_resnet_depth-estimation"
    
    # Processing Settings
    MAX_CONCURRENT_TASKS: int = 10
    FRAME_EXTRACTION_INTERVAL: int = 1  # seconds
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
