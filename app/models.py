import os
from app import db, login, bcrypt
from flask_login import UserMixin
from datetime import datetime
from sqlalchemy import func
from hashlib import md5
from flask import url_for, current_app
# Association table for Likes
likes = db.Table('likes',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('version_id', db.Integer, db.ForeignKey('version.id'), primary_key=True)
)

# Association table for Tags
version_tags = db.Table('version_tags',
    db.Column('version_id', db.Integer, db.ForeignKey('version.id'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('tag.id'), primary_key=True)
)
collection_versions = db.Table('collection_versions',
    db.Column('collection_id', db.Integer, db.ForeignKey('collection.id'), primary_key=True),
    db.Column('version_id', db.Integer, db.ForeignKey('version.id'), primary_key=True)
)


class PermissionGroup(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    
    # Permissions
    can_view_scores = db.Column(db.Boolean, default=True)      # 预览、下载曲谱
    can_upload_scores = db.Column(db.Boolean, default=False)   # 上传曲谱
    can_upload_photos = db.Column(db.Boolean, default=False)   # 上传照片
    can_post_comments = db.Column(db.Boolean, default=True)    # 发表评论
    can_create_tracks = db.Column(db.Boolean, default=False)   # 创建新曲目/版本

    users = db.relationship('User', backref='group', lazy='dynamic')

    def __repr__(self):
        return f'<PermissionGroup {self.name}>'

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True)
    password_hash = db.Column(db.String(128))
    is_admin = db.Column(db.Boolean, default=False)
    group_id = db.Column(db.Integer, db.ForeignKey('permission_group.id'))
    email = db.Column(db.String(120), index=True, unique=True, nullable=True)
    versions = db.relationship('Version', backref='creator', lazy='dynamic')
    scores = db.relationship('Score', backref='uploader', lazy='dynamic')
    comments = db.relationship('Comment', back_populates='author', lazy='dynamic', cascade="all, delete-orphan")
    liked_versions = db.relationship('Version', secondary=likes, back_populates='likes')
    ratings = db.relationship('Rating', backref='user', lazy='dynamic', cascade="all, delete-orphan")
    photos = db.relationship('Photo', back_populates='uploader', lazy='dynamic', cascade="all, delete-orphan")
    collections = db.relationship('Collection', back_populates='creator', lazy='dynamic', cascade="all, delete-orphan")
    articles = db.relationship('Article', back_populates='author', lazy='dynamic', cascade="all, delete-orphan")
    avatar_filename = db.Column(db.String(200), default='default_avatar.png',nullable=True)
    bio = db.Column(db.Text)
    has_seen_welcome = db.Column(db.Boolean, default=False)
    about_me = db.Column(db.Text)
    comments = db.relationship('Comment', back_populates='author', lazy='dynamic', cascade="all, delete-orphan")
    activity_score = db.Column(db.Integer, default=0, index=True)
    last_seen = db.Column(db.DateTime, default=datetime.now)

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)
        
    def can(self, permission_name):
        if self.is_admin: return True
        if not self.group: return False
        return getattr(self.group, permission_name, False)
    
    def update_last_seen(self):
        """Updates the last_seen timestamp to now."""
        self.last_seen = datetime.now()
        db.session.commit()

    def recalculate_activity_score(self):
        """Calculates and updates the user's activity score based on their contributions."""
        # Define the weights for each action
        comment_weight = 1
        score_weight = 5
        photo_weight = 2
        
        # Calculate the score
        score = (
            (self.comment_count or 0) * comment_weight +
            (self.score_upload_count or 0) * score_weight +
            (self.photo_upload_count or 0) * photo_weight
        )
        self.activity_score = score
    
    @property
    def avatar(self):
        """
        Returns the URL for the user's avatar.
        - If they uploaded a custom one, returns the path to that file.
        - If not, returns a deterministically random avatar from the default pool.
        """
        # Case 1: User has uploaded a custom avatar.
        if self.avatar_filename:
            return url_for('track.view_photo', filename=self.avatar_filename)

        # Case 2: User has NOT set an avatar. Assign a random default one.
        else:
            try:
                # Get the list of available default avatars
                uploads_dir = current_app.config['UPLOAD_FOLDER']
                default_avatars = [f for f in os.listdir(uploads_dir) if f.startswith('default_')]
                if not default_avatars:
                    # Fallback if no defaults have been uploaded
                    return url_for('static', filename='fallback.png') # Assumes you create this static fallback
                
                # Pick a consistent random avatar based on user ID
                chosen_avatar = default_avatars[self.id % len(default_avatars)]
                return url_for('track.view_photo', filename=chosen_avatar)

            except (FileNotFoundError, IndexError):
                # Handle cases where the uploads directory or files don't exist
                return url_for('static', filename='images/fallback.png')


