# 常用命令

## 开发

```bash
npm run dev                  # 启动开发服务器
npm run deploy               # 部署到生产环境
npm run cf-typegen           # 生成 Workers 类型定义
```

## 数据库

```bash
npm run db:generate          # 生成 Drizzle 迁移（仅供参考）
npm run db:push              # 推送 Schema 到 D1
npm run db:studio            # Drizzle Studio 可视化
npm run db:export            # 导出本地数据库
npm run db:export:prod       # 导出生产(D1 远程)数据库
```

## 构建

```bash
npm run build:migrations     # 生成迁移注册表
npm run build:version        # 生成版本信息
```
