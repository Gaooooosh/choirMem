import os
import subprocess
import shutil
from app import create_app, db

def setup_database(app):
    """
    Ensures the database is created and up-to-date with all migrations.
    Also creates initial data if the database is empty.
    """
    with app.app_context():
        migrations_path = 'migrations'
        
        # On the very first run, the persistent volume will be empty.
        # So, we initialize the migration history.
        if not os.path.exists(migrations_path) or not os.listdir(migrations_path):
            print("Migrations folder not found or empty. Performing first-time setup...")
            
            # This problematic line has been removed.
            # if os.path.exists(migrations_path):
            #     shutil.rmtree(migrations_path)

            subprocess.run(["flask", "db", "init"], check=True)
            subprocess.run(["flask", "db", "migrate", "-m", "Initial database schema"], check=True)
            print("Migration history initialized.")
        
        # For every startup (including the first), run upgrade.
        print("Ensuring database schema is up-to-date...")
        subprocess.run(["flask", "db", "upgrade"], check=True)
        print("Database schema is up to date.")

        # Import models only after the schema is ready
        from app.models import User, SystemSetting

        # Check if we need to add the very first user.
        if User.query.first() is None:
            print("Database is empty. Creating initial data...")
            
            admin_username = os.environ.get('ADMIN_USER', 'admin')
            admin_password = os.environ.get('ADMIN_PASSWORD', 'change_this_password')
            
            print(f"Creating default admin user: {admin_username}...")
            admin_user = User(username=admin_username, is_admin=True)
            admin_user.set_password(admin_password)
            db.session.add(admin_user)
            
            print("Enabling user registration by default...")
            setting = SystemSetting(key='registration_enabled', value='True')
            db.session.add(setting)
            
            db.session.commit()
            print("Initial data created successfully.")
        else:
            print("Database already contains data. Skipping initial data creation.")

if __name__ == "__main__":
    app = create_app()
    setup_database(app)