import os
import logging
import shutil
from datetime import datetime
import uuid
from flask import Flask, render_template
from config import Config
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager,current_user
from flask_bcrypt import Bcrypt
import markdown
import click
from pypinyin import pinyin, Style
import tarfile
import tempfile

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
    from app.article_routes import article_bp
    app.register_blueprint(article_bp)
    from app.profile_routes import profile_bp
    app.register_blueprint(profile_bp)
    from app.collection_routes import collection_bp
    app.register_blueprint(collection_bp)
    from app.api_routes import api_bp
    app.register_blueprint(api_bp)
    # ------------------------------------------------
    @app.before_request
    def before_request():
        if current_user.is_authenticated:
            current_user.update_last_seen()

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
            db.create_all()  # Re-establish database connection
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
        
    @app.cli.command("recalculate-scores")
    def recalculate_scores_command():
        """One-time command to calculate activity scores for all existing users."""
        users = User.query.all()
        print(f"Recalculating scores for {len(users)} users...")
        for user in users:
            # Count contributions directly from the database
            user.comment_count = user.comments.count()
            user.score_upload_count = user.scores.count()
            user.photo_upload_count = user.photos.count()
            # Calculate and save the final score
            user.recalculate_activity_score()
        db.session.commit()
        print("✅ All user activity scores have been updated.")

    @app.cli.group()
    def backup():
        """Commands for database and file backup/restore."""
        pass

    @backup.command("create")
    def backup_create():
        """Creates a full backup (database + uploads) as a single .tar.gz file."""
        with app.app_context():
            print("Starting comprehensive backup...")
            db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '/')
            uploads_path = app.config['UPLOAD_FOLDER']
            
            with tempfile.TemporaryDirectory() as temp_dir:
                print(f"Staging backup in temporary directory: {temp_dir}")
                if os.path.exists(db_path):
                    shutil.copy2(db_path, os.path.join(temp_dir, 'app.db'))
                    print("... Database file staged.")
                else:
                    print("[WARNING] Database file not found. Skipping.")

                if os.path.exists(uploads_path) and os.listdir(uploads_path):
                    archive_name = os.path.join(temp_dir, 'uploads.tar.gz')
                    with tarfile.open(archive_name, "w:gz") as tar:
                        for item in os.listdir(uploads_path):
                            tar.add(os.path.join(uploads_path, item), arcname=item)
                    print("... Uploaded files and their folder structure archived correctly.")
                
                timestamp = datetime.now().strftime('%Y-%m-%d_%H%M%S')
                final_backup_name = f'choir-backup-{timestamp}.tar.gz'
                final_backup_path = os.path.join(uploads_path, final_backup_name)

                print(f"Creating final archive: {final_backup_name}...")
                with tarfile.open(final_backup_path, "w:gz") as tar:
                    tar.add(temp_dir, arcname='.')
                
                print("="*50)
                print("✅ Comprehensive backup successful!")
                print(f"   Backup file created at: uploads/{final_backup_name}")
                print("="*50)

    @backup.command("restore")
    @click.argument("filename")
    @click.confirmation_option(prompt="This will completely overwrite all current data and files. Are you sure?")
    def backup_restore(filename):
        """Restores the application from a comprehensive backup file."""
        with app.app_context():
            print(f"Starting restore from {filename}...")
            uploads_path = app.config['UPLOAD_FOLDER']
            db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '/')
            backup_file_path = os.path.join(uploads_path, filename)

            if not os.path.exists(backup_file_path):
                print(f"[ERROR] Backup file not found at {backup_file_path}")
                return

            with tempfile.TemporaryDirectory() as temp_dir:
                print("Extracting backup archive...")
                with tarfile.open(backup_file_path, "r:gz") as tar:
                    tar.extractall(path=temp_dir)
                
                restored_db_path = os.path.join(temp_dir, 'app.db')
                if os.path.exists(restored_db_path):
                    print("Restoring database...")
                    db.session.remove()
                    db.engine.dispose()
                    shutil.copy2(restored_db_path, db_path)
                    print("... Database restored.")

                restored_uploads_archive = os.path.join(temp_dir, 'uploads.tar.gz')
                if os.path.exists(restored_uploads_archive):
                    print("Clearing old uploads and restoring from backup...")
                    for item in os.listdir(uploads_path):
                        if item == filename: continue
                        item_path = os.path.join(uploads_path, item)
                        try:
                            if os.path.isfile(item_path) or os.path.islink(item_path):
                                os.unlink(item_path)
                            elif os.path.isdir(item_path):
                                shutil.rmtree(item_path)
                        except Exception as e:
                            print(f'Failed to delete {item_path}. Reason: {e}')
                    
                    # --- CORRECTED EXTRACTION LOGIC ---
                    with tarfile.open(restored_uploads_archive, "r:gz") as tar:
                        tar.extractall(path=uploads_path)
                    print("... Uploads and folder structure restored.")
            
            print("="*50)
            print("✅ Restore complete!")
            print("   Please restart the application to apply all changes.")
            print("="*50)

    return app
