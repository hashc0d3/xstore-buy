/**
 * Категории Dyson и «Игровые консоли» (slug: dyson, consoles) + товары.
 * Данные по названиям и ценам с публичной витрины glushakov-official.ru
 * (разделы /catalog/dyson и /catalog/consoles) — только для первичного наполнения;
 * перед продом сверьте актуальные цены.
 *
 * Не трогает товары других категорий. По умолчанию заменяет только товары в dyson + consoles.
 *
 * Из каталога api/:
 *   node scripts/seed-dyson-consoles.js
 *
 * На сервере в контейнере API (БД та же, что у Prisma):
 *   docker compose exec api node scripts/seed-dyson-consoles.js
 *
 * Локально с файлом БД:
 *   DATABASE_URL="file:./prisma/dev.db" node scripts/seed-dyson-consoles.js
 */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const IMG_DYSON =
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=85";
const IMG_CONSOLE =
  "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&q=85";

/** @type {Array<{ name: string; basePrice: number; variants: Array<{ color: string; price: number }>; imageUrl?: string }>} */
const DYSON = [
  {
    name: "Стайлер Straight+Wavy Long HS08",
    basePrice: 38_990,
    imageUrl: IMG_DYSON,
    variants: [
      { color: "Vinca Blue Topaz", price: 38_990 },
      { color: "Ceramic Patina", price: 38_990 },
      { color: "Ceramic Pink", price: 38_990 },
      { color: "Red Velvet", price: 38_990 },
      { color: "Jasper Plum", price: 38_990 }
    ]
  },
  {
    name: "Стайлер HS09 Multi and Dryer",
    basePrice: 57_990,
    imageUrl: IMG_DYSON,
    variants: [
      { color: "Ceramic Pink", price: 57_990 },
      { color: "Jasper Plum", price: 57_990 },
      { color: "Apricot Topaz", price: 57_990 },
      { color: "Red Velvet", price: 57_990 }
    ]
  },
  {
    name: "Пылесос Dyson V12S Slim Submarine",
    basePrice: 55_990,
    imageUrl: IMG_DYSON,
    variants: [{ color: "Yellow/Nickel", price: 55_990 }]
  },
  {
    name: "Пылесос Dyson V12 Slim Absolute",
    basePrice: 44_990,
    imageUrl: IMG_DYSON,
    variants: [{ color: "Yellow/Nickel", price: 44_990 }]
  },
  {
    name: "Пылесос Dyson V15S Submarine",
    basePrice: 60_990,
    imageUrl: IMG_DYSON,
    variants: [{ color: "Yellow/Nickel", price: 60_990 }]
  },
  {
    name: "Пылесос Dyson V15 SV47",
    basePrice: 53_990,
    imageUrl: IMG_DYSON,
    variants: [{ color: "Yellow/Nickel", price: 53_990 }]
  },
  {
    name: "Пылесос Dyson Gen5 Absolute",
    basePrice: 59_990,
    imageUrl: IMG_DYSON,
    variants: [{ color: "Бронза/Синий", price: 59_990 }]
  },
  {
    name: "Пылесос Dyson V16S Piston SV53A",
    basePrice: 83_990,
    imageUrl: IMG_DYSON,
    variants: [{ color: "Black/Copper", price: 83_990 }]
  },
  {
    name: "Пылесос Dyson V16 Piston Animal SV53",
    basePrice: 71_990,
    imageUrl: IMG_DYSON,
    variants: [{ color: "Black/Copper", price: 71_990 }]
  },
  {
    name: "Пылесос Dyson V8 Advanced SV25",
    basePrice: 38_990,
    imageUrl: IMG_DYSON,
    variants: [{ color: "Silver/Nickel", price: 38_990 }]
  },
  {
    name: "Пылесос Dyson PencilVac Fluffycone Black",
    basePrice: 57_990,
    imageUrl: IMG_DYSON,
    variants: [{ color: "Black", price: 57_990 }]
  }
];

