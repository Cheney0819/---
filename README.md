# 时光笺 (Shiguangjian)

你和 ta 的私密空间。

## 项目结构

```
时光笺/
├── packages/
│   ├── api/          # 后端 API (Fastify + Prisma)
│   ├── web/          # iOS PWA 网页版 (Next.js)
│   ├── mobile/       # Android 原生 App (React Native)
│   └── shared/       # 共享类型定义
├── package.json      # Monorepo 配置
└── README.md
```

## 技术栈

| 模块 | 技术 | 说明 |
|------|------|------|
| 后端 | Fastify + Prisma | API 服务 |
| 数据库 | PostgreSQL | 关系型数据库 |
| 缓存 | Redis | 会话状态 |
| iOS PWA | Next.js + Tailwind | 网页版 |
| Android | React Native + Expo | 原生 App |
| 加密 | Signal Protocol | 端到端加密 |
| 推送 | FCM + Server酱 | 双通道推送 |

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp packages/api/.env.example packages/api/.env
# 编辑 .env 文件配置数据库等信息
```

### 3. 初始化数据库

```bash
cd packages/api
npx prisma db push
npx prisma generate
```

### 4. 启动开发服务器

```bash
# 启动 API 服务器
npm run dev:api

# 启动 iOS PWA
npm run dev:web

# 启动 Android App
npm run dev:mobile
```

## 功能模块

- [x] 用户注册/登录
- [x] 配对系统
- [ ] 端到端加密聊天
- [ ] 时间胶囊
- [ ] 记忆时间轴
- [ ] 共享日记
- [ ] 共享相册
- [ ] 推送通知

## 文档

- [产品需求文档](时光笺-需求文档.md)
- [技术方案](私密聊天应用-技术方案.md)
