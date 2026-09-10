import {
    IsInt,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
} from 'class-validator';

export class CreateCustomerProductPriceDto {

    @IsInt()
    customerId: number;

    @IsInt()
    productId: number;

    @IsNumber()
    @IsPositive()
    price: number;

    @IsOptional()
    @IsString()
    notes?: string;
}