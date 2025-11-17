import { Resolver, Query, Args, Float } from '@nestjs/graphql';
import { ProductService } from '../services/product.service';
import { ProductConnection, PaginationArgs } from '../dto/pagination.types';

@Resolver()
export class ProductResolver {
  constructor(private readonly productService: ProductService) {}

  @Query(() => ProductConnection, { name: 'products' })
  async getProducts(
    @Args() args: PaginationArgs
  ): Promise<ProductConnection> {
    return this.productService.getPaginatedProducts(args);
  }

  @Query(() => ProductConnection, { name: 'productsByCategory' })
  async getProductsByCategory(
    @Args('categoryName') categoryName: string,
    @Args() args: PaginationArgs
  ): Promise<ProductConnection> {
    return this.productService.findByCategory(categoryName, args);
  }

  @Query(() => ProductConnection, { name: 'productsByPriceRange' })
  async getProductsByPriceRange(
    @Args('minPrice', { type: () => Float }) minPrice: number,
    @Args('maxPrice', { type: () => Float }) maxPrice: number,
    @Args() args: PaginationArgs
  ): Promise<ProductConnection> {
    return this.productService.findByPriceRange(minPrice, maxPrice, args);
  }
}