@login.user_loader
def load_user(id):
    return User.query.get(int(id))

class Track(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(140), nullable=False, index=True)
    title_sort = db.Column(db.String(140), index=True)
    description = db.Column(db.Text) 
    versions = db.relationship('Version', backref='track', lazy='dynamic', cascade="all, delete-orphan")
    comments = db.relationship('Comment', back_populates='track', lazy='dynamic', cascade="all, delete-orphan")
    photos = db.relationship('Photo', secondary='version', primaryjoin='Track.id == Version.track_id', secondaryjoin='Version.id == Photo.version_id', viewonly=True, lazy='dynamic')

class Version(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    notes = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, index=True, default=datetime.now)
    track_id = db.Column(db.Integer, db.ForeignKey('track.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    
    scores = db.relationship('Score', backref='version', lazy='dynamic', cascade="all, delete-orphan")
    tags = db.relationship('Tag', secondary=version_tags, back_populates='versions')
    comments = db.relationship('Comment', back_populates='version', lazy='dynamic', cascade="all, delete-orphan")
    photos = db.relationship('Photo', backref='version', lazy='dynamic', cascade="all, delete-orphan")
    likes = db.relationship('User', secondary=likes, back_populates='liked_versions')
    ratings = db.relationship('Rating', backref='version', lazy='dynamic', cascade="all, delete-orphan")
    collections = db.relationship('Collection', secondary=collection_versions, back_populates='versions')

    @property
    def avg_difficulty(self):
        # Use a proper query for efficiency
        avg = db.session.query(func.avg(Rating.difficulty)).filter(Rating.version_id == self.id).scalar()
        return avg or 0

class Score(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(200))
    filename = db.Column(db.String(200))
    timestamp = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    version_id = db.Column(db.Integer, db.ForeignKey('version.id'), nullable=False)

class Tag(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), unique=True, nullable=False, index=True)
    versions = db.relationship('Version', secondary=version_tags, back_populates='tags')

class SystemSetting(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(64), unique=True, nullable=False)
    value = db.Column(db.String(128))
    @staticmethod
    def get(key, default=None):
        setting = SystemSetting.query.filter_by(key=key).first()
        return setting.value if setting else default
    @staticmethod
    def set(key, value):
        setting = SystemSetting.query.filter_by(key=key).first()
        if setting: setting.value = str(value)
        else:
            setting = SystemSetting(key=key, value=str(value))
            db.session.add(setting)
        db.session.commit()
    @staticmethod
    def is_registration_enabled():
        return SystemSetting.get('registration_enabled', 'True') == 'True'

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    body = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, index=True, default=datetime.now)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    track_id = db.Column(db.Integer, db.ForeignKey('track.id'))
    version_id = db.Column(db.Integer, db.ForeignKey('version.id'))
    author = db.relationship('User', back_populates='comments')
    track = db.relationship('Track', back_populates='comments')
    version = db.relationship('Version', back_populates='comments')

class Photo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(200), nullable=False)
    caption = db.Column(db.String(200))
    timestamp = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    version_id = db.Column(db.Integer, db.ForeignKey('version.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    uploader = db.relationship('User', back_populates='photos')

class Rating(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    difficulty = db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    version_id = db.Column(db.Integer, db.ForeignKey('version.id'), nullable=False)
    __table_args__ = (db.UniqueConstraint('user_id', 'version_id', name='_user_version_uc'),)

class Announcement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    # Level corresponds to Bootstrap alert colors, e.g., 'success' (green), 'secondary' (gray)
    level = db.Column(db.String(20), nullable=False, default='secondary')
    is_active = db.Column(db.Boolean, default=False, index=True)
    timestamp = db.Column(db.DateTime, index=True, default=datetime.utcnow)

    def __repr__(self):
        return f'<Announcement {self.id}>'


class InvitationCode(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(32), unique=True, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    group_id = db.Column(db.Integer, db.ForeignKey('permission_group.id'), nullable=False)
    group = db.relationship('PermissionGroup')

    # --- CORRECTED: Added server_default='1' ---
    total_uses = db.Column(db.Integer, nullable=True, server_default='1')
    uses_left = db.Column(db.Integer, nullable=True, server_default='1')

    def __repr__(self):
        return f'<InvitationCode {self.code}>'
    
class Article(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    body = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    author = db.relationship('User')

class Collection(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False, index=True)
    description = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    creator = db.relationship('User')
    versions = db.relationship('Version', secondary=collection_versions, back_populates='collections', lazy='dynamic')
