import { defineConfig } from "@playwright/test";

// Playwright 配置：启动真实的 Chromium 浏览器测试页面行为
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:7100",
    // 本地直接用已安装的 Chrome，免去下载 Chromium；CI 上使用 Playwright 自带的 Chromium
    ...(process.env.CI ? {} : { channel: "chrome" }),
  },
  // 测试前自动启动本地预览服务器，测完自动关闭
  webServer: {
    command: "node scripts/dev-server.js --port 7100",
    url: "http://127.0.0.1:7100",
    reuseExistingServer: !process.env.CI,
  },
});
