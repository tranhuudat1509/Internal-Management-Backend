import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  Min,
  IsPositive,
  ArrayMinSize,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @ApiProperty({
    example: 3,
  })
  @IsInt()
  @Min(1)
  productId!: number;

  @ApiProperty({
    example: 3,
  })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({
    example: 3,
  })
  @IsNumber()
  @IsPositive()
  unitPrice!: number;
}

export class CreateOrderDto {
  @ApiProperty({
    example: 3,
  })
  @IsInt()
  @Min(1)
  customerId!: number;

  @ApiPropertyOptional({
    example: 'Deliver after lunch',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    example: 50000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiProperty({
    example: [
      {
        productId: 1,
        quantity: 2,
        unitPrice: 500000,
      },
    ],
  })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  @IsArray()
  @ArrayMinSize(1)
  items!: CreateOrderItemDto[];
}
