import {
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    Min,
    IsPositive,
    IsEnum,
    IsDateString,
} from 'class-validator';

import {
    ApiProperty,
    ApiPropertyOptional,
} from '@nestjs/swagger';

import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
    @ApiProperty({
        example: 1,
        description: 'ID of the customer making this payment.',
    })
    @IsInt()
    @Min(1)
    customerId!: number;

    @ApiProperty({
        example: 1500000,
        description: 'Amount paid by the customer.',
    })
    @IsNumber()
    @IsPositive()
    amount!: number;

    @ApiProperty({
        enum: PaymentMethod,
        example: PaymentMethod.BANK_TRANSFER,
        description: 'Payment method used.',
    })
    @IsEnum(PaymentMethod)
    paymentMethod!: PaymentMethod;

    @ApiPropertyOptional({
        example: '2026-09-27T00:00:00.000Z',
        description: 'Date when the payment was received.',
    })
    @IsOptional()
    @IsDateString()
    paymentDate?: string;

    @ApiPropertyOptional({
        example: 'Thanh toán công nợ tháng 9',
        description: 'Optional notes about this payment.',
    })
    @IsOptional()
    @IsString()
    notes?: string;
}