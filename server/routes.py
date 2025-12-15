# server/routes.py
from flask import request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from server.models import db, User, HabitLog, Feedback
from server.logic import HabitLogic, FeedLogic

def register_routes(app):
    # AUTH
    @app.route('/api/auth/login', methods=['POST'])
    def api_login():
        data = request.get_json()
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'success': False, 'error': 'Email and password required'}), 400
        user = User.query.filter_by(email=data.get('email').strip()).first()
        if not user or not user.check_password(data.get('password')):
            return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
        login_user(user)
        return jsonify({'success': True, 'user': {'id': user.id, 'username': user.username, 'email': user.email, 'coins': user.coins}})
    
    @app.route('/api/auth/register', methods=['POST'])
    def api_register():
        data = request.get_json()
        if not data or not data.get('email') or not data.get('username') or not data.get('password'):
            return jsonify({'success': False, 'error': 'All fields required'}), 400
        if User.query.filter_by(email=data.get('email')).first():
            return jsonify({'success': False, 'error': 'Email already registered'}), 409
        user = User(email=data.get('email'), username=data.get('username'))
        user.set_password(data.get('password'))
        db.session.add(user)
        db.session.commit()
        login_user(user)
        return jsonify({'success': True, 'user': {'id': user.id, 'username': user.username, 'email': user.email, 'coins': user.coins}}), 201
    
    @app.route('/api/auth/logout', methods=['POST'])
    @login_required
    def api_logout():
        logout_user()
        return jsonify({'success': True, 'message': 'Logged out'})
    
    @app.route('/api/auth/current-user')
    def api_current_user():
        if current_user.is_authenticated:
            return jsonify({'success': True, 'user': {'id': current_user.id, 'username': current_user.username, 'email': current_user.email, 'coins': current_user.coins}})
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    # HABITS
    @app.route('/api/habits', methods=['GET', 'POST'])
    @login_required
    def api_habits():
        if request.method == 'GET':
            return jsonify({'success': True, 'habits': HabitLogic.get_user_habits(current_user.id)})
        data = request.get_json()
        if not data or not data.get('name'):
            return jsonify({'success': False, 'error': 'Habit name required'}), 400
        HabitLogic.create_habit(current_user.id, data.get('name').strip(), data.get('description', ''), data.get('frequency', 'daily'), data.get('color', '#007bff'), data.get('icon', 'fa-circle'))
        return jsonify({'success': True, 'message': f'Habit created! You earned 10 coins!'}), 201
    
    @app.route('/api/habits/<int:habit_id>/complete', methods=['POST'])
    @login_required
    def api_complete_habit(habit_id):
        log, error = HabitLogic.complete_habit(current_user.id, habit_id)
        if error:
            return jsonify({'success': False, 'error': error}), 400
        return jsonify({'success': True, 'message': f'Earned {log.habit.coin_reward} coins!', 'coins_earned': log.habit.coin_reward, 'user': {'id': current_user.id, 'username': current_user.username, 'email': current_user.email, 'coins': current_user.coins}})
    
    @app.route('/api/habits/<int:habit_id>', methods=['DELETE'])
    @login_required
    def api_delete_habit(habit_id):
        if HabitLogic.delete_habit(current_user.id, habit_id):
            return jsonify({'success': True, 'message': 'Habit deleted'})
        return jsonify({'success': False, 'error': 'Unauthorized'}), 403
    
    # PROFILE & SUPPORT
    @app.route('/api/profile', methods=['GET'])
    @login_required
    def api_profile():
        total_completed = HabitLog.query.filter_by(user_id=current_user.id).count()
        total_coins = sum(log.coins_earned for log in current_user.habit_logs) if current_user.habit_logs else 0
        return jsonify({'success': True, 'user': {'id': current_user.id, 'username': current_user.username, 'email': current_user.email, 'coins': current_user.coins}, 'total_completed': total_completed, 'total_coins_earned': total_coins})
    
    @app.route('/api/support', methods=['POST'])
    def api_support():
        data = request.get_json()
        feedback = Feedback(user_id=current_user.id if current_user.is_authenticated else None, email=data.get('email'), subject=data.get('subject'), message=data.get('message'))
        db.session.add(feedback)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Feedback received!'})
    
    # FEED
    @app.route('/api/feed', methods=['GET'])
    @login_required
    def api_feed():
        page = request.args.get('page', 1, type=int)
        feed, total_pages = FeedLogic.get_feed(page)
        return jsonify({'success': True, 'feed': feed, 'page': page, 'total_pages': total_pages})
    
    @app.route('/api/feed/<int:log_id>/comments', methods=['GET'])
    @login_required
    def api_get_log_comments(log_id):
        comments = FeedLogic.get_comments(log_id, current_user.id)
        return jsonify({'success': True, 'comments': comments})
    
    @app.route('/api/feed/<int:log_id>/comment', methods=['POST'])
    @login_required
    def api_add_feed_comment(log_id):
        data = request.get_json()
        content = data.get('content', '').strip()
        if not content or len(content) > 500:
            return jsonify({'success': False, 'error': 'Invalid comment'}), 400
        comment, error = FeedLogic.add_comment(current_user.id, log_id, content)
        if error:
            return jsonify({'success': False, 'error': error}), 400
        return jsonify({'success': True, 'message': 'Comment posted! (1 coin spent)', 'comment': {'id': comment.id, 'author': comment.author.username, 'content': comment.content, 'created_at': comment.created_at.strftime('%Y-%m-%d %H:%M:%S'), 'is_owner': True}, 'user': {'id': current_user.id, 'coins': current_user.coins}}), 201
    
    @app.route('/api/feed/<int:log_id>/comment/<int:comment_id>', methods=['DELETE'])
    @login_required
    def api_delete_feed_comment(log_id, comment_id):
        if FeedLogic.delete_comment(current_user.id, comment_id):
            return jsonify({'success': True, 'message': 'Comment deleted! 1 coin refunded', 'user': {'id': current_user.id, 'coins': current_user.coins}})
        return jsonify({'success': False, 'error': 'Unauthorized'}), 403
