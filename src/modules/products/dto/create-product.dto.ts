import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { DimensionUnit } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({
    example: 'INOX-001',
  })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({
    example: 'Inox Dining Table',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: 'Table',
  })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiPropertyOptional({
    example: 'Stainless Steel',
  })
  @IsOptional()
  @IsString()
  material?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['Silver', 'Black'],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  colors?: string[];

  @ApiPropertyOptional({
    example: 120,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  length?: number;

  @ApiPropertyOptional({
    example: 60,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  width?: number;

  @ApiPropertyOptional({
    example: 75,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  height?: number;

  @ApiPropertyOptional({
    enum: DimensionUnit,
    example: DimensionUnit.CM,
    default: DimensionUnit.CM,
  })
  @IsOptional()
  @IsEnum(DimensionUnit)
  dimensionUnit?: DimensionUnit;

  @ApiPropertyOptional({
    example: 18,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiProperty({
    example: 350000,
  })
  @IsNumber()
  @IsPositive()
  basePrice!: number;

  @ApiProperty({
    example: 'Piece',
  })
  @IsString()
  @IsNotEmpty()
  unit!: string;

  @ApiPropertyOptional({
    example: 'Heavy-duty restaurant table',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}