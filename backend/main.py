from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session
import models, schemas
from database import SessionLocal, engine
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
import os
import csv
import io

models.Base.metadata.create_all(bind=engine)

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
    cost: Optional[List[str]] = Query(None, description="Filter by multiple costs"),
    location: Optional[str] = Query(None, description="Filter by Indoor or Outdoor"),
    season: Optional[str] = Query(None, description="Filter by season"),
    include_group: Optional[str] = Query(None, description="Filter by group inclusion"),
    physical_energy: Optional[List[str]] = Query(None, description="Filter by multiple physical energy levels"),
    mental_energy: Optional[List[str]] = Query(None, description="Filter by multiple mental energy levels"),
    db: Session = Depends(get_db)
):
    stmt = select(models.Activity)

    if cost:
        stmt = stmt.where(models.Activity.cost.in_(cost))
    if location:
        stmt = stmt.where(models.Activity.location == location)
    if season:
        stmt = stmt.where(
            (models.Activity.season.contains(season)) | 
            (models.Activity.season == "Any")
        )
    if include_group:
        stmt = stmt.where(models.Activity.include_group == include_group)
    if physical_energy:
        stmt = stmt.where(models.Activity.physical_energy.in_(physical_energy))
    if mental_energy:
        stmt = stmt.where(models.Activity.mental_energy.in_(mental_energy))

    result = db.execute(stmt)
    return result.scalars().all()

@app.get("/activities/export")
def export_activities(db: Session = Depends(get_db)):
    activities = db.query(models.Activity).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow(["id", "name", "cost", "location", "duration", "season", "include_group", "physical_energy", "mental_energy", "spun_count", "skipped_count", "manual_pick_count", "last_chosen_at"])
    
    # Write data rows
    for a in activities:
        writer.writerow([a.id, a.name, a.cost, a.location, a.duration, a.season, a.include_group, a.physical_energy, a.mental_energy, a.spun_count, a.skipped_count, a.manual_pick_count, a.last_chosen_at])
        
    output.seek(0)
    return StreamingResponse(output, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=activities_export.csv"})

@app.delete("/activities/clear-all")
def clear_all_activities(db: Session = Depends(get_db)):
    db.query(models.Activity).delete()
    db.commit()
    return {"message": "All activities wiped successfully"}

@app.delete("/activities/{activity_id}")
def delete_activity(activity_id: int, db: Session = Depends(get_db)):
    db_activity = db.query(models.Activity).filter(models.Activity.id == activity_id).first()
    if db_activity is None:
        raise HTTPException(status_code=404, detail="Activity not found")
    db.delete(db_activity)
    db.commit()
    return {"message": "Activity deleted successfully"}

@app.put("/activities/{activity_id}", response_model=schemas.ActivityResponse)
def update_activity(activity_id: int, activity: schemas.ActivityCreate, db: Session = Depends(get_db)):
    db_activity = db.query(models.Activity).filter(models.Activity.id == activity_id).first()
    if db_activity is None:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Dynamically update all the fields in the database row
    for key, value in activity.model_dump().items():
        setattr(db_activity, key, value)
        
    db.commit()
    db.refresh(db_activity)
    return db_activity

@app.put("/activities/{activity_id}", response_model=schemas.ActivityResponse)
def update_activity(activity_id: int, activity: schemas.ActivityCreate, db: Session = Depends(get_db)):
    db_activity = db.query(models.Activity).filter(models.Activity.id == activity_id).first()
    if db_activity is None:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Dynamically update all the fields in the database row
    for key, value in activity.model_dump().items():
        setattr(db_activity, key, value)
        
    db.commit()
    db.refresh(db_activity)
    return db_activity

@app.post("/activities/{activity_id}/spin", response_model=schemas.ActivityResponse)
def spin_activity(activity_id: int, db: Session = Depends(get_db)):
    db_activity = db.query(models.Activity).filter(models.Activity.id == activity_id).first()
    if db_activity is None:
        raise HTTPException(status_code=404, detail="Activity not found")
    db_activity.spun_count = (db_activity.spun_count or 0) + 1
    db.commit()
    db.refresh(db_activity)
    return db_activity

@app.post("/activities/{activity_id}/choose", response_model=schemas.ActivityResponse)
def choose_activity(activity_id: int, db: Session = Depends(get_db)):
    from datetime import datetime, timezone
    db_activity = db.query(models.Activity).filter(models.Activity.id == activity_id).first()
    if db_activity is None:
        raise HTTPException(status_code=404, detail="Activity not found")
    db_activity.manual_pick_count = (db_activity.manual_pick_count or 0) + 1
    db_activity.last_chosen_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_activity)
    return db_activity

@app.post("/activities/{activity_id}/reset-metrics", response_model=schemas.ActivityResponse)
def reset_activity_metrics(activity_id: int, db: Session = Depends(get_db)):
    db_activity = db.query(models.Activity).filter(models.Activity.id == activity_id).first()
    if db_activity is None:
        raise HTTPException(status_code=404, detail="Activity not found")
    db_activity.spun_count = 0
    db_activity.skipped_count = 0
    db_activity.manual_pick_count = 0
    db_activity.last_chosen_at = None
    db.commit()
    db.refresh(db_activity)
    return db_activity

@app.post("/activities/{activity_id}/skip", response_model=schemas.ActivityResponse)
def skip_activity(activity_id: int, db: Session = Depends(get_db)):
    db_activity = db.query(models.Activity).filter(models.Activity.id == activity_id).first()
    if db_activity is None:
        raise HTTPException(status_code=404, detail="Activity not found")
    db_activity.skipped_count = (db_activity.skipped_count or 0) + 1
    db.commit()
    db.refresh(db_activity)
    return db_activity

@app.post("/activities/upload")
async def upload_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    try:
        # Read the file into memory and decode it
        contents = await file.read()
        decoded = contents.decode('utf-8')
        
        # Parse the CSV
        csv_reader = csv.DictReader(io.StringIO(decoded))
        
        activities_added = 0
        for row in csv_reader:
            # Basic validation: ensure required keys exist and aren't completely empty
            if not row.get('name'):
                continue
                
            db_activity = models.Activity(
                name=row.get('name', '').strip(),
                cost=row.get('cost', '$').strip(),
                location=row.get('location', 'Indoor').strip(),
                duration=int(row.get('duration', 60)),
                season=row.get('season', 'Any').strip(),
                include_group=row.get('include_group', 'No').strip(),
                physical_energy=row.get('physical_energy', 'Low').strip(),
                mental_energy=row.get('mental_energy', 'Low').strip()
            )
            db.add(db_activity)
            activities_added += 1
            
        db.commit()
        return {"message": f"Successfully imported {activities_added} activities"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error processing CSV: {str(e)}")

    # Serve static files if they exist (Production mode)
ui_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(ui_dir):
    app.mount("/", StaticFiles(directory=ui_dir, html=True), name="ui")

    @app.exception_handler(404)
    async def fallback_to_react(request, exc):
        return FileResponse(os.path.join(ui_dir, "index.html"))