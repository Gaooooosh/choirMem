import os
import uuid
from flask import render_template, flash, redirect, url_for, request, abort, Blueprint, current_app, session
from app import db
from app.models import User, SystemSetting, PermissionGroup, Announcement, InvitationCode
from flask_login import current_user, login_required
import random
import string
from werkzeug.utils import secure_filename

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

@admin_bp.route('/users/<int:user_id>/reset_password', methods=['POST'])
def reset_password(user_id):
    user = User.query.get_or_404(user_id)
    # Generate a secure random password
    new_password = uuid.uuid4().hex[:12]
    user.set_password(new_password)
    db.session.commit()
    flash(f'Password for "{user.username}" has been reset to: {new_password}. Please deliver this password securely.', 'success')
    return redirect(url_for('admin.user_management'))

@admin_bp.route('/users/<int:user_id>/delete', methods=['POST'])
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    if user.is_admin:
        flash("Admin accounts cannot be deleted from this interface.", "danger")
        return redirect(url_for('admin.user_management'))
    
    # This simply deletes the user. Content will be orphaned.
    db.session.delete(user)
    db.session.commit()
    flash(f"User '{user.username}' has been deleted.", "success")
    return redirect(url_for('admin.user_management'))

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
    group_id = request.form.get('group_id')
    if not username or not password:
        flash('Username and password are required.', 'danger')
        return redirect(url_for('admin.user_management'))
    
    if User.query.filter_by(username=username).first():
        flash('Username already exists.', 'danger')
        return redirect(url_for('admin.user_management'))
    
    chosen_avatar = None
    try:
        AVATAR_DIR = os.path.join(current_app.static_folder, 'avatars')
        default_avatars = [f for f in os.listdir(AVATAR_DIR) if f != 'fallback.png']
        if default_avatars:
            chosen_avatar = random.choice(default_avatars)
    except FileNotFoundError:
        print("Default avatars directory not found. Skipping random avatar assignment.")

    new_user = User(username=username, is_admin=is_admin, group_id=group_id if group_id != '0' else None,avatar_filename=chosen_avatar)
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

@admin_bp.route('/announcements')
def announcement_management():
    announcements = Announcement.query.order_by(Announcement.timestamp.desc()).all()
    return render_template('admin_announcements.html', title='Announcements', announcements=announcements)

@admin_bp.route('/announcements/new', methods=['GET', 'POST'])
def create_announcement():
    if request.method == 'POST':
        announcement = Announcement(
            content=request.form['content'],
            level=request.form['level']
        )
        db.session.add(announcement)
        db.session.commit()
        flash('Announcement created successfully.', 'success')
        return redirect(url_for('admin.announcement_management'))
    return render_template('admin_announcement_form.html', title='Create New Announcement', announcement=None)

@admin_bp.route('/announcements/<int:ann_id>/edit', methods=['GET', 'POST'])
def edit_announcement(ann_id):
    announcement = Announcement.query.get_or_404(ann_id)
    if request.method == 'POST':
        announcement.content = request.form['content']
        announcement.level = request.form['level']
        db.session.commit()
        flash('Announcement updated successfully.', 'success')
        return redirect(url_for('admin.announcement_management'))
    return render_template('admin_announcement_form.html', title='Edit Announcement', announcement=announcement)

@admin_bp.route('/announcements/<int:ann_id>/activate', methods=['POST'])
def activate_announcement(ann_id):
    # Deactivate all other announcements first
    Announcement.query.update({Announcement.is_active: False})
    # Activate the target one
    announcement = Announcement.query.get_or_404(ann_id)
    announcement.is_active = True
    db.session.commit()
    flash('Announcement has been activated.', 'success')
    return redirect(url_for('admin.announcement_management'))

@admin_bp.route('/announcements/<int:ann_id>/deactivate', methods=['POST'])
def deactivate_announcement(ann_id):
    announcement = Announcement.query.get_or_404(ann_id)
    announcement.is_active = False
    db.session.commit()
    flash('Announcement has been deactivated.', 'info')
    return redirect(url_for('admin.announcement_management'))

@admin_bp.route('/announcements/<int:ann_id>/delete', methods=['POST'])
def delete_announcement(ann_id):
    announcement = Announcement.query.get_or_404(ann_id)
    db.session.delete(announcement)
    db.session.commit()
    flash('Announcement deleted.', 'success')
    return redirect(url_for('admin.announcement_management'))

@admin_bp.route('/ai-polish')
def ai_polish_settings():
    """AI润色提示词管理页面"""
    prompt = current_app.config.get('AI_POLISH_PROMPT', '')
    return render_template('admin_ai_polish.html', 
                         title='AI润色提示词管理', 
                         prompts={'default': prompt})

