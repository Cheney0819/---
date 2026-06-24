# 时光笺 - 部署指南

## 方式一：Vercel 部署（推荐）

### 1. 安装 Vercel CLI
```bash
npm install -g vercel
```

### 2. 登录 Vercel
```bash
cd /Users/jiee/Desktop/时光笺/packages/web
vercel login
```
在浏览器中完成登录。

### 3. 部署
```bash
vercel --prod
```

### 4. 配置环境变量
在 Vercel 控制台添加：
- `NEXT_PUBLIC_API_URL`: 你的 API 地址

---

## 方式二：Netlify 部署

### 1. 安装 Netlify CLI
```bash
npm install -g netlify-cli
```

### 2. 登录
```bash
netlify login
```

### 3. 初始化并部署
```bash
cd /Users/jiee/Desktop/时光笺/packages/web
netlify init
netlify deploy --prod
```

---

## 方式三：本地运行

```bash
cd /Users/jiee/Desktop/时光笺

# 启动后端
npm run dev:api

# 启动前端
npm run dev:web

# 访问
# 前端: http://localhost:3001
# API: http://localhost:3000
```

---

## 后续开发流程

### 修复 Bug
```bash
# 1. 修改代码
# 2. 本地测试
cd /Users/jiee/Desktop/时光笺
npm run dev:api  # 测试后端
npm run dev:web  # 测试前端

# 3. 部署
cd packages/web
vercel --prod
```

### 添加新功能
```bash
# 1. 开发功能
# 2. 测试
# 3. 部署
cd /Users/jiee/Desktop/时光笺/packages/web
vercel --prod
```

---

## 项目结构
```
/Users/jiee/Desktop/时光笺/
├── packages/
│   ├── api/          # 后端 API
│   ├── web/          # 前端 PWA
│   ├── mobile/       # 移动端 App
│   └── shared/       # 共享类型
├── 业务流程图.md
├── DEPLOY.md         # 本文件
└── README.md
```
