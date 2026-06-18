# Bug 审查计划

基于对项目代码的全面审查，以下是发现的 bug 和潜在问题，按严重程度排序。

---

## 🔴 严重 Bug（影响功能正确性）

### 1. `sakura-manager.ts:61` — 樱花 Y 坐标更新逻辑错误
```ts
this.y = this.fn.y(this.x, this.y);  // 正确：fn.y 返回 (y + speed)
```
但 `update()` 方法第 61 行：
```ts
this.y = this.fn.y(this.y, this.y);  // BUG：传入 (this.y, this.y) 而非 (this.x, this.y)
```
`fny` 函数签名是 `(x: number, y: number) => y + speed`，虽然第二个参数 `_x` 未使用（实际只用到 `y`），但这里传了两个 `this.y`，导致第一个参数（被命名为 `_x`）也是 `this.y`。虽然因为 `_x` 被忽略而运行结果相同，但 `fn.x` 的调用 `this.fn.x(this.x, this.y)` 是正确的，`fn.y` 应该保持一致。**这不影响运行结果，但属于代码逻辑不一致，建议修正。**

### 2. `sakura-manager.ts:331` — `removeEventListener` 无法正确移除监听器
```ts
window.removeEventListener("resize", this.handleResize.bind(this));
```
`bind(this)` 每次调用都会创建一个**新的函数对象**，所以 `removeEventListener` 传入的是一个新的绑定函数，与 `addEventListener` 时绑定的函数**不是同一个引用**，导致 resize 监听器永远不会被移除。这是典型的内存泄漏 bug。

**修复方式**：在构造函数中保存绑定后的引用：
```ts
private boundHandleResize: () => void;
constructor(config: SakuraConfig) {
  this.config = config;
  this.boundHandleResize = this.handleResize.bind(this);
}
// addEventListener 使用 this.boundHandleResize
// removeEventListener 也使用 this.boundHandleResize
```

### 3. `content-utils.ts:28-35` — 直接修改 CollectionEntry 的 data 属性
```ts
sorted[i].data.nextSlug = sorted[i - 1].id;
sorted[i].data.nextTitle = sorted[i - 1].data.title;
```
在 Astro v5 的 Content Layer API 中，`CollectionEntry.data` 的 schema 使用了 `default()` 值（如 `prevSlug: z.string().default("")`），这些字段在内部是只读的。直接赋值修改它们可能在某些 Astro 版本中导致问题，或在未来版本中被禁止。虽然当前能运行，但这是**不安全的做法**。

**建议修复**：创建一个增强的 post 类型，将 prev/next 信息作为独立字段存储，而非修改原始 data。

### 4. `navigation-utils.ts:12-13` — `url` 参数名与导入的 `url` 函数冲突
```ts
import { url } from "@/utils/url-utils";
export function navigateToPage(
  url: string,  // ← 参数名 "url" 覆盖了导入的函数 "url"
  ...
)
```
参数名 `url` 与从 `url-utils` 导入的 `url` 函数同名，在函数体内 `url` 会指向参数而非导入的函数。虽然当前函数体并未使用导入的 `url` 函数，但如果将来需要使用就会出问题。且 `isHomePage()` 和 `isPostPage()` 内部使用了导入的 `url` 函数，说明它们依赖同一模块——命名冲突是隐患。

**修复方式**：将参数名改为 `targetUrl` 或 `pageUrl`。

---

## 🟠 中等 Bug（影响边界情况或健壮性）

### 5. `PostCard.astro:64` — 对每个 PostCard 都调用 `render(entry)`
```ts
const { remarkPluginFrontmatter } = await render(entry);
```
在首页文章列表中，每张 PostCard 都会对 entry 调用 `render()`，这会渲染整篇文章内容（包括 MDX），仅为了获取 `excerpt` 和阅读时间。对于 10+ 篇文章的列表页，这会**显著增加构建时间**。`remarkPluginFrontmatter` 的数据已经在 `getSortedPosts()` 中可通过其他方式获取。

