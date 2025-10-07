# API 概览

## 认证

- `POST /api/auth/login` - TOTP 登录，返回 JWT

## 查询

- `GET /api/list/{type}` - 列表（分页）
- `GET /api/get/{type}/{uuid}` - 获取单个项目
- `GET /api/search/{query}` - 搜索作品

## 修改（需要认证）

- `POST /api/input/{type}` - 创建
- `POST /api/update/{type}` - 更新
- `POST /api/delete/{type}` - 删除

## 迁移（需要认证）

- `GET /api/migration/status` - 迁移状态
- `POST /api/migration/execute` - 执行迁移
- `POST /api/migration/rollback` - 回滚

完整 API 文档见项目仓库的 `apilist.md`。
