# 快速开始

## 环境要求

- Node.js 18+
- Cloudflare 账号
- Wrangler CLI

## 5 分钟启动

```bash
# 克隆仓库
git clone https://github.com/gxxk-dev/VOCArchive.git
cd VOCArchive

# 安装依赖
npm install

# 创建 D1 数据库
wrangler d1 create vocarchive-dev

# 配置 wrangler.toml（填入数据库 ID）
# [[d1_databases]]
# binding = "DB"
# database_name = "vocarchive-dev"
# database_id = "你的数据库ID"

# 启动开发服务器
npm run dev
```

访问 `http://localhost:8787/init` 初始化数据库。
