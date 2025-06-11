# 合唱团乐谱管理应用

这是一个使用 Flask 和 Docker 构建的，用于私人合唱团管理乐谱的 Web 应用。

## 功能
- 用户注册和登录
- 管理员和普通用户角色
- 创建曲目并使用 Markdown 编辑介绍
- 上传和管理与曲目关联的 PDF 乐谱
- 在浏览器中直接预览 PDF

## 技术栈
- **后端**: Python, Flask, Gunicorn
- **数据库**: SQLite
- **前端**: Bootstrap
- **部署**: Docker, Docker Compose

## 如何运行 (使用 Docker)

**先决条件**: 确保你的电脑上已经安装了 [Docker](https://www.docker.com/products/docker-desktop/)。

**1. 启动应用**

在项目根目录下，运行以下命令：

```bash
docker-compose up --build