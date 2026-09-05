import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  ValidateNested,
  IsNotEmpty,
  ArrayMinSize,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Type } from 'class-transformer';

class CreateCustomerContactDto {
  @ApiProperty({
    example: 'Mr. Tran',
    description: 'Name of the contact person',
  })
  @IsString()
  @IsNotEmpty()
  contactName!: string;

  @ApiPropertyOptional({
    example: '0909123456',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: 'tran@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class CreateCustomerDto {

  @ApiProperty({
    example: 'Dai Truong Thanh Furniture',
  })
  @IsString()
  @IsNotEmpty()
  companyName!: string;

  @ApiPropertyOptional({
    example: 'Ho Chi Minh City',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    example: '123 Nguyen Trai',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    example: 'Long-term customer',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    type: [CreateCustomerContactDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateCustomerContactDto)
  contacts!: CreateCustomerContactDto[];
}