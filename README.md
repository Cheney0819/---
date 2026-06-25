#时光笺 (Shiguangjian)

你和 ta 的私密空间，一款专为情侣设计的私密社交应用。

## 项目简介

时光笺是一款强调隐私保护的情侣专属应用，提供端到端加密聊天、时间胶囊、记忆时间轴、共享日记和共享相册等核心功能。应用采用现代跨平台技术栈，支持 Web PWA 和 Android 原生 App 多端使用。

## 项目结构

```
时光笺/
├── packages/
│   ├── api/          # 后端 API 服务 (Fastify + Prisma)
│   ├── web/          # iOS PWA 网页版 (Next.js + Tailwind)
│   ├── mobile/       # Android 原生应用 (React Native + Expo)
│   └── shared/       # 共享类型定义
├── package.json      # Monorepo 根配置
└── README.md
```

## 技术栈

| 模块 | 技术 | 说明 |
|------|------|------|
| 后端 API | Fastify | 高性能 Node.js Web 框架 |
| ORM | Prisma | 类型安全的数据库 ORM |
| 数据库 | PostgreSQL | 关系型数据存储 |
| 缓存 | Redis | 会话状态与限流 |
| 前端框架 | Next.js 14 | React 全栈框架 |
| 样式 | Tailwind CSS | 原子化 CSS 框架 |
| 移动端 | React Native + Expo | 跨平台移动开发 |
| 端加密 | Signal Protocol | 端到端加密协议 |
| 推送 | FCM + Server酱 | 双通道推送服务 |
| WebSocket | ws | 实时消息通信 |

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- PostgreSQL >= 14.0
- Redis >= 6.0
- npm >= 9.0

### 1. 安装依赖

```bash
# 克隆项目后，进入目录
npm install
```

### 2. 配置环境变量

```bash
# 复制环境变量示例文件
cp packages/api/.env.example packages/api/.env

# 编辑 .env 文件，配置以下内容：
# - DATABASE_URL: PostgreSQL 连接地址
# - REDIS_URL: Redis 连接地址
# - JWT_SECRET: JWT 密钥
# - SERVERCHAN_SENDKEY: Server酱推送密钥
# - FCM_SERVICE_ACCOUNT: Firebase 服务账号配置
```

### 3. 初始化数据库

```bash
cd packages/api
npx prisma db push      # 同步数据库结构
npx prisma generate    # 生成 Prisma 客户端
```

### 4. 启动开发服务器

```bash
# 根目录运行
npm run dev:api        # 启动后端 API (端口 3000)
npm run dev:web        # 启动 iOS PWA (端口 3001)
npm run dev:mobile    # 启动 Android 开发版
```

## 核心功能

### ✅ 已完成

- **用户系统**
  - 用户注册/登录
  - 邀请码配对
  - 密钥交换

- **即时通讯**
  - 实时消息推送
  - WebSocket 长连接
  - 消息已读回执
  - 轮询 fallback

- **时间胶囊**
  - 创建未来消息
  - 定时开启
  - 推送通知

- **共享日记**
  - 创建日记本
  - 每日记录
  - 双向编辑

- **共享相册**
  - 创建相册
  - 上传照片
  - 双向可见

### 🔄 开发中

- **端到端加密聊天**
  - Signal Protocol 集成
  - 密钥预生成

### 📋 计划中

- 记忆时间轴
- 离线消息同步
- 消息撤回/编辑

## API 接口概览

### 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| GET | /api/auth/me | 获取当前用户 |

### 配对接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/pairs | 创建配对 |
| GET | /api/pairs/:id | 获取配对信息 |
| GET | /api/users/by-code/:code | 邀请码搜索 |

### 消息接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/messages/:pairId | 发送消息 |
| GET | /api/messages/:pairId/poll | 消息轮询 |
| PUT | /api/messages/:pairId/:messageId/read | 已读标记 |

### 时间胶囊

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/capsules | 创建胶囊 |
| GET | /api/capsules/sent | 已发送胶囊 |
| GET | /api/capsules/received | 已接收胶囊 |
| POST | /api/capsules/:id/open | 开启胶囊 |

### 日记

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/diaries | 创建日记本 |
| POST | /api/diaries/:id/entries | 添加日记 |
| GET | /api/diaries/:id/entries/:entryId | 获取日记条目 |

### 相册

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/albums | 创建相册 |
| POST | /api/albums/:id/photos | 添加照片 |
| DELETE | /api/albums/photos/:id | 删除照片 |

## 部署指南

### 方式一：Vercel 部署（推荐）

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署 web
cd packages/web
vercel deploy --prod
```

### 方式二：Docker 部署

```bash
# 使用 docker-compose
docker-compose up -d
```

详见 [DEPLOY.md](./DEPLOY.md)

## 目录结构说明

```
packages/
├── api/                    # 后端服务
│   ├── prisma/            # 数据库模型和迁移
│   ├── src/
│   │   ├── routes/       # API 路由定义
│   │   ├── services/     # 业务服务
│   │   │   ├── notification.ts   # 推送服务
│   │   │   ├── scheduler.ts    # 定时任务
│   │   │   └── websocket.ts   # WebSocket 管理
│   │   ├── middleware/   # 中间件
│   │   │   └── ratelimit.ts    # 限流
│   │   └── index.ts       # 入口文件
│   └── scripts/          # 辅助脚本
│       └── tunnel.sh    # 内网穿透
│
├── web/                    # PWA 前端
│   ├── src/
│   │   ├── app/          # Next.js App Router 页面
│   │   │   ├── api/      # 内部 API 代理
│   │   │   ├── chat/    # 聊天页面
│   │   │   ├── diary/   # 日记页面
│   │   │   ├── album/   # 相册页面
│   │   │   └── ...
│   │   ├── components/  # 组件库
│   │   │   ├── ui/       # 基础 UI 组件
│   │   │   ├── chat/    # 聊天相关
│   │   │   └── capsule/ # 时间胶囊
│   │   ├── contexts/     # React Context
│   │   ├── hooks/       # 自定义 Hooks
│   │   ├── lib/         # 工具库
│   │   │   ├── api.ts   # API 请求封装
│   │   │   ├── crypto.ts # 加密工具
│   │   │   └── notification.ts # 推送
│   │   └── stores/      # 状态管理
│   └── public/          # 静态资源
│
├── mobile/                 # React Native App
│   ├── src/
│   │   └── components/ # 移动端组件
│   └── App.tsx          # 应用入口
│
└── shared/                 # 共享类型
    └── types.ts         # TypeScript 类型定义
```

## 开发指南

### 代码规范

- 使用 ESLint + Prettier 进行代码格式化
- 提交前运行 `npm run lint`

### 数据库迁移

```bash
# 创建迁移
npx prisma migrate dev --name init

# 应用迁移
npx prisma migrate deploy

# 重置数据库（开发环境）
npx prisma migrate reset
```

### 测试

```bash
# 运行测试
npm run test

# 运行单元测试
npm run test:unit
```

## 贡献指南

欢迎提交 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/xxx`)
3. 提交更改 (`git commit -m 'Add xxx'`)
4. 推送分支 (`git push origin feature/xxx`)
5. 创建 Pull Request

## 许可证

本项目仅供学习交流使用，请勿用于商业目的。

## 文档

- [产品需求文档](./时光笺-需求文档.md)
- [技术方案](./私密聊天应用-技术方案.md)
- [部署指南](./DEPLOY.md)

---

Made with ❤️ for you and your loved one.