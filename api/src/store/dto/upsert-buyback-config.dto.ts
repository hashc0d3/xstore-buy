import { IsArray, IsString } from "class-validator";

export class UpsertBuybackConfigDto {
  @IsArray()
  @IsString({ each: true })
  models!: string[];

  @IsArray()
  @IsString({ each: true })
  memories!: string[];

  @IsArray()
  @IsString({ each: true })
  simTypes!: string[];

  @IsArray()
  @IsString({ each: true })
  conditions!: string[];
}
