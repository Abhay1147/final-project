from flask import Flask, render_template, request, jsonify
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from models import db, User, Habit, HabitLog, Feedback, Comment
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

def create_app(config_name='development'):
    app = Flask(__name__, template_folder='templates', static_folder='static')
    
    # Configure based on environment
    if config_name == 'development':
        app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///habit_tracker.db')
        app.config['DEBUG'] = True
    else:
        app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
        app.config['DEBUG'] = False
    
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize extensions
    db.init_app(app)
    login_manager = LoginManager(app)
    login_manager.login_view = 'login'
    
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))
    
    with app.app_context():
        db.create_all()
    
    # Main route - serve SPA
    @app.route('/')
    def index():
        return render_template('index.html')
    
    # ==================== AUTH ENDPOINTS ====================
    @app.route('/api/auth/login', methods=['POST'])
    def api_login():
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'success': False, 'error': 'Missing credentials'}), 400
        
        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            login_user(user)
            return jsonify({
                'success': True,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'coins': user.coins
                }
            })
        return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
    
    @app.route('/api/auth/register', methods=['POST'])
    def api_register():
        data = request.get_json()
        email = data.get('email')
        username = data.get('username')
        password = data.get('password')
        
        if not all([email, username, password]):
            return jsonify({'success': False, 'error': 'Missing fields'}), 400
        
        if User.query.filter_by(email=email).first():
            return jsonify({'success': False, 'error': 'Email already exists'}), 409
        
        user = User(email=email, username=username)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        
        login_user(user)
        return jsonify({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'coins': user.coins
            }
        }), 201
    
    @app.route('/api/auth/logout', methods=['POST'])
    @login_required
    def api_logout():
        logout_user()
        return jsonify({'success': True, 'message': 'Logged out'})
    
    @app.route('/api/auth/current-user')
    @login_required
    def api_current_user():
        return jsonify({
            'success': True,
            'user': {
                'id': current_user.id,
                'username': current_user.username,
                'email': current_user.email,
                'coins': current_user.coins
            }
        })
    
    # ==================== HABITS ENDPOINTS ====================
    @app.route('/api/habits', methods=['GET', 'POST'])
    @login_required
    def api_habits():
        if request.method == 'GET':
            habits = Habit.query.filter_by(user_id=current_user.id, is_active=True).all()
            today = datetime.utcnow().date()
            
            habits_data = []
            for habit in habits:
                log = HabitLog.query.filter_by(
                    habit_id=habit.id,
                    user_id=current_user.id,
                    completed_date=today
                ).first()
                
                habits_data.append({
                    'id': habit.id,
                    'name': habit.name,
                    'description': habit.description,
                    'frequency': habit.frequency,
                    'coin_reward': habit.coin_reward,
                    'color': habit.color,
                    'icon': habit.icon,
                    'completed_today': log is not None,
                    'created_at': habit.created_at.isoformat()
                })
            
            return jsonify({'success': True, 'habits': habits_data})
        
        # POST - Create habit
        data = request.get_json()
        name = data.get('name')
        
        if not name:
            return jsonify({'success': False, 'error': 'Habit name required'}), 400
        
        habit = Habit(
            user_id=current_user.id,
            name=name,
            description=data.get('description', ''),
            frequency=data.get('frequency', 'daily'),
            coin_reward=int(data.get('coin_reward', 5)),
            color=data.get('color', '#007bff'),
            icon=data.get('icon', 'fa-circle')
        )
        db.session.add(habit)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Habit "{name}" created!'
        }), 201
    
    @app.route('/api/habits/<int:habit_id>/complete', methods=['POST'])
    @login_required
    def api_complete_habit(habit_id):
        habit = Habit.query.get_or_404(habit_id)
        
        if habit.user_id != current_user.id:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        today = datetime.utcnow().date()
        existing = HabitLog.query.filter_by(
            habit_id=habit_id,
            user_id=current_user.id,
            completed_date=today
        ).first()
        
        if existing:
            return jsonify({'success': False, 'error': 'Already completed today'}), 400
        
        log = HabitLog(
            habit_id=habit_id,
            user_id=current_user.id,
            completed_date=today,
            coins_earned=habit.coin_reward
        )
        db.session.add(log)
        current_user.coins += habit.coin_reward
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Earned {habit.coin_reward} coins!',
            'coins_earned': habit.coin_reward,
            'user': {
                'id': current_user.id,
                'username': current_user.username,
                'email': current_user.email,
                'coins': current_user.coins
            }
        })
    
    # ==================== STORE ENDPOINTS ====================
    @app.route('/api/store', methods=['GET'])
    @login_required
    def api_store():
        # Return empty store for now
        return jsonify({'success': True, 'items': []})
    
    # ==================== PROFILE & SUPPORT ====================
    @app.route('/api/profile', methods=['GET'])
    @login_required
    def api_profile():
        total_completed = HabitLog.query.filter_by(user_id=current_user.id).count()
        total_coins = sum(log.coins_earned for log in current_user.habit_logs) if current_user.habit_logs else 0
        
        return jsonify({
            'success': True,
            'user': {
                'id': current_user.id,
                'username': current_user.username,
                'email': current_user.email,
                'coins': current_user.coins
            },
            'total_completed': total_completed,
            'total_coins_earned': total_coins
        })
    
    @app.route('/api/support', methods=['POST'])
    def api_support():
        data = request.get_json()
        
        feedback = Feedback(
            user_id=current_user.id if current_user.is_authenticated else None,
            email=data.get('email'),
            subject=data.get('subject'),
            message=data.get('message')
        )
        db.session.add(feedback)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Feedback received!'})
    
    # ==================== COMMENT ENDPOINTS ====================
    @app.route('/api/comments/habit/<int:habit_id>', methods=['GET'])
    @login_required
    def api_get_comments(habit_id):
        comments = Comment.query.filter_by(habit_id=habit_id).order_by(Comment.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'comments': [{
                'id': c.id,
                'author': c.author.username,
                'content': c.content,
                'created_at': c.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'is_owner': c.user_id == current_user.id
            } for c in comments]
        })
    
    @app.route('/api/comments', methods=['POST'])
    @login_required
    def api_create_comment():
        data = request.get_json()
        content = data.get('content', '').strip()
        habit_id = data.get('habit_id')
        
        if not content or len(content) > 500:
            return jsonify({'success': False, 'error': 'Invalid comment'}), 400
        
        comment = Comment(
            user_id=current_user.id,
            habit_id=habit_id,
            content=content
        )
        db.session.add(comment)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'comment': {
                'id': comment.id,
                'author': comment.author.username,
                'content': comment.content,
                'created_at': comment.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'is_owner': True
            }
        }), 201
    
    @app.route('/api/comments/<int:comment_id>', methods=['DELETE'])
    @login_required
    def api_delete_comment(comment_id):
        comment = Comment.query.get_or_404(comment_id)
        
        if comment.user_id != current_user.id:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        db.session.delete(comment)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Deleted'})
    
    @app.route('/api/comments/<int:comment_id>', methods=['PUT'])
    @login_required
    def api_update_comment(comment_id):
        comment = Comment.query.get_or_404(comment_id)
        
        if comment.user_id != current_user.id:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        content = data.get('content', '').strip()
        
        if not content or len(content) > 500:
            return jsonify({'success': False, 'error': 'Invalid comment'}), 400
        
        comment.content = content
        comment.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'success': True, 'comment': {
            'id': comment.id,
            'author': comment.author.username,
            'content': comment.content,
            'created_at': comment.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'is_owner': True
        }})
    
    # ==================== ERROR HANDLERS ====================
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'success': False, 'error': 'Not found'}), 404
    
    @app.errorhandler(500)
    def server_error(error):
        return jsonify({'success': False, 'error': 'Server error'}), 500
    
    return app

if __name__ == '__main__':
    app = create_app(os.getenv('FLASK_ENV', 'development'))
    port = int(os.getenv('PORT', 5001))
    app.run(debug=True, port=port)