/** @type {Array<{ name: string; basePrice: number; variants: Array<{ color: string; price: number }>; imageUrl?: string }>} */
const CONSOLES = [
  {
    name: "Геймпад на PS 5",
    basePrice: 7_490,
    imageUrl: IMG_CONSOLE,
    variants: [
      { color: "White", price: 7_490 },
      { color: "Black", price: 7_490 },
      { color: "Blue", price: 7_490 }
    ]
  },
  {
    name: "Sony PlayStation 5 digital 1TB J/A",
    basePrice: 46_990,
    imageUrl: IMG_CONSOLE,
    variants: [{ color: "White", price: 46_990 }]
  },
  {
    name: "Sony PlayStation 5 slim 1TB J/A",
    basePrice: 54_390,
    imageUrl: IMG_CONSOLE,
    variants: [{ color: "White", price: 54_390 }]
  },
  {
    name: "Sony PlayStation 5 slim 1TB EU",
    basePrice: 56_990,
    imageUrl: IMG_CONSOLE,
    variants: [{ color: "White", price: 56_990 }]
  },
  {
    name: "Sony PlayStation 5 pro 2TB J/A",
    basePrice: 78_990,
    imageUrl: IMG_CONSOLE,
    variants: [{ color: "White", price: 78_990 }]
  }
];

function variantsJson(rows, imageUrl) {
  return {
    variants: rows.map((v) => ({
      color: v.color,
      price: v.price,
      imageUrl,
      availability: "in_stock"
    }))
  };
}

async function main() {
  console.log("[seed-dyson-consoles] DATABASE_URL =", process.env.DATABASE_URL || "(from prisma schema default)");

  await prisma.category.upsert({
    where: { slug: "dyson" },
    create: {
      slug: "dyson",
      name: "Dyson",
      imageUrl: IMG_DYSON,
      memoryOptions: null
    },
    update: {
      name: "Dyson",
      imageUrl: IMG_DYSON
    }
  });

  await prisma.category.upsert({
    where: { slug: "consoles" },
    create: {
      slug: "consoles",
      name: "Игровые консоли",
      imageUrl: IMG_CONSOLE,
      memoryOptions: null
    },
    update: {
      name: "Игровые консоли",
      imageUrl: IMG_CONSOLE
    }
  });

  const del = await prisma.product.deleteMany({
    where: {
      category: {
        slug: { in: ["dyson", "consoles"] }
      }
    }
  });
  console.log(`[seed-dyson-consoles] Удалено старых товаров dyson/consoles: ${del.count}`);

  const dysonCat = await prisma.category.findUnique({ where: { slug: "dyson" } });
  const conCat = await prisma.category.findUnique({ where: { slug: "consoles" } });
  if (!dysonCat || !conCat) throw new Error("Категории не найдены после upsert");

  let n = 0;
  for (const item of DYSON) {
    const img = item.imageUrl || IMG_DYSON;
    await prisma.product.create({
      data: {
        categoryId: dysonCat.id,
        name: item.name,
        color: item.variants[0]?.color ?? null,
        description: `${item.name} — оригинальная техника Dyson.`,
        basePrice: item.basePrice,
        imageUrl: img,
        memoryPrices: variantsJson(item.variants, img)
      }
    });
    n += 1;
  }

  for (const item of CONSOLES) {
    const img = item.imageUrl || IMG_CONSOLE;
    await prisma.product.create({
      data: {
        categoryId: conCat.id,
        name: item.name,
        color: item.variants[0]?.color ?? null,
        description: `${item.name} — игровые консоли и аксессуары.`,
        basePrice: item.basePrice,
        imageUrl: img,
        memoryPrices: variantsJson(item.variants, img)
      }
    });
    n += 1;
  }

  console.log(`[seed-dyson-consoles] Создано товаров: ${n} (Dyson: ${DYSON.length}, консоли: ${CONSOLES.length})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
