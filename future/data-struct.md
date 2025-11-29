# VOCArchive(IPFS ver.) 数据结构

**此处展示的 JSON 示例数据仅作参考，实际数据结构将采用DAG-CBOR编码格式。**

---

## Object - 对象

此为下文所介绍的所有数据结构的基类，所有数据结构将嵌套于 data 字段中。

```typescript
{
  vaid: string       // 外部唯一标识符（VOCArchive Object ID）
  type: enum         // 类型: work | creator | asset | media_source | external_object | tag | category
  data: object       // 数据
  schema: string?    // 数据结构规定源(IPFS CID)
}
```

---

## Work - 作品

```typescript
{
  copyright_status: enum   // 版权基础: none | accept | license | onlymetadata | arr
  license: string          // 版权许可证(copyright_status为license时生效)
  titles: [workTitle]          // 标题
}
```

**copyright_status 枚举值**:
- `none`: 无版权声明
- `accept`: 接受使用
- `license`: 许可证授权
- `onlymetadata`: 仅元数据
- `arr`: 保留所有权利（All Rights Reserved）


**关联对象**:
- workTitle (标题，多语言)
  - 每个作品必须至少有一个官方标题（workTitle 中 `is_official=1`）
- workLicense (许可证)
- workCreator (创作者，多角色)
- mediaSource (媒体源)
- asset (资产)
- workTag (标签)
- workCategory (分类)
- workRelation (作品关系)
- workWiki (Wiki 链接)

---

## Creator - 创作者

```typescript
{
  id: number       // 内部主键
  uuid: string     // 外部唯一标识符
  name: string     // 创作者名称
  type: enum       // 创作者类型: human | virtual
}
```

**type 枚举值**:
- `human`: 人类创作者
- `virtual`: 虚拟歌手（VOCALOID、UTAU、CeVIO 等）

**数据约束**:
- `type` 必须为上文提到的枚举值 

**关联对象**:
- workCreator (参与作品)
- assetCreator (创作资产)
- creatorWiki (Wiki 链接)

---

## Tag - 标签

```typescript
{
  id: number       // 内部主键
  uuid: string     // 外部唯一标识符
  name: string     // 标签名称（全局唯一）
}
```

扁平化标签系统，无层级关系。

---

## Category - 分类

```typescript
{
  id: number           // 内部主键
  uuid: string         // 外部唯一标识符
  name: string         // 分类名称（全局唯一）
  parent_id: number?   // 父分类ID（支持层级）
}
```

支持层级分类（父子关系）。

**层级示例**:
```
VOCALOID
├─ 初音未来
│  ├─ 原创曲
│  └─ 翻唱曲
├─ 洛天依
└─ KAITO
```

**数据约束**:
- `parent_id` 不能形成循环引用（防止无限递归）

**关联对象**:
- parent/children (父子分类)

---

## MediaSource - 媒体源

```typescript
{
  id: number           // 内部主键
  uuid: string         // 外部唯一标识符
  work_id: number      // 所属作品ID
  is_music: boolean    // 是否为音频（否则为视频）
  file_name: string    // 文件名
  mime_type: string    // MIME 类型
  info: string         // 附加信息（JSON）
}
```

**info 字段示例**:
```json
{
  "duration": 240,
  "bitrate": "320kbps",
  "sample_rate": "44100Hz",
  "format": "MP3",
  "quality": "high"
}
```

**MIME 类型**:
- 音频: `audio/mpeg`, `audio/flac`, `audio/ogg`
- 视频: `video/mp4`, `video/webm`

---

## Asset - 资产

```typescript
{
  id: number               // 内部主键
  uuid: string             // 外部唯一标识符
  work_id: number          // 所属作品ID
  asset_type: enum         // 资产类型: lyrics | picture
  file_name: string        // 文件名
  is_previewpic: boolean?  // 是否为预览图
  language: string?        // 语言代码（歌词专用，ISO 639-1）
}
```

**asset_type 枚举值**:
- `lyrics`: 歌词文件
- `picture`: 图片文件

**数据约束**:
- 每个作品最多有一个预览图（`is_previewpic=1`）
- `language` 语言代码必须遵循 ISO 639-1 标准（如 `ja`, `en`, `zh`）

---

## ExternalSource - 外部存储源

```typescript
{
  uuid: string      // 外部唯一标识符
  type: enum        // 存储源类型: raw_url | ipfs
  name: string      // 存储源名称
  endpoint: string  // 访问端点 URL 模板
  isIPFS: boolean   // 是否为 IPFS 存储
}
```

**type 枚举值**:
- `raw_url`: 直接 URL 访问
- `ipfs`: IPFS 分布式存储

**关联对象**:
- externalObject (外部对象)

---

## ExternalObject - 外部对象

```typescript
{
  id: number                 // 内部主键
  uuid: string               // 外部唯一标识符
  external_source_id: number // 存储源ID
  mime_type: string          // MIME 类型
  file_id: string            // 文件标识符（路径/CID/对象键）
}
```

**文件访问流程**:
```
mediaSource/asset
  → mediaSourceExternalObject/assetExternalObject
  → externalObject (获取 file_id 和 external_source_id)
  → externalSource (获取 endpoint)
  → 拼接生成最终 URL
```

