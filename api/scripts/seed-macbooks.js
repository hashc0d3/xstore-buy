/**
 * Импорт каталога MacBook из snifer/output/macbooks.json в админку X:STORE.
 *
 * Один товар в админке = одна модель MacBook (например, "MacBook Air M4"),
 * с четырьмя измерениями вариантов: цвет / диагональ / накопитель / RAM.
 * По умолчанию импортируются все статусы наличия из JSON (в т.ч. «скоро»).
 *
 * Запуск (порт API по умолчанию 4000):
 *   node scripts/seed-macbooks.js
 *
 * Переменные окружения:
 *   API_URL=http://localhost:4000/api
 *   MACBOOKS_JSON=C:/Users/jasper/Documents/snifer/output/macbooks.json
 *   CATEGORY_SLUG=macbook
 *   INCLUDE_AVAILABILITY=in_stock        по умолчанию — in_stock,coming_soon,out_of_stock,unknown
 *   PRESERVE_EXISTING=1                  не удалять прежние товары категории
 */

const fs = require("fs");
const path = require("path");

const API_URL = process.env.API_URL || "http://localhost:4000/api";
const JSON_PATH =
  process.env.MACBOOKS_JSON ||
  path.join(__dirname, "..", "..", "snifer", "output", "macbooks.json");
const CATEGORY_SLUG = process.env.CATEGORY_SLUG || "macbook";
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?w=600&q=80";

const INCLUDE_AVAILABILITY = new Set(
  String(
    process.env.INCLUDE_AVAILABILITY ||
      "in_stock,coming_soon,out_of_stock,unknown",
  )
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
);
const PRESERVE_EXISTING =
  ["1", "true", "yes"].includes(
    String(process.env.PRESERVE_EXISTING || "").toLowerCase(),
  );

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

function rankAv(a) {
  const o = { in_stock: 0, coming_soon: 1, out_of_stock: 2, unknown: 3 };
  return o[a] ?? 3;
}

function pickImage(variant) {
  const images = Array.isArray(variant.images) ? variant.images : [];
  const front = images.find((url) => /front\.(png|jpe?g|webp)$/i.test(url));
  return front || images[0] || FALLBACK_IMAGE;
}

