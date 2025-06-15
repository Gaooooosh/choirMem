import os
from flask import (render_template, flash, redirect, url_for, request,
                   current_app, send_from_directory, abort, Blueprint, jsonify)
from app import db
from app.models import Track, Version, Score, Tag, Comment, Photo, Rating, User
from flask_login import current_user, login_required
from werkzeug.utils import secure_filename
from datetime import datetime
from sqlalchemy import func
from app.decorators import permission_required

track_bp = Blueprint('track', __name__)

ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'gif'}
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def generate_sort_key(text):
    """Generates a sortable key from text (converts Chinese to Pinyin)."""
    # lazy_pinyin returns a list of lists, e.g., [['da'], ['hai']]
    pinyin_list = pinyin(text, style=Style.NORMAL)
    # Join it all together, e.g., 'dahai'
    return "".join(item[0] for item in pinyin_list).lower()


# # # # # # # # # # # # # # # # # # # #
# Main Viewing & Creation Routes
# # # # # # # # # # # # # # # # # # # #

@track_bp.route('/track/new', methods=['GET', 'POST'])
@login_required
def create_track():
    if request.method == 'POST':
        title = request.form['title']
        track = Track(
            title=title,
            description=request.form.get('notes'),
            title_sort=generate_sort_key(title) # Set the sort key
        )
        db.session.add(track)
        db.session.commit()
        flash('曲目创建成功！现在请为它添加第一个版本。', 'success')
        return redirect(url_for('track.create_version', track_id=track.id))
    return render_template('_form_helpers.html', title='创建新曲目', form_target=url_for('track.create_track'))

@track_bp.route('/track/<int:track_id>')
@login_required
def track_detail(track_id):
    track = Track.query.get_or_404(track_id)
    versions = track.versions.order_by(Version.timestamp.desc()).all()
    comments = track.comments.order_by(Comment.timestamp.asc()).all()
    random_photos = track.photos.order_by(func.random()).limit(4).all()
    first_version = track.versions.order_by(Version.timestamp.asc()).first()
    return render_template('track_detail.html', 
                           title=track.title, track=track, versions=versions, 
                           comments=comments, random_photos=random_photos,
                           first_version=first_version)

@track_bp.route('/track/<int:track_id>/version/new', methods=['GET', 'POST'])
@login_required
def create_version(track_id):
    track = Track.query.get_or_404(track_id)
    if request.method == 'POST':
        version = Version(title=request.form['title'], notes=request.form.get('notes'), track_id=track.id, creator=current_user)
        db.session.add(version)
        db.session.commit()
        flash('新版本创建成功！', 'success')
        return redirect(url_for('track.version_detail', version_id=version.id))
    return render_template('_form_helpers.html', title=f'为 {track.title} 添加新版本', form_target=url_for('track.create_version', track_id=track_id))

@track_bp.route('/version/<int:version_id>')
@login_required
def version_detail(version_id):
    version = Version.query.get_or_404(version_id)
    scores = version.scores.order_by(Score.timestamp.desc()).all()
    comments = version.comments.order_by(Comment.timestamp.asc()).all()
    top_tags = db.session.query(Tag, func.count(Tag.id).label('total')).join(Version.tags).group_by(Tag).order_by(func.count(Tag.id).desc()).limit(10).all()
    suggested_tags = [tag for tag, count in top_tags]
    return render_template('version_detail.html', 
                           title=f'{version.track.title} - {version.title}', version=version, 
                           scores=scores, comments=comments, suggested_tags=suggested_tags)

@track_bp.route('/track/<int:track_id>/edit', methods=['POST'])
@login_required
def edit_track(track_id):
    track = Track.query.get_or_404(track_id)
    
    # Logic to find the original creator
    first_version = track.versions.order_by(Version.timestamp.asc()).first()
    track_creator = first_version.creator if first_version else None
    
    # Check permissions for title edits
    if 'title' in request.form:
        if not current_user.is_admin and current_user != track_creator:
            return jsonify({'status': 'error', 'message': '您不是曲目的创建者，无法修改'}), 403
        new_title = request.form['title']
        track.title = new_title
        track.title_sort = generate_sort_key(new_title) # Update the sort key

    # Any logged-in user can edit the description
    if 'description' in request.form:
        track.description = request.form['description']
        
    db.session.commit()
    return jsonify({'status': 'success', 'message': 'Track updated.'})

