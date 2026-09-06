from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session
import models, schemas
from database import SessionLocal, engine

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
    cost: Optional[str] = Query(None, description="Filter by cost"),
    location: Optional[str] = Query(None, description="Filter by Indoor or Outdoor"),
    intensity: Optional[str] = Query(None, description="Filter by Low, Med, High"),
    db: Session = Depends(get_db)
):
    stmt = select(models.Activity)

    if cost:
        stmt = stmt.where(models.Activity.cost == cost)
    if location:
        stmt = stmt.where(models.Activity.location == location)
    if intensity:
        stmt = stmt.where(models.Activity.intensity == intensity)

    result = db.execute(stmt)
    return result.scalars().all()

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