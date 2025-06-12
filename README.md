# 合唱团乐谱管理应用 (v2.0)

一个现代化的、使用 Flask 和 Docker 构建的乐谱管理应用。

## 功能
- 卡片式、网格布局的曲目浏览器
- 曲目 -> 版本 -> 乐谱的层级结构
- 为每个版本添加 Tags
- 自动化数据库初始化和迁移
- 管理员后台 (用户管理, 系统设置)

## 如何运行

**先决条件**: 你的电脑上已经安装了 [Docker](https://www.docker.com/products/docker-desktop/)。

**1. 删除旧数据 (可选但推荐)**
由于数据库结构发生了巨大变化，建议从一个干净的状态开始。
- 删除 `migrations` 文件夹: `rm -rf migrations`
- 删除 `instance/app.db` 文件 (如果存在)。
- 清理 Docker volumes: `docker-compose down -v`

**2. 设为可执行文件**
如果 `entrypoint.sh` 不是可执行文件, 运行: `chmod +x entrypoint.sh`

**3. 启动应用**
在项目根目录下，运行：
`docker-compose up --build`

应用会自动完成所有数据库设置，并创建一个默认管理员。
- **默认管理员用户名**: `admin`
- **默认管理员密码**: `adminpass`
(您可以在 `docker-compose.yml` 文件中修改这些默认值)

应用将在 `http://localhost:5000` 上运行。