import { IsArray, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateCategoryDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(600000)
  imageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memoryOptions?: string[];
}
