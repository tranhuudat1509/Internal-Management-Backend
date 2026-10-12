import {
    IsInt,
    IsOptional,
    Min,
} from 'class-validator';

import {
    ApiProperty,
    ApiPropertyOptional,
} from '@nestjs/swagger';

export class CreateOrderItemDto {

    @ApiProperty({
        example: 1,
    })
    @IsInt()
    @Min(1)
    orderId!: number;

    @ApiProperty({
        example: 2,
    })
    @IsInt()
    @Min(1)
    productId!: number;

    @ApiPropertyOptional({
        example: 5,
        description:
            'Selected product color ID. Leave empty when the product has no color selection.',
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    colorId?: number;

    @ApiProperty({
        example: 5,
    })
    @IsInt()
    @Min(1)
    quantity!: number;
}