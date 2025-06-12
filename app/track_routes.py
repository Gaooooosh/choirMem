import os
from flask import (render_template, flash, redirect, url_for, request,
                   current_app, send_from_directory, abort, Blueprint, jsonify)
from app import db
from app.models import Track, Version, Score, Tag, Comment, Photo
from flask_login import current_user, login_required
from werkzeug.utils import secure_filename
from datetime import datetime
from sqlalchemy import func

track_bp = Blueprint('track', __name__)

ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'gif'} # Add image formats
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- Track and Version Creation/Viewing ---

@track_bp.route('/track/new', methods=['GET', 'POST'])
@login_required
def create_track():
    if request.method == 'POST':
        track = Track(title=request.form['title'], description=request.form.get('notes'))
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
    return render_template('track_detail.html', 
                           title=track.title, 
                           track=track, 
                           versions=versions, 
                           comments=comments,
                           random_photos=random_photos)

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
    return render_template('version_detail.html', title=f'{version.track.title} - {version.title}', version=version, scores=scores, comments=comments, suggested_tags=suggested_tags)

# --- In-Place Editing Routes ---

@track_bp.route('/track/<int:track_id>/edit', methods=['POST'])
@login_required
def edit_track_description(track_id):
    track = Track.query.get_or_404(track_id)
    track.description = request.form['description']
    db.session.commit()
    return jsonify({'status': 'success', 'message': 'Description updated.'})

@track_bp.route('/version/<int:version_id>/edit', methods=['POST'])
@login_required
def edit_version_notes(version_id):
    version = Version.query.get_or_404(version_id)
    version.notes = request.form['notes']
    db.session.commit()
    return jsonify({'status': 'success', 'message': 'Notes updated.'})

# --- Commenting Routes (FIXED) ---

@track_bp.route('/comment/add', methods=['POST'])
@login_required
def add_comment():
    body = request.form.get('body')
    track_id = request.form.get('track_id')
    version_id = request.form.get('version_id')

    if not body:
        flash('评论内容不能为空。', 'danger')
    else:
        # This is the corrected way to create the comment
        comment = Comment(body=body, user_id=current_user.id)
        if version_id:
            comment.version_id = version_id
        elif track_id:
            comment.track_id = track_id
        else:
            flash('无法关联评论。', 'danger')
            return redirect(request.referrer or url_for('main.index'))
            
        db.session.add(comment)
        db.session.commit()
        flash('评论已添加。', 'success')
    
    return redirect(request.referrer or url_for('main.index'))

# --- Improved Tag Management Routes ---

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


# --- Score Management Logic ---

@track_bp.route('/version/<int:version_id>/upload', methods=['POST'])
@login_required
def upload_score(version_id):
    version = Version.query.get_or_404(version_id)
    if 'file' not in request.files or not request.form.get('description'):
        flash('需要同时提供文件和描述。', 'danger')
        return redirect(url_for('track.version_detail', version_id=version.id))
    
    file = request.files['file']
    if file.filename == '':
        flash('未选择文件。', 'warning')
        return redirect(url_for('track.version_detail', version_id=version.id))

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        unique_filename = f"{version.id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{filename}"
        file.save(os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename))
        
        score = Score(description=request.form['description'], filename=unique_filename, uploader=current_user, version=version)
        db.session.add(score)
        db.session.commit()
        flash('乐谱上传成功！', 'success')
    else:
        flash('只允许上传 PDF 文件！', 'danger')
        
    return redirect(url_for('track.version_detail', version_id=version_id))

@track_bp.route('/score/<int:score_id>/delete', methods=['POST'])
@login_required
def delete_score(score_id):
    score = Score.query.get_or_404(score_id)
    version_id = score.version_id
    if score.uploader != current_user and not current_user.is_admin:
        abort(403)
    
    try:
        os.remove(os.path.join(current_app.config['UPLOAD_FOLDER'], score.filename))
    except OSError:
        pass # Ignore if file not found
    
    db.session.delete(score)
    db.session.commit()
    flash('乐谱文件已删除。', 'success')
    return redirect(url_for('track.version_detail', version_id=version_id))

@track_bp.route('/uploads/<path:filename>')
@login_required
def uploaded_file(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)