**建议修复**：将 readingTime/excerpt 计算移到 `getSortedPosts()` 阶段，避免在列表页重复渲染每篇文章的完整内容。

### 6. `setting-utils.ts:66-68` — `getHue()` 使用 parseInt 但未指定基数
```ts
return stored ? Number.parseInt(stored, 10) : getDefaultHue();
```
虽然这里指定了基数 10（好的实践），但 `getDefaultHue()` 中：
```ts
return Number.parseInt(configCarrier?.dataset.hue || fallback, 10);
```
这里也是正确的。不过 `fallback` 是字符串 `"250"`，如果 `dataset.hue` 为空字符串，`parseInt("", 10)` 返回 `NaN`，不会被 `||` 捕获（因为 `""` 在 `||` 左侧已经被处理了）。这个其实没问题，因为 `dataset.hue || fallback` 已经处理了空值。

### 7. `date-utils.ts:4` — `formatDateToYYYYMMDD` 使用 UTC 时间
```ts
export function formatDateToYYYYMMDD(date: Date): string {
  return date.toISOString().substring(0, 10);
}
```
`toISOString()` 返回 UTC 时间，而非本地时间。如果站点配置了 `timezone: "Asia/Shanghai"`，一篇在北京时间 2026-01-01 00:30 发布的文章，UTC 时间是 2025-12-31 16:30，`toISOString()` 会返回 `"2025-12-31"`，导致日期显示比实际少一天。这在 RSS、OG 图片和文章列表中都有影响。

**修复方式**：使用带时区的格式化：
```ts
export function formatDateToYYYYMMDD(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric", month: "2-digit", day: "2-digit",
  };
  if (siteConfig.timezone) options.timeZone = siteConfig.timezone;
  const parts = new Intl.DateTimeFormat("en-CA", options).formatToParts(date);
  const get = (type) => parts.find(p => p.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}
```

### 8. `EncryptedPost.astro` — 加密文章的评论被完全隐藏
在 `[...slug].astro:545`：
```tsx
{entry.data.comment && !entry.data.password && <Comment post={entry} />}
```
加密文章永远不显示评论，即使用户输入密码解锁后也不显示。这可能不符合预期——用户解锁后应该能看到评论。

**建议修复**：加密文章也应该渲染评论组件，但初始隐藏，解锁后通过 `password:decrypted` 事件显示。

### 9. `rss.xml.ts:35-36` — RSS 中加密文章的链接使用了 `post.id`（含扩展名）
```ts
link: url(`/posts/${post.id}/`),
```
`post.id` 在 Astro v5 Content Layer API 中包含文件扩展名（如 `my-post.md`），但 URL slug 应该不含扩展名。对比 `[...slug].astro:38` 中使用了 `removeFileExtension(entry.id)`。RSS 中的链接会包含 `.md` 后缀，导致 404。

**修复方式**：
```ts
link: url(`/posts/${removeFileExtension(post.id)}/`),
```

### 10. `og/[...slug].png.ts:110-119` — OG 图片头像路径处理有问题
```ts
if (profileConfig.avatar?.startsWith("http")) {
  avatarBase64 = profileConfig.avatar;  // BUG：直接把 URL 当 base64 用
} else {
  const avatarPath = profileConfig.avatar?.startsWith("/")
    ? `./public${profileConfig.avatar}`
    : `./src/${profileConfig.avatar}`;
  const avatarBuffer = fs.readFileSync(avatarPath);
  avatarBase64 = `data:image/png;base64,${avatarBuffer.toString("base64")}`;
}
```
当头像为 HTTP URL 时，直接赋值给 `avatarBase64`，但在 satori 模板中 `<img src={avatarBase64}>` 需要的是 base64 data URL 或本地路径，不能直接用远程 URL。satori 不支持远程 URL 图片。需要先下载远程图片再转为 base64。

