import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from '../../products/dto/create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {}
