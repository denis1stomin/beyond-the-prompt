import { defineConfig, type HeadConfig } from 'vitepress'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const site = 'https://denis1stomin.github.io/beyond-the-prompt/'
const docs = fileURLToPath(new URL('../', import.meta.url))
const route = (path: string) => path.replace(/index\.md$/, '').replace(/\.md$/, '')

export default defineConfig({
  title: 'Beyond the Prompt',
  base: '/beyond-the-prompt/', // Adjust for custom domain or repo rename
  cleanUrls: true,
  lastUpdated: true,
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/beyond-the-prompt/favicon.svg' }]],
  sitemap: { hostname: site },
  transformHead({ pageData }) {
    if (pageData.relativePath === '404.md') return [['meta', { name: 'robots', content: 'noindex' }]]
    const path = pageData.relativePath
    const en = path.startsWith('en/')
    const ruPath = en ? path.slice(3) : path
    const pair = en ? ruPath : `en/${path}`
    const title = `${pageData.title} | Beyond the Prompt`
    const description = pageData.description
    const url = new URL(route(path), site).href
    const image = new URL('og.png', site).href
    const head: HeadConfig[] = [
      ['link', { rel: 'canonical', href: url }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { property: 'og:type', content: path.includes('guides/') && !path.endsWith('index.md') || path.includes('architecture/') ? 'article' : 'website' }],
      ['meta', { property: 'og:site_name', content: 'Beyond the Prompt' }],
      ['meta', { property: 'og:locale', content: en ? 'en_US' : 'ru_RU' }],
      ['meta', { property: 'og:image', content: image }],
      ['meta', { property: 'og:image:width', content: '1200' }],
      ['meta', { property: 'og:image:height', content: '630' }],
      ['meta', { property: 'og:image:alt', content: 'Beyond the Prompt — Architectural thinking in the age of AI' }],
      ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
      ['meta', { name: 'twitter:title', content: title }],
      ['meta', { name: 'twitter:description', content: description }],
      ['meta', { name: 'twitter:image', content: image }],
      ['meta', { name: 'twitter:image:alt', content: 'Beyond the Prompt — Architectural thinking in the age of AI' }]
    ]
    if (existsSync(`${docs}${pair}`)) {
      head.push(
        ['link', { rel: 'alternate', hreflang: 'ru', href: new URL(route(ruPath), site).href }],
        ['link', { rel: 'alternate', hreflang: 'en', href: new URL(route(`en/${ruPath}`), site).href }],
        ['link', { rel: 'alternate', hreflang: 'x-default', href: new URL(route(ruPath), site).href }],
        ['meta', { property: 'og:locale:alternate', content: en ? 'ru_RU' : 'en_US' }]
      )
    }
    return head
  },
  locales: {
    root: {
      label: 'Русский',
      lang: 'ru-RU',
      description: 'Архитектурное мышление в эпоху AI',
      themeConfig: {
        nav: [
          { text: 'Главная', link: '/' },
          { text: 'Гайды', link: '/guides/' },
          { text: 'Архитектура', link: '/architecture/vendor-lock-in' },
          { text: 'Об авторе', link: '/about' }
        ],
        sidebar: {
          '/guides/': [
            { text: 'Все гайды', link: '/guides/' },
            { text: 'OpenCode', link: '/guides/opencode-setup' },
            { text: 'Claude Code CLI', link: '/guides/claude-code-cli' }
          ],
          '/architecture/': [
            { text: 'Зависимость от AI-провайдера', link: '/architecture/vendor-lock-in' }
          ]
        },
        outline: { label: 'На этой странице' },
        lastUpdated: { text: 'Обновлено' }
      }
    },
    en: {
      label: 'English',
      lang: 'en-US',
      description: 'Architectural thinking in the age of AI',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/en/' },
          { text: 'Guides', link: '/en/guides/' },
          { text: 'Architecture', link: '/en/architecture/vendor-lock-in' },
          { text: 'About', link: '/en/about' }
        ],
        sidebar: {
          '/en/guides/': [
            { text: 'All guides', link: '/en/guides/' },
            { text: 'OpenCode', link: '/en/guides/opencode-setup' },
            { text: 'Claude Code CLI', link: '/en/guides/claude-code-cli' }
          ],
          '/en/architecture/': [
            { text: 'AI vendor lock-in', link: '/en/architecture/vendor-lock-in' }
          ]
        },
        outline: { label: 'On this page' },
        lastUpdated: { text: 'Last updated' }
      }
    }
  },
  themeConfig: {
    logo: { src: '/logo.svg', alt: 'Beyond the Prompt' },
    socialLinks: [{ icon: 'github', link: 'https://github.com/denis1stomin' }],
    search: { provider: 'local' },
    footer: { message: 'Beyond the Prompt · Test first. Explain second.' }
  }
})
