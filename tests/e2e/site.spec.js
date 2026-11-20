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

test("运行质量：加载和主题切换无控制台错误或失败请求", async ({ page }) => {
  const consoleErrors = [];
  const failedRequests = [];
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    failedRequests.push(`${request.method()} ${request.url()}：${request.failure()?.errorText}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) failedRequests.push(`${response.status()} ${response.url()}`);
  });

  await page.goto("/");
  await page.locator("#theme-dark").click();
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(20, 20, 20)");
  await page.locator("#theme-light").click();
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(232, 232, 232)");

  expect(consoleErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});

test("键盘：第一次 Tab 显示跳转链接，Enter 后焦点进入主要内容", async ({ page, browserName }) => {
  await page.goto("/");

  const skipLink = page.locator(".skip-link");
  await page.keyboard.press("Tab");
  const tabReachedSkipLink = await skipLink.evaluate((el) => el === document.activeElement);
  if (!tabReachedSkipLink) {
    // 某些 WebKit 平台／设置不在普通 Tab 顺序中包含链接，单独验证 Enter 激活。
    // Chromium / Firefox 若第一次 Tab 没到跳转链接，仍直接判定失败。
    expect(browserName, "只有 WebKit 的平台默认设置可能跳过链接").toBe("webkit");
    await skipLink.focus();
  }
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeInViewport();

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main-content$/);
  await expect(page.locator("#main-content")).toBeFocused();
});

test("键盘：Tab 到 DARK 后按 Enter 可切换主题，焦点框清晰可见", async ({ page }) => {
  await page.goto("/");

  // 第一次 Tab 可能到跳转链接，也可能被当前 WebKit 设置直接送到 LIGHT；按真实焦点判断。
  await page.keyboard.press("Tab");
  const skipLinkHasFocus = await page.locator(".skip-link").evaluate((el) => el === document.activeElement);
  if (skipLinkHasFocus) await page.keyboard.press("Tab");
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
  await expect(projectsLink).toHaveCSS("color", "rgb(26, 26, 26)");
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(232, 232, 232)");
  expect(await textContrastRatio(projectsLink)).toBeGreaterThanOrEqual(4.5);

  await page.locator("#theme-dark").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(projectsLink).toHaveCSS("opacity", "0.65");
  // data-theme 会立即更新，但颜色有过渡；必须等待最终颜色再测量对比度。
  await expect(projectsLink).toHaveCSS("color", "rgb(232, 232, 232)");
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(20, 20, 20)");
  expect(await textContrastRatio(projectsLink)).toBeGreaterThanOrEqual(4.5);
});

test("减少动态效果：切换主题时画布背景也会立即更新", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("body")).toHaveCSS("transition-duration", "0s");

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
