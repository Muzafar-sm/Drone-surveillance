from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Optional

from app.api.deps import get_db, get_settings
from app.services.weather import WeatherService
from app.config import Settings

router = APIRouter()

# Initialize weather service
weather_service = WeatherService()

@router.get("/current")
async def get_current_weather(
    lat: float,
    lon: float,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings)
):
    """Get current weather conditions"""
    
    try:
        weather_data = await weather_service.get_current_weather(lat, lon)
        return weather_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Weather data fetch failed: {str(e)}")

@router.get("/forecast")
async def get_weather_forecast(
    lat: float,
    lon: float,
    days: int = 5,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings)
):
    """Get weather forecast"""
    
    try:
        forecast_data = await weather_service.get_forecast(lat, lon, days)
        return forecast_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecast fetch failed: {str(e)}")

@router.get("/fire-data")
async def get_fire_data(
    lat: float,
    lon: float,
    radius: int = 50,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings)
):
    """Get fire/hotspot data from FIRMS"""
    
    try:
        fire_data = await weather_service.get_fire_data(lat, lon, radius)
        return fire_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fire data fetch failed: {str(e)}")

@router.get("/environmental-context")
async def get_environmental_context(
    lat: float,
    lon: float,
    db: Session = Depends(get_db)
):
    """Get comprehensive environmental context for location"""
    
    try:
        # Mock environmental context data
        return {
            "location": {
                "latitude": lat,
                "longitude": lon,
                "elevation": 245,
                "terrain_type": "mixed_forest"
            },
            "weather": {
                "temperature": 24.5,
                "humidity": 65,
                "wind_speed": 12.3,
                "wind_direction": "NW",
                "visibility": 10.0,
                "conditions": "partly_cloudy"
            },
            "fire_risk": {
                "level": "moderate",
                "factors": ["dry_conditions", "moderate_wind"],
                "nearby_fires": 2,
                "fire_weather_index": 15.2
            },
            "air_quality": {
                "aqi": 45,
                "pm25": 12.3,
                "pm10": 18.7,
                "status": "good"
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Environmental context fetch failed: {str(e)}")
