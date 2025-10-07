# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个 VitePress 文档站点，为 VOCArchive（一个基于 Cloudflare Workers 的 VOCALOID 作品存档系统）提供完整的技术文档。该文档站点部署在 Cloudflare Pages 上。

项目源码位于： D:\VOCArch1ve

## 技术栈

- **静态站点生成器**: VitePress 2.x
- **图表支持**: Mermaid (集成到 VitePress 配置中)
- **部署平台**: Cloudflare Pages (通过 Wrangler)
- **项目类型**: 纯前端文档站点，无后端服务

## 常用开发命令

```bash
# 启动开发服务器（支持热重载）
npm run docs:dev

# 构建文档站点
npm run docs:build

# 预览构建后的站点
npm run docs:preview

# 部署到 Cloudflare Pages（需要先构建）
wrangler pages deploy
```

## 文档架构

### 核心文档文件
- `index.md` - 首页，包含项目介绍和快速开始
- `README.md` - 项目概览和基本说明
- `api.md` - API 文档和端点说明
- `database.md` - 数据库架构和表结构
- `data-structures.md` - 内部数据结构和类型定义
- `migration-system.md` - 迁移系统架构与使用指南
- `development.md` - 本地开发指南
- `setup.md` - 安装配置说明

### VitePress 配置
- `.vitepress/config.mts` - 主配置文件
- 支持 Mermaid 图表的自定义渲染
- 导航栏包含 GitHub 链接和演示站点链接

### 部署配置
- `wrangler.toml` - Cloudflare Pages 部署配置
- 构建输出目录: `.vitepress/dist`
- 兼容性日期: 2025-07-12

## 内容编辑指南

### Mermaid 图表
使用标准的 Mermaid 语法块：
```markdown
\`\`\`mermaid
graph TB
    A[节点A] --> B[节点B]
\`\`\`
```

### 文档结构
- 每个文档文件都应该有清晰的标题层级
- 使用代码块展示 API 示例和命令
- 保持中文内容的一致性

## 特殊注意事项

1. **构建前检查**: 修改配置文件后，务必运行 `npm run docs:build` 确保构建成功
2. **Mermaid 语法**: 图表代码需要正确的 Mermaid 语法，错误会导致构建失败
3. **链接检查**: 内部链接使用相对路径，确保链接正确指向现有文件
4. **部署流程**: 构建成功后使用 `wrangler pages deploy` 部署到 Cloudflare Pages