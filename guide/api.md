# API 概览

## 认证

- `POST /api/auth/login` - TOTP 登录，返回 JWT

## 查询

- `GET /api/list/{type}` - 列表（分页）
- `GET /api/get/{type}/{index}` - 获取单个项目（使用 Index 标识符）
- `GET /api/search/{query}` - 搜索作品

## 修改（需要认证）

- `POST /api/input/{type}` - 创建
- `POST /api/update/{type}` - 更新
- `POST /api/delete/{type}` - 删除

## 迁移（需要认证）

- `GET /api/migration/status` - 迁移状态
- `POST /api/migration/execute` - 执行迁移
- `POST /api/migration/rollback` - 回滚

## 说明

- 所有实体（work、creator、tag 等）使用 `index` 字段作为外部唯一标识符
- Index 是由 nanoid 生成的 8 字符字符串（如 `a1b2c3d4`）
- 为保持向后兼容，部分页面路由仍支持 `uuid` 参数

完整 API 文档见项目仓库的 `CLAUDE.md`。
