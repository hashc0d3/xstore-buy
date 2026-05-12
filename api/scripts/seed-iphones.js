/**
 * Импорт iPhone-каталога из snifer/output/iphones.json в админку X:STORE.
 *
 * Скрипт читает JSON, сгруппированный по моделям, и через API
 * (POST /api/store/products) создаёт по одному товару на модель iPhone
 * со всеми вариантами (цвет × объём памяти × тип SIM).
 *
 * Использование (порт API по умолчанию 4000):
 *   node scripts/seed-iphones.js
 *   API_URL=http://localhost:4000/api node scripts/seed-iphones.js
 *
 * Фильтры (значения через запятую, регистр не важен):
 *   MODELS_INCLUDE="iPhone Air,iPhone 17 Pro"   импортировать только эти модели
 *   MODELS_EXCLUDE="iPhone 11,iPhone 12"        пропустить эти модели
 *   PRESERVE_EXISTING=1                          не удалять текущие товары категории
 *                                                (нужно вместе с MODELS_INCLUDE, чтобы
 *                                                  обновить/добавить только часть)
 */

const fs = require("fs");
const path = require("path");

const API_URL = process.env.API_URL || "http://localhost:4000/api";
const JSON_PATH =
  process.env.IPHONES_JSON ||
  path.join(__dirname, "..", "..", "snifer", "output", "iphones.json");
const CATEGORY_SLUG = process.env.CATEGORY_SLUG || "iphone";
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1592286927505-1def25115558?w=600&q=80";

function parseFilter(raw) {
  if (!raw) return null;
  const items = String(raw)
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return items.length ? new Set(items) : null;
}

const MODELS_INCLUDE = parseFilter(process.env.MODELS_INCLUDE);
const MODELS_EXCLUDE = parseFilter(process.env.MODELS_EXCLUDE);
const PRESERVE_EXISTING =
  String(process.env.PRESERVE_EXISTING || "").toLowerCase() === "1" ||
  String(process.env.PRESERVE_EXISTING || "").toLowerCase() === "true";

function normalizeMemory(raw) {
  if (!raw) return "";
  const value = String(raw).trim().toUpperCase();
  // 256GB → 256 ГБ, 1TB → 1 ТБ
  const match = value.match(/^(\d+)\s*(GB|TB|ТБ|ГБ)$/);
  if (!match) return value;
  const [, num, unit] = match;
  if (unit === "GB" || unit === "ГБ") return `${num} ГБ`;
  if (unit === "TB" || unit === "ТБ") return `${num} ТБ`;
  return value;
}

function normalizeSim(raw) {
  if (!raw) return "";
  return String(raw).trim();
}

function pickImage(variant) {
  const images = Array.isArray(variant.images) ? variant.images : [];
  const front = images.find((url) => /front\.(png|jpe?g|webp)$/i.test(url));
  return front || images[0] || FALLBACK_IMAGE;
}

function buildDescription(modelEntry, variants) {
  const chars = new Map();
  for (const v of variants) {
    if (v.characteristics && typeof v.characteristics === "object") {
      for (const [k, val] of Object.entries(v.characteristics)) {
        if (!chars.has(k) && val) chars.set(k, val);
      }
    }
  }
  const parts = [];
  parts.push(`${modelEntry.model} — оригинальная техника Apple.`);
  if (chars.size) {
    const items = Array.from(chars.entries()).map(([k, v]) => `${k}: ${v}`);
    parts.push(items.join("; ") + ".");
  }
  const warn = variants.find((v) => v.defect_warning)?.defect_warning;
  if (warn) {
    parts.push(`Особенность: ${warn}.`);
  }
  return parts.join(" ");
}

