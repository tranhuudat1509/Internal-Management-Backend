import {
    IsEmail,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
} from 'class-validator';

import {
    ApiProperty,
    ApiPropertyOptional,
} from '@nestjs/swagger';

export class CreateCustomerContactDto {
    @ApiProperty({
        example: 1,
        description: 'Customer ID this contact belongs to',
    })
    @IsInt()
    customerId!: number;

    @ApiProperty({
        example: 'Anh Hung',
    })
    @IsString()
    @IsNotEmpty()
    contactName!: string;

    @ApiPropertyOptional({
        example: '0909888777',
    })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({
        example: 'hung@gmail.com',
    })
    @IsOptional()
    @IsEmail()
    email?: string;
}