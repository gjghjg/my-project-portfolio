# 个人作品集网站

一个极简风格的个人作品集单页网站，参考 Keita Yamada 的设计美学：粒子流动背景、竖排明暗主题切换、左侧纵向导航、细边框框架。用纯原生 HTML / CSS / JavaScript 实现，线上零运行时依赖、零构建步骤；测试工具仅作为开发依赖。

> 新对话开始时，请先读本文件和 `DECISIONS.md`，了解项目全貌与历史决策。

## 快速开始

```bash
npm run dev           # 启动本地预览服务器
npm test              # 单元测试（Node，零运行时依赖）
npm install           # 安装 Playwright、axe 等开发依赖

# 快速 E2E：默认使用本机已安装的 Chrome，包含 axe 可访问性扫描
npm run test:e2e

# 完整三浏览器测试（首次使用先安装浏览器）：
npx playwright install chromium firefox webkit
npm run test:e2e:all  # Chromium + Firefox + WebKit
```

`test:e2e` 和 `test:e2e:all` 都会检查键盘操作、明暗主题、触控区域、响应式布局及 WCAG 自动扫描规则。axe 不能代替人工验收，手机真机检查请使用 `MOBILE_CHECKLIST.md`。

## 目录结构

```
index.html              页面结构（区块骨架，项目列表由 JS 渲染）
css/style.css           全部样式（含明暗主题 CSS 变量）
js/data.js              项目数据（新增作品只需在这里加一条）
js/main.js              渲染逻辑、主题切换、页脚年份
js/flow-background.js   粒子流动背景（Canvas 流场动画，含性能优化）
js/scroll-effects.js    滚动淡入 + 导航高亮（IntersectionObserver）
scripts/dev-server.js   本地预览服务器
playwright.config.js    Chromium / Firefox / WebKit 三浏览器配置
tests/site.test.js      数据校验 + 页面结构校验 + 功能校验
tests/e2e/             真实浏览器交互、响应式和 axe 可访问性测试
AGENTS.md               给 AI 协作者的工作约定（提交、测试）
DECISIONS.md            设计/技术决策记录（"为什么这么做"）
MOBILE_CHECKLIST.md     手机真机人工验收清单（结果需实际填写）
.github/workflows/      GitHub Actions：三浏览器测试通过后部署
```

## 部署（GitHub Pages）

- **线上地址**：https://gjghjg.github.io/my-project-portfolio/
- **仓库地址**：https://github.com/gjghjg/my-project-portfolio

已开启 Pages，**部署由 GitHub Actions 完成**（`.github/workflows/test.yml`）：每次 `git push` 先自动跑单元测试 + 三浏览器 E2E + axe 可访问性扫描，全部通过后才发布到 Pages；测试失败则跳过部署，线上保持上一个正常版本。PR 只跑测试不发布。仓库 Settings → Pages 的 Source 需设为 **GitHub Actions**（不是 Deploy from a branch）。

## 迭代方式

- 新增项目作品：只改 `js/data.js`，页面自动渲染，不用碰 HTML。
- 每次改动完成后：运行 `npm test`，通过后创建一个 Git commit（见 `AGENTS.md`）。
- 想法 / 计划 / 待定问题：记进 `DECISIONS.md`，不要只留在对话里。
