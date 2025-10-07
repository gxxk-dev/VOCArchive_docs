---
layout: home

hero:
  name: "VOCArchive"
  text: "泛 VOCALOID 作品存档系统"
  tagline: 基于 Cloudflare 的现代化作品管理平台
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/quick-start
    - theme: alt
      text: GitHub
      link: https://github.com/gxxk-dev/VOCArchive
    - theme: alt
      text: Demo(VAZone)
      link: https://zone.vocarchive.com

features:
  - icon: 🌍
    title: 全球边缘部署
    details: 基于 Cloudflare Workers，实现全球低延迟访问
  - icon: 🗄️
    title: 分布式数据库
    details: Cloudflare D1 分布式 SQLite，强一致性保证
  - icon: 🔐
    title: 安全认证
    details: TOTP + JWT 双重认证，密钥数据库存储
  - icon: 🚀
    title: 现代技术栈
    details: Hono.js + Drizzle ORM + TypeScript
  - icon: 📋
    title: 完整 CRUD
    details: 作品、创作者、标签、分类的完整管理
  - icon: 🔗
    title: 关系管理
    details: 作品间关系、多语言标题、外部链接
  - icon: 💾
    title: 多存储支持
    details: 支持 IPFS、原始 URL 等多种存储方式
  - icon: 🔄
    title: 迁移友好
    details: 迁移脚本，适配 Workers 环境
  - icon: ⚡
    title: 高性能
    details: Serverless 架构，按需扩展，零冷启动
---

## 快速预览

### 核心功能

**作品管理** - 支持音乐、图片、歌词等多媒体资产
```http
GET /api/list/work/1/10
POST /api/input/work
```

**创作者系统** - 人类/虚拟创作者分类管理
```http
GET /api/list/creator/1/10
POST /api/input/creator
```

**标签分类** - 层级分类与自由标签双重组织
```http
GET /api/list/tags-with-counts
GET /api/list/works-by-tag/{uuid}/1/10
```

### 技术架构

```mermaid
graph TB
    A[用户请求] --> B[Cloudflare Workers]
    B --> C[Hono.js 路由]
    C --> D[Drizzle ORM]
    D --> E[Cloudflare D1]

    F[外部存储] --> G[IPFS/URL]
    E --> H[作品数据]
    G --> H
```

### 数据模型

- **19 个数据表** - 完整的实体关系设计
- **UUID 业务主键** - 便于分布式环境使用
- **多语言支持** - 作品标题国际化
- **外键约束** - 确保数据完整性

## 开始使用

1. **克隆仓库**
   ```bash
   git clone https://github.com/gxxk-dev/VOCArchive.git
   ```

2. **安装依赖**
   ```bash
   npm i
   ```

3. **配置数据库**
   ```bash
   wrangler d1 create vocarchive-dev
   # 在 wrangler.toml 填入你的数据库uuid
   ```

4. **启动开发**
   ```bash
   npm run dev
   ```

---

<div style="text-align: center; margin-top: 2rem; color: #666; font-size: 0.9em;">
  此文档技术参照版本： <code>commit 41ac5455b9753c9bbbf791e03feae0f68248d61f(branch main)</code>
</div>
