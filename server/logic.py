# server/logic.py
from datetime import datetime, timedelta
from server.models import db, User, Habit, HabitLog, Comment

class HabitLogic:
    @staticmethod
    def get_user_habits(user_id):
        habits = Habit.query.filter_by(user_id=user_id, is_active=True).all()
        today = datetime.utcnow().date()
        return [{
            'id': h.id, 'name': h.name, 'description': h.description, 'frequency': h.frequency,
            'coin_reward': h.coin_reward, 'color': h.color, 'icon': h.icon,
            'completed_today': HabitLog.query.filter_by(habit_id=h.id, user_id=user_id, completed_date=today).first() is not None,
            'created_at': h.created_at.isoformat()
        } for h in habits]
    
    @staticmethod
    def create_habit(user_id, name, description='', frequency='daily', color='#007bff', icon='fa-circle'):
        user = User.query.get(user_id)
        habit = Habit(user_id=user_id, name=name, description=description, frequency=frequency,
                     coin_reward=10, color=color, icon=icon)
        db.session.add(habit)
        db.session.commit()
        return habit
    
    @staticmethod
    def complete_habit(user_id, habit_id, image_url=None):
        habit = Habit.query.get(habit_id)
        user = User.query.get(user_id)
        today = datetime.utcnow().date()
        
        if HabitLog.query.filter_by(habit_id=habit_id, user_id=user_id, completed_date=today).first():
            return None, "Already completed today"
        
        log = HabitLog(habit_id=habit_id, user_id=user_id, completed_date=today, coins_earned=habit.coin_reward, image_url=image_url)
        db.session.add(log)
        user.coins += habit.coin_reward
        
        # Update streak
        yesterday = today - timedelta(days=1)
        yesterday_log = HabitLog.query.filter_by(habit_id=habit_id, user_id=user_id, completed_date=yesterday).first()
        
        if yesterday_log:
            # Streak continues
            habit.current_streak += 1
        else:
            # Reset or start streak
            habit.current_streak = 1
        
        # Update longest streak
        if habit.current_streak > habit.longest_streak:
            habit.longest_streak = habit.current_streak
        
        db.session.commit()
        return log, None
    
    @staticmethod
    def delete_habit(user_id, habit_id):
        habit = Habit.query.get(habit_id)
        if habit.user_id != user_id:
            return False
        db.session.delete(habit)
        db.session.commit()
        return True

class FeedLogic:
    @staticmethod
    def get_feed(page=1, per_page=10, user_id=None):
        from server.models import Like
        logs = HabitLog.query.order_by(HabitLog.created_at.desc()).paginate(page=page, per_page=per_page)
        feed_data = []
        for log in logs.items:
            habit = Habit.query.get(log.habit_id)
            user = User.query.get(log.user_id)
            if habit and user:
                like_count = Like.query.filter_by(habit_log_id=log.id).count()
                user_liked = Like.query.filter_by(habit_log_id=log.id, user_id=user_id).first() is not None if user_id else False
                feed_data.append({
                    'id': log.id, 'user': user.username, 'habit_name': habit.name,
                    'habit_color': habit.color, 'habit_icon': habit.icon, 'image_url': log.image_url,
                    'completed_date': log.completed_date.isoformat(), 'coins_earned': log.coins_earned,
                    'comments_count': Comment.query.filter_by(habit_log_id=log.id).count(),
                    'likes': like_count, 'liked': user_liked,
                    'created_at': log.created_at.strftime('%Y-%m-%d %H:%M:%S')
                })
        return feed_data, logs.pages
    
    @staticmethod
    def get_comments(log_id, current_user_id):
        comments = Comment.query.filter_by(habit_log_id=log_id).order_by(Comment.created_at.asc()).all()
        return [{
            'id': c.id, 'author': c.author.username, 'content': c.content,
            'created_at': c.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'is_owner': c.user_id == current_user_id
        } for c in comments]
    
    @staticmethod
    def add_comment(user_id, log_id, content):
        user = User.query.get(user_id)
        if user.coins < 1:
            return None, "Not enough coins"
        comment = Comment(user_id=user_id, habit_log_id=log_id, content=content, cost=1)
        db.session.add(comment)
        user.coins -= 1
        db.session.commit()
        return comment, None
    
    @staticmethod
    def delete_comment(user_id, comment_id):
        comment = Comment.query.get(comment_id)
        if not comment or comment.user_id != user_id:
            return False
        user = User.query.get(user_id)
        user.coins += comment.cost
        db.session.delete(comment)
        db.session.commit()
        return True
    
    @staticmethod
    def like_post(user_id, log_id):
        """Like a habit log post (free)"""
        from server.models import Like
        existing = Like.query.filter_by(user_id=user_id, habit_log_id=log_id).first()
        if existing:
            return None, "Already liked"
        like = Like(user_id=user_id, habit_log_id=log_id)
        db.session.add(like)
        db.session.commit()
        return like, None
    
    @staticmethod
    def unlike_post(user_id, log_id):
        """Unlike a habit log post"""
        from server.models import Like
        like = Like.query.filter_by(user_id=user_id, habit_log_id=log_id).first()
        if not like:
            return False
        db.session.delete(like)
        db.session.commit()
        return True
    
    @staticmethod
    def get_like_count(log_id):
        """Get total likes for a post"""
        from server.models import Like
        return Like.query.filter_by(habit_log_id=log_id).count()
