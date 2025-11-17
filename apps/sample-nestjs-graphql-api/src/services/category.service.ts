import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import {
  paginate,
  PaginationArgs,
  IPaginatedType,
} from '@adamwdennis/nestjs-typeorm-cursor-pagination';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>
  ) {}

  async getPaginatedCategories(
    args: PaginationArgs
  ): Promise<IPaginatedType<Category>> {
    const queryBuilder = this.categoryRepo
      .createQueryBuilder('category')
      .orderBy('category.id', 'ASC');
    return paginate(queryBuilder, args, 'category.id');
  }
}
