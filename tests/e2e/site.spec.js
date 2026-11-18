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
