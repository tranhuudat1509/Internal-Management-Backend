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
        description: 'ID of the order receiving this payment.',
    })
    @IsInt()
    @Min(1)
    orderId!: number;

    @ApiProperty({
        example: 1500000,
        description: 'Amount paid by the customer.',
    })
    @IsNumber()
    @IsPositive()
    amount!: number;

    @ApiProperty({
        enum: PaymentMethod,
        example: PaymentMethod.CASH,
        description: 'Payment method used.',
    })
    @IsEnum(PaymentMethod)
    paymentMethod!: PaymentMethod;

    @ApiPropertyOptional({
        example: 'First payment',
        description: 'Optional notes about this payment.',
    })
    @IsOptional()
    @IsString()
    notes?: string;
}