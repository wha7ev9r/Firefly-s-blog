# AGENTS.md

OpenCode 在 Firefly 仓库的工作指引。只保留容易误判或需要跨文件确认的事实。

## 项目与工具链

- 单包 Astro 7.0.7 静态博客主题，不是 monorepo；UI 主要是 `.astro` + Svelte 5，Tailwind CSS 4 通过 `@tailwindcss/vite` 接入。
- 必须用 pnpm：`packageManager` 固定 `pnpm@9.14.4`，`preinstall` 会通过 `only-allow pnpm` 拦截其他包管理器。
- Node 版本按仓库要求使用 `>=22`；CI 在 Node 22 和 23 上跑 check/build。
- `.npmrc` 使用 npmmirror/淘宝源和 sharp 等二进制镜像，除非明确要切源，不要删除这些配置。

## 常用命令

- `pnpm install`：安装依赖；CI 的 build/check 用 `pnpm install --frozen-lockfile`，deploy workflow 用 `--no-frozen-lockfile`。
- `pnpm dev` / `pnpm start`：启动 Astro dev，默认 `http://localhost:4321`。
- `pnpm build`：完整本地构建，顺序是 `node scripts/generate-icons.js` -> `astro build` -> `pagefind --site dist`。
- `pnpm check`：`astro check`；`pnpm type-check`：`tsc --noEmit`。
- `pnpm lint` 会执行 `biome check --write ./src` 并修改文件；只想模拟 CI 时用 `pnpm exec biome ci ./src --reporter=github`。
- `pnpm format` 只格式化 `./src`；`pnpm icons` 只重新生成图标数据；`pnpm new-post <filename>` 在 `src/content/posts/` 下生成 `.md`，已有文件会失败。
- `pnpm run audit`：安全漏洞扫描。`.npmrc` 用的是淘宝镜像（无 audit 端点），此脚本通过 `--registry` 指定 npm 官方源执行扫描；直接 `pnpm audit` 会报 `ERR_PNPM_AUDIT_ENDPOINT_NOT_EXISTS`。

## 构建与生成物

- `src/constants/icons.ts` 是生成文件且被 Biome 忽略，不要手动改；新增/删除 Svelte 中的 `icon="..."`、`getIconSvg(...)`、`hasIcon(...)` 后运行 `pnpm icons` 或 `pnpm build`。
- 图标预处理只扫描 `src/**/*.svelte`，支持的前缀由 `scripts/generate-icons.js` 的 `ICON_SETS` 决定；`astro.config.mjs` 的 `astro-icon` include 列表不完全等同于预处理列表。
- `pnpm build` 之后才会生成 Pagefind 搜索索引；修改 `src/content/posts/` 后仅跑 `astro build` 不会更新搜索索引。
- `siteConfig.generateOgImages` 默认关闭；开启后 `src/pages/og/[...slug].png.ts` 会为非草稿文章生成 OG 图，并可能联网下载 Google Fonts。
- Bangumi 页面在 dev 只取一页数据，生产构建会分页请求 Bangumi API；相关开关和 `userId` 在 `src/config/siteConfig.ts`。

## 配置与路由

- 配置集中在 `src/config/`，统一出口是 `src/config/index.ts`；新增配置要同时考虑 `src/types/config.ts` 和统一导出。
- `siteConfig.pages` 不只是导航开关：页面自身会 redirect/404，`astro.config.mjs` 的 sitemap filter 也会按它过滤。
- 修改 `siteConfig.rehypeCallouts.theme`、语言、页面开关等会影响 Astro/Vite 配置或构建期代码，开发服务器通常需要重启。
- 常用别名来自 `tsconfig.json`：`@/*`、`@components/*`、`@layouts/*`、`@utils/*`、`@i18n/*`、`@constants/*`、`@assets/*`。

## 内容与 i18n

- 文章集合只加载 `src/content/posts/**/*.{md,mdx}`；schema 在 `src/content.config.ts`，草稿在生产通过 `getSortedPosts*` 过滤，dev 会显示。
- Frontmatter 支持的非显眼字段包括 `updated`、`author`、`sourceLink`、`licenseName`、`licenseUrl`、`password`、`passwordHint`；Front Matter CMS 配置在 `frontmatter.json`。
- 文章 `image: "api"` 会走随机封面配置 `src/config/coverImageConfig.ts`；本地文章图片路径在文章页会按文章文件目录解析。
- 新增 UI 文案要同步 `src/i18n/i18nKey.ts` 和 `src/i18n/languages/{zh_CN,zh_TW,en,ja,ru}.ts`；缺失翻译会先回退中文，再回退英文。

## 代码风格与检查

- Biome 2.4.8 替代 ESLint/Prettier；格式化使用 Tab 和双引号，但仓库里部分脚本/配置未必已格式化，不要顺手重排无关文件。
- Biome 范围排除了 `src/**/*.css`、`src/public/**`、`dist/**`、`node_modules/**`、`src/constants/icons.ts`。
- `.astro`、`.svelte`、`.vue` 的未使用变量/导入检查被关闭，不能只靠 Biome 发现这类问题。
- Vite 生产构建会 drop `console` 和 `debugger`，调试输出不要作为生产行为依赖。
- 仓库 `.gitattributes` 为 `* text=auto`；保持 LF，避免大范围换行归一化混入功能改动。

## CI 与部署

- PR/push 到 `master` 会跑 `.github/workflows/build.yml` 的 `pnpm astro check` 和 `pnpm astro build`，矩阵 Node 22/23；这里的 build 不包含图标生成和 Pagefind。
- `.github/workflows/biome.yml` 用 `biome ci ./src --reporter=github`，不是 `pnpm lint`，不会自动写回。
- `.github/workflows/deploy.yml` 只在 `master` push 或手动触发，使用 Node 22、pnpm 9.14.4、`pnpm run build`，再把 `dist` 推到 `pages` 分支并创建 `dist/.nojekyll`。
- `vercel.json` 已固定 Vercel 构建命令 `pnpm build`、输出目录 `dist`、安装命令 `pnpm install`，并配置了全站安全响应头与 `/_astro/*` 长缓存。
