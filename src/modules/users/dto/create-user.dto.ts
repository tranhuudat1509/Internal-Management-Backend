import {
    IsBoolean,
    IsOptional,
    IsString,
    Length,
} from 'class-validator';

export class CreateUserDto {

    @IsString()
    @Length(1, 100)
    name!: string;

    @IsString()
    @Length(3, 20)
    username!: string;

    @IsString()
    @Length(6, 50)
    password!: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

}