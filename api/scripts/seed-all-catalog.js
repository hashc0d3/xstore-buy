/**
 * Заливка всего каталога из JSON (как после snifer) в API админки,
 * затем Dyson + «Игровые консоли» через Prisma в ту же SQLite (если API локальный).
 *
 * Запуск из каталога api/:
 *   node scripts/seed-all-catalog.js
 *
 * На проде в контейнере (после up): API через http://api:4000/api — см. docker-compose.
 *   docker compose exec api node scripts/seed-all-catalog.js
 *
 * С ПК на удалённый API (только JSON-категории; Dyson — отдельно на сервере):
 *   API_URL=https://xstore55.ru/api node scripts/seed-all-catalog.js
 *   docker compose exec api node scripts/seed-dyson-consoles.js
 *
 * Другой каталог с JSON (без snifer в репозитории):
 *   CATALOG_ROOT=/path/to/output API_URL=... node scripts/seed-all-catalog.js
 *
 * Отключить финальный Prisma-шаг: SKIP_DYSON_CONSOLES=1
 * Не ждать поднятие API: SEED_SKIP_API_WAIT=1
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

async function waitForStoreApi(apiBase, maxSec) {
  const url = `${apiBase.replace(/\/$/, "")}/store`;
  console.log(`Ожидание API: GET ${url} …`);
  for (let attempt = 1; attempt <= maxSec; attempt += 1) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        await res.arrayBuffer().catch(() => {});
        return;
      }
    } catch (_) {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(
    `API не отвечает на GET ${url} (${maxSec} с). Запущен ли контейнер api? Смотрите: docker compose logs api`
  );
}

/** В Docker по имени сервиса надёжнее, чем 127.0.0.1 (spawn-дочерние процессы / сеть). */
function resolveApiBase() {
  let u = (env.API_URL || "http://localhost:4000/api").replace(/\/$/, "").trim();
  if (fs.existsSync("/.dockerenv") && /127\.0\.0\.1|localhost/i.test(u)) {
    u = "http://api:4000/api";
  }
  return u;
}

/** Локальный HTTP-залив + Prisma Dyson: localhost, 127.0.0.1 или сервис api из compose внутри контейнера. */
function isInProcessCatalogSeed(apiBase) {
  try {
    const { hostname } = new URL(apiBase.includes("://") ? apiBase : `http://${apiBase}`);
    if (hostname === "localhost" || hostname === "127.0.0.1") return true;
    if (fs.existsSync("/.dockerenv") && hostname === "api") return true;
  } catch {
    /* fallthrough */
  }
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(apiBase);
}

async function main() {
  const apiBase = resolveApiBase();
  const maxWait = Number(process.env.SEED_WAIT_SEC || 120);
  if (process.env.SEED_SKIP_API_WAIT !== "1") {
    await waitForStoreApi(apiBase, maxWait);
  }

  console.log(`API: ${apiBase}`);
  console.log(`JSON: ${catalogRoot}\n`);

  for (const script of steps) {
    const scriptPath = path.join(__dirname, script);
    const r = spawnSync(process.execPath, [scriptPath], {
      cwd: apiDir,
      env: { ...env, API_URL: apiBase },
      stdio: "inherit",
    });
    if (r.status !== 0) {
      process.exit(r.status ?? 1);
    }
  }

  const runDysonPrisma = isInProcessCatalogSeed(apiBase);

  if (process.env.SKIP_DYSON_CONSOLES === "1") {
    console.log("\n[seed-all-catalog] SKIP_DYSON_CONSOLES=1 — шаг Dyson/консолей не запускался.");
  } else if (!runDysonPrisma) {
    console.log(
      "\n[seed-all-catalog] Удалённый API — пропуск Prisma-сида Dyson/консолей.\n" +
        "  На сервере выполните: docker compose exec api node scripts/seed-dyson-consoles.js"
    );
  } else {
    console.log("\n→ Dyson + игровые консоли (Prisma)…");
    const r2 = spawnSync(
      process.execPath,
      [path.join(__dirname, "seed-dyson-consoles.js")],
      {
        cwd: apiDir,
        env: { ...process.env },
        stdio: "inherit",
      }
    );
    if (r2.status !== 0) {
      process.exit(r2.status ?? 1);
    }
  }

  console.log(
    "\nГотово: основной каталог залит" +
      (runDysonPrisma && process.env.SKIP_DYSON_CONSOLES !== "1" ? " + Dyson и консоли" : "") +
      "."
  );
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
