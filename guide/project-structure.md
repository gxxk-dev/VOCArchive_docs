# 项目结构

## 目录树

```
VOCArchive/
├── src/
│   ├── app/
│   │   ├── index.tsx           # 应用入口（分层中间件架构）
│   │   ├── auth.ts             # 认证逻辑
│   │   ├── middleware/         # 中间件层
│   │   │   ├── database.ts     # 数据库中间件
│   │   │   ├── jwt.ts          # JWT 认证中间件
│   │   │   └── error-handler.ts # 错误处理中间件
│   │   ├── services/           # 服务层
│   │   │   ├── page-service.ts # 页面数据加载服务
│   │   │   └── admin-editor-service.ts # 编辑器业务逻辑服务
│   │   ├── types/              # 类型系统
│   │   │   ├── page-data.ts    # 页面数据类型定义
│   │   │   └── admin-data.ts   # 管理后台数据类型定义
│   │   ├── db/
│   │   │   ├── schema.ts       # 数据库 Schema
│   │   │   ├── client.ts       # Drizzle 客户端
│   │   │   ├── operations/     # 数据库操作（按实体分模块）
│   │   │   └── utils/          # 迁移引擎、Index 转换等
│   │   ├── routes/             # 路由配置
│   │   │   ├── api.ts          # API 路由（createApiApp 工厂函数）
│   │   │   └── pages.tsx       # 页面路由（createPageRoutes 工厂函数）
│   │   ├── pages/              # SSR 页面组件
│   │   └── admin/              # Admin 数据加载器
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

### 核心应用层 (`src/app/`)

**应用入口** (`index.tsx`)：
- 采用分层中间件架构（从 600+ 行精简到 117 行）
- 使用工厂函数组织路由（`createApiApp()`, `createPageRoutes()`）
- 中间件执行顺序：数据库 → 路由 → 版本检查 → 初始化检查 → 错误处理

**中间件层** (`middleware/`)：
- `database.ts` - 统一注入 DB 客户端到上下文（`c.get('db')`）
- `jwt.ts` - JWT 认证中间件（支持 header 和 URL 参数）
- `error-handler.ts` - 全局错误处理和自定义错误类型

**服务层** (`services/`)：
- `page-service.ts` - 封装页面数据加载，支持并行加载优化性能
- `admin-editor-service.ts` - 封装编辑器数据加载和表单选项加载

**类型系统** (`types/`)：
- `page-data.ts` - 页面数据类型（`IndexPageData`, `PlayerPageData` 等）
- `admin-data.ts` - 管理后台数据类型（`FormOptions`, `EditorData` 等）

**路由配置** (`routes/`)：
- `api.ts` - API 路由工厂函数，包含 JWT 中间件
- `pages.tsx` - 页面路由工厂函数，调用服务层加载数据

### 数据库层 (`src/app/db/`)

**操作模块** (`operations/`)：
- 所有数据库操作按实体分模块，如：
  - `work.ts` - 作品 CRUD
  - `creator.ts` - 创作者操作
  - `search.ts` - 搜索功能
  - `config.ts` - 站点配置
  - `admin.ts` - 管理功能

**工具模块** (`utils/`)：
- `index-id-converter.ts` - Index ↔ ID 转换器
- `index-utils.ts` - Index 生成工具（nanoid）
- `migration-engine.ts` - 自定义迁移引擎
- `migration-scanner.ts` - 迁移文件扫描器

### 迁移系统 (`src/migrations/`)

迁移文件格式：`001_description.ts`, `002_description.ts` ...

每个迁移文件导出：
- `version` (number) - 版本号
- `description` (string) - 描述
- `up(db)` - 升级函数
- `down(db)` - 回滚函数（可选）

### 前端资源 (`public/`)

**Admin 前端** (`public/admin/js/`)：
- `core/` - 认证、配置
- `ui/` - 主题、iframe 管理、内容加载
- `api/` - API 封装
- `editor-client.js` - 编辑器客户端事件处理（SSR 表单增强）

**SSR 页面** (`src/app/pages/`)：
- Hono JSX 页面组件（服务端渲染）
- `layouts/` - 布局模板
- `components/` - 可复用组件
- `scripts/` - 客户端脚本注入

## 架构特点

### 1. 分层架构

```
请求
  ↓
中间件层（数据库、认证、错误处理）
  ↓
路由层（API 路由 / 页面路由）
  ↓
服务层（数据加载、业务逻辑）
  ↓
数据库操作层（CRUD、查询优化）
```

### 2. 依赖注入

- 数据库客户端通过中间件注入到上下文
- 路由处理器通过 `c.get('db')` 访问
- 避免重复创建连接，提升性能

### 3. 类型安全

- 所有数据结构有明确的 TypeScript 类型定义
- 服务层返回类型化的页面数据
- 端到端类型推导（数据库 → 服务层 → 路由层 → 页面组件）

### 4. 代码组织

- **路由层**：接收请求、调用服务层、返回响应
- **服务层**：封装业务逻辑、并行加载数据
- **数据库操作层**：专注数据访问、查询优化

这种架构提升了代码的可维护性、可测试性和性能。
