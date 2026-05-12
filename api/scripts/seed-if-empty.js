/**
 * Один раз заливает каталог из CATALOG_ROOT, если в SQLite ещё нет товаров.
 * Вызывается из docker-entrypoint.sh при AUTO_SEED_CATALOG=1.
 */
const { PrismaClient } = require("@prisma/client");
const { spawnSync } = require("child_process");
const path = require("path");

const prisma = new PrismaClient();

(async () => {
  try {
    const count = await prisma.product.count();
    if (count > 0) {
      console.log(`[seed-if-empty] Пропуск: в БД уже ${count} товар(ов).`);
      process.exit(0);
    }
    console.log("[seed-if-empty] БД пустая — seed:catalog из", process.env.CATALOG_ROOT || "(default)");
    const apiDir = path.join(__dirname, "..");
    const r = spawnSync(process.execPath, [path.join(__dirname, "seed-all-catalog.js")], {
      cwd: apiDir,
      env: process.env,
      stdio: "inherit"
    });
    process.exit(r.status === null ? 1 : r.status);
  } catch (e) {
    console.error("[seed-if-empty]", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
