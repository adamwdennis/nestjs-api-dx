import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import {
  paginate,
  PaginationArgs,
  IPaginatedType,
} from '@adamwdennis/nestjs-typeorm-cursor-pagination';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>
  ) {}

  async getPaginatedProducts(
    args: PaginationArgs
  ): Promise<IPaginatedType<Product>> {
    const queryBuilder = this.productRepo
      .createQueryBuilder('product')
      .orderBy('product.id', 'ASC');
    return paginate(queryBuilder, args, 'product.id');
  }

  async findByCategory(
    categoryName: string,
    args: PaginationArgs
  ): Promise<IPaginatedType<Product>> {
    const queryBuilder = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.categoryRelation', 'category')
      .where('category.name = :categoryName', { categoryName })
      .orderBy('product.id', 'ASC');
    return paginate(queryBuilder, args, 'product.id');
  }

  async findByPriceRange(
    minPrice: number,
    maxPrice: number,
    args: PaginationArgs
  ): Promise<IPaginatedType<Product>> {
    const queryBuilder = this.productRepo
      .createQueryBuilder('product')
      .where('product.price >= :minPrice', { minPrice })
      .andWhere('product.price <= :maxPrice', { maxPrice })
      .orderBy('product.price', 'ASC')
      .addOrderBy('product.id', 'ASC');
    return paginate(queryBuilder, args, 'product.price');
  }
}
