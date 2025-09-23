#!/bin/bash

# Docker镜像大小比较脚本
# 用于比较标准版和优化版Dockerfile的镜像大小

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函数：打印彩色消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 函数：格式化字节大小
format_size() {
    local bytes=$1
    if [ $bytes -gt 1073741824 ]; then
        echo "$(echo "scale=2; $bytes/1073741824" | bc)GB"
    elif [ $bytes -gt 1048576 ]; then
        echo "$(echo "scale=2; $bytes/1048576" | bc)MB"
    elif [ $bytes -gt 1024 ]; then
        echo "$(echo "scale=2; $bytes/1024" | bc)KB"
    else
        echo "${bytes}B"
    fi
}

# 函数：获取镜像大小（字节）
get_image_size() {
    local image=$1
    docker images --format "table {{.Size}}" $image | tail -n 1 | sed 's/[^0-9.]//g' | head -c -1
}

# 函数：构建镜像
build_image() {
    local dockerfile=$1
    local tag=$2
    local description=$3
    
    print_message $BLUE "构建 $description..."
    
    local start_time=$(date +%s)
    docker build -f $dockerfile -t $tag . > /dev/null 2>&1
    local end_time=$(date +%s)
    local build_time=$((end_time - start_time))
    
    print_message $GREEN "$description 构建完成 (${build_time}秒)"
}

# 函数：分析镜像
analyze_image() {
    local image=$1
    local description=$2
    
    print_message $YELLOW "\n=== $description 分析 ==="
    
    # 基本信息
    echo "镜像标签: $image"
    
    # 镜像大小
    local size_info=$(docker images $image --format "table {{.Size}}")
    echo "镜像大小: $(echo "$size_info" | tail -n 1)"
    
    # 层数统计
    local layers=$(docker history $image --format "table {{.CreatedBy}}" | wc -l)
    echo "镜像层数: $((layers - 1))"
    
    # 创建时间
    local created=$(docker images $image --format "table {{.CreatedAt}}")
    echo "创建时间: $(echo "$created" | tail -n 1)"
    
    # 详细层信息
    echo -e "\n层详细信息:"
    docker history $image --format "table {{.Size}}\t{{.CreatedBy}}" | head -10
}

# 函数：比较镜像
compare_images() {
    local standard_image=$1
    local optimized_image=$2
    
    print_message $BLUE "\n=== 镜像对比分析 ==="
    
    # 获取镜像大小（这里简化处理，实际应该解析具体的字节数）
    local standard_size=$(docker images $standard_image --format "{{.Size}}")
    local optimized_size=$(docker images $optimized_image --format "{{.Size}}")
    
    echo "标准版镜像: $standard_size"
    echo "优化版镜像: $optimized_size"
    
    # 层数比较
    local standard_layers=$(docker history $standard_image --format "table {{.CreatedBy}}" | wc -l)
    local optimized_layers=$(docker history $optimized_image --format "table {{.CreatedBy}}" | wc -l)
    
    echo "标准版层数: $((standard_layers - 1))"
    echo "优化版层数: $((optimized_layers - 1))"
    
    # 构建缓存分析
    echo -e "\n构建缓存友好性分析:"
    echo "标准版 Dockerfile 层结构:"
    docker history $standard_image --format "table {{.CreatedBy}}" | head -5 | tail -4
    
    echo -e "\n优化版 Dockerfile 层结构:"
    docker history $optimized_image --format "table {{.CreatedBy}}" | head -5 | tail -4
}

# 函数：性能测试
performance_test() {
    local image=$1
    local description=$2
    
    print_message $YELLOW "\n=== $description 性能测试 ==="
    
    # 启动时间测试
    print_message $BLUE "测试容器启动时间..."
    
    local start_time=$(date +%s%N)
    local container_id=$(docker run -d -p 3002:3000 $image)
    
    # 等待健康检查通过
    local ready=false
    local timeout=60
    local elapsed=0
    
    while [ $elapsed -lt $timeout ] && [ "$ready" = false ]; do
        if curl -f http://localhost:3002/api/health &> /dev/null; then
            ready=true
            local end_time=$(date +%s%N)
            local startup_time=$(((end_time - start_time) / 1000000))
            print_message $GREEN "启动时间: ${startup_time}ms"
        else
            sleep 1
            elapsed=$((elapsed + 1))
        fi
    done
    
    if [ "$ready" = false ]; then
        print_message $RED "启动超时 (${timeout}秒)"
    fi
    
    # 清理测试容器
    docker stop $container_id > /dev/null 2>&1
    docker rm $container_id > /dev/null 2>&1
}

# 函数：安全扫描
security_scan() {
    local image=$1
    local description=$2
    
    print_message $YELLOW "\n=== $description 安全扫描 ==="
    
    # 检查是否安装了安全扫描工具
    if command -v trivy &> /dev/null; then
        print_message $BLUE "使用 Trivy 进行安全扫描..."
        trivy image --severity HIGH,CRITICAL $image | head -20
    elif command -v docker &> /dev/null && docker scout version &> /dev/null; then
        print_message $BLUE "使用 Docker Scout 进行安全扫描..."
        docker scout cves $image | head -20
    else
        print_message $YELLOW "未找到安全扫描工具，跳过安全扫描"
        print_message $YELLOW "建议安装 Trivy 或 Docker Scout 进行安全扫描"
    fi
}

# 主函数
main() {
    print_message $GREEN "🐳 Docker 镜像比较分析工具"
    print_message $BLUE "比较标准版和优化版 Dockerfile 的构建结果\n"
    
    # 检查必要工具
    if ! command -v docker &> /dev/null; then
        print_message $RED "错误: Docker 未安装"
        exit 1
    fi
    
    if ! command -v bc &> /dev/null; then
        print_message $YELLOW "警告: bc 计算器未安装，某些计算可能不准确"
    fi
    
    # 构建镜像
    print_message $BLUE "开始构建镜像进行比较...\n"
    
    build_image "Dockerfile" "choir-mem:standard" "标准版镜像"
    build_image "Dockerfile.optimized" "choir-mem:optimized" "优化版镜像"
    
    # 分析镜像
    analyze_image "choir-mem:standard" "标准版镜像"
    analyze_image "choir-mem:optimized" "优化版镜像"
    
    # 比较镜像
    compare_images "choir-mem:standard" "choir-mem:optimized"
    
    # 性能测试
    performance_test "choir-mem:standard" "标准版镜像"
    performance_test "choir-mem:optimized" "优化版镜像"
    
    # 安全扫描
    security_scan "choir-mem:standard" "标准版镜像"
    security_scan "choir-mem:optimized" "优化版镜像"
    
    # 总结
    print_message $GREEN "\n=== 总结建议 ==="
    print_message $BLUE "1. 镜像大小: 优化版通常比标准版小 10-30%"
    print_message $BLUE "2. 构建时间: 优化版通过更好的层缓存可以减少重复构建时间"
    print_message $BLUE "3. 安全性: 两个版本都使用 Alpine Linux 和非 root 用户"
    print_message $BLUE "4. 生产建议: 使用优化版 Dockerfile 进行生产部署"
    
    print_message $GREEN "\n✅ 分析完成!"
}

# 运行主函数
main "$@"