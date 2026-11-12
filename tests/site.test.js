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
