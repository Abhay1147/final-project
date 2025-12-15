# server/__init__.py
from flask import Flask, render_template, jsonify, session
from flask_login import LoginManager
from flask_oauthlib.client import OAuth
from server.models import db
import os
from dotenv import load_dotenv

load_dotenv()

def create_app(config_name='development'):
    # Get absolute paths
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    template_dir = os.path.join(base_dir, 'templates')
    static_dir = os.path.join(base_dir, 'static')
    
    app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)
    
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///habit_tracker.db')
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # OAuth Setup
    oauth = OAuth(app)
    google = oauth.remote_app(
        'google',
        consumer_key=os.getenv('GOOGLE_CLIENT_ID'),
        consumer_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
        request_token_params={'scope': 'email profile'},
        base_url='https://www.googleapis.com/oauth2/v1/',
        request_token_url=None,
        access_token_method='POST',
        access_token_url='https://accounts.google.com/o/oauth2/token',
        authorize_url='https://accounts.google.com/o/oauth2/auth',
    )
    
    # Store oauth and google in app config for routes
    app.oauth = oauth
    app.google = google
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['DEBUG'] = config_name == 'development'
    
    @app.google.tokengetter
    def get_google_oauth_token():
        return session.get('google_token')
    
    db.init_app(app)
    login_manager = LoginManager(app)
    login_manager.login_view = 'login'
    
    @login_manager.user_loader
    def load_user(user_id):
        from server.models import User
        return User.query.get(int(user_id))
    
    with app.app_context():
        db.create_all()
    
    @app.route('/')
    def index():
        return render_template('index.html')
    
    from server.routes import register_routes
    register_routes(app)
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'success': False, 'error': 'Not found'}), 404
    
    @app.errorhandler(500)
    def server_error(error):
        return jsonify({'success': False, 'error': 'Server error'}), 500
    
    return app
