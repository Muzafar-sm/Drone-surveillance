from typing import Generator
from app.config import settings
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.config import Settings # Assuming settings are used for DB URL


settings = Settings()

SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()




def get_settings():
    """Dependency to get application settings"""
    return settings
