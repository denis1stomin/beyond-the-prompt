# Beyond the Prompt

[![Deploy](https://github.com/denis1stomin/beyond-the-prompt/actions/workflows/deploy.yml/badge.svg)](https://github.com/denis1stomin/beyond-the-prompt/actions/workflows/deploy.yml)
![Node 20+](https://img.shields.io/badge/node-20%2B-blue.svg)
![VitePress 1.6](https://img.shields.io/badge/VitePress-1.6-646cff.svg)

**Архитектурное мышление в эпоху AI / Architectural thinking in the age of AI**

An independent bilingual AI Engineering publication by a professional software architect: practical guides, architectural trade-offs, reproducible experiments, and workflows.

[Website](https://denis1stomin.github.io/beyond-the-prompt/) · [Author on GitHub](https://github.com/denis1stomin)

The RU and EN guides cover the same setup and safety constraints. The author tested the setup approach with OpenCode v2.3.0 on macOS on November 18, 2026; Windows, Linux and Claude Code remain untested by the author. Documentation review and stub checks do not establish live API compatibility.

## Run locally

Node.js 20+ and npm:

```bash
npm ci
npm run docs:dev
```

Build and preview:

```bash
npm run docs:build
npm run docs:preview
```

## Deploy to GitHub Pages

1. Push `main` to the repository `denis1stomin/beyond-the-prompt`.
2. Set **Settings → Pages → Build and deployment → GitHub Actions**.
3. The included `.github/workflows/deploy.yml` builds and publishes the VitePress site.
4. Live address: `https://denis1stomin.github.io/beyond-the-prompt/`.
5. `base` in `docs/.vitepress/config.mts` is set to `/beyond-the-prompt/`; change it if the repo is renamed or a custom domain is used.

The workflow uses `npm ci` with the committed `package-lock.json` for reproducible installs.

## Site structure

- `docs/index.md` / `docs/en/index.md` — bilingual landing pages.
- `docs/about.md` / `docs/en/about.md` — project and author pages.
- `docs/guides/` / `docs/en/guides/` — OpenCode and Claude Code CLI.
- `docs/architecture/` / `docs/en/architecture/` — vendor lock-in article.

## License

No license is granted; do not assume reuse rights.
