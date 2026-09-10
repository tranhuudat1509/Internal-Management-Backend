import {
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  Min,
  ArrayMinSize,
  IsBoolean,
  IsEnum,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Type } from 'class-transformer';

import { OrderStatus } from '@prisma/client';

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
}

export class CreateOrderDto {
  @ApiProperty({
    example: 3,
  })
  @IsInt()
  @Min(1)
  customerId!: number;

  @ApiPropertyOptional({
    example: '2026-08-05T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  orderDate?: string;

  @ApiPropertyOptional({
    enum: OrderStatus,
    example: OrderStatus.IN_PROGRESS,
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

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
      },
    ],
  })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  @IsArray()
  @ArrayMinSize(1)
  items!: CreateOrderItemDto[];
}
