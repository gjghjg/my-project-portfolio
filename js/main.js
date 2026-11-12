import { projects } from "./data.js";
import { startFlowBackground } from "./flow-background.js";

/**
 * 创建一个项目条目（极简文字行风格）。
 * @param {{title: string, description: string, tags: string[], link: string}} project
 * @returns {HTMLElement}
 */
export function createProjectItem(project) {
  const item = document.createElement("li");
  item.className = "project-item";

  const title = document.createElement("h3");
  title.className = "project-item__title";
  title.textContent = project.title;
  item.appendChild(title);

  const desc = document.createElement("p");
  desc.className = "project-item__desc";
  desc.textContent = project.description;
  item.appendChild(desc);

  const tags = document.createElement("p");
  tags.className = "project-item__tags";
  tags.textContent = project.tags.join(" / ");
  item.appendChild(tags);

  const link = document.createElement("a");
  link.className = "project-item__link";
  link.href = project.link;
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = "查看项目 →";
  item.appendChild(link);

  return item;
}

/** 把所有项目渲染到 #project-list 容器中。 */
export function renderProjects() {
  const container = document.querySelector("#project-list");
  if (!container) return;

  container.innerHTML = "";
  for (const project of projects) {
    container.appendChild(createProjectItem(project));
  }
}

/**
 * 明暗主题切换。
 * 通过修改 <html> 的 data-theme 属性切换 CSS 变量，
 * 并用 localStorage 记住用户的选择。
 */
export function setupThemeSwitch() {
  const root = document.documentElement;
  const lightBtn = document.querySelector("#theme-light");
  const darkBtn = document.querySelector("#theme-dark");
  if (!lightBtn || !darkBtn) return;

  function applyTheme(theme) {
    root.dataset.theme = theme;
    lightBtn.textContent = theme === "light" ? "■ LIGHT" : "□ LIGHT";
    darkBtn.textContent = theme === "dark" ? "■ DARK" : "□ DARK";
    lightBtn.setAttribute("aria-pressed", String(theme === "light"));
    darkBtn.setAttribute("aria-pressed", String(theme === "dark"));
    try {
      localStorage.setItem("theme", theme);
    } catch {
      // 隐私模式下 localStorage 可能不可用，忽略即可
    }
  }

  lightBtn.addEventListener("click", () => applyTheme("light"));
  darkBtn.addEventListener("click", () => applyTheme("dark"));

  // 恢复上次选择的主题；没有记录就跟随系统偏好
  let saved = null;
  try {
    saved = localStorage.getItem("theme");
  } catch {
    // 忽略
  }
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (prefersDark ? "dark" : "light"));
}

/** 页脚年份自动更新为当前年份。 */
export function updateFooterYear() {
  const yearEl = document.querySelector("#year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
}

renderProjects();
setupThemeSwitch();
updateFooterYear();

// 启动粒子流动背景
const canvas = document.querySelector("#flow-canvas");
if (canvas) {
  startFlowBackground(canvas);
}
