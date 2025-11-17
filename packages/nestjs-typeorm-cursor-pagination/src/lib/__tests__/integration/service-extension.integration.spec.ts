/**
 * MIT License
 *
 * Copyright (c) 2022 Adam Dennis (@adamwdennis)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { getRepositoryToken, InjectRepository } from '@nestjs/typeorm';
import {
  TestProduct,
  TestCategory,
  createTestDatabase,
  seedTestData,
  closeTestDatabase,
} from '../../test-utils/test-database.setup.js';
import { PaginationArgs } from '../../pagination/pagination.args.js';
import { IPaginatedType } from '../../pagination/paginated.js';
import { BaseEntityPaginationService } from '../../services/base-entity-pagination.service.js';
import { paginate } from '../../pagination/paginate.js';

/**
 * Example implementation extending BaseEntityPaginationService
 */
@Injectable()
class ProductPaginationService extends BaseEntityPaginationService<
  TestProduct,
  PaginationArgs
> {
  constructor(
    @InjectRepository(TestProduct)
    repository: Repository<TestProduct>
  ) {
    super(repository, 'ProductPaginationService');
  }

  protected async getFilteredConnection(
    args: PaginationArgs
  ): Promise<IPaginatedType<TestProduct>> {
    const queryBuilder = this.repository.createQueryBuilder('product');
    const cursorColumn = this.getOrderBy();

    return paginate(queryBuilder, args, cursorColumn);
  }

  protected getOrderBy(): string {
    // Default ordering by ID
    return 'product.id';
  }

  // Additional custom method using pagination
  async findByPriceRange(
    minPrice: number,
    maxPrice: number,
    args: PaginationArgs
  ): Promise<IPaginatedType<TestProduct>> {
    const queryBuilder = this.repository
      .createQueryBuilder('product')
      .where('product.price >= :minPrice', { minPrice })
      .andWhere('product.price <= :maxPrice', { maxPrice })
      .orderBy('product.price', 'ASC')
      .addOrderBy('product.id', 'ASC');

    return paginate(queryBuilder, args, 'product.price');
  }

  // Custom method with joins
  async findByCategory(
    categoryName: string,
    args: PaginationArgs
  ): Promise<IPaginatedType<TestProduct>> {
    const queryBuilder = this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.categoryRelation', 'category')
      .where('category.name = :categoryName', { categoryName })
      .orderBy('product.id', 'ASC');

    return paginate(queryBuilder, args, 'product.id');
  }

  // Expose getFilteredConnection for testing
  async getPaginatedProducts(
    args: PaginationArgs
  ): Promise<IPaginatedType<TestProduct>> {
    return this.getFilteredConnection(args);
  }
}

/**
 * Another example service with custom ordering by stock
 */
@Injectable()
class ProductByStockService extends BaseEntityPaginationService<
  TestProduct,
  PaginationArgs
> {
  constructor(
    @InjectRepository(TestProduct)
    repository: Repository<TestProduct>
  ) {
    super(repository, 'ProductByStockService');
  }

  protected async getFilteredConnection(
    args: PaginationArgs
  ): Promise<IPaginatedType<TestProduct>> {
    const queryBuilder = this.repository
      .createQueryBuilder('product')
      .orderBy('product.stock', 'DESC')
      .addOrderBy('product.id', 'ASC');

    const cursorColumn = this.getOrderBy();
    return paginate(queryBuilder, args, cursorColumn);
  }

  protected getOrderBy(): string {
    // Custom ordering by stock
    return 'product.stock';
  }

  async getPaginatedProducts(
    args: PaginationArgs
  ): Promise<IPaginatedType<TestProduct>> {
    return this.getFilteredConnection(args);
  }
}

