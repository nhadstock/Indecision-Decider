from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models, schemas
from database import SessionLocal, engine
from typing import Optional

app = FastAPI(title="Activity Decider API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/activities/", response_model=schemas.ActivityResponse)
def create_activity(activity: schemas.ActivityCreate, db: Session = Depends(get_db)):
    db_activity = models.Activity(**activity.model_dump())
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)
    return db_activity

@app.get("/activities/", response_model=list[schemas.ActivityResponse])
def read_activities(
    skip: int = 0, 
    limit: int = 100, 
    cost: Optional[str] = None,
    location: Optional[str] = None,
    intensity: Optional[str] = None,
    season: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Activity)
    if cost:
        query = query.filter(models.Activity.cost == cost)
    if location:
        query = query.filter(models.Activity.location == location)
    if intensity:
        query = query.filter(models.Activity.intensity == intensity)
    if season:
        query = query.filter(models.Activity.season == season)
    return query.offset(skip).limit(limit).all()

@app.delete("/activities/{activity_id}")
def delete_activity(activity_id: int, db: Session = Depends(get_db)):
    db_activity = db.query(models.Activity).filter(models.Activity.id == activity_id).first()
    if db_activity is None:
        raise HTTPException(status_code=404, detail="Activity not found")
    db.delete(db_activity)
    db.commit()
    return {"message": "Activity deleted successfully"}

@app.post("/activities/{activity_id}/spin", response_model=schemas.ActivityResponse)
def spin_activity(activity_id: int, db: Session = Depends(get_db)):
    db_activity = db.query(models.Activity).filter(models.Activity.id == activity_id).first()
    if db_activity is None:
        raise HTTPException(status_code=404, detail="Activity not found")
    db_activity.spun_count += 1
    db.commit()
    db.refresh(db_activity)
    return db_activity