@track_bp.route('/version/<int:version_id>/edit', methods=['POST'])
@login_required
def edit_version(version_id):
    version = Version.query.get_or_404(version_id)
    if 'title' in request.form:
        if version.creator != current_user and not current_user.is_admin:
            return jsonify({'status': 'error', 'message': '您不是版本的创建者，无法修改'}), 403
        version.title = request.form['title']
    if 'notes' in request.form:
        version.notes = request.form['notes']
    db.session.commit()
    return jsonify({'status': 'success', 'message': 'Version updated.'})

# # # # # # # # # # # # # # # # # # # #
# Interactive Routes (Likes, Comments, Tags, Ratings)
# # # # # # # # # # # # # # # # # # # #

@track_bp.route('/version/<int:version_id>/like', methods=['POST'])
@login_required
def like_version(version_id):
    version = Version.query.get_or_404(version_id)
    if current_user in version.likes:
        version.likes.remove(current_user)
        flash(f'你已取消喜欢 "{version.title}".', 'info')
    else:
        version.likes.append(current_user)
        flash(f'你已喜欢 "{version.title}"!', 'success')
    db.session.commit()
    return redirect(url_for('track.version_detail', version_id=version_id))

@track_bp.route('/version/<int:version_id>/rate', methods=['POST'])
@login_required
def rate_version(version_id):
    version = Version.query.get_or_404(version_id)
    difficulty = int(request.form.get('difficulty'))
    existing_rating = Rating.query.filter_by(user_id=current_user.id, version_id=version.id).first()
    if existing_rating:
        existing_rating.difficulty = difficulty
        flash('你的难度评分已更新。', 'success')
    else:
        new_rating = Rating(difficulty=difficulty, user_id=current_user.id, version_id=version.id)
        db.session.add(new_rating)
        flash('感谢你的难度评分！', 'success')
    db.session.commit()
    return redirect(url_for('track.version_detail', version_id=version_id))

@track_bp.route('/comment/add', methods=['POST'])
@login_required
@permission_required('can_post_comments')
def add_comment():
    body = request.form.get('body')
    track_id = request.form.get('track_id')
    version_id = request.form.get('version_id')
    if not body:
        flash('评论内容不能为空。', 'danger')
    else:
        comment = Comment(body=body, user_id=current_user.id)
        if version_id:
            comment.version_id = version_id
        elif track_id:
            comment.track_id = track_id
        else:
            return redirect(request.referrer or url_for('main.index'))
        db.session.add(comment)
        db.session.commit()
        flash('评论已添加。', 'success')
    return redirect(request.referrer or url_for('main.index'))

@track_bp.route('/version/<int:version_id>/tags/add', methods=['POST'])
@login_required
def add_tag(version_id):
    version = Version.query.get_or_404(version_id)
    tag_name = request.form.get('tag_name', '').strip()
    if tag_name:
        tag = Tag.query.filter_by(name=tag_name).first()
        if not tag:
            tag = Tag(name=tag_name)
            db.session.add(tag)
        if tag not in version.tags:
            version.tags.append(tag)
            db.session.commit()
            flash(f'Tag "{tag_name}" 已添加。', 'success')
    else:
        flash('Tag名称不能为空。', 'warning')
    return redirect(url_for('track.version_detail', version_id=version_id))

@track_bp.route('/version/<int:version_id>/tags/remove/<int:tag_id>', methods=['POST'])
@login_required
def remove_tag(version_id, tag_id):
    version = Version.query.get_or_404(version_id)
    tag = Tag.query.get_or_404(tag_id)
    if tag in version.tags:
        version.tags.remove(tag)
        db.session.commit()
        flash(f'Tag "{tag.name}" 已移除。', 'success')
    return redirect(url_for('track.version_detail', version_id=version_id))


# # # # # # # # # # # # # # # # # # # #
# File Upload and Deletion Routes
# # # # # # # # # # # # # # # # # # # #

@track_bp.route('/uploads/<path:filename>')
@login_required
@permission_required('can_view_scores')
def uploaded_file(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)

