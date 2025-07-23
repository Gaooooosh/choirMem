from functools import wraps
from flask import abort
from flask_login import current_user

def permission_required(permission_name):
    """
    A decorator that checks if the current user has the required permission.
    An admin user bypasses all checks.
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.can(permission_name):
                abort(403, description=f"Permission denied: {permission_name} is required.")
            return f(*args, **kwargs)
        return decorated_function
    return decorator