function buildDescription(modelName, modelVariants) {
  const chars = new Map();
  for (const v of modelVariants) {
    if (v.characteristics && typeof v.characteristics === "object") {
      for (const [k, val] of Object.entries(v.characteristics)) {
        if (!chars.has(k) && val) chars.set(k, val);
      }
    }
  }
  const parts = [];
  parts.push(`${modelName} — оригинальная техника Apple.`);
  if (chars.size) {
    const items = Array.from(chars.entries()).map(([k, v]) => `${k}: ${v}`);
    parts.push(items.join("; ") + ".");
  }
  const warn = modelVariants.find((v) => v.defect_warning)?.defect_warning;
  if (warn) parts.push(`Особенность: ${warn}.`);
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
  const res = await fetch(`${API_URL}${pathname}`);
  if (!res.ok) {
    throw new Error(`GET ${pathname} → ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function deleteJson(pathname) {
  const res = await fetch(`${API_URL}${pathname}`, { method: "DELETE" });
  if (!res.ok && res.status !== 404) {
    throw new Error(`DELETE ${pathname} → ${res.status} ${res.statusText}`);
  }
}

async function main() {
  console.log(`API: ${API_URL}`);
  console.log(`JSON: ${JSON_PATH}`);
  console.log(`Категория: ${CATEGORY_SLUG}`);
  console.log(`Импортируем availability: ${Array.from(INCLUDE_AVAILABILITY).join(", ")}`);

  if (!fs.existsSync(JSON_PATH)) {
    throw new Error(`Файл с данными MacBook не найден: ${JSON_PATH}`);
  }

  const models = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
  if (!Array.isArray(models) || !models.length) {
    throw new Error("В macbooks.json нет моделей");
  }

  if (!PRESERVE_EXISTING) {
    const store = await getJson("/store");
    const existing = (store.products || []).filter(
      (p) => p.categorySlug === CATEGORY_SLUG,
    );
    if (existing.length) {
      console.log(`Удаляю ${existing.length} прежних товаров категории ${CATEGORY_SLUG}…`);
      for (const item of existing) {
        await deleteJson(`/store/products/${item.id}`);
      }
    }
  }

  // Группировка только по имени модели (например, "MacBook Air M4").
  // Цвет / диагональ / накопитель / RAM становятся вариантами одного товара.
  const modelGroups = new Map();
  for (const m of models) {
    for (const v of m.variants || []) {
      const modelName = String(v.model || m.model || "").trim();
      if (!modelName) continue;
      const av = normalizeAvailability(v.availability);
      if (!INCLUDE_AVAILABILITY.has(av)) continue;
      if (!modelGroups.has(modelName)) {
        modelGroups.set(modelName, { allItems: [], filteredItems: [] });
      }
      modelGroups.get(modelName).filteredItems.push(v);
    }
    for (const v of m.variants || []) {
      const modelName = String(v.model || m.model || "").trim();
      if (modelName && modelGroups.has(modelName)) {
        modelGroups.get(modelName).allItems.push(v);
      }
    }
  }

  if (!modelGroups.size) {
    console.log("Нет SKU, подходящих под фильтр availability — нечего импортировать.");
    return;
  }

  console.log(`Будет создано товаров (моделей): ${modelGroups.size}`);

  let createdCount = 0;
  let totalVariants = 0;

  for (const [modelName, group] of modelGroups) {
    // Дедупликация по (color + screen + memory + ram); если одинаковое SKU встретилось дважды,
    // берём первое (но фиксируем минимальную цену, чтобы при разных ценах для одной комбинации
    // отображалась корректная минимальная).
    const byKey = new Map();
    for (const v of group.filteredItems) {
      const color = (v.color || "").trim();
      const screen = (v.screen || "").trim();
      const storage = (v.storage || "").trim();
      const ram = (v.ram || "").trim();
      if (!color) continue;
      const priceRaw = Number(v.price_rub);
      const price =
        Number.isFinite(priceRaw) && priceRaw >= 0 ? Math.floor(priceRaw) : 0;
      const key = `${color}|${screen}|${storage}|${ram}`;
      const av = normalizeAvailability(v.availability);
      const entry = {
        color,
        screen: screen || undefined,
        memory: storage || undefined,
        ram: ram || undefined,
        price,
        imageUrl: pickImage(v),
        availability: av,
      };
      const existing = byKey.get(key);
      if (!existing) byKey.set(key, entry);
      else if (
        rankAv(av) < rankAv(existing.availability) ||
        (rankAv(av) === rankAv(existing.availability) &&
          price > 0 &&
          (existing.price === 0 || price < existing.price))
      )
        byKey.set(key, entry);
    }

    if (!byKey.size) continue;

    const variants = Array.from(byKey.values());
    const priced = variants.map((v) => v.price).filter((p) => p > 0);
    const basePrice = priced.length ? Math.min(...priced) : 0;
    const firstImage = variants[0].imageUrl;

    const payload = {
      name: modelName,
      categorySlug: CATEGORY_SLUG,
      color: variants[0].color,
      description: buildDescription(modelName, group.allItems.length ? group.allItems : group.filteredItems),
      basePrice,
      variants,
      imageUrl: firstImage,
    };

    process.stdout.write(`→ ${modelName} (${variants.length} конф., от ${basePrice || 0} RUB)… `);
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
  console.log(
    `Готово. Создано товаров: ${createdCount}, всего конфигураций: ${totalVariants}.`,
  );
}

main().catch((err) => {
  console.error("Ошибка импорта:");
  console.error(err);
  process.exit(1);
});
