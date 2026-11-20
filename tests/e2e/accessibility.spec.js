import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const viewports = [
  { name: "桌面", width: 1440, height: 900 },
  { name: "手机", width: 375, height: 812 },
];

for (const viewport of viewports) {
  for (const theme of ["light", "dark"]) {
    test(`axe：${viewport.name}的${theme}主题无 WCAG 自动扫描违规`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      // 让所有内容直接显示，也避免动画干扰扫描结果。
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/");

      // 每个主题使用独立页面：Firefox 在 axe 扫描后切换主题可能崩溃，
      // 隔离页面既能避开引擎冲突，也避免前一个扫描影响下一个状态。
      await page.locator(`#theme-${theme}`).click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await expect(page.locator("body")).toHaveCSS(
        "background-color",
        theme === "light" ? "rgb(232, 232, 232)" : "rgb(20, 20, 20)"
      );

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      const summary = results.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        help: violation.help,
        targets: violation.nodes.map((node) => node.target),
      }));

      expect(
        summary,
        `${testInfo.project.name}／${viewport.name}／${theme} 发现可访问性违规`
      ).toEqual([]);
    });
  }
}

test("触控：两个主题按钮的可点击区域均至少为 44×44px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  for (const id of ["#theme-light", "#theme-dark"]) {
    const box = await page.locator(id).boundingBox();
    expect(box, `${id} 应能测量到点击区域`).not.toBeNull();
    expect(box.width, `${id} 宽度不足`).toBeGreaterThanOrEqual(44);
    expect(box.height, `${id} 高度不足`).toBeGreaterThanOrEqual(44);
  }
});

test("响应式：360～1440px 均不出现页面横向溢出", async ({ page }) => {
  await page.goto("/");

  for (const width of [360, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    expect(hasOverflow, `${width}px 视口出现横向滚动`).toBe(false);
  }
});
