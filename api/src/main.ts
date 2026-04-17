import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { json, urlencoded } from "express";
import { AppModule } from "./app.module";
import { StoreService } from "./store/store.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(json({ limit: "20mb" }));
  app.use(urlencoded({ extended: true, limit: "20mb" }));
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(",").map((item) => item.trim()) ?? ["http://localhost:3000"],
    credentials: true
  });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const storeService = app.get(StoreService);
  await storeService.ensureSeedData();

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
