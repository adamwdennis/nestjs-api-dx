import { ObjectType } from '@nestjs/graphql';
import { Paginated } from '@adamwdennis/nestjs-typeorm-cursor-pagination';
import { Product } from '../entities/product.entity';
import { Category } from '../entities/category.entity';

// Re-export PaginationArgs from library
export { PaginationArgs } from '@adamwdennis/nestjs-typeorm-cursor-pagination';

@ObjectType()
export class ProductConnection extends Paginated(Product, 'Product') {}

@ObjectType()
export class CategoryConnection extends Paginated(Category, 'Category') {}
