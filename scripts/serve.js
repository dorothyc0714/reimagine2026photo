import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const PUBLIC_DIR = path.resolve(process.cwd(), "public");
const PORT = Number(process.env.PORT || 4173);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml"
};

function safePath(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]).replaceAll("\\", "/");
  const joined = path.join(PUBLIC_DIR, clean);
  const rel = path.relative(PUBLIC_DIR, joined);
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
  return joined;
}

const server = http.createServer((req, res) => {
  const u = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const pathname = u.pathname === "/" ? "/index.html" : u.pathname;
  const abs = safePath(pathname);
  if (!abs) {
    res.writeHead(400);
    res.end("Bad path");
    return;
  }

  if (!fs.existsSync(abs) || fs.statSync(abs).isDirectory()) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const ext = path.extname(abs).toLowerCase();
  res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
  fs.createReadStream(abs).pipe(res);
});

server.listen(PORT, () => {
  console.log(`Serving ${PUBLIC_DIR} at http://localhost:${PORT}`);
});

