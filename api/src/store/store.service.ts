import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, Product } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpsertProductDto } from "./dto/upsert-product.dto";

type StoreCategory = {
  id: string;
  slug: string;
  name: string;
  memoryOptions: string[];
};

type StoreProduct = {
  id: string;
  categorySlug: string;
  name: string;
  color?: string;
  description?: string;
  basePrice: number;
  memoryPrices?: Record<string, number>;
  variants?: Array<{
    color?: string;
    memory?: string;
    simType?: string;
    price: number;
    imageUrl?: string;
  }>;
  imageUrl: string;
};

type BuybackConfigPayload = {
  models: string[];
  memories: string[];
  simTypes: string[];
  conditions: string[];
};

@Injectable()
export class StoreService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureSeedData() {
    const count = await this.prisma.category.count();
    if (count === 0) {
      const categories = [
        { slug: "iphone", name: "iPhone", memoryOptions: ["256 ГБ", "512 ГБ", "1 ТБ"] },
        { slug: "macbook", name: "MacBook", memoryOptions: ["256 ГБ", "512 ГБ", "1 ТБ"] },
        { slug: "apple-watch", name: "Apple Watch", memoryOptions: [] },
        { slug: "ipad", name: "iPad", memoryOptions: ["128 ГБ", "256 ГБ", "512 ГБ"] },
        { slug: "airpods", name: "AirPods", memoryOptions: [] },
        { slug: "custom", name: "Под заказ", memoryOptions: [] }
      ];

      for (const category of categories) {
        await this.prisma.category.create({
          data: {
            slug: category.slug,
            name: category.name,
            memoryOptions: category.memoryOptions.join("|")
          }
        });
      }
    }

