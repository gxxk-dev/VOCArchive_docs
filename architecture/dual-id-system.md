# 双 ID 系统

VOCArchive 的所有主要实体同时拥有两种标识符：自增整数 ID 和 Index。

## 设计动机

### 单一 ID 的问题

**仅使用自增 ID**：
- ❌ 分布式环境下容易冲突
- ❌ 对外暴露序列信息（可猜测总数）
- ❌ 难以在多个数据库实例间同步

**仅使用 Index**：
- ❌ 查询性能低于整数索引
- ❌ 存储空间更大（8+ 字符 vs 4-8 字节）
- ❌ 关联查询性能较差

### 双 ID 的优势

- ✅ **Index 对外**：稳定、分布式友好、不暴露内部信息、简短易读
- ✅ **ID 对内**：高效索引、快速关联查询
- ✅ **兼顾性能与灵活性**

## Schema 设计

所有主要实体表都包含 `id` 和 `index` 字段：

```typescript
// src/app/db/schema.ts

export const work = sqliteTable('work', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    index: text('index').notNull().unique(),
    copyright_basis: text('copyright_basis', {
        enum: ['none', 'accept', 'license', 'onlymetadata', 'arr']
    }).notNull(),
});

export const creator = sqliteTable('creator', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    index: text('index').notNull().unique(),
    name: text('name').notNull(),
    type: text('type', { enum: ['human', 'virtual'] }).notNull(),
});

export const tag = sqliteTable('tag', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    index: text('index').notNull().unique(),
    name: text('name').notNull().unique(),
});
```

**关键点**：
- `id` 是主键（自增整数）
- `index` 有唯一约束
- 外键引用使用 `id`，不是 `index`

## 使用场景

### Index 使用场景

**1. 外部 API**

所有公开 API 端点使用 Index：

```http
GET /api/get/work/{index}
GET /api/get/creator/{index}
POST /api/delete/work
{
  "work_index": "a1b2c3d4"
}
```

**2. 前端 URL**

页面路由使用 Index（同时保留 uuid 参数向后兼容）：

```
/player?index=a1b2c3d4
/player?uuid=a1b2c3d4  # 向后兼容旧链接
```

**3. 跨系统集成**

与外部系统交互时，Index 作为唯一标识符。

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

## Index-ID 转换

转换器位于 `src/app/db/utils/index-id-converter.ts`：

### Index → ID

```typescript
export async function getWorkIdByIndex(db: DrizzleDB, index: string): Promise<number | null> {
    const result = await db.select({ id: work.id })
        .from(work)
        .where(eq(work.index, index))
        .limit(1);

    return result[0]?.id || null;
}
```

### ID → Index

```typescript
export async function getWorkIndexById(db: DrizzleDB, id: number): Promise<string | null> {
    const result = await db.select({ index: work.index })
        .from(work)
        .where(eq(work.id, id))
        .limit(1);

    return result[0]?.index || null;
}
```

### 典型使用模式

**API 端点**（Index 转 ID）：

```typescript
app.get('/api/get/work/:index', async (c) => {
    const index = c.req.param('index');
    const db = c.get('db');

    // 1. Index → ID
    const workId = await getWorkIdByIndex(db, index);
    if (!workId) {
        return c.notFound();
    }

    // 2. 使用 ID 查询
    const workData = await db.select()
        .from(work)
        .where(eq(work.id, workId))
        .limit(1);

    // 3. 返回包含 Index 的数据
    return c.json(workData[0]);
});
```

**数据库操作函数**：

```typescript
// src/app/db/operations/work.ts

export async function getWorkByIndex(db: DrizzleDB, index: string) {
    // 直接使用 Index 查询（已有索引）
    const result = await db.select()
        .from(work)
        .leftJoin(workTitle, eq(work.id, workTitle.work_id))
        .leftJoin(workCreator, eq(work.id, workCreator.work_id))
        .leftJoin(creator, eq(workCreator.creator_id, creator.id))
        .where(eq(work.index, index));

    return transformWorkData(result);
}
```

## Index 生成

使用 `nanoid` 库生成 8 字符的 Index：

