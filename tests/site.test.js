import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { projects } from "../js/data.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");
const css = readFileSync(join(root, "css", "style.css"), "utf8");
const mainJs = readFileSync(join(root, "js", "main.js"), "utf8");

// ---------- 项目数据校验 ----------

test("项目数据：至少有一个项目", () => {
  assert.ok(Array.isArray(projects), "projects 应该是数组");
  assert.ok(projects.length > 0, "至少需要一个项目");
});

test("项目数据：每个项目都有必填字段", () => {
  for (const p of projects) {
    assert.ok(typeof p.title === "string" && p.title.trim(), `缺少 title: ${JSON.stringify(p)}`);
    assert.ok(typeof p.description === "string" && p.description.trim(), `项目「${p.title}」缺少 description`);
    assert.ok(Array.isArray(p.tags) && p.tags.length > 0, `项目「${p.title}」缺少 tags`);
    assert.ok(typeof p.link === "string" && p.link.trim(), `项目「${p.title}」缺少 link`);
  }
});

test("项目数据：link 是合法的 URL", () => {
  for (const p of projects) {
    assert.doesNotThrow(() => new URL(p.link), `项目「${p.title}」的 link 不是合法 URL: ${p.link}`);
  }
});

test("项目数据：项目标题不重复", () => {
  const titles = projects.map((p) => p.title);
  assert.equal(new Set(titles).size, titles.length, "存在重复的项目标题");
});

// ---------- 页面结构校验 ----------

test("页面：包含核心区块（Projects / Info / Contact）", () => {
  for (const id of ["projects", "info", "contact"]) {
    assert.ok(html.includes(`id="${id}"`), `index.html 缺少 #${id} 区块`);
  }
});

test("页面：包含项目列表容器和页脚年份占位", () => {
  assert.ok(html.includes('id="project-list"'), "缺少 #project-list 容器");
  assert.ok(html.includes('id="year"'), "缺少 #year 占位");
});

test("页面：引用的 CSS / JS 文件真实存在", () => {
  for (const href of html.matchAll(/<link[^>]+href="([^"]+\.css)"/g)) {
    assert.ok(existsSync(join(root, href[1])), `CSS 文件不存在: ${href[1]}`);
  }
  for (const src of html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)) {
    assert.ok(existsSync(join(root, src[1])), `JS 文件不存在: ${src[1]}`);
  }
});

test("页面：有 lang、title 和 viewport 设置", () => {
  assert.ok(html.includes('lang="zh-CN"'), "缺少 lang 属性");
  assert.ok(/<title>.+<\/title>/.test(html), "缺少 <title>");
  assert.ok(html.includes("viewport"), "缺少 viewport meta");
});

// ---------- 新功能：主题切换 ----------

test("主题切换：包含 LIGHT / DARK 按钮和 data-theme 属性", () => {
  assert.ok(html.includes('id="theme-light"'), "缺少 LIGHT 切换按钮");
  assert.ok(html.includes('id="theme-dark"'), "缺少 DARK 切换按钮");
  assert.ok(html.includes('data-theme="light"'), "缺少默认 data-theme 属性");
});

test("主题切换：CSS 定义了 dark 主题变量", () => {
  assert.ok(css.includes('[data-theme="dark"]'), "CSS 缺少 dark 主题变量");
  assert.ok(css.includes("--color-bg"), "CSS 缺少 --color-bg 变量");
});

test("主题切换：JS 持久化用户选择（localStorage）", () => {
  assert.ok(mainJs.includes("localStorage"), "main.js 未使用 localStorage 保存主题");
});

// ---------- 可访问性 ----------

test("可访问性：跳转链接指向可接收焦点的主要内容", () => {
  assert.ok(html.includes('class="skip-link" href="#main-content"'), "缺少指向主要内容的跳转链接");
  assert.ok(html.includes('<main id="main-content" tabindex="-1">'), "main 缺少对应 id 或跳转焦点支持");
  assert.ok(css.includes(".skip-link:focus"), "跳转链接没有键盘聚焦时的显示样式");
});

test("可访问性：链接和按钮有键盘焦点样式", () => {
  assert.ok(css.includes(":focus-visible"), "缺少 :focus-visible 焦点样式");
  assert.ok(css.includes("outline-offset"), "焦点框缺少与元素的间距");
});

