#!/bin/bash

# Choir Mem Docker 发布脚本
# 用于自动化构建、标签和发布 Docker 镜像

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
IMAGE_NAME="choir-mem"
REGISTRY=""  # 留空表示使用 Docker Hub，或设置为私有注册中心地址
DOCKERFILE="Dockerfile"

# 函数：打印彩色消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 函数：检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_message $RED "错误: $1 命令未找到，请先安装"
        exit 1
    fi
}

# 函数：获取当前版本
get_current_version() {
    if [ -f "package.json" ]; then
        node -p "require('./package.json').version"
    else
        echo "1.0.0"
    fi
}

# 函数：验证版本格式
validate_version() {
    if [[ ! $1 =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        print_message $RED "错误: 版本格式无效。请使用 x.y.z 格式"
        exit 1
    fi
}

# 函数：构建镜像
build_image() {
    local version=$1
    local tags=("$IMAGE_NAME:$version" "$IMAGE_NAME:latest")
    
    if [ -n "$REGISTRY" ]; then
        tags+=("$REGISTRY/$IMAGE_NAME:$version" "$REGISTRY/$IMAGE_NAME:latest")
    fi
    
    print_message $BLUE "开始构建 Docker 镜像..."
    
    # 构建基础镜像
    docker build -t "$IMAGE_NAME:$version" -f "$DOCKERFILE" .
    
    # 添加所有标签
    for tag in "${tags[@]}"; do
        if [ "$tag" != "$IMAGE_NAME:$version" ]; then
            print_message $YELLOW "添加标签: $tag"
            docker tag "$IMAGE_NAME:$version" "$tag"
        fi
    done
    
    print_message $GREEN "镜像构建完成!"
}

# 函数：测试镜像
test_image() {
    local version=$1
    print_message $BLUE "测试镜像 $IMAGE_NAME:$version..."
    
    # 启动测试容器
    local container_id=$(docker run -d -p 3001:3000 --name "test-$IMAGE_NAME-$version" "$IMAGE_NAME:$version")
    
    # 等待容器启动
    sleep 10
    
    # 健康检查
    local health_check_passed=false
    for i in {1..30}; do
        if curl -f http://localhost:3001/api/health &> /dev/null; then
            health_check_passed=true
            break
        fi
        sleep 2
    done
    
    # 清理测试容器
    docker stop "$container_id" &> /dev/null || true
    docker rm "$container_id" &> /dev/null || true
    
    if [ "$health_check_passed" = true ]; then
        print_message $GREEN "镜像测试通过!"
    else
        print_message $RED "镜像测试失败!"
        exit 1
    fi
}

# 函数：推送镜像
push_image() {
    local version=$1
    
    if [ -z "$REGISTRY" ]; then
        print_message $YELLOW "未配置注册中心，跳过推送"
        return
    fi
    
    print_message $BLUE "推送镜像到注册中心..."
    
    docker push "$REGISTRY/$IMAGE_NAME:$version"
    docker push "$REGISTRY/$IMAGE_NAME:latest"
    
    print_message $GREEN "镜像推送完成!"
}

# 函数：生成发布说明
generate_release_notes() {
    local version=$1
    local notes_file="RELEASE_NOTES_$version.md"
    
    cat > "$notes_file" << EOF
# Choir Mem v$version 发布说明

## 发布信息
- **版本**: v$version
- **发布日期**: $(date '+%Y-%m-%d')
- **Docker 镜像**: \`$IMAGE_NAME:$version\`

## 部署命令

### 使用 Docker Compose
\`\`\`bash
# 更新镜像版本
docker-compose pull
docker-compose up -d
\`\`\`

### 使用 Docker 命令
\`\`\`bash
# 停止旧容器
docker stop choir-mem-app || true
docker rm choir-mem-app || true

# 启动新容器
docker run -d \\
  --name choir-mem-app \\
  -p 3000:3000 \\
  -v choir-mem-uploads:/app/uploads \\
  -v choir-mem-database:/app/database \\
  --env-file .env \\
  --restart unless-stopped \\
  $IMAGE_NAME:$version
\`\`\`

## 镜像信息
\`\`\`bash
# 镜像大小
$(docker images $IMAGE_NAME:$version --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}")

# 镜像层数
$(docker history $IMAGE_NAME:$version --format "table {{.CreatedBy}}" | wc -l) 层
\`\`\`

## 验证部署
\`\`\`bash
# 健康检查
curl http://localhost:3000/api/health

# 查看容器状态
docker ps | grep choir-mem
docker logs choir-mem-app
\`\`\`

## 回滚说明
如果需要回滚到上一个版本：
\`\`\`bash
# 查看可用版本
docker images $IMAGE_NAME

# 回滚到指定版本
docker stop choir-mem-app
docker rm choir-mem-app
docker run -d --name choir-mem-app -p 3000:3000 -v choir-mem-uploads:/app/uploads -v choir-mem-database:/app/database --env-file .env --restart unless-stopped $IMAGE_NAME:<previous-version>
\`\`\`

## 更新日志
<!-- 在这里添加具体的更新内容 -->
- 功能改进
- Bug 修复
- 性能优化
- 安全更新

EOF

    print_message $GREEN "发布说明已生成: $notes_file"
}

# 函数：显示帮助信息
show_help() {
    cat << EOF
Choir Mem Docker 发布脚本

用法: $0 [选项] <版本号>

选项:
  -h, --help          显示此帮助信息
  -t, --test-only     仅构建和测试，不推送
  -s, --skip-test     跳过测试步骤
  -r, --registry URL  设置 Docker 注册中心地址
  --no-latest         不更新 latest 标签

示例:
  $0 1.0.0                    # 发布版本 1.0.0
  $0 -t 1.0.1                 # 仅测试版本 1.0.1
  $0 -r registry.example.com 1.0.2  # 推送到私有注册中心

EOF
}

# 主函数
main() {
    local version=""
    local test_only=false
    local skip_test=false
    local no_latest=false
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -t|--test-only)
                test_only=true
                shift
                ;;
            -s|--skip-test)
                skip_test=true
                shift
                ;;
            -r|--registry)
                REGISTRY="$2"
                shift 2
                ;;
            --no-latest)
                no_latest=true
                shift
                ;;
            -*)
                print_message $RED "未知选项: $1"
                show_help
                exit 1
                ;;
            *)
                if [ -z "$version" ]; then
                    version="$1"
                else
                    print_message $RED "错误: 多余的参数 $1"
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    # 检查必要的命令
    check_command docker
    check_command curl
    check_command node
    
    # 如果没有提供版本号，使用当前版本
    if [ -z "$version" ]; then
        version=$(get_current_version)
        print_message $YELLOW "使用当前版本: $version"
    fi
    
    # 验证版本格式
    validate_version "$version"
    
    print_message $BLUE "开始发布 Choir Mem v$version"
    print_message $BLUE "镜像名称: $IMAGE_NAME"
    if [ -n "$REGISTRY" ]; then
        print_message $BLUE "注册中心: $REGISTRY"
    fi
    
    # 构建镜像
    build_image "$version"
    
    # 测试镜像
    if [ "$skip_test" = false ]; then
        test_image "$version"
    else
        print_message $YELLOW "跳过镜像测试"
    fi
    
    # 推送镜像
    if [ "$test_only" = false ]; then
        push_image "$version"
    else
        print_message $YELLOW "仅测试模式，跳过推送"
    fi
    
    # 生成发布说明
    generate_release_notes "$version"
    
    print_message $GREEN "发布完成! 🎉"
    print_message $BLUE "镜像标签:"
    docker images "$IMAGE_NAME" | head -5
}

# 运行主函数
main "$@"