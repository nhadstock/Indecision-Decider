import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Ensure the persistent data directory exists
os.makedirs("./data", exist_ok=True)

# Point SQLite to the volume-mapped folder
SQLALCHEMY_DATABASE_URL = "sqlite:///./data/activity_decider.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()