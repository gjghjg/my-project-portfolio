/**
 * 滚动效果
 * =========
 * 用到同一个 API：IntersectionObserver（交叉观察者）。
 * 它的作用是「当某个元素进入/离开视口时通知你」，不用监听 scroll 事件逐帧计算，性能更好。
 *
 * 1. 滚动淡入：给每个 .section 加 .reveal，进入视口时加 .is-visible 触发 CSS 过渡。
 * 2. 导航高亮（Scrollspy）：观察各区块，哪个区块位于视口中部，就高亮对应的导航链接。
 */

/** 滚动淡入：元素进入视口时显现。 */
export function setupReveal() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sections = document.querySelectorAll(".section");
  if (reducedMotion || sections.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target); // 只淡入一次，之后不再观察
        }
      }
    },
    { threshold: 0.15 } // 元素露出 15% 就触发
  );

  for (const section of sections) {
    section.classList.add("reveal");
    observer.observe(section);
  }
}

/** 导航高亮：视口中部的区块决定哪个导航链接是「当前位置」。 */
export function setupScrollspy() {
  const links = document.querySelectorAll(".nav__link");
  if (links.length === 0) return;

  // 建立「区块 id → 导航链接」的映射
  const linkBySection = new Map();
  for (const link of links) {
    const id = link.getAttribute("href")?.replace("#", "");
    const section = document.getElementById(id);
    if (section) linkBySection.set(section, link);
  }
  if (linkBySection.size === 0) return;

  function setActive(activeLink) {
    for (const link of links) {
      link.classList.toggle("is-active", link === activeLink);
    }
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setActive(linkBySection.get(entry.target));
        }
      }
    },
    // 把观察区域缩到视口中部一条带：区块穿过这条带时算「当前」
    { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
  );

  for (const section of linkBySection.keys()) {
    observer.observe(section);
  }

  setActive(links[0]); // 默认高亮 Home
}