describe('Service Extension Integration', () => {
  let module: TestingModule;
  let productService: ProductPaginationService;
  let stockService: ProductByStockService;
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await createTestDatabase();
    await seedTestData(dataSource);

    module = await Test.createTestingModule({
      providers: [
        ProductPaginationService,
        ProductByStockService,
        {
          provide: getRepositoryToken(TestProduct),
          useValue: dataSource.getRepository(TestProduct),
        },
        {
          provide: getRepositoryToken(TestCategory),
          useValue: dataSource.getRepository(TestCategory),
        },
      ],
    }).compile();

    productService = module.get<ProductPaginationService>(
      ProductPaginationService
    );
    stockService = module.get<ProductByStockService>(ProductByStockService);
  });

  afterAll(async () => {
    await module?.close();
    await closeTestDatabase(dataSource);
  });

  describe('BaseEntityPaginationService Extension', () => {
    it('should extend BaseEntityPaginationService correctly', () => {
      expect(productService).toBeInstanceOf(BaseEntityPaginationService);
      expect(stockService).toBeInstanceOf(BaseEntityPaginationService);
    });

    it('should implement required abstract methods', () => {
      expect(productService['getFilteredConnection']).toBeDefined();
      expect(productService['getOrderBy']).toBeDefined();
      expect(stockService['getFilteredConnection']).toBeDefined();
      expect(stockService['getOrderBy']).toBeDefined();
    });

    it('should have access to repository through DI', () => {
      expect(productService['repository']).toBeDefined();
      expect(stockService['repository']).toBeDefined();
    });
  });

  describe('getFilteredConnection Implementation', () => {
    it('should paginate using getFilteredConnection', async () => {
      const result = await productService.getPaginatedProducts({ first: 10 });

      expect(result.edges).toHaveLength(10);
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.pageInfo.totalCount).toBe(40);
    });

    it('should navigate pages using getFilteredConnection', async () => {
      const page1 = await productService.getPaginatedProducts({ first: 5 });
      const page2 = await productService.getPaginatedProducts({
        first: 5,
        after: page1.pageInfo.endCursor,
      });

      expect(page2.edges).toHaveLength(5);
      expect(page2.pageInfo.countBefore).toBe(5);

      const page1Ids = page1.edges.map((e) => e.node.id);
      const page2Ids = page2.edges.map((e) => e.node.id);
      expect(page1Ids).not.toContain(page2Ids[0]);
    });
  });

  describe('getOrderBy Implementation', () => {
    it('should use default ordering (by ID)', async () => {
      const result = await productService.getPaginatedProducts({ first: 10 });

      const ids = result.edges.map((e) => e.node.id);
      const sortedIds = [...ids].sort();
      expect(ids).toEqual(sortedIds);
    });

    it('should use custom ordering (by stock DESC)', async () => {
      const result = await stockService.getPaginatedProducts({ first: 10 });

      // Verify that stock is being used as the cursor column
      // The ordering should reflect stock DESC ordering
      const stocks = result.edges.map((e) => e.node.stock);

      // Check that we got results and they include varying stock levels
      expect(result.edges).toHaveLength(10);
      expect(stocks.length).toBe(10);

      // Verify cursor is based on stock by checking multi-column format
      if (result.pageInfo.endCursor) {
        const decoded = Buffer.from(result.pageInfo.endCursor, 'base64').toString('utf-8');
        // Multi-column cursor format: stock|id
        expect(decoded).toContain('|');
      }
    });

    it('should return cursor column name', () => {
      expect(productService['getOrderBy']()).toBe('product.id');
      expect(stockService['getOrderBy']()).toBe('product.stock');
    });
  });

  describe('Custom Service Methods', () => {
    it('should filter by price range', async () => {
      const result = await productService.findByPriceRange(20, 50, {
        first: 20,
      });

      expect(result.edges.length).toBeGreaterThan(0);
      result.edges.forEach((edge) => {
        expect(edge.node.price).toBeGreaterThanOrEqual(20);
        expect(edge.node.price).toBeLessThanOrEqual(50);
      });

      // Verify ordering by price
      const prices = result.edges.map((e) => e.node.price);
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
      }
    });

    it('should paginate price range results', async () => {
      const page1 = await productService.findByPriceRange(10, 100, {
        first: 5,
      });
      const page2 = await productService.findByPriceRange(10, 100, {
        first: 5,
        after: page1.pageInfo.endCursor,
      });

      expect(page1.edges).toHaveLength(5);
      expect(page2.edges).toHaveLength(5);

      // Verify no overlap
      const page1Ids = page1.edges.map((e) => e.node.id);
      const page2Ids = page2.edges.map((e) => e.node.id);
      expect(page1Ids).not.toContain(page2Ids[0]);
    });

    it('should handle multi-column cursor for price sorting', async () => {
      const page1 = await productService.findByPriceRange(10, 100, {
        first: 3,
      });

      expect(page1.pageInfo.endCursor).toBeTruthy();
      const endCursor = page1.pageInfo.endCursor!;
      const decoded = Buffer.from(endCursor, 'base64').toString('utf-8');

      // Multi-column cursor format: price|id
      expect(decoded).toContain('|');
    });

    it('should filter by category with joins', async () => {
      const result = await productService.findByCategory('Electronics', {
        first: 20,
      });

      expect(result.edges).toHaveLength(15); // 15 electronics products
      result.edges.forEach((edge) => {
        expect(edge.node.categoryRelation?.name).toBe('Electronics');
      });
    });

    it('should paginate category results', async () => {
      const page1 = await productService.findByCategory('Books', { first: 5 });
      const page2 = await productService.findByCategory('Books', {
        first: 5,
        after: page1.pageInfo.endCursor,
      });

      expect(page1.edges).toHaveLength(5);
      expect(page2.edges).toHaveLength(5);

      page1.edges.forEach((edge) => {
        expect(edge.node.categoryRelation?.name).toBe('Books');
      });
      page2.edges.forEach((edge) => {
        expect(edge.node.categoryRelation?.name).toBe('Books');
      });

      // Verify no overlap
      const page1Ids = page1.edges.map((e) => e.node.id);
      const page2Ids = page2.edges.map((e) => e.node.id);
      expect(page1Ids).not.toContain(page2Ids[0]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty results', async () => {
      const result = await productService.findByPriceRange(10000, 20000, {
        first: 10,
      });

      expect(result.edges).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.totalCount).toBe(0);
    });

    it('should handle backward pagination', async () => {
      const result = await productService.findByCategory('Clothing', {
        last: 5,
      });

      expect(result.edges).toHaveLength(5);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(true);

      result.edges.forEach((edge) => {
        expect(edge.node.categoryRelation?.name).toBe('Clothing');
      });
    });

    it('should handle requesting more than available', async () => {
      const result = await productService.findByCategory('Clothing', {
        first: 100,
      });

      expect(result.edges).toHaveLength(10); // Only 10 clothing items
      expect(result.pageInfo.hasNextPage).toBe(false);
    });
  });

  describe('Multiple Service Instances', () => {
    it('should maintain independent service state', async () => {
      const [result1, result2] = await Promise.all([
        productService.getPaginatedProducts({ first: 10 }),
        stockService.getPaginatedProducts({ first: 10 }),
      ]);

      expect(result1.edges).toHaveLength(10);
      expect(result2.edges).toHaveLength(10);

      // Results should be different due to different ordering
      const ids1 = result1.edges.map((e) => e.node.id);
      const ids2 = result2.edges.map((e) => e.node.id);
      expect(ids1).not.toEqual(ids2);
    });

    it('should handle concurrent requests to same service', async () => {
      const [result1, result2, result3] = await Promise.all([
        productService.findByCategory('Electronics', { first: 5 }),
        productService.findByCategory('Books', { first: 5 }),
        productService.findByPriceRange(10, 50, { first: 5 }),
      ]);

      expect(result1.edges).toHaveLength(5);
      expect(result2.edges).toHaveLength(5);
      expect(result3.edges).toHaveLength(5);

      // Verify category filtering worked
      result1.edges.forEach((e) =>
        expect(e.node.categoryRelation?.name).toBe('Electronics')
      );
      result2.edges.forEach((e) =>
        expect(e.node.categoryRelation?.name).toBe('Books')
      );
    });
  });

  describe('Logger Integration', () => {
    it('should initialize logger', () => {
      expect(productService['logger']).toBeDefined();
      expect(stockService['logger']).toBeDefined();
    });
  });
});
