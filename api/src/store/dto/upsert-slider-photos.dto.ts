import { Type } from "class-transformer";
import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from "class-validator";

class SliderPhotoDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  imageUrl!: string;

  @IsInt()
  @Min(0)
  position!: number;
}

export class UpsertSliderPhotosDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SliderPhotoDto)
  photos!: SliderPhotoDto[];
}
