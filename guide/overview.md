# 项目概览

VOCArchive 是一个基于 Cloudflare Workers 的泛 VOCALOID 作品存档系统，专为边缘计算环境设计。

## 是什么

一个完整的音乐作品管理系统，运行在 Cloudflare 的全球边缘网络上，提供：
- 作品元数据管理（标题、创作者、标签、分类）
- 多媒体资源管理（音频、视频、歌词、图片）
- 外部存储抽象（IPFS、原始 URL）
- 版权管理和 Wiki 链接
- Web 管理后台

## 解决什么问题

- **全球访问**: 边缘计算带来低延迟
- **数据持久化**: D1 分布式 SQLite 数据库
- **Serverless 架构**: 无服务器运维，按需扩展
- **类型安全**: TypeScript + Drizzle ORM 全栈类型推导

## 技术栈

| 类别 | 技术 |
|------|------|
| 运行环境 | Cloudflare Workers（边缘计算） |
| 数据库 | Cloudflare D1（分布式 SQLite） |
| Web 框架 | Hono v4（高性能路由） |
| ORM | Drizzle ORM（类型安全） |
| 认证 | TOTP + JWT |
| 渲染 | Hono JSX（SSR） |
| 构建 | TypeScript + Wrangler |

## 核心设计

VOCArchive 的几个关键设计决策：

### 1. 双 ID 系统

所有实体同时拥有 `id`（自增整数）和 `uuid`（文本）：
- **UUID**: 用于外部 API 和 URL，分布式友好
- **ID**: 用于内部关联查询，性能优化

详见：[双 ID 系统](../architecture/dual-id-system.md)

### 2. 自定义迁移系统

不使用 Drizzle Kit 的迁移，而是自建迁移引擎，支持：
- 参数化迁移（运行时输入）
- 干运行预览
- 版本管理和回滚
- 迁移序列验证

详见：[迁移系统](../architecture/migration-system.md)

### 3. 多 iframe 管理后台

Admin 后台使用三层 iframe 架构隔离页面，通过 postMessage 通信：
- 主窗口：认证和标签导航
- 内容 iframe：数据列表展示
- 编辑器 iframe：表单编辑

详见：[Admin 多 iframe 架构](../architecture/admin-iframe.md)

### 4. 外部存储抽象

媒体文件不直接存储在 D1，而是通过外部存储抽象层：
```
ExternalSource (存储源配置)
    ↓
ExternalObject (具体文件)
    ↓
MediaSource / Asset (关联到作品)
```

详见：[外部存储抽象](../architecture/external-storage.md)
