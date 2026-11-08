import { projects } from "./data.js";

/**
 * 创建一个项目卡片的 DOM 节点。
 * @param {{title: string, description: string, tags: string[], link: string}} project
 * @returns {HTMLElement}
 */
export function createProjectCard(project) {
  const card = document.createElement("article");
  card.className = "project-card";

  const title = document.createElement("h3");
  title.className = "project-card__title";
  title.textContent = project.title;
  card.appendChild(title);

  const desc = document.createElement("p");
  desc.className = "project-card__desc";
  desc.textContent = project.description;
  card.appendChild(desc);

  const tagList = document.createElement("ul");
  tagList.className = "project-card__tags";
  for (const tag of project.tags) {
    const item = document.createElement("li");
    item.className = "project-card__tag";
    item.textContent = tag;
    tagList.appendChild(item);
  }
  card.appendChild(tagList);

  const link = document.createElement("a");
  link.className = "project-card__link";
  link.href = project.link;
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = "查看项目 →";
  card.appendChild(link);

  return card;
}

/** 把所有项目渲染到 #project-list 容器中。 */
export function renderProjects() {
  const container = document.querySelector("#project-list");
  if (!container) return;

  container.innerHTML = "";
  for (const project of projects) {
    container.appendChild(createProjectCard(project));
  }
}

/** 页脚年份自动更新为当前年份。 */
export function updateFooterYear() {
  const yearEl = document.querySelector("#year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
}

renderProjects();
updateFooterYear();
