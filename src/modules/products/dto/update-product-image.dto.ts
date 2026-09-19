import {
    IsBoolean,
    IsInt,
    IsOptional,
    Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProductImageDto {
    @ApiPropertyOptional({
        example: 3,
        nullable: true,
    })
    @IsOptional()
    @IsInt()
    colorId?: number | null;

    @ApiPropertyOptional({
        example: 0,
    })
    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;

    @ApiPropertyOptional({
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    isPrimary?: boolean;
}