from datetime import datetime
from app.track_routes import allowed_file
from flask import render_template, flash, redirect, url_for, request, Blueprint, current_app
from app import db
from app.models import User,Article,Score,Photo
from flask_login import current_user, login_required
from werkzeug.utils import secure_filename
import os

profile_bp = Blueprint('profile', __name__)

@profile_bp.route('/user/<username>')
# @login_required
def user_profile(username):
    user = User.query.filter_by(username=username).first_or_404()
    # Fetch content associated with the user for the tabs
    articles = user.articles.order_by(Article.timestamp.desc()).all()
    scores = user.scores.order_by(Score.timestamp.desc()).all()
    photos = user.photos.order_by(Photo.timestamp.desc()).all()
    return render_template('user_profile.html', 
                           title=f"{user.username}'s Profile", 
                           user=user,
                           articles=articles,
                           scores=scores,
                           photos=photos)

@profile_bp.route('/profile/edit', methods=['GET', 'POST'])
@login_required
def edit_profile():
    if request.method == 'POST':
        # --- POST部分的逻辑（保存用户修改） ---
        current_user.username = request.form.get('username', current_user.username)
        current_user.bio = request.form.get('bio', current_user.bio)

        # 处理头像更新
        # 优先1: 检查是否有新文件上传
        if 'avatar' in request.files:
            file = request.files['avatar']
            if file and file.filename != '' and allowed_file(file.filename):
                _, f_ext = os.path.splitext(file.filename)
                # 为用户自定义头像创建一个唯一的文件名
                avatar_filename = f"avatar_user_{current_user.id}_{int(datetime.now().timestamp())}{f_ext}"
                file.save(os.path.join(current_app.config['UPLOAD_FOLDER'], avatar_filename))
                current_user.avatar_filename = avatar_filename
                flash('新头像已上传！', 'success')
        
        # 优先2: 如果没有文件上传，检查是否选择了预设头像
        elif request.form.get('selected_avatar'):
            current_user.avatar_filename = request.form.get('selected_avatar')
            flash('预设头像已选择。', 'success')

        db.session.commit()
        return redirect(url_for('profile.user_profile', username=current_user.username))
    
    # --- GET部分的逻辑（显示编辑表单）---
    # 从正确的 uploads 文件夹读取默认头像列表
    AVATAR_DIR = current_app.config['UPLOAD_FOLDER']
    default_avatars = []
    try:
        if os.path.exists(AVATAR_DIR):
            all_files = os.listdir(AVATAR_DIR)
            # 筛选出所有以 'default_' 开头的文件
            default_avatars = sorted([f for f in all_files if f.startswith('default_') and os.path.isfile(os.path.join(AVATAR_DIR, f))])
    except FileNotFoundError:
        pass
        
    # 将头像列表传递给模板
    return render_template('edit_profile.html', title="编辑个人资料", default_avatars=default_avatars)