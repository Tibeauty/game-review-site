#!/usr/bin/env node
/**
 * 扫描 games.js 里 asset("…") 引用，检查 assets/covers 下文件是否存在。
 * 用法：在项目根目录执行 npm run check:covers
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const gamesPath = path.join(root, "games.js");
const coversDir = path.join(root, "assets", "covers");

const src = fs.readFileSync(gamesPath, "utf8");
const re = /\basset\s*\(\s*["']([^"']+)["']\s*\)/g;
const files = new Set();
let m;
while ((m = re.exec(src))) files.add(m[1]);

let bad = 0;
const list = [...files].sort();
for (const name of list) {
  const p = path.join(coversDir, name);
  const ok = fs.existsSync(p);
  if (!ok) bad += 1;
  console.log(`${ok ? "OK " : "MISS"}  assets/covers/${name}`);
}

if (bad > 0) {
  console.error(`\n缺少 ${bad} 个文件；线上 404 时封面会走回退链或占位图。`);
  process.exit(1);
}

console.log(`\n共 ${list.length} 个 asset 引用，文件均在磁盘上。`);
