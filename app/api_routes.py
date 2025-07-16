from flask import Blueprint, jsonify, url_for, render_template, request
from app.models import Comment, User

api_bp = Blueprint('api', __name__)

@api_bp.route('/api/latest-comments')
def latest_comments():
    comments = Comment.query.order_by(Comment.timestamp.desc()).limit(20).all()
    
    # Prepare the data in a JSON-friendly format
    comments_data = []
    for comment in comments:
        context_url = ''
        context_name = ''
        if comment.version:
            context_url = url_for('track.version_detail', version_id=comment.version_id)
            context_name = f"{comment.version.track.title} - {comment.version.title}"
        elif comment.track:
            context_url = url_for('track.track_detail', track_id=comment.track_id)
            context_name = comment.track.title

        comments_data.append({
            'body': comment.body,
            'author_name': comment.author.username,
            'author_avatar': comment.author.avatar,
            'author_url': url_for('profile.user_profile', username=comment.author.username, _external=True),
            'timestamp': comment.timestamp.strftime('%Y-%m-%d %H:%M'),
            'context_url': context_url,
            'context_name': context_name
        })
    return jsonify(comments_data)

@api_bp.route('/api/load-members')
def load_members():
    page = request.args.get('page', 1, type=int)
    
    # --- NEW SORTING ORDER ---
    # 1. Admins first.
    # 2. Then by the calculated activity_score (highest first).
    # 3. Then by the last_seen time (most recent first).
    pagination = User.query.order_by(
        User.is_admin.desc(), 
        User.activity_score.desc(),
        User.last_seen.desc()
    ).paginate(page=page, per_page=16, error_out=False)
    
    items_html = render_template('_user_cards.html', users=pagination.items)
    return jsonify({'html': items_html, 'has_next': pagination.has_next})