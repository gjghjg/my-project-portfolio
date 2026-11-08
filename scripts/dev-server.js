/**
 * 极简静态文件服务器（零依赖，仅用于本地预览）
 * 用法：node scripts/dev-server.js [--port 7100] [--host 127.0.0.1]
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(import.meta.url), "..", "..");

// 解析命令行参数（转发 --port / --host / -p）
function parseArgs(argv) {
  const args = { port: 7100, host: "127.0.0.1" };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--port" || argv[i] === "-p") args.port = Number(argv[++i]);
    else if (argv[i] === "--host") args.host = argv[++i];
    else if (argv[i].startsWith("--port=")) args.port = Number(argv[i].split("=")[1]);
    else if (argv[i].startsWith("--host=")) args.host = argv[i].split("=")[1];
  }
  return args;
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const { port, host } = parseArgs(process.argv.slice(2));

const server = createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (pathname === "/") pathname = "/index.html";
    const filePath = normalize(join(root, pathname));
    if (!filePath.startsWith(normalize(root))) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    const body = await readFile(filePath);
    res.writeHead(200, { "Content-Type": MIME[extname(filePath)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("404 Not Found");
  }
});

server.listen(port, host, () => {
  console.log(`预览地址: http://${host}:${port}/`);
});
