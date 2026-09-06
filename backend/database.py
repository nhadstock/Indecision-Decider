from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# This creates a local SQLite file named activity_decider.db
SQLALCHEMY_DATABASE_URL = "sqlite:///./activity_decider.db"

# check_same_thread=False is specifically required for SQLite in FastAPI
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()