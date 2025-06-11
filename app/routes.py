# app/routes.py

import os
from flask import (render_template, flash, redirect, url_for, request,
                   current_app, send_from_directory, abort, Blueprint)
from app import db
# --- THIS IS THE LINE TO FIX ---
from app.models import User, Track, Score, SystemSetting
from flask_login import current_user, login_user, logout_user, login_required
from werkzeug.utils import secure_filename
from werkzeug.urls import url_parse
from datetime import datetime

main_bp = Blueprint('main', __name__)

ALLOWED_EXTENSIONS = {'pdf'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@main_bp.before_request
def before_request_logging():
    """在每个请求前记录日志"""
    current_app.logger.info(f"收到请求: {request.method} {request.path} 来自 {request.remote_addr}")

@main_bp.route('/')
@main_bp.route('/index')
@login_required
def index():
    current_app.logger.info("进入 'index' 视图函数")
    tracks = Track.query.order_by(Track.timestamp.desc()).all()
    current_app.logger.info(f"查询到 {len(tracks)} 个曲目")
    return render_template('index.html', title='首页', tracks=tracks)

@main_bp.route('/login', methods=['GET', 'POST'])
def login():
    current_app.logger.info(f"进入 'login' 视图函数, 方法: {request.method}")
    if current_user.is_authenticated:
        current_app.logger.info("用户已认证，重定向到 index")
        return redirect(url_for('main.index'))
    
    if request.method == 'POST':
        username = request.form['username']
        current_app.logger.info(f"尝试为用户 '{username}' 登录")
        user = User.query.filter_by(username=username).first()
        if user is None or not user.check_password(request.form['password']):
            current_app.logger.warning(f"用户 '{username}' 登录失败：无效的用户名或密码")
            flash('无效的用户名或密码')
            return redirect(url_for('main.login'))
        
        login_user(user, remember=request.form.get('remember_me'))
        current_app.logger.info(f"用户 '{username}' 登录成功")
        next_page = request.args.get('next')
        if not next_page or url_parse(next_page).netloc != '':
            next_page = url_for('main.index')
        current_app.logger.info(f"重定向到: {next_page}")
        return redirect(next_page)

    current_app.logger.info("渲染登录模板")
    return render_template('login.html', title='登录')

@main_bp.route('/logout')
def logout():
    current_app.logger.info(f"用户 '{current_user.username}' 正在登出")
    logout_user()
    return redirect(url_for('main.index'))

@main_bp.route('/register', methods=['GET', 'POST'])
def register():
    if not SystemSetting.is_registration_enabled():
        flash('User registration is currently disabled.', 'info')
        return redirect(url_for('main.login'))
        
    current_app.logger.info(f"进入 'register' 视图函数, 方法: {request.method}")
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))

    if request.method == 'POST':
        username = request.form['username']
        if User.query.filter_by(username=username).first():
            current_app.logger.warning(f"注册失败：用户名 '{username}' 已存在")
            flash('该用户名已被使用，请换一个')
            return redirect(url_for('main.register'))
        
        user = User(username=username)
        user.set_password(request.form['password'])
        db.session.add(user)
        db.session.commit()
        current_app.logger.info(f"新用户 '{username}' 注册成功")
        flash('恭喜你，注册成功！')
        return redirect(url_for('main.login'))

    current_app.logger.info("渲染注册模板")
    return render_template('register.html', title='注册')

# (The rest of the file is unchanged, but is included for completeness)
@main_bp.route('/track/new', methods=['GET', 'POST'])
@login_required
def new_track():
    current_app.logger.info(f"进入 'new_track' 视图函数, 方法: {request.method}")
    if request.method == 'POST':
        track = Track(title=request.form['title'], description=request.form['description'], creator=current_user)
        db.session.add(track)
        db.session.commit()
        current_app.logger.info(f"用户 '{current_user.username}' 创建了新曲目: {track.title}")
        flash('新曲目已创建！')
        return redirect(url_for('main.track_detail', track_id=track.id))
    return render_template('track_form.html', title='创建新曲目')

