import logging
import sys
from typing import Dict, Any

def setup_logging(log_level: str = "INFO") -> None:
    """Setup application logging configuration"""
    
    # Create formatter
    formatter = logging.Formatter(
        fmt="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    
    # Setup root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper()))
    
    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)
    
    # Set specific logger levels
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    logging.getLogger("fastapi").setLevel(logging.INFO)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    
    # Application loggers
    logging.getLogger("app").setLevel(logging.INFO)
    logging.getLogger("app.services").setLevel(logging.INFO)
    logging.getLogger("app.api").setLevel(logging.INFO)

def get_logger(name: str) -> logging.Logger:
    """Get logger instance for module"""
    return logging.getLogger(name)
