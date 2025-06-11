# app/__init__.py

import os
import logging
from logging.handlers import RotatingFileHandler
from flask import Flask
from config import Config
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_bcrypt import Bcrypt
import markdown
import click

# 扩展先初始化，但不绑定 app
db = SQLAlchemy()
migrate = Migrate()
login = LoginManager()
login.login_view = 'main.login'
login.login_message = '请登录以访问此页面。'
bcrypt = Bcrypt()


def create_app(config_class=Config):
    """
    应用工厂函数
    """
    app = Flask(__name__)
    app.config.from_object(config_class)

    # --- 日志配置开始 ---
    if not app.debug and not app.testing:
        # 设置日志记录级别
        app.logger.setLevel(logging.INFO)

        # 创建一个日志格式化器
        formatter = logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        )

        # 创建一个StreamHandler，将日志输出到标准错误流 (可以在docker logs中看到)
        stream_handler = logging.StreamHandler()
        stream_handler.setLevel(logging.INFO)
        stream_handler.setFormatter(formatter)
        app.logger.addHandler(stream_handler)

        app.logger.info('合唱团应用启动')
    # --- 日志配置结束 ---


    # 确保 instance 文件夹存在
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # 将扩展绑定到 app 实例
    db.init_app(app)
    migrate.init_app(app, db)
    login.init_app(app)
    bcrypt.init_app(app)

    # 注册 Markdown 过滤器
    @app.template_filter('markdown')
    def markdown_filter(s):
        return markdown.markdown(s, extensions=['fenced_code', 'tables'])

    # 从 routes.py 导入蓝图并注册
    from app.routes import main_bp
    app.register_blueprint(main_bp)

# --- NEW: REGISTER ADMIN BLUEPRINT ---
    from app.admin_routes import admin_bp
    app.register_blueprint(admin_bp)

    # 在应用上下文中创建上传文件夹
    with app.app_context():
        if not os.path.exists(app.config['UPLOAD_FOLDER']):
            os.makedirs(app.config['UPLOAD_FOLDER'])
    
    # 注册 CLI 命令
    from app.models import User
    @app.cli.command("create-admin")
    @click.argument("username")
    @click.option("--password", prompt=True, hide_input=True, confirmation_prompt=True)
    def create_admin(username, password):
        """创建一个新的管理员用户"""
        with app.app_context():
            if User.query.filter_by(username=username).first():
                app.logger.warning(f"尝试创建已存在的管理员用户: {username}")
                print(f"用户 '{username}' 已存在.")
                return
            admin_user = User(username=username, is_admin=True)
            admin_user.set_password(password)
            db.session.add(admin_user)
            db.session.commit()
            app.logger.info(f"成功创建新的管理员用户: {username}")
            print(f"管理员用户 '{username}' 已成功创建.")

    return app