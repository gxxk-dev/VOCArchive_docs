# 项目结构

## 目录树

```
VOCArchive/
├── src/
│   ├── app/
│   │   ├── index.tsx           # 应用入口
│   │   ├── auth.ts             # 认证逻辑
│   │   ├── db/
│   │   │   ├── schema.ts       # 数据库 Schema
│   │   │   ├── client.ts       # Drizzle 客户端
│   │   │   ├── operations/     # 数据库操作（按实体分模块）
│   │   │   └── utils/          # 迁移引擎、UUID 转换等
│   │   ├── routes/             # API 路由
│   │   ├── pages/              # SSR 页面组件
│   │   ├── admin/              # Admin 数据加载器
│   │   └── utils/              # 版本信息等工具
│   └── migrations/             # 数据库迁移文件
├── public/
│   ├── admin/                  # Admin 前端资源
│   │   ├── js/                 # Admin JS 模块
│   │   └── css/                # 样式
│   ├── css/                    # 全局样式
│   ├── init/                   # 初始化页面资源
│   └── sw.js                   # Service Worker
├── scripts/
│   ├── generate-migration-registry.js  # 生成迁移注册表
│   └── generate-version-info.js        # 生成版本信息
├── wrangler.toml               # Cloudflare Workers 配置
└── drizzle.config.ts           # Drizzle Kit 配置
```

## 关键目录说明

**`src/app/db/operations/`** - 所有数据库操作按实体分模块，如：
- `work.ts` - 作品 CRUD
- `creator.ts` - 创作者操作
- `search.ts` - 搜索功能
- `config.ts` - 站点配置

**`src/migrations/`** - 迁移文件，格式 `001_description.ts`

**`public/admin/js/`** - Admin 前端模块化 JS：
- `core/` - 认证、配置
- `ui/` - 主题、iframe 管理、内容加载
- `api/` - API 封装

**`src/app/pages/`** - Hono JSX 页面组件（SSR）
