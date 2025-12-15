# run.py
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from server import create_app

if __name__ == '__main__':
    app = create_app(os.getenv('FLASK_ENV', 'development'))
    app.run(debug=True, port=int(os.getenv('PORT', 5001)))
