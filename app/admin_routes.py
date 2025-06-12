from flask import render_template, flash, redirect, url_for, request, abort, Blueprint, current_app
from app import db
from app.models import User, SystemSetting, PermissionGroup
from flask_login import current_user, login_required
import random
import string

# Create a new Blueprint for admin pages
admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

# This decorator checks if the user is an admin for ALL routes in this blueprint
@admin_bp.before_request
@login_required
def require_admin():
    if not current_user.is_admin:
        current_app.logger.warning(f"Non-admin user '{current_user.username}' attempted to access admin page: {request.path}")
        abort(403) # Forbidden

@admin_bp.route('/')
def index():
    return redirect(url_for('admin.user_management'))

@admin_bp.route('/users')
def user_management():
    users = User.query.all()
    groups = PermissionGroup.query.all()
    return render_template('admin_users.html', title='User Management', users=users, groups=groups)

@admin_bp.route('/users/<int:user_id>/assign_group', methods=['POST'])
def assign_group(user_id):
    user = User.query.get_or_404(user_id)
    group_id = request.form.get('group_id')
    if group_id == '0': # '0' means "No Group"
        user.group_id = None
    else:
        user.group_id = group_id
    db.session.commit()
    flash(f'User {user.username}\'s group has been updated.', 'success')
    return redirect(url_for('admin.user_management'))

@admin_bp.route('/users/add', methods=['POST'])
def add_user():
    username = request.form.get('username')
    password = request.form.get('password')
    is_admin = request.form.get('is_admin') == 'on'

    if not username or not password:
        flash('Username and password are required.', 'danger')
        return redirect(url_for('admin.user_management'))
    
    if User.query.filter_by(username=username).first():
        flash('Username already exists.', 'danger')
        return redirect(url_for('admin.user_management'))

    new_user = User(username=username, is_admin=is_admin)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()
    flash(f'User "{username}" created successfully.', 'success')
    return redirect(url_for('admin.user_management'))

@admin_bp.route('/users/<int:user_id>/toggle_admin', methods=['POST'])
def toggle_admin(user_id):
    user = User.query.get_or_404(user_id)
    # Prevent admin from de-admining themselves if they are the last one
    if user == current_user and User.query.filter_by(is_admin=True).count() == 1:
        flash('You cannot remove your own admin status as you are the only admin.', 'danger')
        return redirect(url_for('admin.user_management'))
        
    user.is_admin = not user.is_admin
    db.session.commit()
    flash(f'User "{user.username}" admin status updated.', 'success')
    return redirect(url_for('admin.user_management'))

@admin_bp.route('/users/<int:user_id>/reset_password', methods=['POST'])
def reset_password(user_id):
    user = User.query.get_or_404(user_id)
    new_password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
    user.set_password(new_password)
    db.session.commit()
    flash(f'Password for "{user.username}" has been reset to: {new_password}. Please save this password.', 'success')
    return redirect(url_for('admin.user_management'))

@admin_bp.route('/users/<int:user_id>/delete', methods=['POST'])
def delete_user(user_id):
    user_to_delete = User.query.get_or_404(user_id)
    if user_to_delete.is_admin and User.query.filter_by(is_admin=True).count() == 1:
        flash("You cannot delete the last admin account.", "danger")
        return redirect(url_for('admin.user_management'))
    if user_to_delete.id == current_user.id:
        flash("You cannot delete your own account.", "danger")
        return redirect(url_for('admin.user_management'))
    
    # Here you might want to re-assign or delete content created by the user
    # For now, we'll just delete the user
    db.session.delete(user_to_delete)
    db.session.commit()
    flash(f"User '{user_to_delete.username}' has been deleted.", "success")
    return redirect(url_for('admin.user_management'))


@admin_bp.route('/system')
def system_settings():
    registration_enabled = SystemSetting.is_registration_enabled()
    homepage_photo_max = SystemSetting.get('homepage_photo_max', '3')
    return render_template('admin_system.html', 
                           title='System Settings', 
                           registration_enabled=registration_enabled,
                           homepage_photo_max=homepage_photo_max)

@admin_bp.route('/system/toggle_registration', methods=['POST'])
def toggle_registration():
    current_status = SystemSetting.is_registration_enabled()
    SystemSetting.set('registration_enabled', not current_status)
    flash(f'User registration has been {"disabled" if current_status else "enabled"}.', 'success')
    return redirect(url_for('admin.system_settings'))

@admin_bp.route('/system/update_homepage_photos', methods=['POST'])
def update_homepage_photos():
    max_photos = request.form.get('max_photos', '3')
    SystemSetting.set('homepage_photo_max', max_photos)
    flash(f'Homepage max photos set to {max_photos}.', 'success')
    return redirect(url_for('admin.system_settings'))

@admin_bp.route('/groups')
def group_management():
    groups = PermissionGroup.query.order_by(PermissionGroup.name).all()
    return render_template('admin_groups.html', title='Permission Groups', groups=groups)

@admin_bp.route('/groups/new', methods=['GET', 'POST'])
def create_group():
    if request.method == 'POST':
        group = PermissionGroup(
            name=request.form['name'],
            can_view_scores=request.form.get('can_view_scores') == 'on',
            can_upload_scores=request.form.get('can_upload_scores') == 'on',
            can_upload_photos=request.form.get('can_upload_photos') == 'on',
            can_post_comments=request.form.get('can_post_comments') == 'on',
            can_create_tracks=request.form.get('can_create_tracks') == 'on'
        )
        db.session.add(group)
        db.session.commit()
        flash(f'Group "{group.name}" created.', 'success')
        return redirect(url_for('admin.group_management'))
    return render_template('admin_group_form.html', title='Create New Group', group=None)

@admin_bp.route('/groups/<int:group_id>/edit', methods=['GET', 'POST'])
def edit_group(group_id):
    group = PermissionGroup.query.get_or_404(group_id)
    if request.method == 'POST':
        group.name = request.form['name']
        group.can_view_scores = request.form.get('can_view_scores') == 'on'
        group.can_upload_scores = request.form.get('can_upload_scores') == 'on'
        group.can_upload_photos = request.form.get('can_upload_photos') == 'on'
        group.can_post_comments = request.form.get('can_post_comments') == 'on'
        group.can_create_tracks = request.form.get('can_create_tracks') == 'on'
        db.session.commit()
        flash(f'Group "{group.name}" updated.', 'success')
        return redirect(url_for('admin.group_management'))
    return render_template('admin_group_form.html', title='Edit Group', group=group)

@admin_bp.route('/groups/<int:group_id>/delete', methods=['POST'])
def delete_group(group_id):
    group = PermissionGroup.query.get_or_404(group_id)
    db.session.delete(group)
    db.session.commit()
    flash(f'Group "{group.name}" deleted.', 'success')
    return redirect(url_for('admin.group_management'))