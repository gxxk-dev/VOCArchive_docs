# 数据模型概览

## 核心实体（无外键依赖）

- `work` - 作品
- `creator` - 创作者（人类/虚拟）
- `tag` - 标签
- `category` - 分类（支持父分类）
- `external_source` - 外部存储源
- `site_config` - 站点配置
- `wiki_platform` - Wiki 平台配置
- `footer_settings` - 页脚设置

## 关联表

- `work_title` - 作品标题（多语言）
- `work_creator` - 作品-创作者关联
- `work_tag` / `work_category` - 标签/分类关联
- `work_relation` - 作品关系（remix、cover 等）
- `work_wiki` / `creator_wiki` - Wiki 链接

## 媒体和资源

- `media_source` - 媒体源（音频/视频）
- `asset` - 资产（歌词/图片）
- `external_object` - 外部对象（实际文件）
- `asset_external_object` - 资产-外部对象关联
- `media_source_external_object` - 媒体源-外部对象关联
