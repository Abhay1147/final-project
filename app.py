from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from models import db, User, Habit, HabitLog, StoreItem, UserPurchase, CoinTransaction, Feedback, Comment
import os
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

def create_app(config_name='development'):
    app = Flask(__name__, template_folder='templates')
    
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
    login_manager.login_message = 'Please log in to access this page.'
    
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))
    
    with app.app_context():
        db.create_all()
    
    # Routes
    @app.route('/')
    def index():
        if current_user.is_authenticated:
            return redirect(url_for('home'))
        return redirect(url_for('login'))
    
    @app.route('/home')
    @login_required
    def home():
        habits = Habit.query.filter_by(user_id=current_user.id, is_active=True).all()
        today = datetime.utcnow().date()
        
        # Check which habits are completed today
        for habit in habits:
            log = HabitLog.query.filter_by(
                habit_id=habit.id,
                user_id=current_user.id,
                completed_date=today
            ).first()
            habit.completed_today = log is not None
        
        # Get stats
        user_coins = current_user.coins
        habits_completed_today = sum(1 for h in habits if h.completed_today)
        total_habits = len(habits)
        completion_rate = 0
        current_streak = 0
        
        if total_habits > 0:
            last_7_days = (datetime.utcnow().date() - timedelta(days=7), datetime.utcnow().date())
            completed_in_week = HabitLog.query.filter(
                HabitLog.user_id == current_user.id,
                HabitLog.completed_date >= last_7_days[0],
                HabitLog.completed_date <= last_7_days[1]
            ).count()
            completion_rate = int((completed_in_week / (total_habits * 7)) * 100) if total_habits > 0 else 0
        
        # Prepare data for D3.js
        habit_log_data = []
        weekly_completion_data = [
            {'day': 'Mon', 'completion': 0},
            {'day': 'Tue', 'completion': 0},
            {'day': 'Wed', 'completion': 0},
            {'day': 'Thu', 'completion': 0},
            {'day': 'Fri', 'completion': 0},
            {'day': 'Sat', 'completion': 0},
            {'day': 'Sun', 'completion': 0},
        ]
        
        return render_template(
            'home.jinja',
            habits=habits,
            user_coins=user_coins,
            habits_completed_today=habits_completed_today,
            total_habits=total_habits,
            completion_rate=completion_rate,
            current_streak=current_streak,
            habit_log_data=json.dumps(habit_log_data),
            weekly_completion_data=json.dumps(weekly_completion_data)
        )
    
    @app.route('/login', methods=['GET', 'POST'])
    def login():
        if current_user.is_authenticated:
            return redirect(url_for('home'))
        
        if request.method == 'POST':
            email = request.form.get('email')
            password = request.form.get('password')
            user = User.query.filter_by(email=email).first()
            
            if user and user.check_password(password):
                login_user(user)
                flash('Login successful!', 'success')
                return redirect(url_for('home'))
            else:
                flash('Invalid email or password.', 'error')
        
        return render_template('login.jinja')
    
    @app.route('/logout')
    @login_required
    def logout():
        logout_user()
        flash('You have been logged out.', 'success')
        return redirect(url_for('login'))
    
    @app.route('/register', methods=['GET', 'POST'])
    def register():
        if request.method == 'POST':
            email = request.form.get('email')
            username = request.form.get('username')
            password = request.form.get('password')
            
            if User.query.filter_by(email=email).first():
                flash('Email already registered.', 'error')
                return redirect(url_for('register'))
            
            user = User(email=email, username=username)
            user.set_password(password)
            db.session.add(user)
            db.session.commit()
            
            flash('Registration successful! Please log in.', 'success')
            return redirect(url_for('login'))
        
        return render_template('register.jinja')
    
    @app.route('/habits', methods=['GET', 'POST'])
    @login_required
    def habits():
        if request.method == 'POST':
            name = request.form.get('name')
            description = request.form.get('description')
            frequency = request.form.get('frequency', 'daily')
            coin_reward = int(request.form.get('coin_reward', 5))
            color = request.form.get('color', '#007bff')
            icon = request.form.get('icon', 'fa-circle')
            
            habit = Habit(
                user_id=current_user.id,
                name=name,
                description=description,
                frequency=frequency,
                coin_reward=coin_reward,
                color=color,
                icon=icon
            )
            db.session.add(habit)
            db.session.commit()
            
            flash(f'Habit "{name}" created successfully!', 'success')
            return redirect(url_for('home'))
        
        habits = Habit.query.filter_by(user_id=current_user.id, is_active=True).all()
        return render_template('habits.jinja', habits=habits)
    
    @app.route('/habit/<int:habit_id>')
    @login_required
    def view_habit(habit_id):
        habit = Habit.query.get_or_404(habit_id)
        
        if habit.user_id != current_user.id:
            flash('You do not have permission to view this habit.', 'error')
            return redirect(url_for('home'))
        
        comments = Comment.query.filter_by(habit_id=habit_id).order_by(Comment.created_at.desc()).all()
        
        return render_template('habit_detail.jinja', habit=habit, comments=comments)
    
    @app.route('/habit/create')
    @login_required
    def create_habit():
        return render_template('create_habit.jinja')
    
    @app.route('/habit/<int:habit_id>/complete', methods=['POST'])
    @login_required
    def complete_habit(habit_id):
        habit = Habit.query.get_or_404(habit_id)
        
        if habit.user_id != current_user.id:
            flash('Unauthorized action.', 'error')
            return redirect(url_for('home'))
        
        today = datetime.utcnow().date()
        existing_log = HabitLog.query.filter_by(
            habit_id=habit_id,
            user_id=current_user.id,
            completed_date=today
        ).first()
        
        if existing_log:
            flash('You already completed this habit today!', 'info')
        else:
            log = HabitLog(
                habit_id=habit_id,
                user_id=current_user.id,
                completed_date=today,
                coins_earned=habit.coin_reward
            )
            db.session.add(log)
            
            current_user.coins += habit.coin_reward
            
            transaction = CoinTransaction(
                user_id=current_user.id,
                amount=habit.coin_reward,
                transaction_type='earned',
                related_id=habit_id
            )
            db.session.add(transaction)
            db.session.commit()
            
            flash(f'Great! You earned {habit.coin_reward} coins!', 'success')
        
        return redirect(url_for('home'))
    
    @app.route('/store')
    @login_required
    def store():
        items = StoreItem.query.all()
        return render_template('store.jinja', items=items, user_coins=current_user.coins)
    
    @app.route('/support', methods=['GET', 'POST'])
    def support():
        if request.method == 'POST':
            email = request.form.get('email')
            subject = request.form.get('subject')
            message = request.form.get('message')
            
            feedback = Feedback(
                user_id=current_user.id if current_user.is_authenticated else None,
                email=email,
                subject=subject,
                message=message
            )
            db.session.add(feedback)
            db.session.commit()
            
            flash('Thank you for your feedback!', 'success')
            return redirect(url_for('home') if current_user.is_authenticated else url_for('login'))
        
        return render_template('support.jinja')
    
    @app.route('/profile')
    @login_required
    def profile():
        total_completed = HabitLog.query.filter_by(user_id=current_user.id).count()
        total_coins_earned = sum(log.coins_earned for log in current_user.habit_logs)
        
        return render_template(
            'profile.jinja',
            total_completed=total_completed,
            total_coins_earned=total_coins_earned
        )
    
    # API Routes for Comments
    @app.route('/api/comments/habit/<int:habit_id>', methods=['GET'])
    @login_required
    def get_habit_comments(habit_id):
        """Get all comments for a habit"""
        habit = Habit.query.get_or_404(habit_id)
        comments = Comment.query.filter_by(habit_id=habit_id).order_by(Comment.created_at.desc()).all()
        
        comments_data = [{
            'id': c.id,
            'author': c.author.username,
            'content': c.content,
            'created_at': c.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'is_owner': c.user_id == current_user.id
        } for c in comments]
        
        return jsonify({'success': True, 'comments': comments_data})
    
    @app.route('/api/comments', methods=['POST'])
    @login_required
    def create_comment():
        """Create a new comment on a habit"""
        data = request.get_json()
        habit_id = data.get('habit_id')
        content = data.get('content', '').strip()
        
        if not habit_id or not content:
            return jsonify({'success': False, 'error': 'Missing required fields'}), 400
        
        if len(content) > 500:
            return jsonify({'success': False, 'error': 'Comment too long (max 500 characters)'}), 400
        
        habit = Habit.query.get_or_404(habit_id)
        
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
    def delete_comment(comment_id):
        """Delete a comment (only owner can delete)"""
        comment = Comment.query.get_or_404(comment_id)
        
        if comment.user_id != current_user.id:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        db.session.delete(comment)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Comment deleted'})
    
    @app.route('/api/comments/<int:comment_id>', methods=['PUT'])
    @login_required
    def update_comment(comment_id):
        """Update a comment (only owner can update)"""
        comment = Comment.query.get_or_404(comment_id)
        
        if comment.user_id != current_user.id:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        content = data.get('content', '').strip()
        
        if not content:
            return jsonify({'success': False, 'error': 'Comment cannot be empty'}), 400
        
        if len(content) > 500:
            return jsonify({'success': False, 'error': 'Comment too long (max 500 characters)'}), 400
        
        comment.content = content
        comment.updated_at = datetime.utcnow()
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
        })
    
    @app.errorhandler(404)
    def not_found(error):
        return render_template('error.jinja', error='Page not found'), 404
    
    @app.errorhandler(500)
    def server_error(error):
        return render_template('error.jinja', error='Server error'), 500
    
    return app

if __name__ == '__main__':
    app = create_app(os.getenv('FLASK_ENV', 'development'))
    port = int(os.getenv('PORT', 5001))
    app.run(debug=True, port=port)
