from flask import render_template, flash, redirect, url_for, request, Blueprint, abort
from app import db
from app.models import Collection, Version
from flask_login import current_user, login_required

collection_bp = Blueprint('collection', __name__)

@collection_bp.route('/collections')
@login_required
def list_collections():
    collections = Collection.query.order_by(Collection.timestamp.desc()).all()
    return render_template('collections.html', title="乐集", collections=collections)

@collection_bp.route('/collection/new', methods=['GET', 'POST'])
@login_required
def create_collection():
    if request.method == 'POST':
        collection = Collection(
            name=request.form['name'],
            description=request.form.get('description'),
            creator=current_user
        )
        db.session.add(collection)
        db.session.commit()
        flash('乐集已成功创建！', 'success')
        return redirect(url_for('collection.view_collection', collection_id=collection.id))
    return render_template('collection_form.html', title="创建新乐集")

@collection_bp.route('/collection/<int:collection_id>')
@login_required
def view_collection(collection_id):
    collection = Collection.query.get_or_404(collection_id)
    versions = collection.versions.order_by(Version.timestamp.desc()).all()
    return render_template('collection_detail.html', title=collection.name, collection=collection, versions=versions)

@collection_bp.route('/version/<int:version_id>/add-to-collection', methods=['POST'])
@login_required
def add_to_collection(version_id):
    version = Version.query.get_or_404(version_id)
    collection_id = request.form.get('collection_id')
    if not collection_id:
        flash('请选择一个乐集。', 'warning')
        return redirect(url_for('track.version_detail', version_id=version_id))
        
    collection = Collection.query.get_or_404(collection_id)
    if current_user != collection.creator and not current_user.is_admin:
        abort(403)
        
    if version not in collection.versions:
        collection.versions.append(version)
        db.session.commit()
        flash(f'已将 "{version.title}" 添加到乐集 "{collection.name}"。', 'success')
    else:
        flash(f'"{version.title}" 已存在于此乐集中。', 'info')
        
    return redirect(url_for('track.version_detail', version_id=version_id))

@collection_bp.route('/collection/<int:collection_id>/edit', methods=['GET', 'POST'])
@login_required
def edit_collection(collection_id):
    collection = Collection.query.get_or_404(collection_id)
    if current_user != collection.creator and not current_user.is_admin:
        abort(403)
    
    if request.method == 'POST':
        collection.name = request.form['name']
        collection.description = request.form.get('description')
        db.session.commit()
        flash('乐集已成功更新。', 'success')
        return redirect(url_for('collection.view_collection', collection_id=collection.id))
        
    return render_template('collection_form.html', title="编辑乐集", collection=collection)

# --- NEW: DELETE COLLECTION ROUTE ---
@collection_bp.route('/collection/<int:collection_id>/delete', methods=['POST'])
@login_required
def delete_collection(collection_id):
    collection = Collection.query.get_or_404(collection_id)
    if current_user != collection.creator and not current_user.is_admin:
        abort(403)
        
    db.session.delete(collection)
    db.session.commit()
    flash(f'乐集 "{collection.name}" 已被删除。', 'success')
    return redirect(url_for('collection.list_collections'))

@collection_bp.route('/collection/<int:collection_id>/remove/<int:version_id>', methods=['POST'])
@login_required
def remove_from_collection(collection_id, version_id):
    collection = Collection.query.get_or_404(collection_id)
    version = Version.query.get_or_404(version_id)

    # Permission check: must be the collection creator or an admin
    if current_user != collection.creator and not current_user.is_admin:
        abort(403)

    if version in collection.versions.all():
        collection.versions.remove(version)
        db.session.commit()
        flash(f'已将 "{version.title}" 从乐集 "{collection.name}" 中移除。', 'success')
    else:
        flash(f'错误：该版本不在此乐集中。', 'danger')
    
    return redirect(url_for('collection.view_collection', collection_id=collection_id))