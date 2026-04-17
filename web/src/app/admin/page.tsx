"use client";

import Link from "next/link";
import { ChangeEvent, DragEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { createCategory, deleteProduct, fetchStoreData, fileToDataUrl, upsertProduct } from "@/lib/api";
import { Product, ProductVariant, StoreData, defaultStoreData, toRub } from "@/lib/store";

function createSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

const IPHONE_CATEGORY_SLUG = "iphone";

export default function AdminPage() {
  const [data, setData] = useState<StoreData>(defaultStoreData);
  const [categoryName, setCategoryName] = useState("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productFormError, setProductFormError] = useState("");
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productCategory, setProductCategory] = useState(defaultStoreData.categories[0]?.slug ?? "");
  const [newColorName, setNewColorName] = useState("");
  const [newMemoryOption, setNewMemoryOption] = useState("");
  const [newSimOption, setNewSimOption] = useState("");
  const [productColors, setProductColors] = useState<string[]>([]);
  const [productMemoryOptions, setProductMemoryOptions] = useState<string[]>([]);
  const [productSimOptions, setProductSimOptions] = useState<string[]>([]);
  const [productExistingImage, setProductExistingImage] = useState("");
  const [productColorImages, setProductColorImages] = useState<Record<string, string>>({});
  const [productColorImageNames, setProductColorImageNames] = useState<Record<string, string>>({});
  const [productVariants, setProductVariants] = useState<
    Array<{ color: string; memory: string; simType: string; price: string }>
  >([{ color: "", memory: "", simType: "", price: "" }]);

  const categories = data.categories;
  const products = data.products;
  const isIphoneCategory = productCategory === IPHONE_CATEGORY_SLUG;

  const productsByCategory = useMemo(() => {
    return categories.map((cat) => ({
      category: cat,
      items: products.filter((product) => product.categorySlug === cat.slug)
    }));
  }, [categories, products]);

  const syncStoreData = async () => {
    const remote = await fetchStoreData();
    setData(remote);
    setProductCategory((prev) => prev || remote.categories[0]?.slug || "");
  };

  useEffect(() => {
    let isMounted = true;
    void fetchStoreData().then((remoteStore) => {
      if (!isMounted) return;
      setData(remoteStore);
      setProductCategory((prev) => prev || remoteStore.categories[0]?.slug || "");
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isIphoneCategory) return;
    setProductMemoryOptions([]);
    setProductSimOptions([]);
    setNewMemoryOption("");
    setNewSimOption("");
    setProductVariants((prev) => prev.map((item) => ({ ...item, memory: "", simType: "" })));
  }, [isIphoneCategory]);

  const onCategorySubmit = (e: FormEvent) => {
    e.preventDefault();
    const name = categoryName.trim();
    if (!name) return;

    const slug = createSlug(name);
    if (!slug) return;
    if (categories.some((item) => item.slug === slug)) return;

    void createCategory({ name }).then(syncStoreData);
    setCategoryName("");
    setProductCategory((prev) => prev || slug);
  };

  const mapVariantsToForm = (variants?: ProductVariant[]) => {
    if (!variants?.length) {
      return [{ color: "", memory: "", simType: "", price: "" }];
    }
    return variants.map((variant) => ({
      color: variant.color ?? "",
      memory: variant.memory ?? "",
      simType: variant.simType ?? "",
      price: String(variant.price)
    }));
  };

  const addVariantRow = () => {
    setProductVariants((prev) => [
      ...prev,
      {
        color: productColors[0] ?? "",
        memory: isIphoneCategory ? (productMemoryOptions[0] ?? "") : "",
        simType: isIphoneCategory ? (productSimOptions[0] ?? "") : "",
        price: ""
      }
    ]);
  };

  const removeVariantRow = (index: number) => {
    setProductVariants((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const updateVariantRow = (
    index: number,
    patch: Partial<{ color: string; memory: string; simType: string; price: string }>
  ) => {
    setProductVariants((prev) => prev.map((row, idx) => (idx === index ? { ...row, ...patch } : row)));
  };

  const saveColorImage = async (color: string, file: File) => {
    try {
      const dataUrl = await fileToDataUrl(file);
      setProductColorImages((prev) => ({ ...prev, [color]: dataUrl }));
      setProductColorImageNames((prev) => ({ ...prev, [color]: file.name }));
    } catch {
      // Ignore image read errors and keep previous value.
    }
  };

  const addProductColor = () => {
    const color = newColorName.trim();
    if (!color) return;
    if (productColors.includes(color)) {
      setNewColorName("");
      return;
    }
    setProductColors((prev) => [...prev, color]);
    setProductVariants((prev) =>
      prev.map((item, index) => (index === 0 && !item.color ? { ...item, color } : item))
    );
    setNewColorName("");
  };

  const addProductMemoryOption = () => {
    const option = newMemoryOption.trim();
    if (!option) return;
    if (productMemoryOptions.includes(option)) {
      setNewMemoryOption("");
      return;
    }
    setProductMemoryOptions((prev) => [...prev, option]);
    setProductVariants((prev) =>
      prev.map((item, index) => (index === 0 && !item.memory ? { ...item, memory: option } : item))
    );
    setNewMemoryOption("");
  };

  const addProductSimOption = () => {
    const option = newSimOption.trim();
    if (!option) return;
    if (productSimOptions.includes(option)) {
      setNewSimOption("");
      return;
    }
    setProductSimOptions((prev) => [...prev, option]);
    setProductVariants((prev) =>
      prev.map((item, index) => (index === 0 && !item.simType ? { ...item, simType: option } : item))
    );
    setNewSimOption("");
  };

  const removeProductColor = (colorToRemove: string) => {
    const nextColors = productColors.filter((color) => color !== colorToRemove);
    setProductColors(nextColors);
    setProductColorImages((prev) => {
      if (!prev[colorToRemove]) return prev;
      const copy = { ...prev };
      delete copy[colorToRemove];
      return copy;
    });
    setProductColorImageNames((prev) => {
      if (!prev[colorToRemove]) return prev;
      const copy = { ...prev };
      delete copy[colorToRemove];
      return copy;
    });
    setProductVariants((prev) =>
      prev.map((variant) => {
        if (variant.color !== colorToRemove) return variant;
        return { ...variant, color: nextColors[0] ?? "" };
      })
    );
  };

  const removeProductMemoryOption = (optionToRemove: string) => {
    const nextOptions = productMemoryOptions.filter((option) => option !== optionToRemove);
    setProductMemoryOptions(nextOptions);
    setProductVariants((prev) =>
      prev.map((variant) => {
        if (variant.memory !== optionToRemove) return variant;
        return { ...variant, memory: nextOptions[0] ?? "" };
      })
    );
  };

  const removeProductSimOption = (optionToRemove: string) => {
    const nextOptions = productSimOptions.filter((option) => option !== optionToRemove);
    setProductSimOptions(nextOptions);
    setProductVariants((prev) =>
      prev.map((variant) => {
        if (variant.simType !== optionToRemove) return variant;
        return { ...variant, simType: nextOptions[0] ?? "" };
      })
    );
  };

  const onColorImageInputChange =
    (color: string) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      void saveColorImage(color, file);
    };

  const onColorImageDrop =
    (color: string) =>
    (e: DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      void saveColorImage(color, file);
    };

  const resetProductForm = () => {
    setEditingProductId(null);
    setProductFormError("");
    setProductName("");
    setProductDescription("");
    setNewColorName("");
    setNewMemoryOption("");
    setNewSimOption("");
    setProductColors([]);
    setProductMemoryOptions([]);
    setProductSimOptions([]);
    setProductExistingImage("");
    setProductColorImages({});
    setProductColorImageNames({});
    setProductVariants([{ color: "", memory: "", simType: "", price: "" }]);
  };

  const startEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setProductFormError("");
    setProductName(product.name);
    setProductDescription(product.description ?? "");
    setProductCategory(product.categorySlug);
    setNewColorName("");
    setNewMemoryOption("");
    setNewSimOption("");
    setProductExistingImage(product.imageUrl);
    setProductVariants(
      mapVariantsToForm(
        product.variants?.length
          ? product.variants
          : [
              {
                color: product.color,
                price: product.basePrice,
                imageUrl: product.imageUrl
              }
            ]
      )
    );
    const colorImages: Record<string, string> = {};
    const colorImageNames: Record<string, string> = {};
    for (const variant of product.variants ?? []) {
      const color = variant.color?.trim();
      const image = variant.imageUrl?.trim();
      if (!color || !image || colorImages[color]) continue;
      colorImages[color] = image;
      colorImageNames[color] = "Загружено ранее";
    }
    if (product.color && !colorImages[product.color] && product.imageUrl) {
      colorImages[product.color] = product.imageUrl;
      colorImageNames[product.color] = "Текущее изображение товара";
    }
    const colors = Array.from(
      new Set(
        (product.variants?.length
          ? product.variants.map((item) => item.color ?? "")
          : [product.color ?? ""])
          .map((item) => item.trim())
          .filter(Boolean)
      )
    );
    const memoryOptions = Array.from(
      new Set((product.variants ?? []).map((item) => (item.memory ?? "").trim()).filter(Boolean))
    );
    const simOptions = Array.from(
      new Set((product.variants ?? []).map((item) => (item.simType ?? "").trim()).filter(Boolean))
    );
    setProductColors(colors);
    setProductMemoryOptions(memoryOptions);
    setProductSimOptions(simOptions);
    setProductColorImages(colorImages);
    setProductColorImageNames(colorImageNames);
  };

  const onProductSubmit = (e: FormEvent) => {
    e.preventDefault();
    setProductFormError("");
    const name = productName.trim();
    const description = productDescription.trim();
    const categorySlug = productCategory;
    const defaultImageUrl =
      productExistingImage.trim() ||
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80";
    const variants: Array<{ color?: string; memory?: string; simType?: string; price: number; imageUrl?: string }> = [];
    for (const item of productVariants) {
      const price = Number(item.price);
      if (Number.isNaN(price)) continue;
      const color = item.color.trim();
      const colorImage = color ? productColorImages[color] : undefined;
      variants.push({
        color: color || undefined,
        memory: isIphoneCategory ? (item.memory.trim() || undefined) : undefined,
        simType: isIphoneCategory ? (item.simType.trim() || undefined) : undefined,
        price,
        imageUrl: colorImage || defaultImageUrl
      });
    }
    const basePrice = variants.length
      ? Math.min(...variants.map((item) => item.price))
      : Number.NaN;
    const imageUrl = variants[0]?.imageUrl ?? defaultImageUrl;
    const requiredColors = productColors.map((item) => item.trim()).filter(Boolean);
    const missingColorImages = requiredColors.filter((color) => !productColorImages[color] && !productExistingImage.trim());
    const hasVariantWithoutColor = productVariants.some((item) => Boolean(item.price.trim()) && !item.color.trim());
    const hasVariantWithoutMemory = isIphoneCategory && productMemoryOptions.length
      ? productVariants.some((item) => Boolean(item.price.trim()) && !item.memory.trim())
      : false;
    const hasVariantWithoutSim = isIphoneCategory && productSimOptions.length
      ? productVariants.some((item) => Boolean(item.price.trim()) && !item.simType.trim())
      : false;

    if (!name || !categorySlug || Number.isNaN(basePrice)) {
      setProductFormError("Заполните название, категорию и цену хотя бы у одного варианта.");
      return;
    }
    if (!requiredColors.length) {
      setProductFormError("Сначала добавьте хотя бы один цвет товара.");
      return;
    }
    if (hasVariantWithoutColor) {
      setProductFormError("Укажите цвет для каждого варианта с ценой.");
      return;
    }
    if (hasVariantWithoutMemory) {
      setProductFormError("Укажите объем памяти для каждого варианта с ценой.");
      return;
    }
    if (hasVariantWithoutSim) {
      setProductFormError("Укажите тип SIM для каждого варианта с ценой.");
      return;
    }
    if (missingColorImages.length) {
      setProductFormError(`Загрузите фото для цветов: ${missingColorImages.join(", ")}.`);
      return;
    }

    void upsertProduct({
      id: editingProductId ?? undefined,
      name,
      color: variants[0]?.color,
      description: description || undefined,
      categorySlug,
      basePrice,
      variants: variants.length ? variants : undefined,
      imageUrl
    }).then(syncStoreData);

    resetProductForm();
  };

  const removeProduct = (id: string) => {
    void deleteProduct(id)
      .then(syncStoreData)
      .catch(() => {
        setProductFormError("Не удалось удалить товар. Проверьте, что API запущен и попробуйте еще раз.");
      });
  };

  return (
    <div className="min-h-screen bg-zinc-100 px-6 py-8 text-zinc-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Админка X:STORE</h1>
            <p className="text-sm text-zinc-500">Категории и товары витрины</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/buyback" className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700">
              Выкуп
            </Link>
            <Link href="/" className="rounded-xl bg-zinc-900 px-4 py-2 text-white">
              На сайт
            </Link>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Добавить категорию</h2>
            <form onSubmit={onCategorySubmit} className="space-y-3">
              <input
                className="field"
                placeholder="Название категории (например, iPhone)"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
              <button type="submit" className="btn-primary">
                Сохранить категорию
              </button>
            </form>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Добавить товар</h2>
            <form onSubmit={onProductSubmit} className="space-y-3">
              <input
                className="field"
                placeholder="Название товара"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
              <textarea
                className="field min-h-24 resize-y"
                placeholder="Полное описание товара"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
              />
              <select className="field" value={productCategory} onChange={(e) => setProductCategory(e.target.value)}>
                {categories.map((item) => (
                  <option value={item.slug} key={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-sm font-semibold text-zinc-800">Цвета товара</p>
                <div className="flex gap-2">
                  <input
                    className="field"
                    placeholder="Добавить цвет (например, Natural Titanium)"
                    value={newColorName}
                    onChange={(e) => setNewColorName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addProductColor();
                      }
                    }}
                  />
                  <button type="button" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" onClick={addProductColor}>
                    Добавить
                  </button>
                </div>
                {productColors.length ? (
                  <div className="space-y-2">
                    {productColors.map((color) => (
                      <div key={color} className="rounded-lg border border-zinc-200 bg-white p-2.5">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-zinc-800">{color}</p>
                          <button
                            type="button"
                            className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600"
                            onClick={() => removeProductColor(color)}
                          >
                            Удалить цвет
                          </button>
                        </div>
                        <label
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={onColorImageDrop(color)}
                          className="block cursor-pointer rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-3 transition hover:border-zinc-400"
                        >
                          <input type="file" accept="image/*" className="hidden" onChange={onColorImageInputChange(color)} />
                          <p className="text-xs text-zinc-600">Перетащите фото сюда или нажмите для выбора</p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {productColorImageNames[color] ? `Файл: ${productColorImageNames[color]}` : "Файл не выбран"}
                          </p>
                          {productColorImages[color] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={productColorImages[color]}
                              alt={`Фото цвета ${color}`}
                              className="mt-2 h-16 w-16 rounded-md border border-zinc-200 object-cover"
                            />
                          ) : null}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">Сначала добавьте цвета, затем загрузите фото для каждого цвета.</p>
                )}
              </div>
              {isIphoneCategory ? (
                <>
                  <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                    <p className="text-sm font-semibold text-zinc-800">Набор объемов памяти</p>
                    <div className="flex gap-2">
                      <input
                        className="field"
                        placeholder="Добавить объем (например, 256 ГБ)"
                        value={newMemoryOption}
                        onChange={(e) => setNewMemoryOption(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addProductMemoryOption();
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                        onClick={addProductMemoryOption}
                      >
                        Добавить
                      </button>
                    </div>
                    {productMemoryOptions.length ? (
                      <div className="flex flex-wrap gap-2">
                        {productMemoryOptions.map((option) => (
                          <button
                            key={option}
                            type="button"
                            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700"
                            onClick={() => removeProductMemoryOption(option)}
                            title="Удалить объем"
                          >
                            {option} ×
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500">Добавьте объемы памяти, которые будут доступны в вариантах.</p>
                    )}
                  </div>
                  <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                    <p className="text-sm font-semibold text-zinc-800">Набор типов SIM</p>
                    <div className="flex gap-2">
                      <input
                        className="field"
                        placeholder="Добавить тип SIM (например, eSIM + nano-SIM)"
                        value={newSimOption}
                        onChange={(e) => setNewSimOption(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addProductSimOption();
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                        onClick={addProductSimOption}
                      >
                        Добавить
                      </button>
                    </div>
                    {productSimOptions.length ? (
                      <div className="flex flex-wrap gap-2">
                        {productSimOptions.map((option) => (
                          <button
                            key={option}
                            type="button"
                            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700"
                            onClick={() => removeProductSimOption(option)}
                            title="Удалить тип SIM"
                          >
                            {option} ×
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500">Добавьте типы SIM, которые будут доступны в вариантах.</p>
                    )}
                  </div>
                </>
              ) : null}
              <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-zinc-800">Варианты товара</p>
                  <button type="button" className="rounded-lg border border-zinc-300 px-2 py-1 text-xs" onClick={addVariantRow}>
                    + Добавить вариант
                  </button>
                </div>
                {productVariants.map((variant, index) => (
                  <div key={index} className="space-y-2 rounded-lg border border-zinc-200 bg-white p-2.5">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <select
                        className="field"
                        value={variant.color}
                        onChange={(e) => updateVariantRow(index, { color: e.target.value })}
                        disabled={!productColors.length}
                      >
                        <option value="">{productColors.length ? "Выберите цвет" : "Сначала добавьте цвета"}</option>
                        {productColors.map((color) => (
                          <option key={color} value={color}>
                            {color}
                          </option>
                        ))}
                      </select>
                      {isIphoneCategory ? (
                        <>
                          <select
                            className="field"
                            value={variant.memory}
                            disabled={!productMemoryOptions.length}
                            onChange={(e) => updateVariantRow(index, { memory: e.target.value })}
                          >
                            <option value="">{productMemoryOptions.length ? "Выберите объем памяти" : "Сначала добавьте объемы"}</option>
                            {productMemoryOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                          <select
                            className="field"
                            value={variant.simType}
                            disabled={!productSimOptions.length}
                            onChange={(e) => updateVariantRow(index, { simType: e.target.value })}
                          >
                            <option value="">{productSimOptions.length ? "Выберите тип SIM" : "Сначала добавьте типы SIM"}</option>
                            {productSimOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </>
                      ) : null}
                      <input
                        className="field"
                        type="number"
                        min={0}
                        placeholder="Цена варианта"
                        value={variant.price}
                        onChange={(e) => updateVariantRow(index, { price: e.target.value })}
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 disabled:opacity-50"
                        onClick={() => removeVariantRow(index)}
                        disabled={productVariants.length <= 1}
                      >
                        Удалить вариант
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-zinc-500">
                Для iPhone: создайте цвета, загрузите фото, добавьте наборы памяти и SIM. Для остальных категорий: только цвет, фото и цена варианта.
              </p>
              {productFormError ? <p className="text-sm font-medium text-red-600">{productFormError}</p> : null}
              <div className="flex items-center gap-2">
                <button type="submit" className="btn-primary">
                  {editingProductId ? "Сохранить изменения" : "Сохранить товар"}
                </button>
                {editingProductId ? (
                  <button
                    type="button"
                    className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700"
                    onClick={resetProductForm}
                  >
                    Отмена
                  </button>
                ) : null}
              </div>
            </form>
          </section>
        </div>

        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Товары по категориям</h2>
          <div className="space-y-6">
            {productsByCategory.map(({ category, items }) => (
              <div key={category.id}>
                <h3 className="mb-2 text-lg font-semibold">{category.name}</h3>
                {items.length ? (
                  <div className="grid gap-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-xl border p-3">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.description ? <p className="text-xs text-zinc-500">Описание: {item.description}</p> : null}
                          <p className="text-sm text-zinc-500">Базовая цена: {toRub(item.basePrice)}</p>
                          {item.variants?.length ? (
                            <div className="mt-1 space-y-1 text-xs text-zinc-500">
                              {item.variants.map((variant, index) => (
                                <p key={`${item.id}-${index}`}>
                                  {variant.color || "—"} / {variant.memory || "—"} / {variant.simType || "—"} — {toRub(variant.price)}
                                </p>
                              ))}
                            </div>
                          ) : item.memoryPrices ? (
                            <p className="text-xs text-zinc-500">
                              По памяти:{" "}
                              {Object.entries(item.memoryPrices)
                                .map(([memory, price]) => `${memory} — ${toRub(price)}`)
                                .join(", ")}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="rounded-lg border border-zinc-300 px-3 py-1 text-sm text-zinc-700"
                            onClick={() => startEditProduct(item)}
                          >
                            Редактировать
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-red-200 px-3 py-1 text-sm text-red-600"
                            onClick={() => removeProduct(item.id)}
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed p-3 text-sm text-zinc-500">Товаров нет</p>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
