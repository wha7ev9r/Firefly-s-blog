# AGENTS.md

OpenCode 在 Firefly 仓库的工作指引。本文件只记录容易踩坑或需要跨文件推断才能知道的细节。

## 项目基础

- 这是 **Astro 6 + Tailwind CSS 4 + Svelte 5** 的静态博客主题模板，单包（非 monorepo）。
- 强制使用 **pnpm ≥ 9**，`package.json` 有 `preinstall: npx only-allow pnpm`；`packageManager` 锁定为 `pnpm@9.14.4`。
- 运行环境要求：**Node.js ≥ 22**。

## 常用命令

| 命令                       | 说明                                                                           |
| -------------------------- | ------------------------------------------------------------------------------ |
| `pnpm install`             | 安装依赖（注意 `.npmrc` 使用淘宝镜像，开发机无外网时可能不需要改）             |
| `pnpm dev`                 | 开发服务器，默认 `http://localhost:4321`                                       |
| `pnpm build`               | 完整构建：`scripts/generate-icons.js` → `astro build` → `pagefind --site dist` |
| `pnpm preview`             | 预览 `./dist`                                                                  |
| `pnpm check`               | Astro 类型检查（`astro check`）                                                |
| `pnpm type-check`          | TypeScript 类型检查（`tsc --noEmit`）                                          |
| `pnpm lint`                | Biome 检查并自动修复（`biome check --write ./src`）                            |
| `pnpm format`              | Biome 格式化（`biome format --write ./src`）                                   |
| `pnpm new-post <filename>` | 在 `src/content/posts/` 创建带 frontmatter 的文章；无扩展名时自动加 `.md`      |
| `pnpm icons`               | 单独运行图标扫描生成脚本（`scripts/generate-icons.js`）                        |

## 代码风格与检查

- **Biome 2.4.8** 替代 ESLint/Prettier。
- 缩进使用 **Tab**（`biome.json` 配置）。
- 字符串格式化为 **双引号**。
- `.astro`、`.svelte`、`.vue` 文件中的未使用变量/导入**不报错**（Biome override 已关闭）。
- 生成文件 `src/constants/icons.ts` 被 Biome 忽略，不要手动编辑。

## 构建流程细节

1. `scripts/generate-icons.js` 扫描 `src/**/*.svelte` 中的 `icon="..."`、`getIconSvg(...)`、`hasIcon(...)` 等用法，从 `@iconify-json/*` 包生成 `src/constants/icons.ts`。**新增/删除图标后必须重新构建或运行 `pnpm icons`。**
2. `astro build` 输出到 `dist/`。
3. `pagefind --site dist` 生成搜索索引。**新增或修改 `src/content/posts/` 文章后必须重新构建才能更新搜索。**

## 配置系统

- 配置集中在 `src/config/`，统一从 `src/config/index.ts` 导出。
- 核心文件：`siteConfig.ts`（站点 URL、语言、页面开关）、`sidebarConfig.ts`（侧边栏布局）、`profileConfig.ts`（作者资料）、`commentConfig.ts`（评论系统）。
- 修改 `siteConfig.ts` 等配置后通常需要**重启 `pnpm dev`** 才能生效。
- 页面开关（`siteConfig.pages`）同时控制导航栏、路由、Sitemap 生成，禁用某页面时相关入口会自动隐藏。

## 路径别名（`tsconfig.json`）

- `@components/*` → `src/components/*`
- `@layouts/*` → `src/layouts/*`
- `@utils/*` → `src/utils/*`
- `@i18n/*` → `src/i18n/*`
- `@constants/*` → `src/constants/*`
- `@assets/*` → `src/assets/*`
- `@/*` → `src/*`

## 内容创作

- 文章放在 `src/content/posts/`，类型定义在 `src/content.config.ts`。
- Frontmatter 关键字段：`title`、`published`、`description`、`image`、`tags`、`category`、`draft`、`pinned`、`comment`、`lang`。
- `image` 可用本地图片路径，也可写 `"api"` 启用随机封面（列表在 `src/config/coverImageConfig.ts`）。
- 站点支持多语言 UI，但仅简体中文为人工翻译，其他为 AI 翻译；多语言文本在 `src/i18n/`。

## 部署

- `vercel.json` 已配置：构建命令 `pnpm build`、输出目录 `dist`、框架 `astro`。
- 其他平台（Netlify / Cloudflare Pages 等）按 Astro 默认静态站点部署即可。
- 构建产物在 `dist/`。

## 换行与编辑

- 仓库使用 `.gitattributes`（`* text=auto`）统一换行符为 LF。
- 若 Edit 工具报 "String to replace not found"，可能是 CRLF 导致，改用 Bash 工具（如 `sed`）处理，或运行 `git add --renormalize .` 后再编辑。

## 其他提示

- 图标使用 `astro-icon` 的 `Icon` 组件，预配置了 `material-symbols`、`fa7-*`、`simple-icons`、`mdi` 等图标集。如果新增图标后页面没有显示，先运行 `pnpm icons` 再重新构建。
- 搜索索引基于 Pagefind，`.katex`、`.katex-display`、`[data-pagefind-ignore]` 以及搜索面板本身会被排除（配置在 `pagefind.yml`）。
- 有 `frontmatter.json` 配置，给 Front Matter CMS 使用，通常不需要修改。
