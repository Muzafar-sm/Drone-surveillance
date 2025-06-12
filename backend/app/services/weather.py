import asyncio
import aiohttp
from typing import Dict, Any, List, Optional
import logging

from app.config import settings

logger = logging.getLogger(__name__)

class WeatherService:
    def __init__(self):
        self.openweather_api_key = settings.OPENWEATHER_API_KEY
        self.firms_api_key = settings.FIRMS_API_KEY
        self.base_url = "https://api.openweathermap.org/data/2.5"
        self.firms_url = "https://firms.modaps.eosdis.nasa.gov/api"
    
    async def get_current_weather(self, lat: float, lon: float) -> Dict[str, Any]:
        """Get current weather conditions"""
        
        try:
            # Mock weather data for demo
            return {
                "location": {
                    "latitude": lat,
                    "longitude": lon
                },
                "current": {
                    "temperature": 24.5,
                    "humidity": 65,
                    "pressure": 1013.2,
                    "wind_speed": 12.3,
                    "wind_direction": 315,
                    "wind_direction_text": "NW",
                    "visibility": 10.0,
                    "conditions": "partly_cloudy",
                    "description": "Partly cloudy with light winds",
                    "uv_index": 6,
                    "cloud_cover": 40
                },
                "timestamp": "2023-06-15T14:32:10Z"
            }
            
        except Exception as e:
            logger.error(f"Failed to fetch weather data: {e}")
            raise
    
    async def get_forecast(self, lat: float, lon: float, days: int = 5) -> Dict[str, Any]:
        """Get weather forecast"""
        
        try:
            # Mock forecast data
            forecast_days = []
            
            for i in range(days):
                forecast_days.append({
                    "date": f"2023-06-{16 + i}",
                    "temperature_max": 26 + i,
                    "temperature_min": 18 + i,
                    "humidity": 60 + (i * 2),
                    "wind_speed": 10 + i,
                    "conditions": "partly_cloudy" if i % 2 == 0 else "sunny",
                    "precipitation_probability": 20 + (i * 10)
                })
            
            return {
                "location": {
                    "latitude": lat,
                    "longitude": lon
                },
                "forecast": forecast_days,
                "timestamp": "2023-06-15T14:32:10Z"
            }
            
        except Exception as e:
            logger.error(f"Failed to fetch forecast data: {e}")
            raise
    
    async def get_fire_data(self, lat: float, lon: float, radius: int = 50) -> Dict[str, Any]:
        """Get fire/hotspot data from FIRMS"""
        
        try:
            # Mock fire data
            return {
                "location": {
                    "latitude": lat,
                    "longitude": lon,
                    "radius_km": radius
                },
                "fires": [
                    {
                        "id": "fire_001",
                        "latitude": lat + 0.01,
                        "longitude": lon + 0.01,
                        "confidence": 85,
                        "brightness": 320.5,
                        "scan_date": "2023-06-15",
                        "scan_time": "14:30",
                        "satellite": "MODIS",
                        "distance_km": 1.2
                    },
                    {
                        "id": "fire_002",
                        "latitude": lat - 0.02,
                        "longitude": lon + 0.03,
                        "confidence": 92,
                        "brightness": 345.8,
                        "scan_date": "2023-06-15",
                        "scan_time": "13:45",
                        "satellite": "VIIRS",
                        "distance_km": 3.7
                    }
                ],
                "fire_weather_index": 15.2,
                "fire_danger_rating": "moderate",
                "timestamp": "2023-06-15T14:32:10Z"
            }
            
        except Exception as e:
            logger.error(f"Failed to fetch fire data: {e}")
            raise
    
    async def _make_request(self, url: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Make HTTP request to external API"""
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise Exception(f"API request failed with status {response.status}")
