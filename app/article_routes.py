from flask import render_template, flash, redirect, url_for, request, Blueprint
from app import db
from app.models import Article
from flask_login import current_user, login_required
from app.decorators import permission_required

article_bp = Blueprint('article', __name__)

@article_bp.route('/articles')
@login_required
def list_articles():
    articles = Article.query.order_by(Article.timestamp.desc()).all()
    return render_template('articles.html', title="署名文章", articles=articles)

@article_bp.route('/article/<int:article_id>')
@login_required
def view_article(article_id):
    article = Article.query.get_or_404(article_id)
    return render_template('article_detail.html', title=article.title, article=article)

@article_bp.route('/article/new', methods=['GET', 'POST'])
@login_required
def create_article():
    if request.method == 'POST':
        article = Article(title=request.form['title'], body=request.form['body'], author=current_user)
        db.session.add(article)
        db.session.commit()
        flash('文章已成功发布！', 'success')
        return redirect(url_for('article.list_articles'))
    return render_template('article_form.html', title="撰写新文章")

@article_bp.route('/article/<int:article_id>/delete', methods=['POST'])
@login_required
def delete_article(article_id):
    article = Article.query.get_or_404(article_id)
    # Check if the current user is the author or an admin
    if current_user != article.author and not current_user.is_admin:
        abort(403) # Forbidden
    
    db.session.delete(article)
    db.session.commit()
    flash('文章已成功删除。', 'success')
    return redirect(url_for('article.list_articles'))

@article_bp.route('/article/<int:article_id>/edit', methods=['GET', 'POST'])
@login_required
def edit_article(article_id):
    article = Article.query.get_or_404(article_id)
    # Check for permission
    if current_user != article.author and not current_user.is_admin:
        abort(403)
    
    if request.method == 'POST':
        article.title = request.form['title']
        article.body = request.form['body']
        db.session.commit()
        flash('文章已成功更新。', 'success')
        return redirect(url_for('article.view_article', article_id=article.id))
        
    return render_template('article_form.html', title="编辑文章", article=article)