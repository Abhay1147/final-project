#!/usr/bin/env python
"""Initialize the database"""
import os
from app import create_app
from models import db

# Create app instance
app = create_app(os.getenv('FLASK_ENV', 'development'))

# Create all tables
with app.app_context():
    print("Creating database tables...")
    db.create_all()
    print("✓ Database initialized successfully!")
    print(f"Database location: {os.getenv('DATABASE_URL', 'sqlite:///habit_tracker.db')}")