test("可访问性：主题控件和区块有明确的辅助名称", () => {
  assert.ok(html.includes('role="group" aria-label="颜色主题"'), "主题按钮组缺少中文名称");
  // 辅助名称必须同时包含可见英文和中文说明，满足 Label in Name。
  assert.ok(html.includes('aria-label="LIGHT：切换到浅色主题"'), "浅色按钮名称缺少可见文字或中文说明");
  assert.ok(html.includes('aria-label="DARK：切换到深色主题"'), "深色按钮名称缺少可见文字或中文说明");
  for (const id of ["projects", "info", "contact"]) {
    assert.ok(html.includes(`aria-labelledby="${id}-title"`), `${id} 区块未关联标题`);
    assert.ok(html.includes(`id="${id}-title"`), `${id} 标题缺少 id`);
  }
});

// ---------- 新功能：粒子流动背景 ----------

test("粒子背景：包含 canvas 元素且模块文件存在", () => {
  assert.ok(html.includes('id="flow-canvas"'), "缺少 #flow-canvas 画布");
  assert.ok(existsSync(join(root, "js", "flow-background.js")), "缺少 flow-background.js");
  assert.ok(mainJs.includes("startFlowBackground"), "main.js 未启动粒子背景");
});

test("粒子背景：尊重减少动态效果的系统设置", () => {
  const flow = readFileSync(join(root, "js", "flow-background.js"), "utf8");
  assert.ok(flow.includes("prefers-reduced-motion"), "未处理 prefers-reduced-motion");
});

// ---------- 性能优化 ----------

test("性能：粒子数量随屏幕宽度降级", async () => {
  const { responsiveParticleCount } = await import("../js/flow-background.js");
  assert.equal(responsiveParticleCount(375), 300, "手机应为 300 粒子");
  assert.equal(responsiveParticleCount(800), 600, "平板应为 600 粒子");
  assert.equal(responsiveParticleCount(1440), 900, "桌面应为 900 粒子");
});

test("性能：页面切到后台时暂停动画", () => {
  const flow = readFileSync(join(root, "js", "flow-background.js"), "utf8");
  assert.ok(flow.includes("visibilitychange"), "未监听 visibilitychange");
  assert.ok(flow.includes("document.hidden"), "未检查 document.hidden");
  assert.ok(flow.includes("cancelAnimationFrame"), "暂停时未取消动画帧");
});

test("性能：debounce 合并连续调用，只执行最后一次", async () => {
  const { debounce } = await import("../js/flow-background.js");
  let calls = [];
  const record = debounce((v) => calls.push(v), 30);

  record(1);
  record(2);
  record(3);
  assert.equal(calls.length, 0, "等待期内不应立即执行");

  await new Promise((r) => setTimeout(r, 60));
  assert.deepEqual(calls, [3], "只执行一次，且用最后一次的参数");

  record(4);
  await new Promise((r) => setTimeout(r, 60));
  assert.deepEqual(calls, [3, 4], "间隔超过等待期后正常再次执行");
});

test("性能：resize 使用防抖，主题颜色有缓存", () => {
  const flow = readFileSync(join(root, "js", "flow-background.js"), "utf8");
  assert.ok(flow.includes('debounce(resize, 150)'), "resize 未使用防抖");
  assert.ok(flow.includes("MutationObserver"), "未监听主题变化来更新颜色缓存");
  // tick 每帧执行，不应再直接调用 getComputedStyle
  const tickBody = flow.split("function tick()")[1]?.split("function start()")[0] ?? "";
  assert.ok(!tickBody.includes("themeColors()"), "tick 内不应每帧读取计算样式");
});

// ---------- 滚动效果 ----------

test("滚动效果：模块存在且被 main.js 调用", () => {
  assert.ok(existsSync(join(root, "js", "scroll-effects.js")), "缺少 scroll-effects.js");
  assert.ok(mainJs.includes("setupReveal"), "main.js 未启用滚动淡入");
  assert.ok(mainJs.includes("setupScrollspy"), "main.js 未启用导航高亮");
});

