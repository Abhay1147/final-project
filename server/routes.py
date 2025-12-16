# server/routes.py
from flask import request, jsonify, redirect, url_for, session
from flask_login import login_user, logout_user, login_required, current_user
from server.models import db, User, HabitLog, Feedback, Comment, Habit
from server.logic import HabitLogic, FeedLogic
from .notifications.service import send_notification
import os
import base64
from datetime import datetime

UPLOAD_FOLDER = 'static/uploads'

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
        return jsonify({'success': True, 'user': {'id': user.id, 'username': user.username, 'email': user.email, 'coins': user.coins, 'is_admin': user.is_admin}})
    
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

        send_notification(user, "USER_REGISTERED", {"username": user.username})

        login_user(user)

        return jsonify({'success': True, 'user': {'id': user.id, 'username': user.username, 'email': user.email, 'coins': user.coins, 'is_admin': getattr(user, 'is_admin', False)}}), 201
    
    @app.route('/api/auth/logout', methods=['POST'])
    @login_required
    def api_logout():
        logout_user()
        return jsonify({'success': True, 'message': 'Logged out'})
    
    # GOOGLE OAUTH
    @app.route('/auth/google')
    def login_with_google():
        redirect_uri = url_for('oauth_callback', _external=True)
        return app.google.authorize_redirect(redirect_uri)
    
    @app.route('/auth/google/callback')
    def oauth_callback():
        try:
            token = app.google.authorize_access_token()
            user_info = token.get('userinfo')
            
            if not user_info:
                return redirect('/')
            
            email = user_info.get('email', '').lower()
            username = user_info.get('name', email.split('@')[0] if email else 'user')
            
            if not email:
                return redirect('/')
            
            user = User.query.filter_by(email=email).first()
            is_new_user = False
            if not user:
                user = User(email=email, username=username)
                user.set_password('oauth-' + os.urandom(16).hex())
                db.session.add(user)
                db.session.commit()
                is_new_user = True
                # Send welcome notification for new OAuth users
                from server.notifications.service import send_notification
                send_notification(user, 'USER_REGISTERED', {'username': username})
            
            login_user(user)
            return redirect('/')
        except Exception as e:
            return redirect('/')
    
    @app.route('/api/auth/current-user')
    def api_current_user():
        if current_user.is_authenticated:
            return jsonify({'success': True, 'user': {'id': current_user.id, 'username': current_user.username, 'email': current_user.email, 'coins': current_user.coins, 'is_admin': current_user.is_admin}})
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    # HABITS
    @app.route('/api/habits', methods=['GET', 'POST'])
    @login_required
    def api_habits():
        if request.method == 'GET':
            habits = HabitLogic.get_user_habits(current_user.id)
            return jsonify({'success': True, 'habits': habits})
        data = request.get_json()
        if not data or not data.get('name'):
            return jsonify({'success': False, 'error': 'Habit name required'}), 400
        HabitLogic.create_habit(current_user.id, data.get('name').strip(), data.get('description', ''), data.get('frequency', 'daily'), data.get('color', '#007bff'), data.get('icon', 'fa-circle'))
        return jsonify({'success': True, 'message': f'Habit created! You earned 10 coins!'}), 201
    
    @app.route('/api/completed-logs', methods=['GET'])
    @login_required
    def api_completed_logs():
        logs = HabitLog.query.filter_by(user_id=current_user.id).order_by(HabitLog.completed_date.desc()).limit(20).all()
        result = []
        for log in logs:
            result.append({
                'id': log.id,
                'habit_name': log.habit.name,
                'completed_date': log.completed_date.strftime('%Y-%m-%d'),
                'coins_earned': log.coins_earned
            })
        return jsonify({'success': True, 'logs': result})
    
    @app.route('/api/habits/<int:habit_id>/complete', methods=['POST'])
    @login_required
    def api_complete_habit(habit_id):
        data = request.get_json()
        image_url = None
        
        if data and data.get('image_url'):
            try:
                base64_str = data.get('image_url').split(',')[1] if ',' in data.get('image_url') else data.get('image_url')
                image_data = base64.b64decode(base64_str)
                filename = f"habit_{habit_id}_{current_user.id}_{datetime.utcnow().timestamp()}.png"
                filepath = os.path.join(UPLOAD_FOLDER, filename)
                os.makedirs(UPLOAD_FOLDER, exist_ok=True)
                with open(filepath, 'wb') as f:
                    f.write(image_data)
                image_url = f"/static/uploads/{filename}"
            except Exception as e:
                print(f"Error saving image: {e}")
        
        log, error = HabitLogic.complete_habit(current_user.id, habit_id, image_url)
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
        
        # Send email to admin
        try:
            from server.notifications.service import send_notification
            from server.models import User as UserModel
            admin = UserModel.query.filter_by(is_admin=True).first()
            if admin:
                send_notification(admin, 'SUPPORT_RECEIVED', {
                    'user_email': data.get('email'),
                    'subject': data.get('subject'),
                    'message': data.get('message')
                })
        except Exception as e:
            print(f"Error sending support notification: {e}")
        
        return jsonify({'success': True, 'message': 'Feedback received!'})
    
    # FEED
    @app.route('/api/feed', methods=['GET'])
    @login_required
    def api_feed():
        page = request.args.get('page', 1, type=int)
        feed, total_pages = FeedLogic.get_feed(page, user_id=current_user.id)
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
        
        if current_user.coins < 1:
            return jsonify({'success': False, 'error': 'Not enough coins! You need 1 coin to comment. Complete a habit to earn coins.'}), 400
        
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
    
    # ADMIN ROUTES
    @app.route('/api/admin/comments', methods=['GET'])
    @login_required
    def api_admin_comments():
        if not getattr(current_user, 'is_admin', False):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        try:
            from server.models import Comment as CommentModel
            comments = CommentModel.query.all()
            result = []
            for c in comments:
                result.append({
                    'id': c.id,
                    'author': c.author.username,
                    'content': c.content,
                    'created_at': c.created_at.strftime('%Y-%m-%d %H:%M:%S')
                })
            return jsonify({'success': True, 'comments': result})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route('/api/admin/comments/<int:comment_id>/delete', methods=['POST'])
    @login_required
    def api_admin_delete_comment(comment_id):
        if not getattr(current_user, 'is_admin', False):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        try:
            from server.models import Comment as CommentModel
            comment = CommentModel.query.get(comment_id)
            if comment:
                user = comment.author
                user.coins += 1
                db.session.delete(comment)
                db.session.commit()
                return jsonify({'success': True, 'message': 'Comment removed and coin refunded'})
            return jsonify({'success': False, 'error': 'Not found'}), 404
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    @app.route('/api/admin/posts', methods=['GET'])
    @login_required
    def api_admin_posts():
        if not getattr(current_user, 'is_admin', False):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        logs = HabitLog.query.filter(HabitLog.image_url != None).all()
        return jsonify({'success': True, 'posts': [{'id': l.id, 'user': l.user.username, 'habit': l.habit.name, 'image_url': l.image_url, 'created_at': l.completed_date.strftime('%Y-%m-%d %H:%M:%S')} for l in logs]})
    
    @app.route('/api/admin/posts/<int:log_id>/delete-image', methods=['POST'])
    @login_required
    def api_admin_delete_image(log_id):
        if not getattr(current_user, 'is_admin', False):
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        log = HabitLog.query.get(log_id)
        if log and log.image_url:
            try:
                os.remove(log.image_url.lstrip('/'))
            except Exception:
                pass
            log.image_url = None
            db.session.commit()
            return jsonify({'success': True, 'message': 'Image removed'})
        return jsonify({'success': False, 'error': 'Not found'}), 404
    
    # LIKES
    @app.route('/api/feed/<int:log_id>/like', methods=['POST'])
    @login_required
    def api_like_post(log_id):
        like, error = FeedLogic.like_post(current_user.id, log_id)
        if error:
            return jsonify({'success': False, 'error': error}), 400
        like_count = FeedLogic.get_like_count(log_id)
        return jsonify({'success': True, 'message': 'Liked!', 'likes': like_count}), 201
    
    @app.route('/api/feed/<int:log_id>/unlike', methods=['POST'])
    @login_required
    def api_unlike_post(log_id):
        if FeedLogic.unlike_post(current_user.id, log_id):
            like_count = FeedLogic.get_like_count(log_id)
            return jsonify({'success': True, 'message': 'Unliked!', 'likes': like_count})
        return jsonify({'success': False, 'error': 'Not liked'}), 400
