# 双 ID 系统

VOCArchive 的所有主要实体同时拥有两种标识符：自增整数 ID 和 UUID。

## 设计动机

### 单一 ID 的问题

**仅使用自增 ID**：
- ❌ 分布式环境下容易冲突
- ❌ 对外暴露序列信息（可猜测总数）
- ❌ 难以在多个数据库实例间同步

**仅使用 UUID**：
- ❌ 查询性能低于整数索引
- ❌ 存储空间更大（36 字符 vs 4-8 字节）
- ❌ 关联查询性能较差

### 双 ID 的优势

- ✅ **UUID 对外**：稳定、分布式友好、不暴露内部信息
- ✅ **ID 对内**：高效索引、快速关联查询
- ✅ **兼顾性能与灵活性**

## Schema 设计

所有主要实体表都包含 `id` 和 `uuid` 字段：

```typescript
// src/app/db/schema.ts

export const work = sqliteTable('work', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    uuid: text('uuid').notNull().unique(),
    copyright_basis: text('copyright_basis', {
        enum: ['none', 'accept', 'license', 'onlymetadata', 'arr']
    }).notNull(),
});

export const creator = sqliteTable('creator', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    uuid: text('uuid').notNull().unique(),
    name: text('name').notNull(),
    type: text('type', { enum: ['human', 'virtual'] }).notNull(),
});

export const tag = sqliteTable('tag', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    uuid: text('uuid').notNull().unique(),
    name: text('name').notNull().unique(),
});
```

**关键点**：
- `id` 是主键（自增整数）
- `uuid` 有唯一约束
- 外键引用使用 `id`，不是 `uuid`

## 使用场景

### UUID 使用场景

**1. 外部 API**

所有公开 API 端点使用 UUID：

```http
GET /api/get/work/{uuid}
GET /api/get/creator/{uuid}
POST /api/delete/work
{
  "work_uuid": "550e8400-e29b-41d4-a716-446655440000"
}
```

**2. 前端 URL**

页面路由使用 UUID：

```
/player?uuid=550e8400-e29b-41d4-a716-446655440000
```

**3. 跨系统集成**

与外部系统交互时，UUID 作为唯一标识符。

### ID 使用场景

**1. 数据库关联**

关联表使用整数 ID 作为外键：

```typescript
export const workCreator = sqliteTable('work_creator', {
    work_id: integer('work_id').notNull().references(() => work.id, {
        onDelete: 'cascade'
    }),
    creator_id: integer('creator_id').notNull().references(() => creator.id, {
        onDelete: 'cascade'
    }),
    role: text('role').notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.work_id, table.creator_id, table.role] })
}));
```

**2. 内部查询**

数据库操作优先使用 ID：

```typescript
// 查询作品的所有创作者
const workCreators = await db.select()
    .from(workCreator)
    .leftJoin(creator, eq(workCreator.creator_id, creator.id))
    .where(eq(workCreator.work_id, workId));
```

**3. 性能敏感场景**

批量查询、关联查询使用 ID：

```typescript
// 获取多个作品的标签（使用 ID 效率更高）
const workTags = await db.select()
    .from(workTag)
    .leftJoin(tag, eq(workTag.tag_id, tag.id))
    .where(inArray(workTag.work_id, workIds));
```

## UUID-ID 转换

转换器位于 `src/app/db/utils/uuid-id-converter.ts`：

### UUID → ID

```typescript
export async function getWorkIdByUUID(db: DrizzleDB, uuid: string): Promise<number | null> {
    const result = await db.select({ id: work.id })
        .from(work)
        .where(eq(work.uuid, uuid))
        .limit(1);

    return result[0]?.id || null;
}
```

### ID → UUID

```typescript
export async function getWorkUUIDById(db: DrizzleDB, id: number): Promise<string | null> {
    const result = await db.select({ uuid: work.uuid })
        .from(work)
        .where(eq(work.id, id))
        .limit(1);

    return result[0]?.uuid || null;
}
```

### 典型使用模式

**API 端点**（UUID 转 ID）：

```typescript
app.get('/api/get/work/:uuid', async (c) => {
    const uuid = c.req.param('uuid');
    const db = createDrizzleClient(c.env.DB);

    // 1. UUID → ID
    const workId = await getWorkIdByUUID(db, uuid);
    if (!workId) {
        return c.notFound();
    }

    // 2. 使用 ID 查询
    const workData = await db.select()
        .from(work)
        .where(eq(work.id, workId))
        .limit(1);

    // 3. 返回包含 UUID 的数据
    return c.json(workData[0]);
});
```

**数据库操作函数**：