test("滚动效果：使用 IntersectionObserver 并处理减少动态效果", () => {
  const fx = readFileSync(join(root, "js", "scroll-effects.js"), "utf8");
  assert.ok(fx.includes("IntersectionObserver"), "未使用 IntersectionObserver");
  assert.ok(fx.includes("prefers-reduced-motion"), "未处理 prefers-reduced-motion");
});

test("滚动效果：导航链接都有对应的真实区块", () => {
  for (const m of html.matchAll(/class="nav__link" href="#([^"]+)"/g)) {
    assert.ok(html.includes(`id="${m[1]}"`), `导航指向的 #${m[1]} 区块不存在`);
  }
});

test("窄屏修复：简介为主题按钮留出左边距", () => {
  assert.ok(css.includes("margin-left: 36px"), "窄屏简介未让出主题按钮位置");
});

// ---------- 上线收尾：favicon 与分享卡片 ----------

test("favicon：SVG 图标存在且被 HTML 引用", () => {
  assert.ok(existsSync(join(root, "assets", "favicon.svg")), "缺少 assets/favicon.svg");
  assert.ok(html.includes('rel="icon"'), "HTML 未引用 favicon");
  assert.ok(html.includes("assets/favicon.svg"), "favicon 路径不匹配");
});

test("分享卡片：OG meta 完整且图片真实存在", () => {
  for (const prop of ["og:title", "og:description", "og:url", "og:image"]) {
    assert.ok(html.includes(`property="${prop}"`), `缺少 ${prop}`);
  }
  assert.ok(html.includes('name="twitter:card"'), "缺少 twitter:card");
  assert.ok(existsSync(join(root, "assets", "og-image.png")), "缺少 assets/og-image.png");
});

test("分享卡片：og:image 使用绝对地址（相对地址在社交平台无法显示）", () => {
  const m = html.match(/property="og:image" content="([^"]+)"/);
  assert.ok(m && m[1].startsWith("https://"), "og:image 必须是 https 绝对地址");
});

// ---------- 多浏览器与可访问性质量保障 ----------

test("质量保障：配置三种浏览器和 axe 开发依赖", () => {
  const config = readFileSync(join(root, "playwright.config.js"), "utf8");
  for (const browser of ["chromium", "firefox", "webkit"]) {
    assert.ok(config.includes(`name: "${browser}"`), `Playwright 缺少 ${browser} 项目`);
  }
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert.ok(pkg.devDependencies["@axe-core/playwright"], "缺少 axe 开发依赖");
  assert.ok(pkg.scripts["test:e2e:all"], "缺少三浏览器测试命令");
  assert.ok(existsSync(join(root, "tests", "e2e", "accessibility.spec.js")), "缺少可访问性 E2E 测试");
});

test("质量保障：手机真机验收清单存在且不误标为已测", () => {
  const checklistPath = join(root, "MOBILE_CHECKLIST.md");
  assert.ok(existsSync(checklistPath), "缺少手机真机验收清单");
  const checklist = readFileSync(checklistPath, "utf8");
  assert.ok(checklist.includes("44×44px"), "清单缺少触控区域检查");
  assert.ok(checklist.includes("减少动态效果"), "清单缺少减少动态效果检查");
  assert.ok(checklist.includes("未测"), "真机结果不应预先标记为通过");
});

// ---------- 项目文档（防止"记忆文件"被误删） ----------

test("文档：README.md 存在且包含运行命令", () => {
  const readmePath = join(root, "README.md");
  assert.ok(existsSync(readmePath), "缺少 README.md");
  const readme = readFileSync(readmePath, "utf8");
  assert.ok(readme.includes("npm run dev"), "README 缺少运行命令说明");
  assert.ok(readme.includes("npm test"), "README 缺少测试命令说明");
});

test("文档：DECISIONS.md 存在且包含决策记录", () => {
  const decisionsPath = join(root, "DECISIONS.md");
  assert.ok(existsSync(decisionsPath), "缺少 DECISIONS.md");
  const decisions = readFileSync(decisionsPath, "utf8");
  assert.ok(/## \d{4}-\d{2}-\d{2}/.test(decisions), "DECISIONS 缺少带日期的决策条目");
});
