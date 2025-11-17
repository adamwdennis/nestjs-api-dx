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
import { paginate } from '../../pagination/paginate.js';

/**
 * Test service that demonstrates using pagination within NestJS context
 */
@Injectable()
class ProductPaginationService {
  constructor(
    @InjectRepository(TestProduct)
    private readonly productRepository: Repository<TestProduct>
  ) {}

  async getPaginatedProducts(
    args: PaginationArgs
  ): Promise<IPaginatedType<TestProduct>> {
    const queryBuilder = this.productRepository.createQueryBuilder('product');
    return paginate(queryBuilder, args, 'product.id');
  }

  async getPaginatedProductsByPrice(
    args: PaginationArgs,
    minPrice?: number
  ): Promise<IPaginatedType<TestProduct>> {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .orderBy('product.price', 'ASC')
      .addOrderBy('product.id', 'ASC');

    if (minPrice !== undefined) {
      queryBuilder.where('product.price >= :minPrice', { minPrice });
    }

    return paginate(queryBuilder, args, 'product.price');
  }

  async getPaginatedProductsWithCategory(
    args: PaginationArgs,
    categoryName?: string
  ): Promise<IPaginatedType<TestProduct>> {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.categoryRelation', 'category');

    if (categoryName) {
      queryBuilder.where('category.name = :categoryName', { categoryName });
    }

    return paginate(queryBuilder, args, 'product.id');
  }
}

describe('NestJS Module Integration', () => {
  let module: TestingModule;
  let service: ProductPaginationService;
  let dataSource: DataSource;

  beforeAll(async () => {
    // Create in-memory database
    dataSource = await createTestDatabase();
    await seedTestData(dataSource);

    // Create NestJS testing module
    module = await Test.createTestingModule({
      providers: [
        ProductPaginationService,
        {
          provide: getRepositoryToken(TestProduct),
          useValue: dataSource.getRepository(TestProduct),
        },
        {
          provide: getRepositoryToken(TestCategory),
          useValue: dataSource.getRepository(TestCategory),
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<ProductPaginationService>(ProductPaginationService);
  });

  afterAll(async () => {
    await module?.close();
    await closeTestDatabase(dataSource);
  });

  describe('Service Dependency Injection', () => {
    it('should inject ProductPaginationService', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(ProductPaginationService);
    });

    it('should have access to repository through DI', () => {
      expect(service['productRepository']).toBeDefined();
    });
  });

  describe('Basic Pagination', () => {
    it('should paginate products using injected repository', async () => {
      const result = await service.getPaginatedProducts({ first: 10 });

      expect(result.edges).toHaveLength(10);
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.totalCount).toBe(40);
    });

    it('should paginate backwards using last parameter', async () => {
      const result = await service.getPaginatedProducts({ last: 10 });

      expect(result.edges).toHaveLength(10);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(true);
    });

    it('should navigate through pages using cursors', async () => {
      const page1 = await service.getPaginatedProducts({ first: 10 });
      const page2 = await service.getPaginatedProducts({
        first: 10,
        after: page1.pageInfo.endCursor,
      });

      expect(page2.edges).toHaveLength(10);
      expect(page2.pageInfo.hasPreviousPage).toBe(true);
      expect(page2.pageInfo.countBefore).toBe(10);

      // Ensure no overlap
      const page1Ids = page1.edges.map((e) => e.node.id);
      const page2Ids = page2.edges.map((e) => e.node.id);
      expect(page1Ids).not.toContain(page2Ids[0]);
    });
  });

  describe('Custom Sorting and Filtering', () => {
    it('should paginate by price with custom sort', async () => {
      const result = await service.getPaginatedProductsByPrice({ first: 10 });

      expect(result.edges).toHaveLength(10);
      expect(result.edges[0].node.name).toMatch(/^Book/); // Books have lowest prices

      // Verify prices are sorted
      const prices = result.edges.map((e) => e.node.price);
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
      }
    });

    it('should paginate with price filter', async () => {
      const result = await service.getPaginatedProductsByPrice(
        { first: 10 },
        50
      );

      expect(result.edges.length).toBeGreaterThan(0);
      result.edges.forEach((edge) => {
        expect(edge.node.price).toBeGreaterThanOrEqual(50);
      });
    });

    it('should handle multi-column cursor (price + id)', async () => {
      const page1 = await service.getPaginatedProductsByPrice({ first: 5 });
      const page2 = await service.getPaginatedProductsByPrice({
        first: 5,
        after: page1.pageInfo.endCursor,
      });

      expect(page2.edges).toHaveLength(5);
      expect(page2.pageInfo.hasPreviousPage).toBe(true);

      // Verify cursor encoding includes both price and id
      expect(page1.pageInfo.endCursor).toBeTruthy();
      const endCursor = page1.pageInfo.endCursor!;
      const decoded = Buffer.from(endCursor, 'base64').toString('utf-8');
      expect(decoded).toContain('|'); // Multi-column cursor format: value|id
    });
  });

  describe('Join Queries', () => {
    it('should paginate with joined relations', async () => {
      const result = await service.getPaginatedProductsWithCategory({
        first: 10,
      });

      expect(result.edges).toHaveLength(10);
      result.edges.forEach((edge) => {
        expect(edge.node.categoryRelation).toBeDefined();
        expect(edge.node.categoryRelation?.name).toBeTruthy();
      });
    });

    it('should filter by joined relation', async () => {
      const result = await service.getPaginatedProductsWithCategory(
        { first: 20 },
        'Electronics'
      );

      expect(result.edges.length).toBe(15); // 15 electronics products
      result.edges.forEach((edge) => {
        expect(edge.node.categoryRelation?.name).toBe('Electronics');
      });
    });

    it('should handle pagination with filtered joins', async () => {
      const page1 = await service.getPaginatedProductsWithCategory(
        { first: 5 },
        'Books'
      );
      const page2 = await service.getPaginatedProductsWithCategory(
        { first: 5, after: page1.pageInfo.endCursor },
        'Books'
      );

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
      const result = await service.getPaginatedProductsByPrice(
        { first: 10 },
        10000 // Price higher than any product
      );

      expect(result.edges).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.totalCount).toBe(0);
    });

    it('should handle requesting more items than available', async () => {
      const result = await service.getPaginatedProducts({ first: 100 });

      expect(result.edges).toHaveLength(40); // Total products in test data
      expect(result.pageInfo.hasNextPage).toBe(false);
    });

    it('should handle simultaneous requests', async () => {
      const [result1, result2, result3] = await Promise.all([
        service.getPaginatedProducts({ first: 10 }),
        service.getPaginatedProducts({ first: 10 }),
        service.getPaginatedProducts({ first: 10 }),
      ]);

      expect(result1.edges).toHaveLength(10);
      expect(result2.edges).toHaveLength(10);
      expect(result3.edges).toHaveLength(10);

      // All should return the same first page
      expect(result1.edges[0].node.id).toBe(result2.edges[0].node.id);
      expect(result1.edges[0].node.id).toBe(result3.edges[0].node.id);
    });
  });
});
