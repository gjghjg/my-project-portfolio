# 个人作品集网站

一个极简风格的个人作品集单页网站，参考 Keita Yamada 的设计美学：粒子流动背景、竖排明暗主题切换、左侧纵向导航、细边框框架。用纯原生 HTML / CSS / JavaScript 实现，零依赖、零构建步骤。

> 新对话开始时，请先读本文件和 `DECISIONS.md`，了解项目全貌与历史决策。

## 快速开始

```bash
npm run dev      # 启动本地预览服务器
npm test         # 单元测试（Node，零依赖）

# E2E 浏览器测试（首次使用需先安装）：
npm install
npx playwright install chromium
npm run test:e2e
```

## 目录结构

```
index.html              页面结构（区块骨架，项目列表由 JS 渲染）
css/style.css           全部样式（含明暗主题 CSS 变量）
js/data.js              项目数据（新增作品只需在这里加一条）
js/main.js              渲染逻辑、主题切换、页脚年份
js/flow-background.js   粒子流动背景（Canvas 流场动画，含性能优化）
js/scroll-effects.js    滚动淡入 + 导航高亮（IntersectionObserver）
scripts/dev-server.js   本地预览服务器
tests/site.test.js      数据校验 + 页面结构校验 + 功能校验
AGENTS.md               给 AI 协作者的工作约定（提交、测试）
DECISIONS.md            设计/技术决策记录（"为什么这么做"）
.github/workflows/      GitHub Actions：推送代码自动运行测试
```

## 部署（GitHub Pages）

- **线上地址**：https://gjghjg.github.io/my-project-portfolio/
- **仓库地址**：https://github.com/gjghjg/my-project-portfolio

已开启 Pages（Source：Deploy from a branch，main / root）。之后每次 `git push`，线上网站约 1 分钟内自动更新，同时 GitHub Actions 自动跑测试（见仓库 Actions 页）。

## 迭代方式

- 新增项目作品：只改 `js/data.js`，页面自动渲染，不用碰 HTML。
- 每次改动完成后：运行 `npm test`，通过后创建一个 Git commit（见 `AGENTS.md`）。
- 想法 / 计划 / 待定问题：记进 `DECISIONS.md`，不要只留在对话里。
