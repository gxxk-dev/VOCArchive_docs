import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "VOCArchive Docs",
  description: "一个基于 Cloudflare Workers 和 D1 数据库的 泛VOCALOID 歌曲存档项目。",
  markdown: {
    config: (md) => {
      const fence = md.renderer.rules.fence!
      md.renderer.rules.fence = (...args) => {
        const [tokens, idx] = args
        const token = tokens[idx]
        const rawCode = fence(...args)

        if (token.info === 'mermaid') {
          const code = token.content.trim()
          return `<Mermaid code="${encodeURIComponent(code)}" />`
        }
        return rawCode
      }
    }
  },
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: 'GitHub', link: 'https://github.com/gxxk-dev/VOCArchive' },
      { text: 'Demo(VAZone)', link: 'https://zone.vocarchive.com' }
    ],

    sidebar: [
      {
        text: '开发者指南',
        collapsed: false,
        items: [
          { text: '项目概览', link: '/guide/overview' },
          { text: '快速开始', link: '/guide/quick-start' },
          { text: '项目结构', link: '/guide/project-structure' },
          { text: '常用命令', link: '/guide/commands' },
          { text: '数据模型', link: '/guide/data-model' },
          { text: 'API 概览', link: '/guide/api' },
          { text: '开发注意事项', link: '/guide/dev-notes' }
        ]
      },
      {
        text: '架构设计',
        collapsed: false,
        items: [
          { text: '迁移系统', link: '/architecture/migration-system' },
          { text: 'Admin 多 iframe 架构', link: '/architecture/admin-iframe' },
          { text: '双 ID 系统', link: '/architecture/dual-id-system' },
          { text: '外部存储抽象', link: '/architecture/external-storage' },
          { text: 'SSR 与 Service Worker', link: '/architecture/ssr-and-sw' },
          { text: '版本号机制', link: '/architecture/versioning' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/gxxk-dev/VOCArchive' }
    ],

    search: {
      provider: 'local'
    },

    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium'
      }
    }
  }
})
