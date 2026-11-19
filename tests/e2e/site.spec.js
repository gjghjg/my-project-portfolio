/**
 * 端到端（E2E）测试：在真实浏览器里模拟用户操作。
 * 和 tests/site.test.js 的区别：
 * - 单元测试只检查文件内容 / 纯函数逻辑；
 * - E2E 测试会真的打开页面、点击按钮、滚动页面，验证「用户实际看到的行为」。
 */
import { test, expect } from "@playwright/test";
import { projects } from "../../js/data.js";

test("首页加载：标题和首屏内容正确", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/你的名字/);
  await expect(page.locator(".hero__name")).toBeVisible();
  await expect(page.locator("#flow-canvas")).toBeVisible();
});

test("项目列表：渲染数量与 data.js 中的数据一致", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".project-item")).toHaveCount(projects.length);
  // 每个项目都有标题和链接
  for (const p of projects) {
    await expect(page.locator(".project-item__title", { hasText: p.title })).toBeVisible();
    await expect(page.locator(`.project-item__link[href="${p.link}"]`)).toBeVisible();
  }
});

test("主题切换：点击 DARK 页面变暗，刷新后选择被记住", async ({ page }) => {
  await page.goto("/");

  // 点击 DARK，<html> 的 data-theme 应变更为 dark
  await page.locator("#theme-dark").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("#theme-dark")).toHaveAttribute("aria-pressed", "true");

  // 刷新后仍保持 dark（localStorage 持久化生效）
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  // 切回 LIGHT 同样生效
  await page.locator("#theme-light").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("导航：点击 Projects 锚点跳转到项目区块", async ({ page }) => {
  await page.goto("/");
  await page.locator('.nav__link[href="#projects"]').click();
  await expect(page).toHaveURL(/#projects$/);
});

test("滚动：区块淡入且导航高亮跟随", async ({ page }) => {
  await page.goto("/");

  // 一直滚到页面底部（真实用户的操作），联系区块应淡入完成
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.locator("#contact")).toHaveClass(/is-visible/);

  // 导航高亮应切换到 Contact
  await expect(page.locator(".nav__link.is-active")).toHaveText(/Contact/);
});

test("页脚：显示当前年份", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#year")).toHaveText(String(new Date().getFullYear()));
});

test("键盘：第一次 Tab 显示跳转链接，Enter 后焦点进入主要内容", async ({ page }) => {
  await page.goto("/");

  await page.keyboard.press("Tab");
  const skipLink = page.locator(".skip-link");
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeInViewport();

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main-content$/);
  await expect(page.locator("#main-content")).toBeFocused();
});

test("键盘：Tab 到 DARK 后按 Enter 可切换主题，焦点框清晰可见", async ({ page }) => {
  await page.goto("/");

  // Tab 顺序：跳转链接 → LIGHT → DARK，与页面 DOM 顺序一致
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(page.locator("#theme-light")).toBeFocused();
  await page.keyboard.press("Tab");

  const darkButton = page.locator("#theme-dark");
  await expect(darkButton).toBeFocused();
  const outlineStyle = await darkButton.evaluate((el) => getComputedStyle(el).outlineStyle);
  const outlineWidth = await darkButton.evaluate((el) => getComputedStyle(el).outlineWidth);
  expect(outlineStyle).not.toBe("none");
  expect(outlineWidth).not.toBe("0px");

  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(darkButton).toHaveAttribute("aria-pressed", "true");
});

test("对比度：非当前导航在明暗主题下均达到 4.5:1", async ({ page }) => {
  await page.goto("/");
  const projectsLink = page.locator('.nav__link[href="#projects"]');
  await expect(projectsLink).toHaveCSS("opacity", "0.65");
  expect(await textContrastRatio(projectsLink)).toBeGreaterThanOrEqual(4.5);

  await page.locator("#theme-dark").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(projectsLink).toHaveCSS("opacity", "0.65");
  expect(await textContrastRatio(projectsLink)).toBeGreaterThanOrEqual(4.5);
});

test("减少动态效果：切换主题时画布背景也会立即更新", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const topLeftPixel = () => page.locator("#flow-canvas").evaluate((canvas) => {
    const context = canvas.getContext("2d");
    return Array.from(context.getImageData(0, 0, 1, 1).data);
  });

  await page.locator("#theme-dark").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect.poll(topLeftPixel).toEqual([20, 20, 20, 255]);

  await page.locator("#theme-light").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect.poll(topLeftPixel).toEqual([232, 232, 232, 255]);
});

/** 把带元素透明度的文字合成到页面背景上，再计算 WCAG 相对亮度对比度。 */
async function textContrastRatio(locator) {
  const { foreground, background, opacity } = await locator.evaluate((el) => ({
    foreground: getComputedStyle(el).color,
    background: getComputedStyle(document.body).backgroundColor,
    opacity: Number(getComputedStyle(el).opacity),
  }));
  const fg = parseRgb(foreground);
  const bg = parseRgb(background);
  const composited = fg.map((channel, index) => channel * opacity + bg[index] * (1 - opacity));
  const lighter = Math.max(relativeLuminance(composited), relativeLuminance(bg));
  const darker = Math.min(relativeLuminance(composited), relativeLuminance(bg));
  return (lighter + 0.05) / (darker + 0.05);
}

function parseRgb(color) {
  const channels = color.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  if (!channels || channels.length !== 3) throw new Error(`无法解析颜色：${color}`);
  return channels;
}

function relativeLuminance(rgb) {
  const [r, g, b] = rgb.map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
