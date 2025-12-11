from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    username = db.Column(db.String(80), nullable=False)
    oauth_id = db.Column(db.String(255), unique=True, nullable=True)
    password_hash = db.Column(db.String(255), nullable=True)
    coins = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    habits = db.relationship('Habit', backref='user', lazy=True, cascade='all, delete-orphan')
    habit_logs = db.relationship('HabitLog', backref='user', lazy=True, cascade='all, delete-orphan')
    purchases = db.relationship('UserPurchase', backref='user', lazy=True, cascade='all, delete-orphan')
    transactions = db.relationship('CoinTransaction', backref='user', lazy=True, cascade='all, delete-orphan')
    feedback = db.relationship('Feedback', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Hash and set the user password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Verify the user password"""
        return check_password_hash(self.password_hash, password)


class Habit(db.Model):
    __tablename__ = 'habits'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    frequency = db.Column(db.String(20), default='daily')  # daily, weekly, custom
    coin_reward = db.Column(db.Integer, default=5)
    color = db.Column(db.String(7), default='#007bff')  # hex color
    icon = db.Column(db.String(50), default='fa-circle')  # Font Awesome icon
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    logs = db.relationship('HabitLog', backref='habit', lazy=True, cascade='all, delete-orphan')
    comments = db.relationship('Comment', backref='habit', foreign_keys='Comment.habit_id', lazy=True, cascade='all, delete-orphan')
    comments = db.relationship('Comment', backref='habit', lazy=True, cascade='all, delete-orphan')


class HabitLog(db.Model):
    __tablename__ = 'habit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    habit_id = db.Column(db.Integer, db.ForeignKey('habits.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    completed_date = db.Column(db.Date, nullable=False)
    coins_earned = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class StoreItem(db.Model):
    __tablename__ = 'store_items'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Integer, nullable=False)  # price in coins
    image_url = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    purchases = db.relationship('UserPurchase', backref='item', lazy=True, cascade='all, delete-orphan')


class UserPurchase(db.Model):
    __tablename__ = 'user_purchases'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    item_id = db.Column(db.Integer, db.ForeignKey('store_items.id'), nullable=False)
    purchased_at = db.Column(db.DateTime, default=datetime.utcnow)
    coins_spent = db.Column(db.Integer, nullable=False)


class CoinTransaction(db.Model):
    __tablename__ = 'coin_transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Integer, nullable=False)  # positive or negative
    transaction_type = db.Column(db.String(50), nullable=False)  # earned, purchased, spent
    related_id = db.Column(db.Integer, nullable=True)  # habit_id or item_id
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Feedback(db.Model):
    __tablename__ = 'feedback'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    email = db.Column(db.String(120), nullable=False)
    subject = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_resolved = db.Column(db.Boolean, default=False)


class Comment(db.Model):
    __tablename__ = 'comments'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    habit_id = db.Column(db.Integer, db.ForeignKey('habits.id'), nullable=True)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    author = db.relationship('User', backref='user_comments')
