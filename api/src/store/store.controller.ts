import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpsertBuybackConfigDto } from "./dto/upsert-buyback-config.dto";
import { UpsertProductDto } from "./dto/upsert-product.dto";
import { UpsertSliderPhotosDto } from "./dto/upsert-slider-photos.dto";
import { StoreService } from "./store.service";

@Controller("store")
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get()
  async getStoreData() {
    return this.storeService.getStoreData();
  }

  @Get("buyback")
  async getBuybackConfig() {
    return this.storeService.getBuybackConfig();
  }

  @Post("categories")
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.storeService.createCategory(dto);
  }

  @Post("products")
  async upsertProduct(@Body() dto: UpsertProductDto) {
    return this.storeService.upsertProduct(dto);
  }

  @Post("buyback")
  async upsertBuybackConfig(@Body() dto: UpsertBuybackConfigDto) {
    return this.storeService.upsertBuybackConfig(dto);
  }

  @Post("slider")
  async upsertSliderPhotos(@Body() dto: UpsertSliderPhotosDto) {
    return this.storeService.upsertSliderPhotos(dto);
  }

  @Delete("products/:id")
  async removeProduct(@Param("id") id: string) {
    await this.storeService.removeProduct(id);
    return { ok: true };
  }
}
