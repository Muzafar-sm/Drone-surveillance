from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from app.api.deps import get_db
from app.models.schema import Alert, AlertCreate, AlertUpdate

router = APIRouter()

# Mock alerts data
mock_alerts = [
    {
        "id": "alert_001",
        "title": "Fire Detected",
        "description": "Potential wildfire detected in sector A-7 with high heat signature.",
        "timestamp": datetime.now() - timedelta(minutes=5),
        "severity": "critical",
        "confidence": 94,
        "location": "Sector A-7, North Ridge",
        "status": "new",
        "type": "fire",
        "coordinates": {"lat": 37.7749, "lng": -122.4194}
    },
    {
        "id": "alert_002",
        "title": "Unauthorized Vehicle",
        "description": "Unidentified vehicle detected in restricted area near the perimeter fence.",
        "timestamp": datetime.now() - timedelta(minutes=15),
        "severity": "high",
        "confidence": 87,
        "location": "Perimeter Zone B, East Entrance",
        "status": "acknowledged",
        "type": "intrusion",
        "coordinates": {"lat": 37.7759, "lng": -122.4204}
    },
    {
        "id": "alert_003",
        "title": "Crowd Formation",
        "description": "Unusual crowd density detected in public area exceeding safety thresholds.",
        "timestamp": datetime.now() - timedelta(minutes=30),
        "severity": "medium",
        "confidence": 76,
        "location": "Central Plaza, Main Entrance",
        "status": "new",
        "type": "crowd",
        "coordinates": {"lat": 37.7769, "lng": -122.4174}
    }
]

@router.get("/", response_model=List[Alert])
async def get_alerts(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get alerts with optional filtering"""
    
    filtered_alerts = mock_alerts.copy()
    
    if status:
        filtered_alerts = [a for a in filtered_alerts if a["status"] == status]
    
    if severity:
        filtered_alerts = [a for a in filtered_alerts if a["severity"] == severity]
    
    # Apply pagination
    paginated_alerts = filtered_alerts[offset:offset + limit]
    
    return paginated_alerts

@router.get("/{alert_id}", response_model=Alert)
async def get_alert(alert_id: str, db: Session = Depends(get_db)):
    """Get specific alert by ID"""
    
    alert = next((a for a in mock_alerts if a["id"] == alert_id), None)
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return alert

@router.post("/", response_model=Alert)
async def create_alert(
    alert: AlertCreate,
    db: Session = Depends(get_db)
):
    """Create new alert"""
    
    new_alert = {
        "id": f"alert_{len(mock_alerts) + 1:03d}",
        "title": alert.title,
        "description": alert.description,
        "timestamp": datetime.now(),
        "severity": alert.severity,
        "confidence": alert.confidence,
        "location": alert.location,
        "status": "new",
        "type": alert.type,
        "coordinates": alert.coordinates
    }
    
    mock_alerts.append(new_alert)
    return new_alert

@router.put("/{alert_id}", response_model=Alert)
async def update_alert(
    alert_id: str,
    alert_update: AlertUpdate,
    db: Session = Depends(get_db)
):
    """Update alert status or details"""
    
    alert_index = next((i for i, a in enumerate(mock_alerts) if a["id"] == alert_id), None)
    
    if alert_index is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    # Update alert fields
    if alert_update.status:
        mock_alerts[alert_index]["status"] = alert_update.status
    if alert_update.severity:
        mock_alerts[alert_index]["severity"] = alert_update.severity
    
    return mock_alerts[alert_index]

@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str, db: Session = Depends(get_db)):
    """Acknowledge an alert"""
    
    alert_index = next((i for i, a in enumerate(mock_alerts) if a["id"] == alert_id), None)
    
    if alert_index is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    mock_alerts[alert_index]["status"] = "acknowledged"
    
    return {"message": "Alert acknowledged", "alert_id": alert_id}

@router.post("/{alert_id}/resolve")
async def resolve_alert(alert_id: str, db: Session = Depends(get_db)):
    """Resolve an alert"""
    
    alert_index = next((i for i, a in enumerate(mock_alerts) if a["id"] == alert_id), None)
    
    if alert_index is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    mock_alerts[alert_index]["status"] = "resolved"
    
    return {"message": "Alert resolved", "alert_id": alert_id}

@router.get("/stats/summary")
async def get_alert_stats(db: Session = Depends(get_db)):
    """Get alert statistics summary"""
    
    total_alerts = len(mock_alerts)
    new_alerts = len([a for a in mock_alerts if a["status"] == "new"])
    critical_alerts = len([a for a in mock_alerts if a["severity"] == "critical"])
    
    alerts_by_type = {}
    for alert in mock_alerts:
        alert_type = alert["type"]
        alerts_by_type[alert_type] = alerts_by_type.get(alert_type, 0) + 1
    
    return {
        "total_alerts": total_alerts,
        "new_alerts": new_alerts,
        "critical_alerts": critical_alerts,
        "alerts_by_type": alerts_by_type,
        "average_confidence": sum(a["confidence"] for a in mock_alerts) / total_alerts if total_alerts > 0 else 0
    }
