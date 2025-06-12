from app import db, login, bcrypt
from flask_login import UserMixin
from datetime import datetime


likes = db.Table('likes',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('version_id', db.Integer, db.ForeignKey('version.id'), primary_key=True)
)

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True)
    password_hash = db.Column(db.String(128))
    is_admin = db.Column(db.Boolean, default=False)
    
    versions = db.relationship('Version', backref='creator', lazy='dynamic')
    scores = db.relationship('Score', backref='uploader', lazy='dynamic')
    comments = db.relationship('Comment', back_populates='author', lazy='dynamic')
    liked_versions = db.relationship('Version', secondary=likes, back_populates='likes')
    # NEW: Relationship to see ratings a user has given
    ratings = db.relationship('Rating', backref='user', lazy='dynamic')

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

@login.user_loader
def load_user(id):
    return User.query.get(int(id))

version_tags = db.Table('version_tags',
    db.Column('version_id', db.Integer, db.ForeignKey('version.id'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('tag.id'), primary_key=True)
)

class Track(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(140), nullable=False, index=True)
    description = db.Column(db.Text) 
    versions = db.relationship('Version', backref='track', lazy='dynamic', cascade="all, delete-orphan")
    comments = db.relationship('Comment', back_populates='track', lazy='dynamic', cascade="all, delete-orphan")
    photos = db.relationship('Photo', secondary='version', primaryjoin='Track.id == Version.track_id', secondaryjoin='Version.id == Photo.version_id', viewonly=True, lazy='dynamic')
    
class Version(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    notes = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    track_id = db.Column(db.Integer, db.ForeignKey('track.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    scores = db.relationship('Score', backref='version', lazy='dynamic', cascade="all, delete-orphan")
    tags = db.relationship('Tag', secondary=version_tags, back_populates='versions')
    comments = db.relationship('Comment', back_populates='version', lazy='dynamic', cascade="all, delete-orphan")
    photos = db.relationship('Photo', backref='version', lazy='dynamic', cascade="all, delete-orphan")
    likes = db.relationship('User', secondary=likes, back_populates='liked_versions')
    ratings = db.relationship('Rating', backref='version', lazy='dynamic', cascade="all, delete-orphan")
    # calculate average difficulty
    @property
    def avg_difficulty(self):
        if not self.ratings.all():
            return 0
        return sum(r.difficulty for r in self.ratings) / len(self.ratings.all())
    

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
        if setting:
            setting.value = str(value)
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
    timestamp = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    track_id = db.Column(db.Integer, db.ForeignKey('track.id'))
    version_id = db.Column(db.Integer, db.ForeignKey('version.id'))

    # --- CORRECTED RELATIONSHIPS ---
    author = db.relationship('User', back_populates='comments')
    track = db.relationship('Track', back_populates='comments')
    version = db.relationship('Version', back_populates='comments')

class Photo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(200), nullable=False)
    caption = db.Column(db.String(200))
    timestamp = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    
    # Foreign key to the Version it was uploaded to
    version_id = db.Column(db.Integer, db.ForeignKey('version.id'), nullable=False)
    # Foreign key to the user who uploaded it
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    uploader = db.relationship('User')

class Rating(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    difficulty = db.Column(db.Integer, nullable=False) # From 1 to 5
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    version_id = db.Column(db.Integer, db.ForeignKey('version.id'), nullable=False)
    
    # Ensures a user can only rate a version once
    __table_args__ = (db.UniqueConstraint('user_id', 'version_id', name='_user_version_uc'),)