### 11. `url-utils.ts:62-64` — `url()` 函数的 `BASE_URL` 处理
```ts
export function url(path: string) {
  return joinUrl("", import.meta.env.BASE_URL, path);
}
```
`joinUrl` 会把空字符串、BASE_URL（默认"/"）和 path 拼接并用 `replace(/\/+/g, "/")` 去重。如果 `BASE_URL` 是 `/`，结果会是 `/posts/slug/`，这是正确的。但如果 `BASE_URL` 是 `/blog/`，结果会是 `/blog/posts/slug/`。然而 `joinUrl("", "/blog/", "/posts/slug/")` → `"/blog/posts/slug/"` 正确。但如果 path 不带前导 `/`，如 `url("posts/slug/")` → `"/blog/posts/slug/"`，也正确。看起来没问题。

---

## 🟡 低风险问题（代码质量 / 健壮性改进）

### 12. `setting-utils.ts` — localStorage 检查过于冗长
几乎每个函数都重复检查 `typeof localStorage === "undefined" || typeof localStorage.setItem !== "function"`。这虽然在 SSR 场景下是必要的，但可以抽取为一个 `isLocalStorageAvailable()` 辅助函数来减少代码冗余。

### 13. `setting-utils.ts:256` — `getStoredTheme()` 的类型安全性
```ts
return (localStorage.getItem("theme") as LIGHT_DARK_MODE) || getDefaultTheme();
```
直接 `as LIGHT_DARK_MODE` 类型断言，如果 localStorage 中存了无效值（如被手动篡改），不会被验证。建议加一个验证逻辑。

### 14. `[...page].astro:34-69` — 客户端脚本中的 `getDeviceType()` 在 SSR 中不应运行
```ts
function getDeviceType() {
  if (typeof window === "undefined") return "desktop";
  ...
}
```
这个脚本没有 `is:inline` 标记，Astro 会尝试在 SSR 中处理它。但函数内部检查了 `window`，所以不会出错。不过这段代码永远在客户端运行（因为没有 `is:inline`），所以 `typeof window === "undefined"` 检查是多余的。

### 15. `ClientPagination.astro:173` — 分页计算可见项目时依赖 CSS `.hidden` 类
```ts
const items = document.querySelectorAll(`[data-item-section="${sectionId}"]:not(.hidden)`);
```
这依赖 Tailwind 的 `.hidden` 类（`display: none`）来过滤不可见项目。如果项目被其他方式隐藏（如 `style="display:none"`），则不会被排除，可能导致分页计数错误。

### 16. `PostPage.astro:191-192` — 多处 `@ts-ignore` 注释
`PostPage.astro` 和 `PostCard.astro` 中有多处 `@ts-ignore`，虽然功能不受影响，但降低了类型安全性。建议使用更精确的类型声明来替代。

---

## 📋 实施优先级

| 优先级 | Bug | 影响 |
|--------|-----|------|
| P0 🔴 | #9 RSS链接含扩展名 | 加密文章和普通文章的 RSS 链接都会 404 |
| P0 🔴 | #10 OG图片远程头像不支持 | 远程头像在 OG 图片中无法渲染 |
| P1 🟠 | #7 日期 UTC 偏移 | 跨日发布的文章日期显示错误 |
| P1 🟠 | #2 resize监听器泄漏 | 樱花特效内存泄漏 |
| P1 🟠 | #8 加密文章评论不可见 | 用户解锁后看不到评论 |
| P2 🟡 | #5 列表页重复渲染 | 构建时间过长 |
| P2 🟡 | #4 url参数名冲突 | 潜在命名冲突 |
| P3 🟢 | 其他低风险问题 | 代码质量改进 |

---

## 实施步骤

1. **修复 P0 bug**：先修 RSS 链接和 OG 头像问题
2. **修复 P1 bug**：日期时区、内存泄漏、加密文章评论
3. **修复 P2 bug**：参数命名、渲染优化
4. **改进 P3 问题**：代码质量优化
