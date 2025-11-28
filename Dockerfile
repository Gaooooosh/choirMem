ARG NODE_IMAGE_REGISTRY=docker.m.daocloud.io/library
ARG NODE_VERSION=20

# ---------------- deps 阶段：装构建依赖 + node_modules ----------------
FROM ${NODE_IMAGE_REGISTRY}/node:${NODE_VERSION} AS deps
WORKDIR /app

# 启用 corepack + 指定 pnpm 版本
RUN corepack enable \
  && corepack prepare pnpm@10.23.0 --activate

# ✅ 把所有 apt 源配置干掉（包括 .list / .sources），只保留阿里云
RUN rm -f /etc/apt/sources.list /etc/apt/sources.list.d/* \
  && printf 'deb http://mirrors.aliyun.com/debian bookworm main contrib non-free non-free-firmware\n\
deb http://mirrors.aliyun.com/debian bookworm-updates main contrib non-free non-free-firmware\n\
deb http://mirrors.aliyun.com/debian-security bookworm-security main contrib non-free non-free-firmware\n' \
    > /etc/apt/sources.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# 只拷贝依赖文件，方便 Docker 缓存命中
COPY package.json pnpm-lock.yaml ./

# 使用国内 npm 镜像，加速依赖安装
RUN pnpm config set registry https://registry.npmmirror.com \
  && pnpm install --frozen-lockfile

# ---------------- builder 阶段：构建应用 ----------------
FROM ${NODE_IMAGE_REGISTRY}/node:${NODE_VERSION} AS builder
WORKDIR /app

# 拷贝依赖
COPY --from=deps /app/node_modules ./node_modules

# 再启一次 corepack（不同 stage 环境独立）
RUN corepack enable \
  && corepack prepare pnpm@10.23.0 --activate

# 拷贝源码
COPY . .

ENV NODE_OPTIONS=--no-deprecation

# 构建（例如 Next.js）
RUN pnpm build

# ---------------- runner 阶段：运行时镜像 ----------------
FROM ${NODE_IMAGE_REGISTRY}/node:${NODE_VERSION}-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_PUBLIC_SERVER_URL=http://127.0.0.1:3000

# 拷贝构建产物
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=deps /app/node_modules ./node_modules

# 运行时必须存在的持久目录（数据库与上传目录）
RUN mkdir -p ./data ./public/media ./scores

EXPOSE 3000
CMD ["node","server.js"]
