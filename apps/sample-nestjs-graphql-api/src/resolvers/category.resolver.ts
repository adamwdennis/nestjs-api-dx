import { Resolver, Query, Args } from '@nestjs/graphql';
import { CategoryService } from '../services/category.service';
import { CategoryConnection, PaginationArgs } from '../dto/pagination.types';

@Resolver()
export class CategoryResolver {
  constructor(private readonly categoryService: CategoryService) {}

  @Query(() => CategoryConnection, { name: 'categories' })
  async getCategories(
    @Args() args: PaginationArgs
  ): Promise<CategoryConnection> {
    return this.categoryService.getPaginatedCategories(args);
  }
}
