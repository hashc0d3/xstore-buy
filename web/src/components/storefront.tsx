"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createLead, fetchStoreData } from "@/lib/api";
import { Category, Product, StoreData, defaultStoreData, toRub } from "@/lib/store";

const IPHONE_LIKE_SLUGS = new Set(["iphone", "iphone-used"]);

function isIphoneLikeSlug(slug: string | undefined): boolean {
  return Boolean(slug && IPHONE_LIKE_SLUGS.has(slug));
}

type ModalType = "tradein" | "reviews" | "order" | "product" | "preorder" | null;
type CartItem = {
  key: string;
  productId: string;
  name: string;
  color?: string;
  memory?: string;
  simType?: string;
  price: number;
  imageUrl: string;
  quantity: number;
};

const CART_STORAGE_KEY = "xstore-cart-v1";

function persistCartItems(items: CartItem[]) {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

const quickLinks = [
  "Каталог",
  "Trade-in",
  "Выкуп",
  "Отзывы",
  "Статьи",
  "Доставка и оплата",
  "Возврат и обмен",
  "Гарантия и проверка"
];

function Modal({
  title,
  subtitle,
  children,
  iconSrc,
  iconAlt,
  hideBadge,
  noScroll,
  onClose
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  iconSrc?: string;
  iconAlt?: string;
  hideBadge?: boolean;
  noScroll?: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 min-[640px]:p-4" onClick={onClose}>
      <div
        className={`relative w-full rounded-3xl bg-white shadow-2xl ${
          noScroll ? "max-h-[96vh] overflow-visible p-4 min-[640px]:p-5" : "max-h-[92vh] overflow-y-auto p-5 min-[640px]:p-6"
        } ${noScroll ? "max-w-3xl" : "max-w-md"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-xl text-zinc-400 transition hover:text-zinc-700"
        >
          ×
        </button>
        {hideBadge
          ? null
          : iconSrc ? (
              <span className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={iconSrc} alt={iconAlt ?? ""} className="h-4 w-4" />
              </span>
            ) : (
              <div className="mb-4 h-8 w-8 rounded-full bg-zinc-100" />
            )}
        <h3 className={`${noScroll ? "mb-1 text-xl min-[640px]:text-2xl" : "mb-2 text-lg min-[640px]:text-2xl"} font-semibold text-zinc-900`}>{title}</h3>
        <p className={`${noScroll ? "mb-3 text-xs leading-5 min-[640px]:text-sm" : "mb-5 text-sm leading-6"} text-zinc-500`}>{subtitle}</p>
        {children}
      </div>
    </div>
  );
}

function CategoryCard({ category, onPodZakaz }: { category: Category; onPodZakaz?: () => void }) {
  const isDark = category.slug === "custom";
  const imageCandidatesBySlug: Record<string, string[]> = {
    iphone: ["/iphone.png", "/iphone.jpg", "/iphone.webp", "/image.png"],
    "iphone-used": ["/iphone.png", "/iphone.jpg", "/iphone.webp", "/image.png"],
    macbook: ["/macbook.png", "/macbook.jpg", "/macbook.webp"],
    "apple-watch": ["/applewatch.png", "/watch.png", "/watch.jpg", "/watch.webp"],
    ipad: ["/ipad.png", "/ipad.jpg", "/ipad.webp"],
    airpods: ["/airpods.png", "/airpods.jpg", "/airpods.webp"],
    custom: ["/zakaz.png", "/custom.png", "/custom.jpg", "/custom.webp"]
  };
  const candidates = imageCandidatesBySlug[category.slug] ?? [];
  const [imageIdx, setImageIdx] = useState(0);
  const imageSrc = candidates[imageIdx];
  const imagePlacementBySlug: Record<string, string> = {
    iphone: "right-[-8%] top-1/2 h-[96%] -translate-y-1/2",
    "iphone-used": "right-[-8%] top-1/2 h-[96%] -translate-y-1/2",
    macbook: "right-[-6%] top-1/2 h-[90%] -translate-y-1/2",
    "apple-watch": "right-[-4%] top-1/2 h-[86%] -translate-y-1/2",
    ipad: "right-[-4%] top-1/2 h-[96%] -translate-y-1/2",
    airpods: "right-[-4%] top-1/2 h-[86%] -translate-y-1/2",
    custom: "right-[-4%] top-1/2 h-[94%] -translate-y-1/2"
  };
  const imagePlacement = imagePlacementBySlug[category.slug] ?? "right-[-4%] top-1/2 h-[90%] -translate-y-1/2";

  const cardClass = `group relative h-[74px] min-w-0 overflow-hidden rounded-xl border border-zinc-200 p-1.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md min-[480px]:h-[88px] min-[640px]:h-[108px] min-[960px]:h-[132px] min-[960px]:rounded-2xl min-[960px]:p-3 ${
    isDark ? "bg-zinc-900" : "bg-[#f6f6f7]"
  }`;

  const inner = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icon/catalog.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-1.5 top-1.5 h-2.5 w-2.5 min-[640px]:h-3 min-[640px]:w-3 min-[960px]:left-3 min-[960px]:top-3 min-[960px]:h-3.5 min-[960px]:w-3.5"
      />
      {imageSrc ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt={category.name}
            className={`pointer-events-none absolute w-auto object-contain min-[640px]:h-[98%] ${imagePlacement} ${
              isDark ? "opacity-95" : "opacity-100"
            }`}
            onError={() => setImageIdx((idx) => (idx + 1 < candidates.length ? idx + 1 : idx))}
          />
          {!isDark ? <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-black/[0.02]" /> : null}
        </>
      ) : null}
      <h3 className={`absolute bottom-1.5 left-1.5 max-w-[82%] text-[11px] font-bold leading-none min-[480px]:text-xs min-[640px]:text-sm min-[900px]:text-base min-[960px]:bottom-3 min-[960px]:left-3 min-[1440px]:text-xl ${isDark ? "text-white" : "text-zinc-800"}`}>
        {category.name}
      </h3>
    </>
  );

  if (category.slug === "custom" && onPodZakaz) {
    return (
      <button type="button" onClick={onPodZakaz} className={`${cardClass} block w-full cursor-pointer text-left`}>
        {inner}
      </button>
    );
  }

  return (
    <Link href={`/catalog/${category.slug}`} className={cardClass}>
      {inner}
    </Link>
  );
}

function ProductCard({
  product,
  category,
  onOrder,
  onAddToCart,
  onOpenDetails
}: {
  product: Product;
  category?: Category;
  onOrder: (selection: { color?: string; memory?: string; simType?: string }) => void;
  onAddToCart: (selection: { color?: string; memory?: string; simType?: string; price: number; imageUrl: string }) => void;
  onOpenDetails: (selection: { color?: string; memory?: string; simType?: string }) => void;
}) {
  const isIphoneCategory = isIphoneLikeSlug(category?.slug);
  const variants = useMemo(() => product.variants ?? [], [product.variants]);
  const hasVariants = variants.length > 0;
  const colorOptions = useMemo(
    () =>
      hasVariants
        ? Array.from(new Set(variants.map((item) => item.color).filter((item): item is string => Boolean(item))))
        : product.color
          ? [product.color]
          : [],
    [hasVariants, product.color, variants]
  );
  const [selectedColor, setSelectedColor] = useState<string>(() => {
    if (colorOptions.length === 0) return "";
    if (product.color && colorOptions.includes(product.color)) return product.color;
    return colorOptions[0] ?? "";
  });
  const colorScopedVariants = hasVariants
    ? variants.filter((item) => !selectedColor || item.color === selectedColor)
    : [];
  const allMemoryOptions = hasVariants && isIphoneCategory
    ? Array.from(new Set(colorScopedVariants.map((item) => item.memory).filter((item): item is string => Boolean(item))))
    : [];
  const allSimOptions = hasVariants && isIphoneCategory
    ? Array.from(new Set(colorScopedVariants.map((item) => item.simType).filter((item): item is string => Boolean(item))))
    : [];
  const [selectedMemory, setSelectedMemory] = useState<string>(() => {
    if (hasVariants && isIphoneCategory) return allMemoryOptions[0] ?? "";
    return "";
  });
  const [selectedSim, setSelectedSim] = useState<string>(() => allSimOptions[0] ?? "");
  const memoryScopedVariants = hasVariants && isIphoneCategory
    ? colorScopedVariants.filter((item) => !selectedSim || item.simType === selectedSim)
    : colorScopedVariants;
  const simScopedVariants = hasVariants && isIphoneCategory
    ? colorScopedVariants.filter((item) => !selectedMemory || item.memory === selectedMemory)
    : colorScopedVariants;
  const memoryOptions = hasVariants && isIphoneCategory
    ? Array.from(new Set(memoryScopedVariants.map((item) => item.memory).filter((item): item is string => Boolean(item))))
    : [];
  const simOptions = hasVariants && isIphoneCategory
    ? Array.from(new Set(simScopedVariants.map((item) => item.simType).filter((item): item is string => Boolean(item))))
    : [];

  const activeVariant = useMemo(() => {
    if (!hasVariants) return null;
    if (!isIphoneCategory) {
      return (
        variants.find((item) => (!selectedColor || item.color === selectedColor)) ??
        variants[0]
      );
    }
    return (
      variants.find(
        (item) =>
          (!selectedColor || item.color === selectedColor) &&
          (!selectedMemory || item.memory === selectedMemory) &&
          (!selectedSim || item.simType === selectedSim)
      ) ??
      variants.find((item) => (!selectedColor || item.color === selectedColor) && (!selectedMemory || item.memory === selectedMemory)) ??
      variants.find((item) => (!selectedColor || item.color === selectedColor)) ??
      variants[0]
    );
  }, [hasVariants, isIphoneCategory, selectedColor, selectedMemory, selectedSim, variants]);

  const shownPrice = activeVariant?.price ?? product.basePrice;
  const currentImage = activeVariant?.imageUrl ?? product.imageUrl;

  const colorLabel = product.color ?? "";
  const normalizedColor = (selectedColor || colorLabel).toLowerCase();
  const colorDotClass = normalizedColor.includes("orange")
    ? "bg-orange-400"
    : normalizedColor.includes("silver") || normalizedColor.includes("white")
      ? "bg-zinc-400"
      : normalizedColor.includes("blue")
        ? "bg-slate-600"
        : normalizedColor.includes("purple")
          ? "bg-violet-500"
          : normalizedColor.includes("black") || normalizedColor.includes("midnight")
            ? "bg-zinc-800"
            : normalizedColor.includes("gold") || normalizedColor.includes("starlight")
              ? "bg-amber-400"
              : "bg-zinc-500";
  return (
    <article
      className="flex h-full w-full cursor-pointer flex-col rounded-xl border border-zinc-200 bg-[#f9f9fa] p-1.5 shadow-[0_4px_12px_rgba(24,24,27,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(24,24,27,0.1)] min-[640px]:max-w-[260px] min-[640px]:justify-self-start min-[640px]:rounded-2xl min-[640px]:p-2 min-[960px]:max-w-none min-[960px]:justify-self-stretch"
      onClick={() =>
        onOpenDetails({
          color: selectedColor || undefined,
          memory: selectedMemory || undefined,
          simType: selectedSim || undefined
        })
      }
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenDetails({
            color: selectedColor || undefined,
            memory: selectedMemory || undefined,
            simType: selectedSim || undefined
          });
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Открыть описание товара ${product.name}`}
    >
      <div className="overflow-hidden rounded-xl bg-white min-[640px]:rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentImage}
          alt={product.name}
          className="h-[7.5rem] w-full object-contain p-1 transition-opacity duration-300 min-[640px]:h-[8.5rem]"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-2 min-[640px]:p-2.5">
        <h4 className="mt-1 line-clamp-1 text-base font-bold leading-tight text-zinc-900 min-[480px]:text-lg min-[960px]:text-xl">
          {product.name}
        </h4>
        {colorOptions.length > 0 ? (
          <div className="space-y-1">
            <p className="text-xs text-zinc-500">Цвет</p>
            <div className="flex flex-wrap gap-1">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold transition min-[640px]:px-2 min-[640px]:text-[11px] ${
                    selectedColor === color ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedColor(color);
                    if (hasVariants && isIphoneCategory) {
                      const scoped = variants.filter((item) => item.color === color);
                      const fallback =
                        scoped.find(
                          (item) =>
                            (!selectedMemory || item.memory === selectedMemory) &&
                            (!selectedSim || item.simType === selectedSim)
                        ) ??
                        scoped.find((item) => !selectedMemory || item.memory === selectedMemory) ??
                        scoped[0];
                      setSelectedMemory(fallback?.memory ?? "");
                      setSelectedSim(fallback?.simType ?? "");
                    }
                  }}
                >
                  {color}
                </button>
              ))}
            </div>
            {!hasVariants ? (
              <p className="flex items-center justify-between text-xs text-zinc-600 min-[640px]:text-sm">
                <span>{selectedColor || product.color}</span>
                <span className={`inline-block h-2 w-2 rounded-full ${colorDotClass}`} />
              </p>
            ) : null}
          </div>
        ) : null}
        {memoryOptions.length > 0 ? (
          <div className="space-y-1">
            <p className="text-xs text-zinc-500">Объем</p>
            <div className="flex flex-wrap gap-1">
              {memoryOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold transition min-[640px]:px-2 min-[640px]:text-[11px] ${
                    selectedMemory === option
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMemory(option);
                    const fallback =
                      colorScopedVariants.find((item) => item.memory === option && (!selectedSim || item.simType === selectedSim)) ??
                      colorScopedVariants.find((item) => item.memory === option);
                    setSelectedSim(fallback?.simType ?? "");
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {simOptions.length > 0 ? (
          <div className="space-y-1">
            <p className="text-xs text-zinc-500">SIM</p>
            <div className="flex flex-wrap gap-1">
              {simOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold transition min-[640px]:px-2 min-[640px]:text-[11px] ${
                    selectedSim === option ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSim(option);
                    const fallback =
                      colorScopedVariants.find((item) => item.simType === option && (!selectedMemory || item.memory === selectedMemory)) ??
                      colorScopedVariants.find((item) => item.simType === option);
                    setSelectedMemory(fallback?.memory ?? "");
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <div className="mt-auto space-y-2">
          <p className="text-base font-bold text-zinc-900 min-[480px]:text-lg min-[960px]:text-xl">от {toRub(shownPrice)}</p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOrder({
                color: selectedColor || undefined,
                memory: selectedMemory || undefined,
                simType: selectedSim || undefined
              });
            }}
            className="w-full rounded-lg border border-red-100 bg-[#fdecec] py-1.5 text-xs font-semibold text-red-500 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-900 hover:bg-zinc-900 hover:text-white hover:shadow-[0_10px_24px_rgba(24,24,27,0.25)] min-[640px]:text-sm"
          >
            Заказать
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart({
                color: selectedColor || undefined,
                memory: selectedMemory || undefined,
                simType: selectedSim || undefined,
                price: shownPrice,
                imageUrl: currentImage
              });
            }}
            className="w-full rounded-lg border border-zinc-200 bg-white py-1.5 text-xs font-semibold text-zinc-800 transition hover:border-zinc-300 hover:bg-zinc-50 min-[640px]:text-sm"
          >
            В корзину
          </button>
        </div>
      </div>
    </article>
  );
}

export default function Storefront() {
  const pathname = usePathname();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isHeaderFloating, setIsHeaderFloating] = useState(false);
  const [isDesktopHeader, setIsDesktopHeader] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProductMemory, setSelectedProductMemory] = useState("");
  const [selectedProductColor, setSelectedProductColor] = useState("");
  const [selectedProductSim, setSelectedProductSim] = useState("");
  const [orderSelection, setOrderSelection] = useState<{
    productName?: string;
    color?: string;
    memory?: string;
    simType?: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [storeData, setStoreData] = useState<StoreData>(defaultStoreData);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartHydrated, setCartHydrated] = useState(false);
  const [sendingLead, setSendingLead] = useState(false);
  const [leadNotice, setLeadNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as CartItem[];
      if (Array.isArray(parsed)) {
        setCartItems(parsed);
      }
    } catch {
      setCartItems([]);
    } finally {
      setCartHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!cartHydrated) return;
    persistCartItems(cartItems);
  }, [cartHydrated, cartItems]);

  useEffect(() => {
    void fetchStoreData().then((remote) => setStoreData(remote));
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const onScroll = () => {
      setIsHeaderFloating(window.scrollY > 10);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 960px)");
    const update = () => setIsDesktopHeader(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!leadNotice) return;
    const timer = window.setTimeout(() => setLeadNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [leadNotice]);

  const shouldSplitHeader = isHeaderFloating && isDesktopHeader;

  const routeCategorySlug = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts[0] === "catalog" && parts[1]) {
      return parts[1];
    }
    return null;
  }, [pathname]);
  const isHomePage = pathname === "/";
  const isPolicyPage = pathname === "/policy";
  const isOfferPage = pathname === "/offer";
  const isInfoPage = pathname === "/info";
  const isStaticPage = isPolicyPage || isOfferPage || isInfoPage;

  const activeCategory = useMemo(() => {
    if (!routeCategorySlug) {
      return null;
    }
    return storeData.categories.find((item) => item.slug === routeCategorySlug) ?? null;
  }, [routeCategorySlug, storeData.categories]);

  const visibleProducts = useMemo(() => {
    if (!activeCategory) {
      return storeData.products;
    }
    return storeData.products.filter((product) => product.categorySlug === activeCategory.slug);
  }, [activeCategory, storeData.products]);

  const categoriesBySlug = useMemo(() => {
    const map: Record<string, Category> = {};
    for (const category of storeData.categories) {
      map[category.slug] = category;
    }
    return map;
  }, [storeData.categories]);

  const displayCategories = useMemo(() => {
    const order = ["iphone", "iphone-used", "macbook", "apple-watch", "ipad", "airpods", "custom"];
    const rank = (slug: string) => {
      const idx = order.indexOf(slug);
      return idx === -1 ? 800 : idx;
    };
    return [...storeData.categories].sort((a, b) => {
      const d = rank(a.slug) - rank(b.slug);
      return d !== 0 ? d : a.slug.localeCompare(b.slug);
    });
  }, [storeData.categories]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return visibleProducts;

    return visibleProducts.filter((product) => {
      const categoryName = categoriesBySlug[product.categorySlug]?.name ?? "";
      const variantHaystack = (product.variants ?? [])
        .flatMap((variant) => [variant.color ?? "", variant.memory ?? "", variant.simType ?? ""])
        .join(" ");
      const haystack = [product.name, product.color ?? "", product.description ?? "", categoryName, variantHaystack]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [categoriesBySlug, searchQuery, visibleProducts]);

  const cartCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const addToCart = useCallback(
    (
      product: Product,
      selection: { color?: string; memory?: string; simType?: string; price: number; imageUrl: string }
    ) => {
      const key = [product.id, selection.color ?? "", selection.memory ?? "", selection.simType ?? ""].join("|");
      setCartItems((prev) => {
        let nextItems: CartItem[];
        const existing = prev.find((item) => item.key === key);
        if (existing) {
          nextItems = prev.map((item) => (item.key === key ? { ...item, quantity: item.quantity + 1 } : item));
        } else {
          nextItems = [
            ...prev,
            {
              key,
              productId: product.id,
              name: product.name,
              color: selection.color,
              memory: selection.memory,
              simType: selection.simType,
              price: selection.price,
              imageUrl: selection.imageUrl,
              quantity: 1
            }
          ];
        }
        // Persist immediately so fast navigation to /cart does not lose the update.
        persistCartItems(nextItems);
        return nextItems;
      });
      setLeadNotice({ type: "success", message: "Товар добавлен в корзину." });
    },
    []
  );

  const breadcrumbs = useMemo(() => {
    const crumbs: string[] = ["Главная"];
    if (routeCategorySlug) {
      crumbs.push("Каталог");
      crumbs.push(activeCategory?.name ?? routeCategorySlug);
    }
    return crumbs.join(" / ");
  }, [activeCategory?.name, routeCategorySlug]);

  const formatPhone = useCallback((value: string): string => {
    const digits = value.replace(/\D/g, "");
    const normalized = digits.startsWith("8") ? `7${digits.slice(1)}` : digits;
    const trimmed = normalized.startsWith("7") ? normalized.slice(1, 11) : normalized.slice(0, 10);
    const parts = [
      trimmed.slice(0, 3),
      trimmed.slice(3, 6),
      trimmed.slice(6, 8),
      trimmed.slice(8, 10)
    ].filter(Boolean);

    if (!trimmed.length) return "";
    if (trimmed.length <= 3) return `+7 (${parts[0]}`;
    if (trimmed.length <= 6) return `+7 (${parts[0]}) ${parts[1] ?? ""}`;
    if (trimmed.length <= 8) return `+7 (${parts[0]}) ${parts[1] ?? ""}-${parts[2] ?? ""}`;
    return `+7 (${parts[0]}) ${parts[1] ?? ""}-${parts[2] ?? ""}-${parts[3] ?? ""}`;
  }, []);

  const onPhoneInput = useCallback((value: string, apply: (next: string) => void) => {
    apply(formatPhone(value));
  }, [formatPhone]);

  const submitLead = async (payload: {
    type: "tradein" | "assessment" | "order";
    phone: string;
    deviceFrom?: string;
    deviceTo?: string;
    targetDevice?: string;
    productName?: string;
    color?: string;
    memory?: string;
    simType?: string;
    customerName?: string;
    telegram?: string;
  }) => {
    if (!payload.phone.trim()) return;
    try {
      setSendingLead(true);
      await createLead(payload);
      setActiveModal(null);
      setOrderSelection(null);
      setLeadNotice({ type: "success", message: "Заявка отправлена, мы скоро с вами свяжемся." });
    } catch {
      setLeadNotice({ type: "error", message: "Не удалось отправить заявку. Попробуйте еще раз." });
    } finally {
      setSendingLead(false);
    }
  };

  const modal = useMemo(() => {
    if (activeModal === "tradein") {
      return (
        <Modal
          title="Заявка на Trade-In"
          subtitle="Оставьте заявку на Trade-In и мы в ближайшее время свяжемся с вами"
          iconSrc="/icon/icon2.svg"
          iconAlt="Иконка Trade-In"
          onClose={() => setActiveModal(null)}
        >
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const phone = (form.elements.namedItem("phone") as HTMLInputElement | null)?.value ?? "";
              const deviceFrom = (form.elements.namedItem("deviceFrom") as HTMLInputElement | null)?.value ?? "";
              const deviceTo = (form.elements.namedItem("deviceTo") as HTMLInputElement | null)?.value ?? "";
              void submitLead({ type: "tradein", phone, deviceFrom, deviceTo });
            }}
          >
            <input
              name="phone"
              className="field"
              placeholder="+7 (999) 123-45-67"
              inputMode="tel"
              maxLength={18}
              onChange={(e) => onPhoneInput(e.target.value, (next) => (e.target.value = next))}
            />
            <div className="grid grid-cols-1 gap-3 min-[640px]:grid-cols-2">
              <input name="deviceFrom" className="field" placeholder="Например, iPhone 13 Pro 256 ГБ" />
              <input name="deviceTo" className="field" placeholder="Например, iPhone 16 Pro 256 ГБ" />
            </div>
            <label className="flex items-start gap-2 text-xs text-zinc-500">
              <input type="checkbox" className="mt-0.5 accent-red-500" defaultChecked />
              <span>
                Я согласен с{" "}
                <Link href="/policy" className="font-medium text-red-500 underline-offset-2 hover:underline">
                  политикой конфиденциальности
                </Link>{" "}
                и принимаю{" "}
                <Link href="/offer" className="font-medium text-red-500 underline-offset-2 hover:underline">
                  условия оферты
                </Link>
              </span>
            </label>
            <button
              type="submit"
              className="btn-primary flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={sendingLead}
            >
              {sendingLead ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Отправка...
                </>
              ) : (
                "Отправить"
              )}
            </button>
          </form>
        </Modal>
      );
    }

    if (activeModal === "reviews") {
      return (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 min-[640px]:p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="relative w-full max-w-[640px] overflow-hidden rounded-3xl border border-zinc-800 bg-[#121317] p-5 text-white shadow-[0_24px_60px_rgba(0,0,0,0.45)] ring-1 ring-white/5 min-[640px]:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute right-4 top-3 z-20 text-xl text-zinc-500 transition hover:text-zinc-200"
            >
              ×
            </button>

            <div className="relative z-10 max-w-[24rem]">
            <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-400">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-400" />
              Нам доверяют
            </p>
            <h3 className="text-4xl font-bold leading-tight min-[640px]:text-5xl">Отзывы клиентов</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              Средняя оценка 5,0 на 2ГИС и более 100 отзывов подтверждают высокий уровень сервиса и качество нашей работы.
            </p>
            </div>

            <a
              href="https://2gis.ru"
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-red-500 px-4 text-sm font-semibold uppercase tracking-[0.08em] transition hover:bg-red-600 min-[640px]:mt-8 min-[640px]:max-w-[18rem]"
            >
              Перейти в 2ГИС
            </a>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/test1.png"
              alt="Отзывы клиентов в 2ГИС"
              className="pointer-events-none absolute -right-10 -bottom-14 h-[128%] w-auto object-contain min-[640px]:-right-6 min-[640px]:-bottom-16 min-[640px]:h-[136%]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/35 via-transparent to-transparent" />
          </div>
        </div>
      );
    }

    if (activeModal === "preorder") {
      return (
        <Modal
          title="Под заказ"
          subtitle="Заполните форму — менеджер уточнит наличие, сроки и стоимость"
          hideBadge
          onClose={() => setActiveModal(null)}
        >
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const customerName = (form.elements.namedItem("customerName") as HTMLInputElement | null)?.value ?? "";
              const phone = (form.elements.namedItem("phone") as HTMLInputElement | null)?.value ?? "";
              const telegram = (form.elements.namedItem("telegram") as HTMLInputElement | null)?.value ?? "";
              const targetDevice = (form.elements.namedItem("targetDevice") as HTMLInputElement | null)?.value ?? "";
              if (!customerName.trim() || !phone.trim() || !targetDevice.trim()) return;
              void submitLead({
                type: "order",
                phone,
                customerName: customerName.trim(),
                telegram: telegram.trim() || undefined,
                targetDevice: targetDevice.trim(),
                productName: "Под заказ"
              });
            }}
          >
            <input name="customerName" className="field" placeholder="ФИО" required />
            <input
              name="phone"
              className="field"
              placeholder="+7 (999) 123-45-67"
              inputMode="tel"
              maxLength={18}
              required
              onChange={(e) => onPhoneInput(e.target.value, (next) => (e.target.value = next))}
            />
            <input name="telegram" className="field" placeholder="Telegram (не обязательно)" />
            <input name="targetDevice" className="field" placeholder="Желаемый товар" required />
            <button
              type="submit"
              className="btn-primary flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={sendingLead}
            >
              {sendingLead ? "Отправка..." : "Отправить"}
            </button>
          </form>
        </Modal>
      );
    }

    if (activeModal === "order") {
      return (
        <Modal
          title="Заказать устройство"
          subtitle="Оставьте заявку на заказ и мы в ближайшее время свяжемся с вами"
          hideBadge
          onClose={() => {
            setActiveModal(null);
            setOrderSelection(null);
          }}
        >
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const phone = (form.elements.namedItem("phone") as HTMLInputElement | null)?.value ?? "";
              const targetDevice = (form.elements.namedItem("targetDevice") as HTMLInputElement | null)?.value ?? "";
              void submitLead({
                type: "order",
                phone,
                targetDevice,
                productName: orderSelection?.productName,
                color: orderSelection?.color,
                memory: orderSelection?.memory,
                simType: orderSelection?.simType
              });
            }}
          >
            <input
              name="phone"
              className="field"
              placeholder="+7 (999) 123-45-67"
              inputMode="tel"
              maxLength={18}
              onChange={(e) => onPhoneInput(e.target.value, (next) => (e.target.value = next))}
            />
            <input name="targetDevice" className="field" placeholder={'Например, MacBook Air M2 13"'} />
            <label className="flex items-start gap-2 text-xs text-zinc-500">
              <input type="checkbox" className="mt-0.5 accent-red-500" defaultChecked />
              <span>
                Я согласен с{" "}
                <Link href="/policy" className="font-medium text-red-500 underline-offset-2 hover:underline">
                  политикой конфиденциальности
                </Link>{" "}
                и принимаю{" "}
                <Link href="/offer" className="font-medium text-red-500 underline-offset-2 hover:underline">
                  условия оферты
                </Link>
              </span>
            </label>
            <button
              type="submit"
              className="btn-primary flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={sendingLead}
            >
              {sendingLead ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Отправка...
                </>
              ) : (
                "Отправить"
              )}
            </button>
          </form>
        </Modal>
      );
    }

    if (activeModal === "product" && selectedProduct) {
      const selectedCategory = categoriesBySlug[selectedProduct.categorySlug];
      const isIphoneCategory = isIphoneLikeSlug(selectedCategory?.slug);
      const productVariants = selectedProduct.variants ?? [];
      const hasVariants = productVariants.length > 0;
      const colorOptions = hasVariants
        ? Array.from(new Set(productVariants.map((item) => item.color).filter((item): item is string => Boolean(item))))
        : selectedProduct.color
          ? [selectedProduct.color]
          : [];
      const colorFilter = selectedProductColor || colorOptions[0] || "";
      const colorScopedVariants = hasVariants
        ? productVariants.filter((item) => !colorFilter || item.color === colorFilter)
        : [];
      const memoryScopedVariants = hasVariants && isIphoneCategory
        ? colorScopedVariants.filter((item) => !selectedProductSim || item.simType === selectedProductSim)
        : colorScopedVariants;
      const simScopedVariants = hasVariants && isIphoneCategory
        ? colorScopedVariants.filter((item) => !selectedProductMemory || item.memory === selectedProductMemory)
        : colorScopedVariants;
      const memoryOptions = hasVariants && isIphoneCategory
        ? Array.from(new Set(memoryScopedVariants.map((item) => item.memory).filter((item): item is string => Boolean(item))))
        : [];
      const simOptions = hasVariants && isIphoneCategory
        ? Array.from(new Set(simScopedVariants.map((item) => item.simType).filter((item): item is string => Boolean(item))))
        : [];

      const activeVariant =
        hasVariants
          ? isIphoneCategory
            ? productVariants.find(
                (item) =>
                  (!colorFilter || item.color === colorFilter) &&
                  (!selectedProductMemory || item.memory === selectedProductMemory) &&
                  (!selectedProductSim || item.simType === selectedProductSim)
              ) ??
              productVariants.find(
                (item) => (!colorFilter || item.color === colorFilter) && (!selectedProductMemory || item.memory === selectedProductMemory)
              ) ??
              productVariants.find((item) => (!colorFilter || item.color === colorFilter)) ??
              productVariants[0]
            : productVariants.find((item) => (!colorFilter || item.color === colorFilter)) ?? productVariants[0]
          : null;

      const shownModalPrice = activeVariant?.price ?? selectedProduct.basePrice;
      const shownModalImage = activeVariant?.imageUrl ?? selectedProduct.imageUrl;
      return (
        <Modal
          title={selectedProduct.name}
          subtitle={(activeVariant?.color ?? selectedProduct.color) ? `Цвет: ${activeVariant?.color ?? selectedProduct.color}` : "Оригинальная техника Apple"}
          hideBadge
          noScroll
          onClose={() => {
            setActiveModal(null);
            setSelectedProduct(null);
            setSelectedProductMemory("");
            setSelectedProductColor("");
            setSelectedProductSim("");
          }}
        >
          <div className="space-y-2 min-[640px]:grid min-[640px]:grid-cols-[minmax(220px,0.95fr)_minmax(260px,1.05fr)] min-[640px]:gap-4 min-[640px]:space-y-0">
            <div className="overflow-hidden rounded-xl bg-zinc-50 p-1.5 min-[640px]:h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shownModalImage} alt={selectedProduct.name} className="h-28 w-full object-contain min-[480px]:h-32 min-[640px]:h-full min-[640px]:min-h-[280px]" />
            </div>
            <div className="space-y-2 min-[640px]:space-y-3">
              <p className="line-clamp-2 text-xs leading-5 text-zinc-600 min-[640px]:text-sm">
                {selectedProduct.description ??
                  "Подробное описание для этого товара скоро появится. Вы можете оставить заявку, и менеджер уточнит все характеристики."}
              </p>
              {isIphoneCategory ? (
                <p className="rounded-xl border border-amber-200/90 bg-amber-50 px-2.5 py-1.5 text-[11px] font-medium leading-snug text-amber-950 min-[640px]:text-xs">
                  Имееться недостаток товара: невозможно установить и использовать RuStore.
                </p>
              ) : null}
              <div className="rounded-xl bg-zinc-50 p-2 text-xs text-zinc-600 min-[640px]:text-sm">
                <p>Категория: {selectedCategory?.name ?? "—"}</p>
                {colorOptions.length ? (
                  <div className="mt-1 space-y-1">
                    <p className="text-xs text-zinc-500">Выберите цвет</p>
                    <div className="flex flex-wrap gap-1">
                      {colorOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold transition min-[640px]:text-xs ${
                            selectedProductColor === option ? "bg-zinc-900 text-white" : "bg-white text-zinc-700 hover:bg-zinc-100"
                          }`}
                          onClick={() => {
                            setSelectedProductColor(option);
                            setSelectedProductMemory("");
                            setSelectedProductSim("");
                          }}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                {isIphoneCategory ? (
                  memoryOptions.length ? (
                    <div className="mt-1 space-y-1">
                      <p className="text-xs text-zinc-500">Выберите объем</p>
                      <div className="flex flex-wrap gap-1">
                        {memoryOptions.map((option) => (
                          <button
                            key={option}
                            type="button"
                            className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold transition min-[640px]:text-xs ${
                              selectedProductMemory === option ? "bg-zinc-900 text-white" : "bg-white text-zinc-700 hover:bg-zinc-100"
                            }`}
                            onClick={() => setSelectedProductMemory(option)}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1">Объем: не указан</p>
                  )
                ) : null}
                {simOptions.length ? (
                  <div className="mt-1 space-y-1">
                    <p className="text-xs text-zinc-500">Выберите тип SIM</p>
                    <div className="flex flex-wrap gap-1">
                      {simOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold transition min-[640px]:text-xs ${
                            selectedProductSim === option ? "bg-zinc-900 text-white" : "bg-white text-zinc-700 hover:bg-zinc-100"
                          }`}
                          onClick={() => setSelectedProductSim(option)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                <p className="mt-1 font-semibold text-zinc-900">Цена: от {toRub(shownModalPrice)}</p>
              </div>
              <div className="grid grid-cols-1 gap-2 min-[640px]:grid-cols-2">
                <button
                  type="button"
                  className="btn-primary w-full py-2 text-sm"
                  onClick={() => {
                    setOrderSelection({
                      productName: selectedProduct.name,
                      color: (activeVariant?.color ?? selectedProductColor) || undefined,
                      memory: (activeVariant?.memory ?? selectedProductMemory) || undefined,
                      simType: (activeVariant?.simType ?? selectedProductSim) || undefined
                    });
                    setSelectedProduct(null);
                    setActiveModal("order");
                  }}
                >
                  Заказать
                </button>
                <button
                  type="button"
                  className="w-full rounded-xl border border-zinc-200 bg-white py-2 text-sm font-semibold text-zinc-800 transition hover:border-zinc-900 hover:bg-zinc-900 hover:text-white"
                  onClick={() =>
                    addToCart(selectedProduct, {
                      color: (activeVariant?.color ?? selectedProductColor) || undefined,
                      memory: (activeVariant?.memory ?? selectedProductMemory) || undefined,
                      simType: (activeVariant?.simType ?? selectedProductSim) || undefined,
                      price: shownModalPrice,
                      imageUrl: shownModalImage
                    })
                  }
                >
                  В корзину
                </button>
              </div>
            </div>
          </div>
        </Modal>
      );
    }

    return null;
  }, [
    activeModal,
    addToCart,
    categoriesBySlug,
    onPhoneInput,
    orderSelection,
    selectedProduct,
    selectedProductColor,
    selectedProductMemory,
    selectedProductSim,
    sendingLead
  ]);

  return (
    <div className="min-h-screen bg-[#f4f4f6] text-zinc-900">
      <div className="hidden border-b border-zinc-200 bg-white min-[960px]:block">
        <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between px-8 py-3 text-sm text-zinc-500 min-[1440px]:px-12 min-[1920px]:px-16">
          <div className="flex gap-5">
            <Link href="/info#delivery" className="transition hover:text-zinc-700">
              Доставка и оплата
            </Link>
            <Link href="/info#return" className="transition hover:text-zinc-700">
              Возврат и обмен
            </Link>
            <Link href="/info#warranty" className="transition hover:text-zinc-700">
              Гарантия и проверка
            </Link>
          </div>
          <div className="flex gap-5 text-red-500">
            <span>Омск, ул. Гагарина 3</span>
            <span>11:00 - 20:00</span>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40">
        <div
          className={`mx-auto flex w-full max-w-[1920px] items-center justify-between gap-3 px-4 transition-all duration-300 min-[640px]:px-6 min-[960px]:px-8 min-[1440px]:px-12 min-[1920px]:px-16 ${
            shouldSplitHeader
              ? "mt-3 rounded-full border border-white/70 bg-white/88 py-2 shadow-[0_16px_40px_rgba(24,24,27,0.12)] backdrop-blur-2xl"
              : "border-b border-white/50 liquid-glass py-4 min-[640px]:py-5 min-[960px]:py-6"
          }`}
        >
          <Link
            href="/"
            className={`inline-flex shrink-0 items-center font-bold tracking-tight text-zinc-950 transition-all duration-300 ${
              shouldSplitHeader ? "text-xl min-[1200px]:text-2xl min-[1440px]:text-3xl" : "text-2xl min-[640px]:text-3xl min-[1440px]:text-4xl min-[1920px]:text-5xl"
            }`}
          >
            <span className="text-red-500">X</span> : STORE
          </Link>
          <nav
            className={`hidden h-10 items-center gap-5 rounded-full px-4 text-sm font-medium text-zinc-700 transition-all duration-300 min-[960px]:flex min-[1440px]:gap-7 min-[1920px]:text-base ${
              shouldSplitHeader ? "bg-zinc-100/70" : ""
            }`}
          >
            <Link className="inline-flex items-center gap-2 hover:text-red-500" href="/catalog">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon/catalog.svg" alt="" aria-hidden="true" className="h-4 w-4" />
              Каталог
            </Link>
            <button className="hover:text-red-500" type="button" onClick={() => setActiveModal("tradein")}>
              Trade-in
            </button>
            <Link className="hover:text-red-500" href="/assessment">
              Выкуп
            </Link>
            <button className="hover:text-red-500" type="button" onClick={() => setActiveModal("reviews")}>
              Отзывы
            </button>
            <a className="hover:text-red-500" href="#">
              Статьи
            </a>
          </nav>
          <div className="flex shrink-0 items-center gap-2 min-[960px]:hidden">
            <Link
              href="/cart"
              className={`relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-900 shadow-sm transition-all duration-300 min-[640px]:h-12 min-[640px]:w-12 ${
                shouldSplitHeader ? "ring-1 ring-white/60" : ""
              }`}
              aria-label="Корзина"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5.5 w-5.5">
                <path d="M6 7h15l-1.5 9h-12z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 7 5 3H2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9.5" cy="20" r="1.25" fill="currentColor" stroke="none" />
                <circle cx="17.5" cy="20" r="1.25" fill="currentColor" stroke="none" />
              </svg>
              <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {cartCount}
              </span>
            </Link>
            <button
              type="button"
              className={`inline-flex h-11 items-center gap-2 rounded-[1.2rem] border border-zinc-300 bg-[#f2ecec] px-3 text-sm font-semibold leading-none text-[#3f2430] shadow-sm transition-all duration-300 min-[640px]:h-12 min-[640px]:gap-2.5 min-[640px]:rounded-[1.4rem] min-[640px]:px-4 min-[640px]:text-base ${
                shouldSplitHeader ? "ring-1 ring-white/60" : ""
              }`}
              aria-label={mobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              <span className="relative h-4 w-5">
                <span
                  className={`absolute left-0 top-0 h-0.5 w-5 rounded-full bg-current transition ${
                    mobileMenuOpen ? "translate-y-[7px] rotate-45" : ""
                  }`}
                />
                <span
                  className={`absolute left-0 top-[7px] h-0.5 w-5 rounded-full bg-current transition ${
                    mobileMenuOpen ? "opacity-0" : ""
                  }`}
                />
                <span
                  className={`absolute left-0 top-[14px] h-0.5 w-5 rounded-full bg-current transition ${
                    mobileMenuOpen ? "-translate-y-[7px] -rotate-45" : ""
                  }`}
                />
              </span>
              Меню
            </button>
          </div>
          <div
            className={`hidden h-10 items-center gap-2 transition-all duration-300 min-[960px]:flex`}
          >
            <Link
              href="/cart"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 text-xs font-semibold min-[1200px]:text-sm text-zinc-800 transition hover:border-zinc-300 hover:bg-white"
            >
              Корзина
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-zinc-900 px-1.5 py-0.5 text-[10px] text-white">
                {cartCount}
              </span>
            </Link>
            <a
              href="https://vk.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 transition hover:border-zinc-300 hover:bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon/vk.svg" alt="VK" className="h-4.5 w-4.5" />
            </a>
            <a
              href="https://t.me"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 transition hover:border-zinc-300 hover:bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon/telegram.svg" alt="Telegram" className="h-4.5 w-4.5" />
            </a>
            <div className="text-right text-[11px] font-medium leading-tight text-zinc-700 min-[1200px]:text-xs min-[1440px]:text-sm">
              <p>+7 (923) 696-93-77</p>
              <p>+7 (923) 686-93-77</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1920px] px-4 py-6 min-[640px]:px-6 min-[640px]:py-8 min-[960px]:px-8 min-[960px]:py-10 min-[1440px]:px-12 min-[1920px]:px-16">
        {isPolicyPage ? (
          <section>
            <p className="mb-4 text-xs text-zinc-400 min-[640px]:mb-5 min-[640px]:text-sm">Главная / Политика конфиденциальности</p>
            <h1 className="mb-5 text-3xl font-bold text-zinc-900 min-[640px]:text-5xl">Политика конфиденциальности</h1>
            <article className="rounded-3xl border border-white/70 liquid-glass p-5 text-zinc-700 min-[640px]:p-7">
              <p className="text-sm leading-7 min-[640px]:text-base">
                Честная диагностика и прозрачный расчет без скрытых условий. Мы обрабатываем персональные данные только
                для связи по заявке, уточнения заказа и улучшения сервиса. Передача данных третьим лицам не
                осуществляется, за исключением случаев, предусмотренных законодательством.
              </p>
            </article>
          </section>
        ) : null}

        {isOfferPage ? (
          <section>
            <p className="mb-4 text-xs text-zinc-400 min-[640px]:mb-5 min-[640px]:text-sm">Главная / Публичная оферта</p>
            <h1 className="mb-5 text-3xl font-bold text-zinc-900 min-[640px]:text-5xl">Публичная оферта</h1>
            <article className="rounded-3xl border border-white/70 liquid-glass p-5 text-zinc-700 min-[640px]:p-7">
              <p className="text-sm leading-7 min-[640px]:text-base">
                Честная диагностика и прозрачный расчет без скрытых условий. Настоящая публичная оферта определяет
                порядок оформления заявок, условия согласования стоимости и сроки исполнения заказа. Отправка формы на
                сайте подтверждает согласие клиента с условиями оферты.
              </p>
            </article>
          </section>
        ) : null}

        {isInfoPage ? (
          <section>
            <p className="mb-4 text-xs text-zinc-400 min-[640px]:mb-5 min-[640px]:text-sm">Главная / Информация для клиента</p>
            <h1 className="mb-5 text-3xl font-bold text-zinc-900 min-[640px]:text-5xl">Покупателям</h1>
            <div className="space-y-5 min-[640px]:space-y-6">
              <article id="delivery" className="rounded-3xl border border-white/70 liquid-glass p-5 min-[640px]:p-7">
                <h2 className="text-2xl font-semibold text-zinc-900 min-[640px]:text-3xl">Доставка и оплата</h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-600 min-[640px]:text-base">
                  Оформите заявку на сайте или по телефону. Менеджер подтвердит наличие, согласует итоговую стоимость,
                  способы доставки по Омску и в другие регионы, а также удобный формат оплаты.
                </p>
              </article>
              <article id="return" className="rounded-3xl border border-white/70 liquid-glass p-5 min-[640px]:p-7">
                <h2 className="text-2xl font-semibold text-zinc-900 min-[640px]:text-3xl">Возврат и обмен</h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-600 min-[640px]:text-base">
                  Возврат или обмен возможен в соответствии с действующим законодательством РФ. Для обращения
                  подготовьте чек и сохраните комплектность товара и внешний вид устройства.
                </p>
              </article>
              <article id="warranty" className="rounded-3xl border border-white/70 liquid-glass p-5 min-[640px]:p-7">
                <h2 className="text-2xl font-semibold text-zinc-900 min-[640px]:text-3xl">Гарантия и проверка</h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-600 min-[640px]:text-base">
                  Перед выдачей каждое устройство проходит проверку. На технику предоставляется гарантия, условия
                  которой менеджер уточняет при оформлении заказа.
                </p>
              </article>
            </div>
          </section>
        ) : null}

        {!isStaticPage ? (
          <>
        {isHomePage ? (
          <section className="mb-6 grid grid-cols-1 gap-3 min-[640px]:mb-8 min-[640px]:gap-4 min-[960px]:grid-cols-5 min-[960px]:gap-5">
            <article className="relative flex min-h-[360px] flex-col overflow-hidden rounded-3xl bg-[#121317] liquid-glass-dark p-5 text-white min-[640px]:min-h-[420px] min-[640px]:p-7 min-[960px]:col-span-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img2.png" alt="Оценка устройства" className="absolute inset-0 h-full w-full object-cover" />
              <div className="pointer-events-none absolute inset-0 bg-black/45" />
              <p className="relative z-10 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-red-400">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon/icon3.svg" alt="" aria-hidden="true" className="h-3.5 w-3.5" />
                Оценка за 10 минут
              </p>
              <h1 className="relative z-10 mt-4 max-w-xl text-3xl font-bold leading-tight min-[640px]:text-4xl min-[1440px]:text-5xl">
                Выкупим ваше устройство
              </h1>
              <p className="relative z-10 mt-3 max-w-xl text-sm text-zinc-300 min-[640px]:text-base">
                Честная оценка и быстрый ответ менеджера.
              </p>
              <Link
                href="/assessment"
                className="relative z-10 mt-auto inline-flex min-h-12 min-w-40 items-center justify-center self-start rounded-2xl bg-red-500 px-10 py-3.5 text-base font-semibold text-white transition hover:bg-red-600 min-[640px]:min-h-16 min-[640px]:min-w-52 min-[640px]:px-14 min-[640px]:py-4 min-[640px]:text-xl"
              >
                Оценка устройства
              </Link>
              <div className="pointer-events-none absolute -bottom-20 -right-16 h-56 w-56 rounded-full bg-red-500/25 blur-3xl" />
            </article>

            <div className="grid grid-cols-1 gap-3 min-[640px]:gap-4 min-[960px]:col-span-2">
              <button
                type="button"
                onClick={() => setActiveModal("tradein")}
              className="group relative overflow-hidden rounded-3xl border border-white/70 liquid-glass p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg min-[640px]:p-6"
              >
                <p className="relative z-10 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-red-500">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icon/icon2.svg" alt="" aria-hidden="true" className="h-3.5 w-3.5" />
                  Выгодный обмен
                </p>
                <h3 className="relative z-10 mt-3 max-w-[18rem] text-2xl font-bold leading-tight text-zinc-900 min-[640px]:text-3xl">
                  Условия по программе Trade-In
                </h3>
                <p className="relative z-10 mt-3 max-w-[16rem] text-sm text-zinc-500 min-[640px]:text-base">
                  Обменивайте текущее устройство на новую модель со скидкой.
                </p>
                <span className="relative z-10 mt-4 inline-block text-sm font-semibold text-red-500 group-hover:text-red-600">
                  Открыть заявку
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/image.png"
                  alt="Trade-In"
                  className="pointer-events-none absolute -right-4 -top-6 h-[122%] w-auto object-contain opacity-95 min-[640px]:-right-6"
                />
              </button>

              <Link
                href="/catalog"
                className="group relative block overflow-hidden rounded-3xl border border-white/70 liquid-glass p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg min-[640px]:p-6"
              >
                <p className="relative z-10 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-red-500">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icon/icon1.svg" alt="" aria-hidden="true" className="h-3.5 w-3.5" />
                  Гарантия 12 месяцев
                </p>
                <h3 className="relative z-10 mt-3 max-w-[18rem] text-2xl font-bold leading-tight text-zinc-900 min-[640px]:text-3xl">
                  Магазин оригинальной техники
                </h3>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/img3.png"
                  alt="Каталог"
                  className="pointer-events-none absolute -right-5 top-1/2 h-[118%] w-auto -translate-y-1/2 object-contain opacity-95 min-[640px]:-right-7"
                />
              </Link>
            </div>
          </section>
        ) : null}

        {isHomePage ? (
          <h2 className="mb-4 inline-flex items-center gap-3 text-2xl font-bold text-zinc-900 min-[640px]:mb-5 min-[640px]:text-3xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon/catalog.svg" alt="" aria-hidden="true" className="h-5 w-5 min-[640px]:h-6 min-[640px]:w-6" />
            Каталог
          </h2>
        ) : (
          <p className="mb-4 text-xs text-zinc-400 min-[640px]:mb-5 min-[640px]:text-sm">{breadcrumbs}</p>
        )}

        {isHomePage ? (
          <section className="mt-6 min-[640px]:mt-8">
            <button
              type="button"
              onClick={() => setActiveModal("tradein")}
              className="group relative w-full overflow-hidden rounded-3xl border border-zinc-800 bg-[#121317] liquid-glass-dark p-5 text-left text-white shadow-[0_14px_34px_rgba(0,0,0,0.22)] ring-1 ring-white/5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(0,0,0,0.3)] min-[640px]:p-7"
            >
              <div className="relative z-10 flex h-full max-w-[38rem] flex-col">
                <p className="text-xs font-semibold uppercase tracking-widest text-red-400">Выгодный обмен</p>
                <h3 className="mt-3 text-3xl font-bold leading-tight min-[640px]:text-5xl">Программа TRADE-IN</h3>
                <p className="mt-3 text-sm text-zinc-300 min-[640px]:text-lg">
                  Обменивайте ваше текущее устройство на новую модель со скидкой
                </p>
                <span className="mt-6 inline-flex min-w-[230px] self-start items-center justify-center rounded-2xl bg-red-500 px-7 py-3 text-sm font-semibold text-white transition group-hover:bg-red-600 min-[640px]:mt-8 min-[640px]:min-w-[240px] min-[640px]:px-10 min-[640px]:py-4">
                  Рассчитать Trade-In
                </span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/image.png"
                alt="Trade-In"
                className="pointer-events-none absolute -right-6 -bottom-12 h-[130%] w-auto object-contain min-[640px]:-right-2 min-[640px]:-bottom-16 min-[960px]:-bottom-10 min-[960px]:h-[145%]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/35 via-transparent to-transparent" />
            </button>
          </section>
        ) : null}

        {isHomePage ? (
          <section className="mt-8 rounded-3xl border border-white/60 liquid-glass p-4 min-[640px]:mt-10 min-[640px]:p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-red-500">Оценка за 10 минут</p>
            <h3 className="mt-2 text-3xl font-bold text-zinc-900 min-[640px]:text-5xl">Выкуп техники</h3>

            <div className="mt-5 grid grid-cols-1 gap-3 min-[640px]:mt-6 min-[640px]:grid-cols-2 min-[640px]:gap-4 min-[960px]:grid-cols-3">
              <article className="rounded-2xl border border-white/70 liquid-glass p-4 min-[640px]:rounded-3xl min-[640px]:p-5">
                <div className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 text-sm text-red-500">
                  ◉
                </div>
                <h4 className="text-xl font-semibold text-zinc-900 min-[640px]:text-2xl">Честная оценка</h4>
                <p className="mt-2 text-sm text-zinc-500 min-[640px]:text-base">
                  Честная диагностика и прозрачный расчет без скрытых условий
                </p>
              </article>

              <article className="rounded-2xl border border-white/70 liquid-glass p-4 min-[640px]:rounded-3xl min-[640px]:p-5">
                <div className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 text-sm text-red-500">
                  ◎
                </div>
                <h4 className="text-xl font-semibold text-zinc-900 min-[640px]:text-2xl">Быстрая сделка</h4>
                <p className="mt-2 text-sm text-zinc-500 min-[640px]:text-base">
                  Оформление и расчет в день обращения без ожиданий и лишних процедур
                </p>
              </article>

              <article className="rounded-2xl border border-white/70 liquid-glass p-4 min-[640px]:rounded-3xl min-[640px]:p-5">
                <div className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 text-sm text-red-500">
                  ◍
                </div>
                <h4 className="text-xl font-semibold text-zinc-900 min-[640px]:text-2xl">Безопасно и официально</h4>
                <p className="mt-2 text-sm text-zinc-500 min-[640px]:text-base">
                  Работаем открыто, фиксируем сделку и гарантируем корректность расчета
                </p>
              </article>
            </div>
          </section>
        ) : null}

        {isHomePage ? (
          <section className="mt-8 rounded-3xl border border-white/60 liquid-glass p-4 min-[640px]:mt-10 min-[640px]:p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-red-500">Быстро и удобно</p>
            <h3 className="mt-2 text-3xl font-bold text-zinc-900 min-[640px]:text-5xl">Доставка и оплата</h3>

            <div className="mt-5 grid grid-cols-1 gap-3 min-[640px]:mt-6 min-[640px]:gap-4 min-[960px]:grid-cols-3">
              <article className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-[#111217] liquid-glass-dark p-4 text-white shadow-[0_14px_34px_rgba(0,0,0,0.22)] ring-1 ring-white/5 min-[640px]:rounded-3xl min-[640px]:p-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/next.png" alt="Доставка" className="pointer-events-none absolute right-0 top-0 h-full w-auto object-cover opacity-95" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-transparent" />
                <div className="relative z-10">
                  <p className="mb-10 inline-flex rounded-xl border border-red-300/40 bg-black/30 px-3 py-1 text-xs font-semibold text-red-300">
                    Омск, ул. Гагарина 3
                  </p>
                  <h4 className="text-xl font-semibold min-[640px]:text-2xl">Самовывоз и доставка</h4>
                  <p className="mt-2 max-w-sm text-sm text-zinc-300 min-[640px]:text-base">
                    Предусмотрен удобный самовывоз, а также оперативная доставка по городу с соблюдением сроков.
                  </p>
                </div>
              </article>

              <article className="rounded-2xl border border-white/70 liquid-glass p-4 min-[640px]:rounded-3xl min-[640px]:p-5">
                <div className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 text-sm text-red-500">
                  ◌
                </div>
                <h4 className="text-xl font-semibold text-zinc-900 min-[640px]:text-2xl">Способы оплаты</h4>
                <p className="mt-2 text-sm text-zinc-500 min-[640px]:text-base">
                  Принимаем наличный и безналичный расчет, обеспечивая безопасное и прозрачное проведение сделки.
                </p>
                <button
                  type="button"
                  onClick={() => (window.location.href = "/catalog")}
                  className="mt-5 w-full rounded-2xl border border-zinc-300 bg-red-50 py-2.5 text-sm font-semibold text-red-500 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-900 hover:bg-zinc-900 hover:text-white hover:shadow-[0_10px_24px_rgba(24,24,27,0.25)]"
                >
                  Перейти в каталог
                </button>
              </article>

              <article className="rounded-2xl border border-white/70 liquid-glass p-4 min-[640px]:rounded-3xl min-[640px]:p-5">
                <div className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 text-sm text-red-500">
                  ◍
                </div>
                <h4 className="text-xl font-semibold text-zinc-900 min-[640px]:text-2xl">Сроки под заказ</h4>
                <p className="mt-2 text-sm text-zinc-500 min-[640px]:text-base">
                  Поставки устройств под заказ согласовываются индивидуально, с предварительным подтверждением сроков.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setOrderSelection(null);
                    setActiveModal("order");
                  }}
                  className="mt-5 w-full rounded-2xl border border-zinc-300 bg-red-50 py-2.5 text-sm font-semibold text-red-500 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-900 hover:bg-zinc-900 hover:text-white hover:shadow-[0_10px_24px_rgba(24,24,27,0.25)]"
                >
                  Оформить заказ
                </button>
              </article>
            </div>
          </section>
        ) : null}

        {isHomePage ? (
          <section className="mt-8 min-[640px]:mt-10">
            <a
              href="https://2gis.ru"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block w-full overflow-hidden rounded-3xl border border-zinc-800 bg-[#121317] liquid-glass-dark p-5 text-white shadow-[0_14px_34px_rgba(0,0,0,0.22)] ring-1 ring-white/5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(0,0,0,0.3)] min-[640px]:p-7"
            >
              <div className="relative z-10 max-w-[38rem]">
                <p className="text-xs font-semibold uppercase tracking-widest text-red-400">Нам доверяют</p>
                <h3 className="mt-3 text-3xl font-bold leading-tight min-[640px]:text-5xl">Отзывы клиентов</h3>
                <p className="mt-3 text-sm text-zinc-300 min-[640px]:text-lg">
                  Средняя оценка 5,0 на 2ГИС и более 100 отзывов подтверждают высокий уровень сервиса.
                </p>
                <span className="mt-6 inline-flex rounded-2xl bg-red-500 px-7 py-3 text-sm font-semibold text-white transition group-hover:bg-red-600 min-[640px]:mt-8 min-[640px]:px-10 min-[640px]:py-4">
                  Перейти в 2ГИС
                </span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/test1.png"
                alt="Отзывы в 2ГИС"
                className="pointer-events-none absolute -right-8 -bottom-10 h-[135%] w-auto object-contain min-[640px]:right-0 min-[640px]:-bottom-16 min-[960px]:-bottom-12 min-[960px]:h-[145%]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/35 via-transparent to-transparent" />
            </a>
          </section>
        ) : null}

        <section
          className={`${
            isHomePage ? "mt-8 rounded-2xl border border-white/60 liquid-glass p-2 min-[640px]:mt-10 min-[640px]:p-3" : ""
          } grid grid-cols-4 gap-1.5 min-[480px]:gap-2 min-[640px]:gap-2.5 min-[900px]:grid-cols-7 min-[960px]:gap-3 min-[1440px]:gap-4`}
        >
          {displayCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onPodZakaz={category.slug === "custom" ? () => setActiveModal("preorder") : undefined}
            />
          ))}
        </section>

        {!isHomePage ? (
          <section className="mt-8 min-[640px]:mt-10">
            <div className="mb-4 flex flex-col gap-2 min-[640px]:mb-5 min-[640px]:flex-row min-[640px]:items-center min-[640px]:justify-between">
              <h2 className="text-2xl font-bold text-zinc-900 min-[640px]:text-3xl min-[1920px]:text-4xl">
                {activeCategory ? `Товары: ${activeCategory.name}` : "Все товары"}
              </h2>
              <input
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100 min-[640px]:w-80"
                placeholder="Поиск по товарам"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {filteredProducts.length ? (
              <div className="grid grid-cols-2 gap-2 min-[640px]:grid-cols-2 min-[640px]:gap-3 min-[960px]:grid-cols-5 min-[1440px]:grid-cols-6 min-[1920px]:grid-cols-7 min-[1920px]:gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    category={categoriesBySlug[product.categorySlug]}
                    onOrder={(selection) => {
                      setOrderSelection({
                        productName: product.name,
                        color: selection.color,
                        memory: selection.memory,
                        simType: selection.simType
                      });
                      setActiveModal("order");
                    }}
                    onAddToCart={(selection) => addToCart(product, selection)}
                    onOpenDetails={(selection) => {
                      const variants = product.variants ?? [];
                      const isIphoneCategory = isIphoneLikeSlug(product.categorySlug);
                      if (variants.length) {
                        setSelectedProductColor(selection.color ?? variants[0]?.color ?? "");
                        if (isIphoneCategory) {
                          setSelectedProductMemory(selection.memory ?? variants[0]?.memory ?? "");
                          setSelectedProductSim(selection.simType ?? variants[0]?.simType ?? "");
                        } else {
                          setSelectedProductMemory("");
                          setSelectedProductSim("");
                        }
                      } else {
                        setSelectedProductColor(selection.color ?? product.color ?? "");
                        setSelectedProductMemory("");
                        setSelectedProductSim("");
                      }
                      setSelectedProduct(product);
                      setActiveModal("product");
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500">
                По вашему запросу товары не найдены.
              </div>
            )}
          </section>
        ) : null}
          </>
        ) : null}
      </main>

      <footer className="mt-14 bg-[#111217] text-zinc-300">
        <div className="mx-auto grid w-full max-w-[1920px] grid-cols-1 gap-8 px-4 py-12 min-[640px]:grid-cols-2 min-[640px]:px-6 min-[640px]:py-14 min-[960px]:grid-cols-4 min-[960px]:px-8 min-[960px]:py-16 min-[1440px]:px-12 min-[1920px]:px-16">
          <div>
            <div className="mb-6 text-3xl font-bold text-white min-[640px]:mb-8 min-[640px]:text-4xl">
              <span className="text-red-500">X</span> : STORE
            </div>
            <p className="text-sm text-zinc-500">ИП ИНН</p>
            <div className="mt-8 space-y-2 text-sm text-zinc-500 min-[640px]:mt-14">
              <Link href="/policy" className="block hover:text-zinc-300">
                Политика конфиденциальности
              </Link>
              <Link href="/offer" className="block hover:text-zinc-300">
                Публичная оферта
              </Link>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase text-zinc-500">Каталог</h4>
            <ul className="space-y-2 text-sm">
              {storeData.categories.map((item) => (
                <li key={item.id}>
                  <Link href={`/catalog/${item.slug}`} className="transition hover:text-zinc-100">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase text-zinc-500">Меню</h4>
            <ul className="space-y-2 text-sm">
              {quickLinks.map((item) => (
                <li key={item}>
                  {item === "Доставка и оплата" ? (
                    <Link href="/info#delivery" className="transition hover:text-zinc-100">
                      {item}
                    </Link>
                  ) : item === "Возврат и обмен" ? (
                    <Link href="/info#return" className="transition hover:text-zinc-100">
                      {item}
                    </Link>
                  ) : item === "Гарантия и проверка" ? (
                    <Link href="/info#warranty" className="transition hover:text-zinc-100">
                      {item}
                    </Link>
                  ) : item === "Каталог" ? (
                    <Link href="/catalog" className="transition hover:text-zinc-100">
                      {item}
                    </Link>
                  ) : item === "Trade-in" ? (
                    <button type="button" className="transition hover:text-zinc-100" onClick={() => setActiveModal("tradein")}>
                      {item}
                    </button>
                  ) : item === "Выкуп" ? (
                    <Link href="/assessment" className="transition hover:text-zinc-100">
                      {item}
                    </Link>
                  ) : item === "Отзывы" ? (
                    <a
                      href="https://2gis.ru"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition hover:text-zinc-100"
                    >
                      {item}
                    </a>
                  ) : (
                    <span>{item}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase text-zinc-500">Контакты</h4>
            <p className="mb-2 text-xl font-semibold text-white">Омск, ул. Гагарина 3</p>
            <p className="mb-6 text-red-500">11:00 - 20:00</p>
            <p className="text-lg">+7 (923) 696-93-77</p>
            <p className="mb-5 text-lg">+7 (923) 686-93-77</p>
            <div className="flex gap-3">
              <a
                href="https://vk.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 transition hover:bg-zinc-700"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon/vk.svg" alt="VK" className="h-4.5 w-4.5" />
              </a>
              <a
                href="https://t.me"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 transition hover:bg-zinc-700"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon/telegram.svg" alt="Telegram" className="h-4.5 w-4.5" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      <div
        className={`fixed inset-0 z-50 bg-black/65 transition-opacity duration-300 min-[960px]:hidden ${
          mobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div
          className={`h-full w-[86%] max-w-sm overflow-y-auto bg-white px-5 py-5 transition-transform duration-300 ease-out min-[640px]:w-[82%] min-[640px]:px-7 min-[640px]:py-7 ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-6"
          }`}
        >
            <div className="mb-6 flex items-center justify-between min-[640px]:mb-8">
              <Link
                href="/"
                className="text-3xl font-bold tracking-tight text-zinc-950 min-[640px]:text-4xl"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="text-red-500">X</span> : STORE
              </Link>
              <button
                type="button"
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-zinc-900"
                aria-label="Закрыть меню"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="absolute h-0.5 w-5 rotate-45 rounded-full bg-current" />
                <span className="absolute h-0.5 w-5 -rotate-45 rounded-full bg-current" />
              </button>
            </div>

            <div className="space-y-4 text-[1.35rem] font-semibold leading-none text-zinc-900 min-[390px]:text-[1.5rem] min-[640px]:space-y-5 min-[640px]:text-[1.7rem]">
              <Link
                className="flex items-center gap-3 text-red-500"
                href="/catalog"
                onClick={() => setMobileMenuOpen(false)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon/catalog.svg" alt="" aria-hidden="true" className="h-5.5 w-5.5 min-[640px]:h-6 min-[640px]:w-6" />
                <span className="text-zinc-900">Каталог</span>
              </Link>
              <button
                className="block text-left"
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setActiveModal("tradein");
                }}
              >
                Trade-in
              </button>
              <Link className="block text-left" href="/assessment" onClick={() => setMobileMenuOpen(false)}>
                Выкуп
              </Link>
              <button
                className="block text-left"
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setActiveModal("reviews");
                }}
              >
                Отзывы
              </button>
              <a className="block" href="#">
                Статьи
              </a>
            </div>

            <div className="mt-6 space-y-2 text-sm text-zinc-600 min-[390px]:text-base min-[640px]:mt-8 min-[640px]:text-lg">
              <Link href="/info#delivery" className="block" onClick={() => setMobileMenuOpen(false)}>
                Доставка и оплата
              </Link>
              <Link href="/info#return" className="block" onClick={() => setMobileMenuOpen(false)}>
                Возврат и обмен
              </Link>
              <Link href="/info#warranty" className="block" onClick={() => setMobileMenuOpen(false)}>
                Гарантия и проверка
              </Link>
            </div>

            <div className="mt-6 space-y-1 text-[1.25rem] font-semibold leading-tight text-zinc-900 min-[390px]:text-[1.4rem] min-[640px]:mt-8 min-[640px]:text-[1.6rem]">
              <p>+7 (923) 696-93-77</p>
              <p>+7 (923) 686-93-77</p>
            </div>

            <div className="mt-5 min-[640px]:mt-7">
              <p className="text-[1.25rem] font-semibold leading-tight text-red-500 min-[390px]:text-[1.4rem] min-[640px]:text-[1.6rem]">Омск, ул. Гагарина 3</p>
              <p className="mt-1 text-[1.25rem] font-semibold leading-tight text-red-500 min-[390px]:text-[1.4rem] min-[640px]:text-[1.6rem]">11:00 - 20:00</p>
            </div>

            <div className="mt-6 flex gap-3 min-[640px]:mt-8 min-[640px]:gap-4">
              <a
                href="https://vk.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 min-[640px]:h-14 min-[640px]:w-14"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon/vk.svg" alt="VK" className="h-5.5 w-5.5 min-[640px]:h-6 min-[640px]:w-6" />
              </a>
              <a
                href="https://t.me"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 min-[640px]:h-14 min-[640px]:w-14"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon/telegram.svg" alt="Telegram" className="h-5.5 w-5.5 min-[640px]:h-6 min-[640px]:w-6" />
              </a>
            </div>
        </div>
      </div>

      {modal}

      {leadNotice ? (
        <div className="pointer-events-none fixed right-4 top-4 z-[60] w-[calc(100%-2rem)] max-w-sm min-[640px]:right-6 min-[640px]:top-6">
          <div
            className={`pointer-events-auto rounded-2xl border px-4 py-3 text-sm shadow-xl ${
              leadNotice.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-red-200 bg-red-50 text-red-900"
            }`}
          >
            <div className="mb-1 flex items-center justify-between gap-3">
              <p className="font-semibold">{leadNotice.type === "success" ? "Заявка отправлена" : "Ошибка отправки"}</p>
              <button
                type="button"
                className="rounded-md px-1 text-base leading-none opacity-60 transition hover:opacity-100"
                onClick={() => setLeadNotice(null)}
                aria-label="Закрыть уведомление"
              >
                ×
              </button>
            </div>
            <p>{leadNotice.message}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}








