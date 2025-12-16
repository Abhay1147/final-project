from flask import Flask, render_template, jsonify, session
from flask_login import LoginManager
from authlib.integrations.flask_client import OAuth
from server.models import db
import os
from dotenv import load_dotenv

load_dotenv()

def create_app(config_name='development'):
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    template_dir = os.path.join(base_dir, 'templates')
    static_dir = os.path.join(base_dir, 'static')
    
    app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)
    
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///habit_tracker.db')
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['DEBUG'] = config_name == 'development'
    
    # OAuth Setup with Authlib
    oauth = OAuth(app)
    google = oauth.register(
        name='google',
        client_id=os.getenv('GOOGLE_CLIENT_ID'),
        client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={'scope': 'openid email profile'}
    )
    
    # Store in app config
    app.google = google
    
    db.init_app(app)
    login_manager = LoginManager(app)
    login_manager.login_view = 'login'
    
    @login_manager.user_loader
    def load_user(user_id):
        from server.models import User
        return User.query.get(int(user_id))
    
    with app.app_context():
        db.create_all()
        _create_default_admins()
        _create_default_admins()  # Create default admins on first run
    
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

def _create_default_admins():
    """Create default admin accounts on first run"""
    from server.models import User
    admins = [
        {'email': 'admin1@luther.edu', 'username': 'admin1', 'password': 'admin123'},
        {'email': 'admin2@luther.edu', 'username': 'admin2', 'password': 'admin456'}
    ]
    
    for admin_data in admins:
        admin = User.query.filter_by(email=admin_data['email']).first()
        if not admin:
            admin = User(
                email=admin_data['email'],
                username=admin_data['username'],
                is_admin=True
            )
            admin.set_password(admin_data['password'])
            db.session.add(admin)
    
    db.session.commit()
