"""
Initialize tables and seed demo data for NexGuard AI Wallet.
"""
from app.database import engine, Base, SessionLocal
from app.models import User, Wallet, Device, Beneficiary, Transaction, Incident, AuditLog
from app.bootstrap import seed_database

def init():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("Seeding database...")
    db = SessionLocal()
    try:
        seed_database(db)
        print("Database ready.")
    finally:
        db.close()

if __name__ == "__main__":
    init()