async function postJson(pathname, body) {
  const url = `${API_URL}${pathname}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`POST ${url} → ${res.status} ${res.statusText}\n${text}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function getJson(pathname) {
  const url = `${API_URL}${pathname}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`GET ${url} → ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function deleteJson(pathname) {
  const url = `${API_URL}${pathname}`;
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok && res.status !== 404) {
    throw new Error(`DELETE ${url} → ${res.status} ${res.statusText}`);
  }
}

function normalizeAvailability(raw) {
  const a = String(raw ?? "unknown")
    .trim()
    .toLowerCase();
  if (
    ["in_stock", "coming_soon", "out_of_stock", "unknown"].includes(a)
  )
    return a;
  return "unknown";
}

async function main() {
  console.log(`API: ${API_URL}`);
  console.log(`JSON: ${JSON_PATH}`);

  if (!fs.existsSync(JSON_PATH)) {
    throw new Error(`Файл с данными iPhone не найден: ${JSON_PATH}`);
  }

  const raw = fs.readFileSync(JSON_PATH, "utf8");
  const models = JSON.parse(raw);
  if (!Array.isArray(models) || !models.length) {
    throw new Error("В iphones.json нет моделей");
  }

  const store = await getJson("/store");
  const existing = (store.products || []).filter(
    (p) => p.categorySlug === CATEGORY_SLUG,
  );

  // По умолчанию очищаем категорию перед импортом, чтобы скрипт был идемпотентен.
  // С PRESERVE_EXISTING=1 ничего не удаляем (нужно вместе с MODELS_INCLUDE,
  // когда правишь только часть моделей).
  if (existing.length && !PRESERVE_EXISTING) {
    if (MODELS_INCLUDE) {
      const targeted = existing.filter((p) =>
        MODELS_INCLUDE.has(String(p.name).trim().toLowerCase()),
      );
      if (targeted.length) {
        console.log(
          `Удаляю ${targeted.length} прежних товаров (только из MODELS_INCLUDE)…`,
        );
        for (const item of targeted) {
          await deleteJson(`/store/products/${item.id}`);
        }
      }
    } else {
      console.log(
        `Удаляю ${existing.length} прежних товаров категории ${CATEGORY_SLUG}…`,
      );
      for (const item of existing) {
        await deleteJson(`/store/products/${item.id}`);
      }
    }
  }

  let createdCount = 0;
  let totalVariants = 0;

  for (const entry of models) {
    const modelKey = String(entry.model || "").trim().toLowerCase();
    if (MODELS_INCLUDE && !MODELS_INCLUDE.has(modelKey)) continue;
    if (MODELS_EXCLUDE && MODELS_EXCLUDE.has(modelKey)) continue;

    const sourceVariants = Array.isArray(entry.variants) ? entry.variants : [];
    if (!sourceVariants.length) continue;

    const variants = [];
    for (const v of sourceVariants) {
      const color = (v.color || "").trim();
      if (!color) continue;
      const memory = normalizeMemory(v.memory);
      const simType = normalizeSim(v.sim ?? "");
      const priceRaw = Number(v.price_rub);
      const price = Number.isFinite(priceRaw) && priceRaw > 0 ? priceRaw : 0;
      variants.push({
        color,
        memory: memory || undefined,
        simType: simType || undefined,
        price,
        imageUrl: pickImage(v),
        availability: normalizeAvailability(v.availability),
      });
    }

    if (!variants.length) continue;

    const basePrice = variants.reduce(
      (min, v) => (v.price > 0 && (min === 0 || v.price < min) ? v.price : min),
      0,
    );

    const firstImage = variants[0].imageUrl;

    const payload = {
      name: entry.model,
      categorySlug: CATEGORY_SLUG,
      color: variants[0].color,
      description: buildDescription(entry, sourceVariants),
      basePrice: basePrice || 0,
      variants,
      imageUrl: firstImage,
    };

    process.stdout.write(`→ ${entry.model} (${variants.length} вариантов)… `);
    try {
      await postJson("/store/products", payload);
      console.log("ок");
      createdCount += 1;
      totalVariants += variants.length;
    } catch (err) {
      console.log("ошибка");
      console.error(err.message);
    }
  }

  console.log("");
  console.log(`Готово. Создано товаров: ${createdCount}, всего вариантов: ${totalVariants}.`);
}

main().catch((err) => {
  console.error("Ошибка импорта:");
  console.error(err);
  process.exit(1);
});
