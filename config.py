import os
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'a-very-hard-to-guess-string'
    
    # --- THIS IS THE CORRECTED LINE ---
    # We now explicitly tell SQLAlchemy to create the database inside the
    # 'instance' folder, which is the folder being persisted by our Docker volume.
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'instance', 'app.db')
        
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = os.path.join(basedir, 'uploads')
    
    # 阿里云DashScope API配置
    DASHSCOPE_API_KEY = os.environ.get('DASHSCOPE_API_KEY')
    
    # AI润色提示词配置 - 管理员统一配置
    AI_POLISH_PROMPT = '你是一个专业的文本润色助手。当前正在处理曲目《{track_title}》的{version_title}版本。请对用户提供的文本进行润色，使其更加通顺、专业、优美，并适当结合音乐曲目的特点，但不要改变原意。直接返回润色后的文本，不要添加解释或其他内容。'