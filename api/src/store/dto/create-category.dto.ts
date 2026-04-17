import { IsArray, IsOptional, IsString } from "class-validator";

export class CreateCategoryDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memoryOptions?: string[];
}
