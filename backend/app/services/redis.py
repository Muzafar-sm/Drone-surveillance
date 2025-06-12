import redis.asyncio as redis
from app.config import Settings
from fastapi import Depends
from app.api.deps import get_settings

_redis_client = None

async def get_redis_client(settings: Settings = Depends(get_settings)):
    """
    Get or create a Redis client instance.
    
    Args:
        settings: Application settings
        
    Returns:
        Redis client instance
    """
    global _redis_client
    
    if _redis_client is None:
        _redis_client = redis.Redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
    
    return _redis_client