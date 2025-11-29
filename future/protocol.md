# VOCArchive Protocol

## 1. 架构概览 (Architecture Overview)

VOCArchive 是一个基于 IPFS 网络构建的模块化、去中心化泛VOCALOID归档生态系统。
该架构分离了数据所有权（发布者）、数据索引（节点运营者）和数据展示（用户端）。

生态系统由四个核心组件构成：
1.  **VOCArchive-Protocol**: IPFS层面规范，定义数据结构、互操作规则及验证逻辑。
2.  **VOCArchive-4Pub**: 内容发布客户端，负责密钥管理与数据上链。
3.  **VOCArchive-EdgeChain**: 边缘索引层，负责验证 IPFS 数据并投射至关系型数据库。
4.  **VOCArchive-Entry**: 用户交互层，负责聚合展示。

---

## 2. 核心规范与寻址 (Core Specifications & Addressing)

### 2.1 身份与加密
*   **全局唯一标识 (UUID)**: 系统内所有实体（Work, Creator, Tag, Category）均使用 UUIDv4 或 UUIDv5 标识。
*   **签名机制**: 所有元数据变更必须经过 Ed25519 密钥对签名。

### 2.2 IPNS 寻址格式 (IPNS Addressing)
协议利用 IPNS (InterPlanetary Name System) 实现可变数据的固定寻址。每个发布者维护一个 IPNS Record，指向其最新的仓库根目录 CID。

**地址结构**:
```text
TODO
```

**目录树规范 (Repository Structure)**:
发布者的 IPNS 根目录应遵循以下结构：
```text
TODO
```

---

## 3. 协议层数据结构 (Protocol JSON Schema)

这是存储在 IPFS 上的原始数据格式（On-Chain Data）。发布者需将关系型数据打包为以下 JSON 格式上传。

### 3.1 Work Object (work.json)
```json
{
  "protocol_version": "4.0",
  "uuid": "String (UUID)",
  "copyright_basis": "none | accept | license | onlymetadata | arr",
  
  // 对应 WorkTitle 表
  "titles": [
    { "title": "String", "language": "ISO-639-1", "is_official": true, "is_for_search": true }
  ],
  
  // 对应 WorkCreator 表
  "creators": [
    { "creator_uuid": "UUID", "role": "String (composer, lyricist...)" }
  ],

  // 对应 WorkRelation (核心关联协议)
  "relations": [
    {
      "target_uuid": "UUID",
      "relation_type": "cover | remix | ...",
      "proof_of_asset": "CIDString" // 必须绑定媒体文件 CID 以通过反垃圾验证
    }
  ],

  // 对应 MediaSource 表
  "media_sources": [
    {
      "uuid": "UUID",
      "is_music": true,
      "file_name": "String",
      "mime_type": "audio/mpeg",
      "cid": "CIDString", // 原始 IPFS 地址
      "info": { "duration": 240, "bitrate": "320kbps" }
    }
  ],

  // 对应 Asset 表
  "assets": [
    {
      "uuid": "UUID",
      "asset_type": "lyrics | picture",
      "file_name": "String",
      "cid": "CIDString",
      "is_previewpic": boolean,
      "language": "ISO-639-1"
    }
  ],

  "tags": ["TagUUID_1", "TagUUID_2"],
  "category_uuid": "CategoryUUID",
  "license_type": "CC-BY-SA",
  "signature": "Ed25519_Signature_String"
}
```

### 3.2 Creator Object (creator.json)
```json
{
  "uuid": "UUID",
  "name": "String",
  "type": "human | virtual",
  "wiki_links": [
    { "platform": "moegirl", "identifier": "PageName" }
  ]
}
```

---

## 4. 关联协议与反垃圾机制 (Relation Protocol)

为解决去中心化环境下的权限管理与数据污染问题，协议执行以下逻辑：

1.  **单向声明 (Outbound Only)**: 发布者仅在自己的 JSON 中声明 `relations`，无需修改目标作品文件。
2.  **强资产绑定 (Proof of Asset)**: 
    *   在声明 `cover`, `remix` 等二创关系时，必须提供 `proof_of_asset` (CID)。
    *   索引器在入库前会校验该 CID 是否指向合法的音频/视频文件。
    *   **校验失败**（如空文件、文本文件）的关联将被视为无效数据丢弃。
3.  **自动反向索引**: 
    *   通过验证的关联会被写入数据库。
    *   在展示原作页面时，系统自动查询所有指向该原作的有效关联。

---

## 5. 索引数据库图谱 (Indexer Database Schema)

EdgeChain 节点解析上述 JSON 后，将其投射（Projection）到 D1 关系型数据库中，以支持高性能查询。

---

## 6. 展示与信誉逻辑 (Presentation Logic)

### 6.1 信誉排序算法 (Trust Graph Sorting)
为应对无许可环境下的数据展示，Entry 端查询 `WorkRelation` 时应用以下权重算法：

$$W = \text{VerifiedBacklink} + \text{GraphDepth}$$

*   **VerifiedBacklink (双向互认)**: 若 A 指向 B，且 B 指向 A，显示权重设为最高（如官方认证的 Remix）。
*   **Standard (单向强资产)**: A 指向 B，且 A 包含合法的媒体资产证明，按发布时间正常排序。
*   **Isolated (孤岛节点)**: 虽有媒体资产，但 A 在整个图谱中与其他高信誉节点无任何路径连接，UI 将默认折叠此类关联。

### 6.2 资源加载回退
1.  **Level 1**: 尝试从 EdgeChain 维护的 `ExternalSource` (如 R2 缓存) 加载。
2.  **Level 2**: 尝试使用 `ExternalSource` 定义的公共 IPFS 网关加载原始 CID。
3.  **Level 3**: 提示用户使用本地 IPFS 节点加载。