@track_bp.route('/version/<int:version_id>/photos/upload', methods=['POST'])
@login_required
def upload_photo(version_id):
    version = Version.query.get_or_404(version_id)
    if 'photo' not in request.files:
        flash('No file part in the request.', 'danger')
        return redirect(url_for('track.version_detail', version_id=version.id))
    
    file = request.files['photo']
    if file.filename == '':
        flash('No selected file.', 'warning')
        return redirect(url_for('track.version_detail', version_id=version.id))

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        unique_filename = f"photo_{version.id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{filename}"
        file.save(os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename))
        
        caption = request.form.get('caption', '')
        photo = Photo(filename=unique_filename, caption=caption, uploader=current_user, version=version)
        db.session.add(photo)
        db.session.commit()
        flash('照片上传成功！', 'success')
    else:
        flash('只允许上传图片文件 (png, jpg, jpeg, gif)。', 'danger')
        
    return redirect(url_for('track.version_detail', version_id=version_id))

@track_bp.route('/comment/<int:comment_id>/delete', methods=['POST'])
@login_required
def delete_comment(comment_id):
    comment = Comment.query.get_or_404(comment_id)
    # Permission check
    if comment.author != current_user and not current_user.is_admin:
        abort(403)
    
    db.session.delete(comment)
    db.session.commit()
    flash('评论已删除。', 'success')
    return redirect(request.referrer or url_for('main.index'))

# --- NEW: DELETE PHOTO ROUTE ---
@track_bp.route('/photo/<int:photo_id>/delete', methods=['POST'])
@login_required
def delete_photo(photo_id):
    photo = Photo.query.get_or_404(photo_id)
    version_id = photo.version_id
    # Permission check
    if photo.uploader != current_user and not current_user.is_admin:
        abort(403)
    
    # Delete physical file from disk
    try:
        os.remove(os.path.join(current_app.config['UPLOAD_FOLDER'], photo.filename))
    except OSError:
        pass # Ignore if file not found
    
    db.session.delete(photo)
    db.session.commit()
    flash('照片已删除。', 'success')
    return redirect(url_for('track.version_detail', version_id=version_id))

@track_bp.route('/version/<int:version_id>/delete', methods=['POST'])
@login_required
def delete_version(version_id):
    version = Version.query.get_or_404(version_id)
    track_id = version.track.id
    if version.creator != current_user and not current_user.is_admin:
        flash('You do not have permission to delete this version.', 'danger')
        abort(403)
    # Manually delete all associated photo files from disk first
    for photo in version.photos:
        try:
            os.remove(os.path.join(current_app.config['UPLOAD_FOLDER'], photo.filename))
        except OSError:
            pass
    # Manually delete all associated score files from disk
    for score in version.scores:
        try:
            os.remove(os.path.join(current_app.config['UPLOAD_FOLDER'], score.filename))
        except OSError:
            pass
    db.session.delete(version)
    db.session.commit()
    flash(f'Version "{version.title}" and all its content have been deleted.', 'success')
    return redirect(url_for('track.track_detail', track_id=track_id))

@track_bp.route('/track/<int:track_id>/delete', methods=['POST'])
@login_required
def delete_track(track_id):
    # Only admins can delete a whole track
    if not current_user.is_admin:
        abort(403)
    
    track = Track.query.get_or_404(track_id)
    
    # Manually delete all physical files associated with this track's versions first
    for version in track.versions:
        for score in version.scores:
            try:
                os.remove(os.path.join(current_app.config['UPLOAD_FOLDER'], score.filename))
            except OSError:
                pass
        for photo in version.photos:
             try:
                os.remove(os.path.join(current_app.config['UPLOAD_FOLDER'], photo.filename))
             except OSError:
                pass
    
    track_title = track.title
    db.session.delete(track)
    db.session.commit()
    
    flash(f'Track "{track_title}" and all its content have been permanently deleted.', 'success')
    return redirect(url_for('main.index'))

@track_bp.route('/track/<int:track_id>/edit_title', methods=['POST'])
@login_required
def edit_track_title(track_id):
    if not current_user.is_admin:
        abort(403)
    track = Track.query.get_or_404(track_id)
    track.title = request.form['title']
    db.session.commit()
    return jsonify({'status': 'success', 'message': 'Track title updated.'})

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
    
    # Check if the user has already rated this version
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