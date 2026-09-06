from pydantic import BaseModel
from datetime import datetime

class ActivityBase(BaseModel):
    name: str
    cost: str
    location: str
    intensity: str
    duration: int
    season: str

# Used when creating an activity (doesn't need ID or analytics yet)
class ActivityCreate(ActivityBase):
    pass

# Used when returning an activity from the API (includes ID and analytics)
class ActivityResponse(ActivityBase):
    id: int
    created_at: datetime
    spun_count: int
    skipped_count: int

    class Config:
        from_attributes = True # Tells Pydantic to read data even if it is not a standard dict