@track_bp.route('/version/<int:version_id>/upload', methods=['POST'])
@login_required
@permission_required('can_upload_scores')
def upload_score(version_id):
    version = Version.query.get_or_404(version_id)
    if 'file' not in request.files or not request.form.get('description'):
        flash('需要同时提供文件和描述。', 'danger')
        return redirect(url_for('track.version_detail', version_id=version.id))
    file = request.files['file']
    if file.filename == '' or not allowed_file(file.filename):
        flash('未选择文件或文件类型不被允许。', 'warning')
        return redirect(url_for('track.version_detail', version_id=version.id))
    filename = secure_filename(file.filename)
    unique_filename = f"score_{version.id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{filename}"
    file.save(os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename))
    score = Score(description=request.form['description'], filename=unique_filename, uploader=current_user, version=version)
    db.session.add(score)
    db.session.commit()
    flash('乐谱上传成功！', 'success')
    return redirect(url_for('track.version_detail', version_id=version_id))

@track_bp.route('/version/<int:version_id>/photos/upload', methods=['POST'])
@login_required
@permission_required('can_upload_photos')
def upload_photo(version_id):
    version = Version.query.get_or_404(version_id)
    if 'photo' not in request.files or not allowed_file(request.files['photo'].filename):
        flash('请选择一个有效的图片文件。', 'danger')
        return redirect(url_for('track.version_detail', version_id=version.id))
    file = request.files['photo']
    if file.filename == '':
        flash('未选择文件。', 'warning')
        return redirect(url_for('track.version_detail', version_id=version.id))
    filename = secure_filename(file.filename)
    unique_filename = f"photo_{version.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
    file.save(os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename))
    caption = request.form.get('caption', '')
    photo = Photo(filename=unique_filename, caption=caption, uploader=current_user, version=version)
    db.session.add(photo)
    db.session.commit()
    flash('照片上传成功！', 'success')
    return redirect(url_for('track.version_detail', version_id=version_id))

@track_bp.route('/score/<int:score_id>/delete', methods=['POST'])
@login_required
def delete_score(score_id):
    score = Score.query.get_or_404(score_id)
    if score.uploader != current_user and not current_user.is_admin: abort(403)
    try:
        os.remove(os.path.join(current_app.config['UPLOAD_FOLDER'], score.filename))
    except OSError: pass
    db.session.delete(score)
    db.session.commit()
    flash('乐谱文件已删除。', 'success')
    return redirect(url_for('track.version_detail', version_id=score.version_id))

@track_bp.route('/comment/<int:comment_id>/delete', methods=['POST'])
@login_required
def delete_comment(comment_id):
    comment = Comment.query.get_or_404(comment_id)
    if comment.author != current_user and not current_user.is_admin: abort(403)
    db.session.delete(comment)
    db.session.commit()
    flash('评论已删除。', 'success')
    return redirect(request.referrer or url_for('main.index'))

@track_bp.route('/photo/<int:photo_id>/delete', methods=['POST'])
@login_required
def delete_photo(photo_id):
    photo = Photo.query.get_or_404(photo_id)
    if photo.uploader != current_user and not current_user.is_admin: abort(403)
    try:
        os.remove(os.path.join(current_app.config['UPLOAD_FOLDER'], photo.filename))
    except OSError: pass
    db.session.delete(photo)
    db.session.commit()
    flash('照片已删除。', 'success')
    return redirect(url_for('track.version_detail', version_id=photo.version_id))

@track_bp.route('/version/<int:version_id>/delete', methods=['POST'])
@login_required
def delete_version(version_id):
    version = Version.query.get_or_404(version_id)
    if version.creator != current_user and not current_user.is_admin: abort(403)
    for photo in version.photos:
        try: os.remove(os.path.join(current_app.config['UPLOAD_FOLDER'], photo.filename))
        except OSError: pass
    for score in version.scores:
        try: os.remove(os.path.join(current_app.config['UPLOAD_FOLDER'], score.filename))
        except OSError: pass
    track_id = version.track_id
    db.session.delete(version)
    db.session.commit()
    flash(f'版本 "{version.title}" 已删除.', 'success')
    return redirect(url_for('track.track_detail', track_id=track_id))

@track_bp.route('/track/<int:track_id>/delete', methods=['POST'])
@login_required
def delete_track(track_id):
    if not current_user.is_admin: abort(403)
    track = Track.query.get_or_404(track_id)
    for version in track.versions:
        for photo in version.photos:
            try: os.remove(os.path.join(current_app.config['UPLOAD_FOLDER'], photo.filename))
            except OSError: pass
        for score in version.scores:
            try: os.remove(os.path.join(current_app.config['UPLOAD_FOLDER'], score.filename))
            except OSError: pass
    track_title = track.title
    db.session.delete(track)
    db.session.commit()
    flash(f'曲目 "{track_title}" 已经被完全删除', 'success')
    return redirect(url_for('main.index'))