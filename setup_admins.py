#!/usr/bin/env python3
# Setup script to create admin accounts

import sys
sys.path.insert(0, '/Users/abhay12/Desktop/final-project')

from server import create_app
from server.models import db, User

app = create_app()

with app.app_context():
    # Create first admin
    admin1 = User.query.filter_by(email='admin1@luther.edu').first()
    if not admin1:
        admin1 = User(email='admin1@luther.edu', username='admin1', is_admin=True)
        admin1.set_password('admin123')
        db.session.add(admin1)
        print("✅ Created admin1@luther.edu")
    else:
        admin1.is_admin = True
        print("✅ Updated admin1@luther.edu as admin")
    
    # Create second admin
    admin2 = User.query.filter_by(email='admin2@luther.edu').first()
    if not admin2:
        admin2 = User(email='admin2@luther.edu', username='admin2', is_admin=True)
        admin2.set_password('admin456')
        db.session.add(admin2)
        print("✅ Created admin2@luther.edu")
    else:
        admin2.is_admin = True
        print("✅ Updated admin2@luther.edu as admin")
    
    db.session.commit()
    print("\n✨ Admin accounts setup complete!")
    print("Admin 1: admin1@luther.edu / admin123")
    print("Admin 2: admin2@luther.edu / admin456")
