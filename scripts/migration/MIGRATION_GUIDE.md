# 数据迁移指南

本指南介绍如何使用分步迁移脚本将旧系统的数据迁移到新的 Payload CMS 系统。

## 迁移步骤概览

数据迁移分为以下几个独立的步骤，每个步骤都有其依赖关系：

1. **用户和权限组** (`users`) - 基础步骤，无依赖
2. **曲目和版本** (`tracks`) - 依赖：用户
3. **媒体文件** (`media`) - 依赖：用户、曲目
4. **内容数据** (`content`) - 依赖：用户、曲目
5. **系统设置** (`system`) - 依赖：用户

## 使用方法

### 查看帮助信息

```bash
pnpm migrate:step help
```

### 执行单个迁移步骤

```bash
# 迁移用户和权限组
pnpm migrate:users

# 迁移曲目和版本
pnpm migrate:tracks

# 迁移媒体文件
pnpm migrate:media

# 迁移内容数据
pnpm migrate:content

# 迁移系统设置
pnpm migrate:system
```

### 执行完整迁移

```bash
# 按正确顺序执行所有迁移步骤
pnpm migrate:all
```

### 自定义路径参数

```bash
# 指定旧数据库路径
pnpm migrate:users ./custom/path/to/old.db

# 媒体迁移需要额外的文件路径参数
pnpm migrate:media ./数据迁移/app.db ./数据迁移/temp_backup/uploads ./uploads

# 完整参数示例
pnpm migrate:step media ./数据迁移/app.db ./数据迁移/temp_backup/uploads ./uploads ./custom-mappings.json
```

## 迁移步骤详解

### 1. 用户和权限组迁移 (`users`)

**功能：**
- 迁移权限组数据
- 迁移用户账户数据
- 建立 ID 映射关系

**依赖：** 无

**输出：** 用户和权限组的 ID 映射

### 2. 曲目和版本迁移 (`tracks`)

**功能：**
- 迁移标签数据
- 迁移曲目数据
- 迁移曲目版本数据
- 处理富文本内容转换

**依赖：** 用户迁移完成

**输出：** 曲目、版本、标签的 ID 映射

### 3. 媒体文件迁移 (`media`)

**功能：**
- 迁移乐谱文件
- 迁移照片和其他媒体文件
- 复制文件到新的存储位置

**依赖：** 用户、曲目迁移完成

**参数：**
- 旧数据库路径
- 旧文件目录路径
- 新文件目录路径
- ID 映射文件路径

**输出：** 乐谱和媒体的 ID 映射

### 4. 内容数据迁移 (`content`)

**功能：**
- 迁移评论数据
- 迁移文章数据
- 处理用户关联和内容关联

**依赖：** 用户、曲目迁移完成

**输出：** 评论和文章的 ID 映射

### 5. 系统设置迁移 (`system`)

**功能：**
- 迁移邀请码数据
- 迁移系统设置
- 处理权限组关联

**依赖：** 用户迁移完成

**输出：** 邀请码和系统设置的 ID 映射

## 文件结构

```
scripts/migration/
├── migrate-step.ts          # 主控制脚本
├── migrate-users.ts         # 用户迁移脚本
├── migrate-tracks.ts        # 曲目迁移脚本
├── migrate-media.ts         # 媒体迁移脚本
├── migrate-content.ts       # 内容迁移脚本
├── migrate-system.ts        # 系统迁移脚本
├── data-transformer.ts      # 数据转换器
├── old-data-reader.ts       # 旧数据读取器
├── file-migrator.ts         # 文件迁移器
├── id-mapper.ts             # ID 映射器
├── utils.ts                 # 工具函数
├── id-mappings.json         # ID 映射文件
└── MIGRATION_GUIDE.md       # 本指南
```

## 注意事项

1. **执行顺序很重要**：必须按照依赖关系执行迁移步骤
2. **备份数据**：迁移前请备份现有数据库
3. **检查路径**：确保旧数据库和文件路径正确
4. **权限检查**：确保有足够的文件读写权限
5. **空间检查**：确保有足够的磁盘空间存储迁移的文件

## 故障排除

### 常见错误

1. **数据库连接失败**
   - 检查数据库文件路径是否正确
   - 确保数据库文件存在且可读

2. **依赖检查失败**
   - 确保按正确顺序执行迁移步骤
   - 检查 ID 映射文件是否存在

3. **文件复制失败**
   - 检查源文件路径和目标路径
   - 确保有足够的磁盘空间和权限

4. **数据转换错误**
   - 检查旧数据格式是否符合预期
   - 查看详细错误日志

### 重新执行迁移

如果某个步骤失败，可以：

1. 修复问题后重新执行该步骤
2. 删除对应的 ID 映射数据后重新执行
3. 如果需要，可以清空新数据库后重新开始

## 验证迁移结果

迁移完成后，建议：

1. 检查数据库中的记录数量
2. 验证关键数据的完整性
3. 测试前端功能是否正常
4. 检查文件是否正确复制

```bash
# 检查数据库记录数
sqlite3 payload.db "SELECT COUNT(*) FROM users;"
sqlite3 payload.db "SELECT COUNT(*) FROM tracks;"
sqlite3 payload.db "SELECT COUNT(*) FROM track_versions;"
```