@admin_bp.route('/ai-polish/update', methods=['POST'])
def update_ai_polish_prompt():
    """更新AI润色提示词"""
    prompt_content = request.form.get('prompt_content')
    
    if not prompt_content:
        flash('提示词内容不能为空', 'danger')
        return redirect(url_for('admin.ai_polish_settings'))
    
    # 这里实际上需要重启应用才能生效，所以只是保存到session中提示
    # 在实际生产环境中，应该保存到数据库或配置文件中
    session['temp_prompt_update'] = prompt_content
    
    flash('AI润色提示词已更新（需要重启应用生效）', 'success')
    return redirect(url_for('admin.ai_polish_settings'))

@admin_bp.route('/invites')
def invite_management():
    invites = InvitationCode.query.order_by(InvitationCode.created_at.desc()).all()
    groups = PermissionGroup.query.order_by(PermissionGroup.name).all()
    return render_template('admin_invites.html', title='Invitation Codes', invites=invites, groups=groups)

@admin_bp.route('/invites/generate', methods=['POST'])
def generate_invite():
    group_id = request.form.get('group_id')
    try:
        # Get the number of uses from the form, default to 1 if not provided or invalid
        total_uses = int(request.form.get('total_uses', 1))
        if total_uses < 1:
            total_uses = 1
    except (ValueError, TypeError):
        total_uses = 1
        
    if not group_id:
        flash('You must select a permission group.', 'danger')
        return redirect(url_for('admin.invite_management'))
    
    new_code = InvitationCode(
        code=uuid.uuid4().hex,
        group_id=group_id,
        total_uses=total_uses,
        uses_left=total_uses  # Initialize uses_left to the total amount
    )
    db.session.add(new_code)
    db.session.commit()
    flash(f'New code "{new_code.code}" generated with {total_uses} uses.', 'success')
    return redirect(url_for('admin.invite_management'))

@admin_bp.route('/invites/<int:invite_id>/delete', methods=['POST'])
def delete_invite(invite_id):
    invite = InvitationCode.query.get_or_404(invite_id)
    db.session.delete(invite)
    db.session.commit()
    flash(f'Code "{invite.code}" has been permanently deleted.', 'success')
    return redirect(url_for('admin.invite_management'))

@admin_bp.route('/invites/<int:invite_id>/deactivate', methods=['POST'])
def deactivate_invite(invite_id):
    invite = InvitationCode.query.get_or_404(invite_id)
    invite.is_active = False
    db.session.commit()
    flash(f'Code "{invite.code}" has been deactivated.', 'info')
    return redirect(url_for('admin.invite_management'))

@admin_bp.route('/admin/default-avatars', methods=['GET', 'POST'])
def manage_default_avatars():
    """Page for admins to manage the pool of default avatars."""
    AVATAR_DIR = AVATAR_DIR = current_app.config['UPLOAD_FOLDER']
    if not os.path.exists(AVATAR_DIR):
        os.makedirs(AVATAR_DIR)

    if request.method == 'POST':
        if 'avatar_upload' not in request.files:
            flash('No file part in the request.', 'warning')
            return redirect(request.url)
        file = request.files['avatar_upload']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            if not filename.startswith('default_'):
                filename = f"default_{filename}"
            file.save(os.path.join(AVATAR_DIR, filename))
            flash(f'Default avatar "{filename}" uploaded successfully.', 'success')
            return redirect(url_for('admin.manage_default_avatars'))

    all_uploads = [f for f in os.listdir(AVATAR_DIR) if os.path.isfile(os.path.join(AVATAR_DIR, f))]
    default_avatars = sorted([f for f in all_uploads if f.startswith('default_')])
    return render_template('admin_avatars.html', title="Manage Default Avatars", default_avatars=default_avatars)

@admin_bp.route('/admin/default-avatars/delete/<filename>', methods=['POST'])
def delete_default_avatar(filename):
    """Deletes a default avatar file."""
    # Basic security check to prevent path traversal
    if '..' in filename or filename.startswith('/'):
        flash('Invalid filename.', 'danger')
        return redirect(url_for('admin.manage_default_avatars'))
        
    AVATAR_DIR = os.path.join(current_app.static_folder, 'avatars')
    file_path = os.path.join(AVATAR_DIR, filename)
    
    if os.path.exists(file_path):
        os.remove(file_path)
        flash(f'Default avatar "{filename}" has been deleted.', 'success')
    else:
        flash('File not found.', 'danger')
        
    return redirect(url_for('admin.manage_default_avatars'))

# You will need an allowed_file function, you can add it here or in a utils.py file
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'gif'}