@main_bp.route('/track/<int:track_id>')
@login_required
def track_detail(track_id):
    current_app.logger.info(f"进入 'track_detail' 视图函数, track_id: {track_id}")
    track = Track.query.get_or_404(track_id)
    return render_template('track_detail.html', title=track.title, track=track)

@main_bp.route('/track/<int:track_id>/edit', methods=['GET', 'POST'])
@login_required
def edit_track(track_id):
    current_app.logger.info(f"进入 'edit_track' 视图函数, track_id: {track_id}, 方法: {request.method}")
    track = Track.query.get_or_404(track_id)
    if track.creator != current_user and not current_user.is_admin:
        current_app.logger.error(f"权限错误: 用户 '{current_user.username}' 尝试编辑不属于自己的曲目 ID {track_id}")
        abort(403)
    if request.method == 'POST':
        track.title = request.form['title']
        track.description = request.form['description']
        db.session.commit()
        current_app.logger.info(f"曲目 ID {track_id} 已被用户 '{current_user.username}' 更新")
        flash('曲目信息已更新。')
        return redirect(url_for('main.track_detail', track_id=track.id))
    return render_template('track_form.html', title='编辑曲目', track=track)

@main_bp.route('/track/<int:track_id>/delete', methods=['POST'])
@login_required
def delete_track(track_id):
    current_app.logger.info(f"用户 '{current_user.username}' 尝试删除曲目 ID: {track_id}")
    track = Track.query.get_or_404(track_id)
    if track.creator != current_user and not current_user.is_admin:
        abort(403)
    for score in track.scores:
        try:
            os.remove(os.path.join(current_app.config['UPLOAD_FOLDER'], score.filename))
        except OSError:
            pass 
    db.session.delete(track)
    db.session.commit()
    flash('曲目已删除。')
    return redirect(url_for('main.index'))

@main_bp.route('/track/<int:track_id>/upload', methods=['POST'])
@login_required
def upload_score(track_id):
    current_app.logger.info(f"用户 '{current_user.username}' 尝试为曲目 ID {track_id} 上传文件")
    track = Track.query.get_or_404(track_id)
    if 'file' not in request.files:
        flash('没有文件部分')
        return redirect(url_for('main.track_detail', track_id=track.id))
    file = request.files['file']
    if file.filename == '':
        flash('未选择文件')
        return redirect(url_for('main.track_detail', track_id=track.id))
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        unique_filename = f"{track.id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{filename}"
        file.save(os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename))
        score = Score(description=request.form['description'], filename=unique_filename, uploader=current_user, track=track)
        db.session.add(score)
        db.session.commit()
        current_app.logger.info(f"文件 '{unique_filename}' 上传成功")
        flash('乐谱上传成功！')
    else:
        flash('只允许上传 PDF 文件！')
    return redirect(url_for('main.track_detail', track_id=track.id))

@main_bp.route('/score/<int:score_id>/delete', methods=['POST'])
@login_required
def delete_score(score_id):
    current_app.logger.info(f"用户 '{current_user.username}' 尝试删除乐谱 ID: {score_id}")
    score = Score.query.get_or_404(score_id)
    if score.uploader != current_user and not current_user.is_admin:
        abort(403)
    track_id = score.track_id
    try:
        os.remove(os.path.join(current_app.config['UPLOAD_FOLDER'], score.filename))
    except OSError as e:
        flash(f'删除文件时出错: {e}')
    db.session.delete(score)
    db.session.commit()
    flash('乐谱文件已删除。')
    return redirect(url_for('main.track_detail', track_id=track_id))

@main_bp.route('/uploads/<filename>')
@login_required
def uploaded_file(filename):
    current_app.logger.info(f"用户 '{current_user.username}' 正在请求文件: {filename}")
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)