```typescript
// src/app/db/operations/work.ts

export async function getWorkByUUID(db: DrizzleDB, uuid: string) {
    // 直接使用 UUID 查询（已有索引）
    const result = await db.select()
        .from(work)
        .leftJoin(workTitle, eq(work.id, workTitle.work_id))
        .leftJoin(workCreator, eq(work.id, workCreator.work_id))
        .leftJoin(creator, eq(workCreator.creator_id, creator.id))
        .where(eq(work.uuid, uuid));

    return transformWorkData(result);
}
```

## UUID 生成

使用 `uuid` 库生成 v4 UUID：

```typescript
import { v4 as uuidv4 } from 'uuid';

// 创建新作品
export async function createWork(db: DrizzleDB, data: CreateWorkInput) {
    const workUuid = uuidv4();

    const result = await db.insert(work).values({
        uuid: workUuid,
        copyright_basis: data.copyright_basis,
    }).returning();

    return result[0];
}
```

**生成时机**：
- 应用层生成（不依赖数据库触发器）
- 在插入记录前生成
- 确保在事务内生成并使用

## 性能考量

### 索引策略

```sql
-- id 作为主键，自动建立索引
CREATE TABLE work (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NOT NULL UNIQUE
);

-- uuid 的 UNIQUE 约束会自动创建索引
-- 因此 UUID 查询性能也不差
```

### 查询性能对比

**按 ID 查询**（主键索引）：
```sql
SELECT * FROM work WHERE id = 1;
-- ~ O(log n) 或 O(1)
```

**按 UUID 查询**（唯一索引）：
```sql
SELECT * FROM work WHERE uuid = '550e8400-...';
-- ~ O(log n)
```

**关联查询**（ID vs UUID）：

```sql
-- 使用 ID（整数比较，更快）
SELECT * FROM work_creator
JOIN creator ON work_creator.creator_id = creator.id
WHERE work_creator.work_id = 1;

-- 使用 UUID（文本比较，较慢）
SELECT * FROM work_creator
JOIN creator ON work_creator.creator_uuid = creator.uuid
WHERE work_creator.work_uuid = '550e8400-...';
```

**结论**：ID 关联查询比 UUID 快约 10-30%（取决于数据量）。

### 存储空间

| 类型 | 存储大小 |
|------|---------|
| INTEGER (id) | 4-8 字节 |
| TEXT (uuid) | 36 字节（不压缩） |
| UUID 二进制格式 | 16 字节 |

SQLite 的 TEXT 类型存储 UUID 占用 36 字节，远大于整数 ID。在有大量关联记录的表中，使用 ID 可显著减少存储空间。

## 迁移注意事项

VOCArchive 早期版本仅使用 UUID，后来引入 ID。迁移脚本示例：

```typescript
// src/migrations/001_uuid_to_id_migration.ts

export const up = async (db: DrizzleDB) => {
    // 1. 添加 id 列（自增）
    await db.run(`ALTER TABLE work ADD COLUMN id INTEGER`);

    // 2. 填充 id 值
    await db.run(`UPDATE work SET id = rowid`);

    // 3. 更新外键引用（从 uuid 改为 id）
    // 这需要重建关联表...
};
```

实际迁移非常复杂，详见 `src/migrations/001_uuid_to_id_migration.ts`。

## 最佳实践

1. **API 接口**：始终使用 UUID
2. **数据库查询**：优先使用 ID
3. **创建记录**：同时生成 UUID 和 ID（ID 自动生成）
4. **外键关联**：使用 ID
5. **前端展示**：使用 UUID（URL、链接）

## 其他实体

### 特例：site_config 和 wiki_platform

这两个表不使用 UUID，因为它们有自然主键：

```typescript
// 使用 key 作为主键
export const siteConfig = sqliteTable('site_config', {
    key: text('key').primaryKey(),
    value: text('value').notNull(),
    description: text('description'),
});

// 使用 platform_key 作为主键
export const wikiPlatform = sqliteTable('wiki_platform', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    platform_key: text('platform_key').notNull().unique(),
    platform_name: text('platform_name').notNull(),
    url_template: text('url_template').notNull(),
});
```

### 关联表

关联表（junction tables）通常不需要 UUID，使用复合主键：

```typescript
export const workTag = sqliteTable('work_tag', {
    work_id: integer('work_id').notNull().references(() => work.id, {
        onDelete: 'cascade'
    }),
    tag_id: integer('tag_id').notNull().references(() => tag.id, {
        onDelete: 'cascade'
    }),
}, (table) => ({
    pk: primaryKey({ columns: [table.work_id, table.tag_id] })
}));
```
