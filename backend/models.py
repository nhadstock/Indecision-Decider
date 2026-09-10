from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime, timezone
from database import Base

class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    cost = Column(String)        # e.g., "$", "$$", "$$$"
    location = Column(String)    # e.g., "Indoor", "Outdoor"
    duration = Column(Integer)   # Duration in minutes
    season = Column(String)      # e.g., "Any", "Summer", "Winter"
    include_group = Column(String) # e.g., "Yes", "No"
    physical_energy = Column(String) # e.g., "Low", "Med", "High"
    mental_energy = Column(String)   # e.g., "Low", "Med", "High"
    
    # Analytics Tracking
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    spun_count = Column(Integer, default=0)
    skipped_count = Column(Integer, default=0)
    manual_pick_count = Column(Integer, default=0)
    last_chosen_at = Column(DateTime, nullable=True)