```typescript
import { nanoid } from 'nanoid';

// 创建新作品
export async function createWork(db: DrizzleDB, data: CreateWorkInput) {
    const workIndex = nanoid(8);

    const result = await db.insert(work).values({
        index: workIndex,
        copyright_basis: data.copyright_basis,
    }).returning();

    return result[0];
}
```

**生成方式变更**：
- **旧方案**（v1.x）：使用 UUID v4，36 字符（如 `550e8400-e29b-41d4-a716-446655440000`）
- **新方案**（v2.x+）：使用 Nano ID，8 字符（如 `a1b2c3d4`，URL 安全字符集）

**生成时机**：
- 应用层生成（不依赖数据库触发器）
- 在插入记录前生成
- 确保在事务内生成并使用

**Nano ID 优势**：
- 更短小（8 字符 vs 36 字符）
- URL 安全（无需编码）
- 性能更好
- 碰撞概率极低（8 字符约需 9 年才有 1% 碰撞概率，假设每秒生成 1000 个）

## 性能考量

### 索引策略

```sql
-- id 作为主键，自动建立索引
CREATE TABLE work (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    index TEXT NOT NULL UNIQUE
);

-- index 的 UNIQUE 约束会自动创建索引
-- 因此 Index 查询性能也不差
```

### 查询性能对比

**按 ID 查询**（主键索引）：
```sql
SELECT * FROM work WHERE id = 1;
-- ~ O(log n) 或 O(1)
```

**按 Index 查询**（唯一索引）：
```sql
SELECT * FROM work WHERE index = 'a1b2c3d4';
-- ~ O(log n)
```

**关联查询**（ID vs Index）：

```sql
-- 使用 ID（整数比较，更快）
SELECT * FROM work_creator
JOIN creator ON work_creator.creator_id = creator.id
WHERE work_creator.work_id = 1;

-- 使用 Index（文本比较，较慢）
SELECT * FROM work_creator
JOIN creator ON work_creator.creator_index = creator.index
WHERE work_creator.work_index = 'a1b2c3d4';
```

**结论**：ID 关联查询比 Index 快约 10-30%（取决于数据量）。

### 存储空间

| 类型 | 存储大小 |
|------|---------|
| INTEGER (id) | 4-8 字节 |
| TEXT (index, 8字符) | 8 字节 |
| TEXT (UUID, 36字符) | 36 字节 |

SQLite 的 TEXT 类型存储 8 字符 Index 占用约 8 字节，相比旧的 36 字符 UUID 节省了约 78% 的空间。在有大量关联记录的表中，使用 ID 仍然是最优选择。

## 迁移注意事项

VOCArchive 在 v2.0 版本将 UUID 系统重命名为 Index 系统（破坏性变更）：

```typescript
// src/migrations/004_rename_uuid_to_index.ts

export const up = async (db: DrizzleDB) => {
    // 1. 重命名所有表的 uuid 列为 index
    await db.run(`ALTER TABLE work RENAME COLUMN uuid TO index`);
    await db.run(`ALTER TABLE creator RENAME COLUMN uuid TO index`);
    // ... 其他表

    // 2. 更新所有引用 UUID 的代码
    // 这是一个全局性的重命名操作
};
```

**向后兼容性**：
- 播放器页面 (`/player`) 和编辑器页面 (`/admin/editor`) 仍然支持 `uuid` URL 参数
- 内部会自动将 `uuid` 参数映射到 `index` 参数
- 这确保了旧链接仍然可以正常工作

## 最佳实践

1. **API 接口**：始终使用 Index
2. **数据库查询**：优先使用 ID
3. **创建记录**：使用 `nanoid(8)` 生成 Index，ID 自动生成
4. **外键关联**：使用 ID
5. **前端展示**：使用 Index（URL、链接）
6. **向后兼容**：关键页面保留 `uuid` 参数支持

## 其他实体

### 特例：site_config 和 wiki_platform

这两个表不使用 Index，因为它们有自然主键：

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

关联表（junction tables）通常不需要 Index，使用复合主键：

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