**示例**:
```
externalSource.endpoint: "https://cdn.vocarchive.com/media/"
externalObject.file_id: "12345/song.mp3"
最终URL: https://cdn.vocarchive.com/media/12345/song.mp3
```

---

<!--
## WorkTitle - 作品标题

```typescript
{
  id: number             // 内部主键
  uuid: string           // 外部唯一标识符
  work_id: number        // 作品ID
  is_official: boolean   // 是否官方标题
  is_for_search: boolean // 是否用于搜索
  language: string       // 语言代码（ISO 639-1）
  title: string          // 标题内容
}
```

支持多语言、多别名。

**使用场景**:
```
作品: 千本桜
  - "千本桜" (ja, official, for_search)
  - "Senbonzakura" (romaji, for_search)
  - "Thousand Cherry Blossoms" (en, for_search)
  - "千本樱" (zh, unofficial, for_search)
```

**数据约束**:
- `language` 语言代码必须遵循 ISO 639-1 标准（如 `ja`, `en`, `zh`）

---

## WorkRelation - 作品关系

```typescript
{
  id: number            // 内部主键
  uuid: string          // 外部唯一标识符
  from_work_id: number  // 源作品ID
  to_work_id: number    // 目标作品ID
  relation_type: enum   // 关系类型
}
```

**relation_type 枚举值**:
- `original`: 原创
- `remix`: 混音/重编
- `cover`: 翻唱
- `remake`: 重制
- `picture`: 关联图像作品（如PV使用的插画）
- `lyrics`: 关联歌词作品（如不同语言版本）

---

## WorkCreator - 作品创作者关联

```typescript
{
  work_id: number      // 作品ID
  creator_id: number   // 创作者ID
  role: string         // 创作角色
}
```

**复合主键**: `(work_id, creator_id, role)`

支持一个作品有多个创作者，一个创作者在同一作品中扮演多个角色。

**典型角色**:
- 音乐类: `作曲`, `作词`, `编曲`, `调校`, `混音`, `母带处理`
- 演唱类: `演唱`, `合声`, `和音`
- 视觉类: `绘图`, `视频`, `PV制作`, `动画`
- 技术类: `调教`, `调音`, `后期`

---

## WorkLicense - 作品许可证

```typescript
{
  work_id: number        // 作品ID（主键）
  license_type: string   // 许可证类型
}
```

一对一关系（一个作品最多一个许可证）。

**常用许可证类型**:
- Creative Commons: `CC-BY`, `CC-BY-SA`, `CC-BY-NC`, `CC-BY-NC-SA`
- 自定义: `piapro`, `nicovideo_commons`

---

## WorkTag - 作品标签关联

```typescript
{
  work_id: number   // 作品ID
  tag_id: number    // 标签ID
}
```

**复合主键**: `(work_id, tag_id)`

---

## WorkCategory - 作品分类关联

```typescript
{
  work_id: number      // 作品ID
  category_id: number  // 分类ID
}
```

**复合主键**: `(work_id, category_id)`

---

## WorkWiki - 作品 Wiki 链接

```typescript
{
  work_id: number      // 作品ID
  platform: string     // 平台标识符
  identifier: string   // Wiki页面标识符
}
```

**复合主键**: `(work_id, platform)`

---

## CreatorWiki - 创作者 Wiki 链接

```typescript
{
  creator_id: number   // 创作者ID
  platform: string     // 平台标识符
  identifier: string   // Wiki页面标识符
}
```

**复合主键**: `(creator_id, platform)`

---

## AssetCreator - 资产创作者关联

```typescript
{
  asset_id: number     // 资产ID
  creator_id: number   // 创作者ID
  role: string         // 创作角色
}
```

**复合主键**: `(asset_id, creator_id)`

---

## AssetExternalObject - 资产外部对象关联

```typescript
{
  asset_id: number           // 资产ID
  external_object_id: number // 外部对象ID
}
```

**复合主键**: `(asset_id, external_object_id)`

---

## MediaSourceExternalObject - 媒体源外部对象关联

```typescript
{
  media_source_id: number    // 媒体源ID
  external_object_id: number // 外部对象ID
}
```

**复合主键**: `(media_source_id, external_object_id)`

---

## SiteConfig - 站点配置

```typescript
{
  key: string          // 配置键（主键）
  value: string        // 配置值
  description: string? // 配置说明
}
```

键值对存储。

**常用配置键**:
- `db_version`: 数据库版本号
- `jwt_secret`: JWT 签名密钥
- `totp_secret`: TOTP 验证密钥
- `site_name`: 站点名称
- `site_description`: 站点描述

---

### WikiPlatform - Wiki 平台配置

```typescript
{
  id: number              // 内部主键
  platform_key: string    // 平台标识符（唯一）
  platform_name: string   // 平台显示名称
  url_template: string    // URL 模板
  icon_class: string?     // 图标 CSS 类
}
```

---

### FooterSettings - 页脚设置

```typescript
{
  id: number          // 内部主键
  uuid: string        // 外部唯一标识符
  item_type: enum     // 项目类型: link | social | copyright
  text: string        // 显示文本
  url: string?        // 链接地址
  icon_class: string? // 图标 CSS 类
}
```

-->