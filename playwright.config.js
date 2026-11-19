import { defineConfig } from "@playwright/test";

// 同一套测试覆盖三个浏览器内核；npm run test:e2e 只跑 Chromium，test:e2e:all 全跑。
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:7100",
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        // 本地直接用已安装的 Chrome；CI 使用 Playwright 自带的 Chromium。
        ...(process.env.CI ? {} : { channel: "chrome" }),
      },
    },
    {
      name: "firefox",
      use: { browserName: "firefox" },
    },
    {
      name: "webkit",
      use: { browserName: "webkit" },
    },
  ],
  // 测试前自动启动本地预览服务器，测完自动关闭
  webServer: {
    command: "node scripts/dev-server.js --port 7100",
    url: "http://127.0.0.1:7100",
    reuseExistingServer: !process.env.CI,
  },
});
