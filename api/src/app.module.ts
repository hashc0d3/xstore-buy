import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LeadsModule } from "./leads/leads.module";
import { PrismaModule } from "./prisma/prisma.module";
import { StoreModule } from "./store/store.module";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, StoreModule, LeadsModule]
})
export class AppModule {}