    await this.prisma.buybackConfig.upsert({
      where: { id: "main" },
      create: {
        id: "main",
        models: "iPhone 11|iPhone 12|iPhone 13|iPhone 14|iPhone 15|iPhone 16",
        memories: "64 ГБ|128 ГБ|256 ГБ|512 ГБ|1 ТБ",
        simTypes: "eSIM|nano-SIM|eSIM + nano-SIM",
        conditions: "Отличное|Хорошее|Среднее|Плохое"
      },
      update: {}
    });
  }

  async getStoreData() {
    const categories = await this.prisma.category.findMany({
      orderBy: { createdAt: "asc" }
    });
    const products = await this.prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" }
    });
    const buyback = await this.prisma.buybackConfig.findUnique({
      where: { id: "main" }
    });

    return {
      categories: categories.map((item) => this.toCategory(item)),
      products: products.map((item) => this.toProduct(item)),
      buybackConfig: this.toBuybackConfig(buyback)
    };
  }

  async getBuybackConfig(): Promise<BuybackConfigPayload> {
    const buyback = await this.prisma.buybackConfig.findUnique({
      where: { id: "main" }
    });
    return this.toBuybackConfig(buyback);
  }

  async upsertBuybackConfig(input: BuybackConfigPayload): Promise<BuybackConfigPayload> {
    const models = this.normalizeOptionList(input.models);
    const memories = this.normalizeOptionList(input.memories);
    const simTypes = this.normalizeOptionList(input.simTypes);
    const conditions = this.normalizeOptionList(input.conditions);
    const saved = await this.prisma.buybackConfig.upsert({
      where: { id: "main" },
      create: {
        id: "main",
        models: models.join("|"),
        memories: memories.join("|"),
        simTypes: simTypes.join("|"),
        conditions: conditions.join("|")
      },
      update: {
        models: models.join("|"),
        memories: memories.join("|"),
        simTypes: simTypes.join("|"),
        conditions: conditions.join("|")
      }
    });
    return this.toBuybackConfig(saved);
  }

  async createCategory(dto: CreateCategoryDto): Promise<StoreCategory> {
    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException("Название категории не может быть пустым");
    }
    const slug = this.createSlug(name);

    const created = await this.prisma.category.create({
      data: {
        name,
        slug,
        memoryOptions: (dto.memoryOptions ?? []).filter(Boolean).join("|")
      }
    });
    return this.toCategory(created);
  }

  async upsertProduct(dto: UpsertProductDto): Promise<StoreProduct> {
    const category = await this.prisma.category.findUnique({
      where: { slug: dto.categorySlug }
    });
    if (!category) {
      throw new NotFoundException("Категория не найдена");
    }

    const payload: Prisma.ProductUncheckedCreateInput = {
      name: dto.name.trim(),
      categoryId: category.id,
      color: dto.color?.trim() || null,
      description: dto.description?.trim() || null,
      basePrice: Number(dto.basePrice),
      memoryPrices: this.normalizePricingPayload(dto.memoryPrices, dto.variants) as Prisma.InputJsonValue,
      imageUrl:
        dto.imageUrl?.trim() || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80"
    };

    let saved: Product;
    if (dto.id) {
      saved = await this.prisma.product.update({
        where: { id: dto.id },
        data: payload
      });
    } else {
      saved = await this.prisma.product.create({
        data: payload
      });
    }

    return this.toProduct({ ...saved, category });
  }

  async removeProduct(id: string): Promise<void> {
    await this.prisma.product.delete({ where: { id } });
  }

  private toCategory(item: { id: string; slug: string; name: string; memoryOptions: string | null }): StoreCategory {
    return {
      id: item.id,
      slug: item.slug,
      name: item.name,
      memoryOptions: item.memoryOptions ? item.memoryOptions.split("|").filter(Boolean) : []
    };
  }

  private toProduct(
    item: Product & { category: { slug: string } }
  ): StoreProduct {
    const { memoryPrices, variants } = this.readPricingPayload(item.memoryPrices);
    return {
      id: item.id,
      categorySlug: item.category.slug,
      name: item.name,
      color: item.color ?? undefined,
      description: item.description ?? undefined,
      basePrice: item.basePrice,
      memoryPrices: Object.keys(memoryPrices).length ? memoryPrices : undefined,
      variants: variants.length ? variants : undefined,
      imageUrl: item.imageUrl
    };
  }

  private toBuybackConfig(item: { models: string; memories: string; simTypes: string; conditions: string } | null): BuybackConfigPayload {
    if (!item) {
      return {
        models: ["iPhone 11", "iPhone 12", "iPhone 13", "iPhone 14", "iPhone 15", "iPhone 16"],
        memories: ["64 ГБ", "128 ГБ", "256 ГБ", "512 ГБ", "1 ТБ"],
        simTypes: ["eSIM", "nano-SIM", "eSIM + nano-SIM"],
        conditions: ["Отличное", "Хорошее", "Среднее", "Плохое"]
      };
    }
    return {
      models: this.fromPipeSeparated(item.models),
      memories: this.fromPipeSeparated(item.memories),
      simTypes: this.fromPipeSeparated(item.simTypes),
      conditions: this.fromPipeSeparated(item.conditions)
    };
  }

  private fromPipeSeparated(value: string): string[] {
    return value
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private normalizeOptionList(input: string[]): string[] {
    return Array.from(
      new Set(
        input
          .map((item) => item.trim())
          .filter(Boolean)
      )
    );
  }

  private normalizeMemoryPrices(input?: Record<string, number>): Record<string, number> {
    const map: Record<string, number> = {};
    if (!input) return map;
    for (const [key, value] of Object.entries(input)) {
      const parsed = Number(value);
      if (key && Number.isFinite(parsed)) {
        map[key] = parsed;
      }
    }
    return map;
  }

  private normalizeVariants(input?: Array<{ color?: string; memory?: string; simType?: string; price: number; imageUrl?: string }>) {
    const normalized: Array<{ color?: string; memory?: string; simType?: string; price: number; imageUrl?: string }> = [];
    if (!input?.length) return normalized;
    for (const item of input) {
      const price = Number(item.price);
      if (!Number.isFinite(price)) continue;
      normalized.push({
        color: item.color?.trim() || undefined,
        memory: item.memory?.trim() || undefined,
        simType: item.simType?.trim() || undefined,
        price,
        imageUrl: item.imageUrl?.trim() || undefined
      });
    }
    return normalized;
  }

  private normalizePricingPayload(
    memoryPrices?: Record<string, number>,
    variants?: Array<{ color?: string; memory?: string; simType?: string; price: number; imageUrl?: string }>
  ): Prisma.JsonValue | null {
    const normalizedVariants = this.normalizeVariants(variants);
    if (normalizedVariants.length) {
      return { variants: normalizedVariants };
    }
    const normalizedMemoryPrices = this.normalizeMemoryPrices(memoryPrices);
    return Object.keys(normalizedMemoryPrices).length ? normalizedMemoryPrices : null;
  }

  private readPricingPayload(input: Prisma.JsonValue | null): {
    memoryPrices: Record<string, number>;
    variants: Array<{ color?: string; memory?: string; simType?: string; price: number; imageUrl?: string }>;
  } {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return { memoryPrices: {}, variants: [] };
    }

    const rawObject = input as Record<string, unknown>;
    const memoryPrices: Record<string, number> = {};
    for (const [key, value] of Object.entries(rawObject)) {
      if (key === "variants") continue;
      const parsed = Number(value);
      if (key && Number.isFinite(parsed)) {
        memoryPrices[key] = parsed;
      }
    }

    const variants: Array<{ color?: string; memory?: string; simType?: string; price: number; imageUrl?: string }> = [];
    if (Array.isArray(rawObject.variants)) {
      for (const item of rawObject.variants) {
        if (!item || typeof item !== "object") continue;
        const candidate = item as Record<string, unknown>;
        const parsedPrice = Number(candidate.price);
        if (!Number.isFinite(parsedPrice)) continue;
        variants.push({
          color: typeof candidate.color === "string" ? candidate.color.trim() || undefined : undefined,
          memory: typeof candidate.memory === "string" ? candidate.memory.trim() || undefined : undefined,
          simType: typeof candidate.simType === "string" ? candidate.simType.trim() || undefined : undefined,
          price: parsedPrice,
          imageUrl: typeof candidate.imageUrl === "string" ? candidate.imageUrl.trim() || undefined : undefined
        });
      }
    }

    return { memoryPrices, variants };
  }

  private createSlug(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9а-яё]+/gi, "-")
      .replace(/^-+|-+$/g, "");
  }
}
