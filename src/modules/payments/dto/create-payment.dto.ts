import {
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    Min,
    IsPositive,
    IsEnum,
} from 'class-validator';

import {
    ApiProperty,
    ApiPropertyOptional,
} from '@nestjs/swagger';

import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
    @ApiProperty({
        example: 1,
    })
    @IsInt()
    @Min(1)
    orderId!: number;

    @ApiProperty({
        example: 15000000.800,
    })
    @IsNumber()
    @IsPositive()
    amount!: number;

    @ApiProperty({
        enum: PaymentMethod,
        example: PaymentMethod.CASH,
    })
    @IsEnum(PaymentMethod)
    paymentMethod!: PaymentMethod;

    @ApiPropertyOptional({
        example: 'First payment',
    })
    @IsOptional()
    @IsString()
    notes?: string;
}