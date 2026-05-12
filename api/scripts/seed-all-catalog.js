/**
 * Заливка всего каталога из JSON (как после snifer) в API админки.
 *
 * Запуск из каталога api/:
 *   node scripts/seed-all-catalog.js
 *
 * На проде:
 *   API_URL=https://xstore55.ru/api node scripts/seed-all-catalog.js
 *
 * Другой каталог с JSON (без snifer в репозитории):
 *   CATALOG_ROOT=/path/to/output API_URL=... node scripts/seed-all-catalog.js
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const apiDir = path.join(__dirname, "..");
const catalogRoot =
  process.env.CATALOG_ROOT ||
  path.join(apiDir, "..", "snifer", "output");

const env = {
  ...process.env,
  IPHONES_JSON:
    process.env.IPHONES_JSON || path.join(catalogRoot, "iphones.json"),
  MACBOOKS_JSON:
    process.env.MACBOOKS_JSON || path.join(catalogRoot, "macbooks.json"),
  IPADS_JSON:
    process.env.IPADS_JSON || path.join(catalogRoot, "ipads.json"),
  WATCHES_JSON:
    process.env.WATCHES_JSON || path.join(catalogRoot, "watches.json"),
  AIRPODS_JSON:
    process.env.AIRPODS_JSON || path.join(catalogRoot, "airpods.json"),
};

const required = [
  ["IPHONES_JSON", "iphones.json"],
  ["MACBOOKS_JSON", "macbooks.json"],
  ["IPADS_JSON", "ipads.json"],
  ["WATCHES_JSON", "watches.json"],
  ["AIRPODS_JSON", "airpods.json"],
];

for (const [key, label] of required) {
  const p = env[key];
  if (!fs.existsSync(p)) {
    console.error(`Нет файла ${label}: ${p}`);
    console.error(`Задайте CATALOG_ROOT или переменную ${key}`);
    process.exit(1);
  }
}

const steps = [
  "seed-iphones.js",
  "seed-macbooks.js",
  "seed-ipads.js",
  "seed-watches.js",
  "seed-airpods.js",
];

console.log(`API: ${env.API_URL || "http://localhost:4000/api"}`);
console.log(`JSON: ${catalogRoot}\n`);

for (const script of steps) {
  const scriptPath = path.join(__dirname, script);
  const r = spawnSync(process.execPath, [scriptPath], {
    cwd: apiDir,
    env,
    stdio: "inherit",
  });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

console.log("\nГотово: все категории залиты.");
