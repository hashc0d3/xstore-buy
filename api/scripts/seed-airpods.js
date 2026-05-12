/**
 * Импорт AirPods из snifer/output/airpods.json.
 *
 * node scripts/seed-airpods.js
 */

const fs = require("fs");
const path = require("path");

const API_URL = process.env.API_URL || "http://localhost:4000/api";
const JSON_PATH =
  process.env.AIRPODS_JSON ||
  path.join(__dirname, "..", "..", "snifer", "output", "airpods.json");
const CATEGORY_SLUG = process.env.CATEGORY_SLUG || "airpods";
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1606841837239-1875a7bbc98e?w=600&q=80";

const INCLUDE_AVAILABILITY = new Set(
  String(
    process.env.INCLUDE_AVAILABILITY ||
      "in_stock,coming_soon,out_of_stock,unknown",
  )
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
);
const PRESERVE_EXISTING = ["1", "true", "yes"].includes(
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
  return images[0] || FALLBACK_IMAGE;
}

function buildDescription(modelName) {
  return `${modelName} — AirPods.`;
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

  if (!fs.existsSync(JSON_PATH)) {
    throw new Error(`Нет файла: ${JSON_PATH}`);
  }
  const models = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
  if (!Array.isArray(models) || !models.length) {
    throw new Error("В JSON нет моделей");
  }

  if (!PRESERVE_EXISTING) {
    const store = await getJson("/store");
    const existing = (store.products || []).filter(
      (p) => p.categorySlug === CATEGORY_SLUG,
    );
    if (existing.length) {
      console.log(`Удаляю ${existing.length} товаров категории ${CATEGORY_SLUG}…`);
      for (const item of existing) {
        await deleteJson(`/store/products/${item.id}`);
      }
    }
  }

  let created = 0;
  let variantsTotal = 0;

  for (const m of models) {
    const modelName = String(m.model || "").trim();
    if (!modelName) continue;
    const source = Array.isArray(m.variants) ? m.variants : [];
    const byKey = new Map();

    for (const v of source) {
      const av = normalizeAvailability(v.availability);
      if (!INCLUDE_AVAILABILITY.has(av)) continue;

      const color = String(v.color || "Стандарт").trim() || "Стандарт";
      const price = Number.isFinite(Number(v.price_rub))
        ? Math.max(0, Number(v.price_rub))
        : 0;
      const key = `${color}|${v.url || ""}`;
      const entry = {
        color,
        price,
        imageUrl: pickImage(v),
        availability: av,
      };
      const ex = byKey.get(key);
      if (!ex) byKey.set(key, entry);
      else if (
        rankAv(av) < rankAv(ex.availability) ||
        (rankAv(av) === rankAv(ex.availability) &&
          price > 0 &&
          (ex.price === 0 || price < ex.price))
      )
        byKey.set(key, entry);
    }

    if (!byKey.size) continue;
    const variants = [...byKey.values()];
    const priced = variants.filter((x) => x.price > 0).map((x) => x.price);
    const basePrice = priced.length ? Math.min(...priced) : 0;

    const payload = {
      name: modelName,
      categorySlug: CATEGORY_SLUG,
      color: variants[0].color,
      description: buildDescription(modelName),
      basePrice,
      variants,
      imageUrl: variants[0].imageUrl,
    };

    process.stdout.write(`→ ${modelName} (${variants.length} вар.)… `);
    try {
      await postJson("/store/products", payload);
      console.log("ок");
      created += 1;
      variantsTotal += variants.length;
    } catch (err) {
      console.log("ошибка");
      console.error(err.message);
    }
  }

  console.log("");
  console.log(`Готово. Товаров: ${created}, вариантов: ${variantsTotal}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
