from flask import render_template, flash, redirect, url_for, request, Blueprint, current_app
from app import db
from app.models import User, Track, SystemSetting, Photo
from flask_login import current_user, login_user, logout_user, login_required
from werkzeug.urls import url_parse
from sqlalchemy.sql.expression import func

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
@login_required
def index():
    page = request.args.get('page', 1, type=int)
    search = request.args.get('search', '')
    
    query = Track.query
    if search:
        query = query.filter(Track.title.ilike(f'%{search}%'))
    
    tracks_pagination = query.order_by(Track.title).paginate(page=page, per_page=9)
    
    photo_limit_str = SystemSetting.get('homepage_photo_max', '3')
    try:
        photo_limit = int(photo_limit_str)
    except (ValueError, TypeError):
        photo_limit = 3

    random_photos = []
    if photo_limit > 0:
        random_photos = Photo.query.order_by(func.random()).limit(photo_limit).all()
    
    display_items = list(tracks_pagination.items)
    if not search and page == 1 and random_photos:
        for i, photo in enumerate(random_photos):
            position = (i + 1) * 3
            if position < len(display_items):
                display_items.insert(position, photo)
            else:
                display_items.append(photo)

    return render_template('index.html', 
                           title='曲目库', 
                           tracks_pagination=tracks_pagination, 
                           display_items=display_items,
                           search=search)

@main_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    if request.method == 'POST':
        user = User.query.filter_by(username=request.form['username']).first()
        if user is None or not user.check_password(request.form['password']):
            flash('无效的用户名或密码', 'danger')
            return redirect(url_for('main.login'))
        login_user(user, remember=request.form.get('remember_me'))
        next_page = request.args.get('next')
        if not next_page or url_parse(next_page).netloc != '':
            next_page = url_for('main.index')
        return redirect(next_page)
    return render_template('login.html', title='登录')

@main_bp.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('main.login'))

@main_bp.route('/register', methods=['GET', 'POST'])
def register():
    if not SystemSetting.is_registration_enabled():
        flash('用户注册功能当前已关闭。', 'info')
        return redirect(url_for('main.login'))
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    if request.method == 'POST':
        user = User.query.filter_by(username=request.form['username']).first()
        if user:
            flash('该用户名已被使用，请换一个。', 'warning')
            return redirect(url_for('main.register'))
        user = User(username=request.form['username'])
        user.set_password(request.form['password'])
        db.session.add(user)
        db.session.commit()
        flash('恭喜你，注册成功！请登录。', 'success')
        return redirect(url_for('main.login'))
    return render_template('register.html', title='注册')