/**
 * Категории Dyson и «Игровые консоли» (slug: dyson, consoles) + товары.
 * Картинки — публичные URL с glushakov-official.ru (каталоги /catalog/dyson и /catalog/consoles).
 * Не трогает товары других категорий. По умолчанию заменяет только товары в dyson + consoles.
 *
 *   node scripts/seed-dyson-consoles.js
 *   docker compose exec api node scripts/seed-dyson-consoles.js
 */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/** @param {string} path путь от корня сайта, например /img/dyson/... */
function gl(path) {
  return "https://www.glushakov-official.ru" + encodeURI(path);
}

const IMG_CAT_DYSON = gl("/img/dyson/styler_hs08/vinca_blue_topaz/front.webp");
const IMG_CAT_CONSOLES = gl("/img/consoles/ps5/1.jpg");

const IMG_GAMEPAD = gl("/img/consoles/gamepadps5/white/1.jpg");
const IMG_PS5 = gl("/img/consoles/ps5/1.jpg");

/** @type {Array<{ name: string; basePrice: number; variants: Array<{ color: string; price: number }>; imageUrl: string }>} */
const DYSON = [
  {
    name: "Стайлер Straight+Wavy Long HS08",
    basePrice: 38_990,
    imageUrl: gl("/img/dyson/styler_hs08/vinca_blue_topaz/front.webp"),
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
    imageUrl: gl("/img/dyson/styler_hs09/ceramic_pink/front.jpg"),
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
    imageUrl: gl("/img/dyson/vcleaner/v12slim_submarine/front.webp"),
    variants: [{ color: "Yellow/Nickel", price: 55_990 }]
  },
  {
    name: "Пылесос Dyson V12 Slim Absolute",
    basePrice: 44_990,
    imageUrl: gl("/img/dyson/vcleaner/v12slim_absolute/front.jpeg"),
    variants: [{ color: "Yellow/Nickel", price: 44_990 }]
  },
  {
    name: "Пылесос Dyson V15S Submarine",
    basePrice: 60_990,
    imageUrl: gl("/img/dyson/vcleaner/v15s_submarine/V15 Submarine.webp"),
    variants: [{ color: "Yellow/Nickel", price: 60_990 }]
  },
  {
    name: "Пылесос Dyson V15 SV47",
    basePrice: 53_990,
    imageUrl: gl("/img/dyson/vcleaner/v15_sv47/V15 SV47.webp"),
    variants: [{ color: "Yellow/Nickel", price: 53_990 }]
  },
  {
    name: "Пылесос Dyson Gen5 Absolute",
    basePrice: 59_990,
    imageUrl: gl("/img/dyson/vcleaner/gen5/Gen5.webp"),
    variants: [{ color: "Бронза/Синий", price: 59_990 }]
  },
  {
    name: "Пылесос Dyson V16S Piston SV53A",
    basePrice: 83_990,
    imageUrl: gl("/img/dyson/vcleaner/v16piston_sv53a/front.webp"),
    variants: [{ color: "Black/Copper", price: 83_990 }]
  },
  {
    name: "Пылесос Dyson V16 Piston Animal SV53",
    basePrice: 71_990,
    imageUrl: gl("/img/dyson/vcleaner/v16piston_animal_sv53/front.webp"),
    variants: [{ color: "Black/Copper", price: 71_990 }]
  },
  {
    name: "Пылесос Dyson - V8 Advanced SV25",
    basePrice: 38_990,
    imageUrl: gl("/img/dyson/vcleaner/v8advanced/front.webp"),
    variants: [{ color: "Silver/Nickel", price: 38_990 }]
  },
  {
    name: "Пылесос Dyson PencilVac Fluffycone Black",
    basePrice: 57_990,
    imageUrl: gl("/img/dyson/vcleaner/pencilvac_fluffyblack/front.png"),
    variants: [{ color: "Black", price: 57_990 }]
  }
];

/** @type {Array<{ name: string; basePrice: number; variants: Array<{ color: string; price: number }>; imageUrl: string }>} */
const CONSOLES = [
  {
    name: "Геймпад на PS 5",
    basePrice: 7_490,
    imageUrl: IMG_GAMEPAD,
    variants: [
      { color: "White", price: 7_490 },
      { color: "Black", price: 7_490 },
      { color: "Blue", price: 7_490 }
    ]
  },
  {
    name: "Sony PlayStation 5 digital 1TB J/A",
    basePrice: 46_990,
    imageUrl: IMG_PS5,
    variants: [{ color: "White", price: 46_990 }]
  },
  {
    name: "Sony PlayStation 5 slim 1TB J/A",
    basePrice: 54_390,
    imageUrl: IMG_PS5,
    variants: [{ color: "White", price: 54_390 }]
  },
  {
    name: "Sony PlayStation 5 slim 1TB EU",
    basePrice: 56_990,
    imageUrl: IMG_PS5,
    variants: [{ color: "White", price: 56_990 }]
  },
  {
    name: "Sony PlayStation 5 pro 2TB J/A",
    basePrice: 78_990,
    imageUrl: IMG_PS5,
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
      imageUrl: IMG_CAT_DYSON,
      memoryOptions: null
    },
    update: {
      imageUrl: IMG_CAT_DYSON
    }
  });

  await prisma.category.upsert({
    where: { slug: "consoles" },
    create: {
      slug: "consoles",
      name: "Игровые консоли",
      imageUrl: IMG_CAT_CONSOLES,
      memoryOptions: null
    },
    update: {
      imageUrl: IMG_CAT_CONSOLES
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
    const img = item.imageUrl;
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
    const img = item.imageUrl;
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
