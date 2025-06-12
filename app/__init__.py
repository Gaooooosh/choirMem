import os
import logging
import shutil
from datetime import datetime
from flask import Flask
from config import Config
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_bcrypt import Bcrypt
import markdown
import click

# --- (No changes to this section) ---
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

    # --- (create-admin command is unchanged) ---
    from app.models import User
    @app.cli.command("create-admin")
    @click.argument("username")
    @click.option("--password", prompt=True, hide_input=True, confirmation_prompt=True)
    def create_admin(username, password):
        # ... (function body is unchanged)
        pass


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

    return app