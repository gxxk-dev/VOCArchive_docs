# 开发注意事项

## Workers 环境限制

- 不支持完整的 Node.js API（使用 `nodejs_compat` 兼容标志）
- 请求执行时间有限制（CPU Time）
- 不要使用 `fs`、`path` 等 Node.js 模块（构建脚本除外）

## 数据库操作

- 优先使用 `src/app/db/operations/` 中的现有函数
- 避免直接编写 SQL，使用 Drizzle ORM
- 外部 API 始终使用 UUID，内部查询使用 ID

## 认证

- JWT Secret 和 TOTP Secret 优先从数据库 `site_config` 读取
- 环境变量 `JWT_SECRET` 和 `TOTP_SECRET` 作为 fallback

## 迁移

- **不要使用 Drizzle Kit 的迁移系统**
- 修改 Schema 后，在 `src/migrations/` 创建迁移文件
- 运行 `npm run build:migrations` 生成注册表
