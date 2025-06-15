import os
import logging
import shutil
from datetime import datetime
import uuid
from flask import Flask, render_template
from config import Config
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_bcrypt import Bcrypt
import markdown
import click
from pypinyin import pinyin, Style

def generate_sort_key(text):
    """A helper function duplicated here for the CLI command."""
    pinyin_list = pinyin(text, style=Style.NORMAL)
    return "".join(item[0] for item in pinyin_list).lower()


db = SQLAlchemy()
migrate = Migrate()
login = LoginManager()
login.login_view = 'main.login'
login.login_message = '请登录以访问此页面。'
bcrypt = Bcrypt()
# ------------------------------------

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # --- (No changes to logging or .init_app calls) ---
    formatter = logging.Formatter('%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]')
    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(formatter)
    app.logger.addHandler(stream_handler)
    app.logger.setLevel(logging.INFO)
    app.logger.info('乐谱应用启动')

    db.init_app(app)
    migrate.init_app(app, db)
    login.init_app(app)
    bcrypt.init_app(app)

    @app.template_filter('markdown')
    def markdown_filter(s):
        return markdown.markdown(s) if s else ''

    # --- (No changes to blueprint registration) ---
    from app.routes import main_bp
    app.register_blueprint(main_bp)
    from app.admin_routes import admin_bp
    app.register_blueprint(admin_bp)
    from app.track_routes import track_bp
    app.register_blueprint(track_bp)
    # ------------------------------------------------
    
    @app.errorhandler(403)
    def forbidden_error(error):
        return render_template('errors/403.html'), 403

    @app.errorhandler(404)
    def not_found_error(error):
        return render_template('errors/404.html'), 404
    
    # --- (create-admin command is unchanged) ---
    from app.models import User
    @app.cli.command("create-admin")
    @click.argument("username")
    @click.option("--password", prompt=True, hide_input=True, confirmation_prompt=True)
    def create_admin(username, password):
        """Creates a new administrator user."""
        if User.query.filter_by(username=username).first():
            print(f"Error: User '{username}' already exists.")
            return
        
        admin_user = User(username=username, is_admin=True)
        admin_user.set_password(password)
        db.session.add(admin_user)
        db.session.commit()
        print(f"Admin user '{username}' created successfully.")


    # --- NEW: EXPORT DATABASE COMMAND ---
    @app.cli.command("export-db")
    def export_db_command():
        """Creates a timestamped backup of the database."""
        db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
        backup_folder = app.config['UPLOAD_FOLDER']
        
        if not os.path.exists(db_path):
            print(f"Error: Database file not found at {db_path}")
            return

        timestamp = datetime.now().strftime('%Y-%m-%d_%H%M%S')
        backup_filename = f'backup-{timestamp}.db'
        backup_path = os.path.join(backup_folder, backup_filename)
        
        try:
            shutil.copy2(db_path, backup_path)
            print("="*50)
            print("✅ Database export successful!")
            print(f"   Backup file created at: uploads/{backup_filename}")
            print("   You can find this file in the 'choir_uploads' Docker volume.")
            print("="*50)
        except Exception as e:
            print(f"Error during export: {e}")

            
    # --- NEW: IMPORT DATABASE COMMAND ---
    @app.cli.command("import-db")
    @click.argument("filename")
    @click.confirmation_option(prompt="This will overwrite the current database. Are you sure you want to continue?")
    def import_db_command(filename):
        """Restores the database from a backup file located in the uploads folder."""
        db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
        backup_folder = app.config['UPLOAD_FOLDER']
        backup_path = os.path.join(backup_folder, filename)

        if not os.path.exists(backup_path):
            print(f"Error: Backup file not found at uploads/{filename}")
            print("Please make sure the backup file is inside the 'choir_uploads' volume.")
            return
            
        try:
            # Stop the database connection to release the file lock
            db.session.remove()
            db.engine.dispose()

            shutil.copy2(backup_path, db_path)
            print("="*50)
            print("✅ Database import successful!")
            print(f"   The database has been restored from uploads/{filename}.")
            print("   You may need to restart the application for changes to take full effect.")
            print("="*50)
        except Exception as e:
            print(f"Error during import: {e}")

    @app.cli.command("reset-password")
    @click.argument("username")
    def reset_password_command(username):
        """Resets a user's password to a new random string."""
        user = User.query.filter_by(username=username).first()
        if not user:
            print(f"Error: User '{username}' not found.")
            return
        
        new_password = uuid.uuid4().hex[:12]
        user.set_password(new_password)
        db.session.commit()
        
        print("="*50)
        print(f"✅ Password for user '{username}' has been reset.")
        print(f"   New Password: {new_password}")
        print("   Please copy this password and use it to log in.")
        print("="*50)

    @app.cli.command("backfill-sort-titles")
    def backfill_sort_titles_command():
        """One-time command to populate the title_sort column for existing tracks."""
        from app.models import Track
        tracks = Track.query.filter(Track.title_sort == None).all()
        if not tracks:
            print("All tracks already have a sort title. Nothing to do.")
            return

        print(f"Found {len(tracks)} tracks to update...")
        for track in tracks:
            track.title_sort = generate_sort_key(track.title)
        
        db.session.commit()
        print("✅ Successfully back-filled sort titles for all tracks.")
        
    return app
