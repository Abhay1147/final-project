import sys
import os

# Add project directory to path
project_home = '/home/habbittracker/myapps/final-project'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Set environment
os.environ['FLASK_ENV'] = 'production'

from server import create_app
application = create_app('production')
