/**
 * 零依赖本地保存服务：GET/POST /reviews
 * 启动：在项目根目录执行 node server/index.mjs
 * 可选环境变量 GAMEREVIEW_TOKEN：若设置，则请求需带 Authorization: Bearer <token>
 */
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "reviews.json");
const PORT = Number(process.env.PORT || 3456);
const TOKEN = process.env.GAMEREVIEW_TOKEN || "";

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(
      DATA_FILE,
      JSON.stringify({ reviews: {}, updatedAt: 0 }, null, 2),
      "utf8"
    );
  }
}

async function readStore() {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  try {
    return JSON.parse(raw);
  } catch {
    return { reviews: {}, updatedAt: 0 };
  }
}

async function writeStore(store) {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
}

function unauthorized(res) {
  cors(res);
  res.writeHead(401, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({ ok: false, error: "unauthorized" }));
}

function bad(res, msg, code = 400) {
  cors(res);
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({ ok: false, error: msg }));
}

function ok(res, body) {
  cors(res);
  res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function checkAuth(req) {
  if (!TOKEN) return true;
  const h = req.headers.authorization || "";
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m && m[1] === TOKEN;
}

const server = http.createServer(async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || "/", `http://${req.headers.host}`);

  if (url.pathname !== "/reviews") {
    bad(res, "not_found", 404);
    return;
  }

  if (!checkAuth(req)) {
    unauthorized(res);
    return;
  }

  if (req.method === "GET") {
    const store = await readStore();
    ok(res, { ok: true, ...store });
    return;
  }

  if (req.method === "POST") {
    let body = "";
    for await (const chunk of req) body += chunk;
    let json;
    try {
      json = JSON.parse(body || "{}");
    } catch {
      bad(res, "invalid_json");
      return;
    }
    if (!json || typeof json.reviews !== "object" || json.reviews === null) {
      bad(res, "reviews_required");
      return;
    }
    const next = {
      reviews: {},
      updatedAt: Date.now(),
    };
    for (const [k, v] of Object.entries(json.reviews)) {
      if (typeof k === "string" && typeof v === "string") next.reviews[k] = v;
    }
    await writeStore(next);
    ok(res, { ok: true, updatedAt: next.updatedAt, count: Object.keys(next.reviews).length });
    return;
  }

  bad(res, "method_not_allowed", 405);
});

await ensureDataFile();
server.listen(PORT, () => {
  console.log(`GameScope reviews API http://127.0.0.1:${PORT}/reviews`);
  if (TOKEN) console.log("Auth: Bearer token required (GAMEREVIEW_TOKEN).");
});
