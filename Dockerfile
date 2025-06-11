# 使用官方 Python 镜像作为基础
FROM python:3.9-slim

# 设置工作目录
WORKDIR /app

# 优先升级 pip，以确保能正确处理所有包的元数据
RUN pip install --upgrade pip -i https://mirrors.aliyun.com/pypi/simple

# 复制依赖文件并安装
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple

# 复制所有应用代码到工作目录
COPY . .

# 暴露端口，让容器外的服务可以访问
EXPOSE 6000

# 创建上传目录
RUN mkdir -p uploads

# 定义容器启动时运行的命令
CMD ["gunicorn", "-b", "0.0.0.0:1000", "run:app"]