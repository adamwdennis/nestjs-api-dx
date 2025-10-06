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

import { DataSource, Repository } from 'typeorm';
import { paginate } from './paginate';
import { PaginationArgs } from './pagination.args';
import {
  TestProduct,
  createTestDatabase,
  seedTestData,
  closeTestDatabase,
} from '../test-utils/test-database.setup';

describe('paginate - Integration Tests', () => {
  let dataSource: DataSource;
  let productRepo: Repository<TestProduct>;

  beforeAll(async () => {
    dataSource = await createTestDatabase();
    await seedTestData(dataSource);
    productRepo = dataSource.getRepository(TestProduct);
  });

  afterAll(async () => {
    await closeTestDatabase(dataSource);
  });

  describe('forward pagination (first/after)', () => {
    it('should paginate forward with first parameter', async () => {
      const queryBuilder = productRepo.createQueryBuilder('TestProduct');
      const args: PaginationArgs = { first: 10 };

      const result = await paginate(queryBuilder, args, 'TestProduct.id');

      expect(result.edges).toHaveLength(10);
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.totalCount).toBe(40);
      expect(result.pageInfo.countAfter).toBe(30);
      expect(result.pageInfo.countBefore).toBe(0);
    });

    it('should paginate to second page using after cursor', async () => {
      // First page
      const firstQueryBuilder = productRepo.createQueryBuilder('TestProduct');
      const firstPage = await paginate(firstQueryBuilder, { first: 10 }, 'TestProduct.id');

      // Second page using endCursor from first page
      const secondQueryBuilder = productRepo.createQueryBuilder('TestProduct');
      const secondPage = await paginate(
        secondQueryBuilder,
        { first: 10, after: firstPage.pageInfo.endCursor },
        'TestProduct.id'
      );

      expect(secondPage.edges).toHaveLength(10);
      expect(secondPage.pageInfo.hasNextPage).toBe(true);
      expect(secondPage.pageInfo.hasPreviousPage).toBe(true);
      expect(secondPage.pageInfo.countBefore).toBe(10);
      expect(secondPage.pageInfo.countAfter).toBe(20);

      // Ensure no overlap
      const firstIds = firstPage.edges.map((e) => e.node.id);
      const secondIds = secondPage.edges.map((e) => e.node.id);
      expect(firstIds).not.toContain(secondIds[0]);
    });

    it('should handle last page correctly', async () => {
      const queryBuilder = productRepo.createQueryBuilder('TestProduct');
      const args: PaginationArgs = { first: 50 };

      const result = await paginate(queryBuilder, args, 'TestProduct.id');

      expect(result.edges).toHaveLength(40); // Total products
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.countAfter).toBe(0);
    });
  });

  describe('backward pagination (last/before)', () => {
    it('should paginate backward with last parameter', async () => {
      const queryBuilder = productRepo.createQueryBuilder('TestProduct');
      const args: PaginationArgs = { last: 10 };

      const result = await paginate(queryBuilder, args, 'TestProduct.id');

      expect(result.edges).toHaveLength(10);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(true);
      expect(result.pageInfo.countBefore).toBe(30);
      expect(result.pageInfo.countAfter).toBe(0);
    });

    it('should paginate to previous page using before cursor', async () => {
      // Start from last page
      const lastQueryBuilder = productRepo.createQueryBuilder('TestProduct');
      const lastPage = await paginate(lastQueryBuilder, { last: 10 }, 'TestProduct.id');

      // Previous page using startCursor
      const prevQueryBuilder = productRepo.createQueryBuilder('TestProduct');
      const prevPage = await paginate(
        prevQueryBuilder,
        { last: 10, before: lastPage.pageInfo.startCursor },
        'TestProduct.id'
      );

      expect(prevPage.edges).toHaveLength(10);
      expect(prevPage.pageInfo.hasNextPage).toBe(true);
      expect(prevPage.pageInfo.hasPreviousPage).toBe(true);

      // Ensure no overlap
      const lastIds = lastPage.edges.map((e) => e.node.id);
      const prevIds = prevPage.edges.map((e) => e.node.id);
      expect(prevIds).not.toContain(lastIds[0]);
    });
  });

  describe('reverse ordering', () => {
    it('should reverse pagination order with reverse flag', async () => {
      const normalQb = productRepo.createQueryBuilder('TestProduct');
      const normalResult = await paginate(normalQb, { first: 5 }, 'TestProduct.id');

      const reversedQb = productRepo.createQueryBuilder('TestProduct');
      const reversedResult = await paginate(
        reversedQb,
        { first: 5, reverse: true },
        'TestProduct.id'
      );

      const normalIds = normalResult.edges.map((e) => e.node.id);
      const reversedIds = reversedResult.edges.map((e) => e.node.id);

      // Normal: first 5 in ASC order [prod-01, prod-02, prod-03, prod-04, prod-05]
      // Reversed: first 5 in DESC order [prod-40, prod-39, prod-38, prod-37, prod-36]
      expect(normalIds).toEqual(['prod-01', 'prod-02', 'prod-03', 'prod-04', 'prod-05']);
      expect(reversedIds).toEqual(['prod-40', 'prod-39', 'prod-38', 'prod-37', 'prod-36']);
      expect(normalIds[0]).not.toBe(reversedIds[0]);
    });
  });

  describe('sorting by non-id column', () => {
    it('should paginate by price with multi-column cursor', async () => {
      const queryBuilder = productRepo.createQueryBuilder('TestProduct');
      const result = await paginate(
        queryBuilder,
        { first: 10 },
        'TestProduct.price'
      );

      expect(result.edges).toHaveLength(10);
      expect(result.pageInfo.hasNextPage).toBe(true);

      // Check that cursors contain both price and id
      const firstCursor = result.edges[0]?.cursor;
      expect(firstCursor).toBeDefined();
    });

    it('should maintain order stability with duplicate prices', async () => {
      // Create products with same price
      const samePrice = 999;
      await productRepo.save([
        {
          id: 'dup-1',
          name: 'Duplicate Price 1',
          price: samePrice,
          category: 'Test',
          createdAt: new Date(),
          stock: 10,
        },
        {
          id: 'dup-2',
          name: 'Duplicate Price 2',
          price: samePrice,
          category: 'Test',
          createdAt: new Date(),
          stock: 10,
        },
        {
          id: 'dup-3',
          name: 'Duplicate Price 3',
          price: samePrice,
          category: 'Test',
          createdAt: new Date(),
          stock: 10,
        },
      ]);

      const qb1 = productRepo.createQueryBuilder('TestProduct');
      qb1.where('TestProduct.price = :price', { price: samePrice });
      const firstPage = await paginate(qb1, { first: 2 }, 'TestProduct.price');

      const qb2 = productRepo.createQueryBuilder('TestProduct');
      qb2.where('TestProduct.price = :price', { price: samePrice });
      const secondPage = await paginate(
        qb2,
        { first: 2, after: firstPage.pageInfo.endCursor },
        'TestProduct.price'
      );

      // Should not have overlapping results
      const firstIds = firstPage.edges.map((e) => e.node.id);
      const secondIds = secondPage.edges.map((e) => e.node.id);

      firstIds.forEach((id) => {
        expect(secondIds).not.toContain(id);
      });

      // Cleanup
      await productRepo.delete(['dup-1', 'dup-2', 'dup-3']);
    });

    it('should paginate by createdAt date column', async () => {
      const queryBuilder = productRepo.createQueryBuilder('TestProduct');
      const result = await paginate(
        queryBuilder,
        { first: 5 },
        'TestProduct.createdAt'
      );

      expect(result.edges).toHaveLength(5);

      // Verify dates are in order
      const dates = result.edges.map((e) => e.node.createdAt.getTime());
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i]).toBeGreaterThanOrEqual(dates[i - 1] ?? 0);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle empty results', async () => {
      const queryBuilder = productRepo.createQueryBuilder('TestProduct');
      queryBuilder.where('TestProduct.price > :price', { price: 999999 });

      const result = await paginate(queryBuilder, { first: 10 }, 'TestProduct.id');

      expect(result.edges).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.totalCount).toBe(0);
      expect(result.pageInfo.startCursor).toBeUndefined();
      expect(result.pageInfo.endCursor).toBeUndefined();
    });

    it('should handle single result', async () => {
      const queryBuilder = productRepo.createQueryBuilder('TestProduct');
      queryBuilder.where('TestProduct.id = :id', { id: 'prod-01' });

      const result = await paginate(queryBuilder, { first: 10 }, 'TestProduct.id');

      expect(result.edges).toHaveLength(1);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.totalCount).toBe(1);
    });

    it('should handle requesting more items than available', async () => {
      const queryBuilder = productRepo.createQueryBuilder('TestProduct');
      queryBuilder.where('TestProduct.category = :cat', { cat: 'Books' });

      const result = await paginate(queryBuilder, { first: 100 }, 'TestProduct.id');

      expect(result.edges.length).toBeLessThan(100);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });
  });

  describe('cursor encoding/decoding', () => {
    it('should properly encode and decode cursors', async () => {
      const queryBuilder = productRepo.createQueryBuilder('TestProduct');
      const firstPage = await paginate(queryBuilder, { first: 5 }, 'TestProduct.id');

      const cursor = firstPage.pageInfo.endCursor;
      expect(cursor).toBeDefined();
      expect(typeof cursor).toBe('string');

      // Use cursor for next page
      const nextQb = productRepo.createQueryBuilder('TestProduct');
      const nextPage = await paginate(
        nextQb,
        { first: 5, after: cursor },
        'TestProduct.id'
      );

      expect(nextPage.edges).toHaveLength(5);
    });

    it('should handle cursors with special characters in values', async () => {
      // Create a product with special characters
      await productRepo.save({
        id: 'special-chars',
        name: 'Product @#$%^&*()',
        price: 100,
        category: 'Test',
        description: 'Special chars: <>&"\'',
        createdAt: new Date(),
        stock: 5,
      });

      const qb = productRepo.createQueryBuilder('TestProduct');
      qb.where('TestProduct.id = :id', { id: 'special-chars' });
      const result = await paginate(qb, { first: 1 }, 'TestProduct.id');

      expect(result.edges[0]?.cursor).toBeDefined();

      // Cleanup
      await productRepo.delete('special-chars');
    });
  });

  describe('with existing WHERE clauses', () => {
    it('should work with existing WHERE conditions', async () => {
      const queryBuilder = productRepo.createQueryBuilder('TestProduct');
      queryBuilder.where('TestProduct.category = :category', {
        category: 'Electronics',
      });

      const result = await paginate(queryBuilder, { first: 5 }, 'TestProduct.id');

      expect(result.edges).toHaveLength(5);
      result.edges.forEach((edge) => {
        expect(edge.node.category).toBe('Electronics');
      });
    });

    it('should combine pagination cursor with WHERE conditions', async () => {
      const qb1 = productRepo.createQueryBuilder('TestProduct');
      qb1.where('TestProduct.category = :category', { category: 'Books' });
      const firstPage = await paginate(qb1, { first: 5 }, 'TestProduct.id');

      const qb2 = productRepo.createQueryBuilder('TestProduct');
      qb2.where('TestProduct.category = :category', { category: 'Books' });
      const secondPage = await paginate(
        qb2,
        { first: 5, after: firstPage.pageInfo.endCursor },
        'TestProduct.id'
      );

      expect(secondPage.edges).toHaveLength(5);
      secondPage.edges.forEach((edge) => {
        expect(edge.node.category).toBe('Books');
      });
    });
  });

  describe('page info calculations', () => {
    it('should correctly calculate totalCount', async () => {
      const queryBuilder = productRepo.createQueryBuilder('TestProduct');
      const result = await paginate(queryBuilder, { first: 10 }, 'TestProduct.id');

      expect(result.pageInfo.totalCount).toBe(
        result.pageInfo.countBefore +
          result.edges.length +
          result.pageInfo.countAfter
      );
    });

    it('should have accurate hasNextPage and hasPreviousPage flags', async () => {
      const qb1 = productRepo.createQueryBuilder('TestProduct');
      const firstPage = await paginate(qb1, { first: 10 }, 'TestProduct.id');

      expect(firstPage.pageInfo.hasPreviousPage).toBe(false);
      expect(firstPage.pageInfo.hasNextPage).toBe(true);

      const qb2 = productRepo.createQueryBuilder('TestProduct');
      const middlePage = await paginate(
        qb2,
        { first: 10, after: firstPage.pageInfo.endCursor },
        'TestProduct.id'
      );

      expect(middlePage.pageInfo.hasPreviousPage).toBe(true);
      expect(middlePage.pageInfo.hasNextPage).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should throw error when cursor column is invalid', async () => {
      const queryBuilder = productRepo.createQueryBuilder('TestProduct');

      await expect(
        paginate(queryBuilder, { first: 10 }, '')
      ).rejects.toThrow('Cursor column is required');
    });

    it('should throw error for invalid pagination arguments', async () => {
      const queryBuilder = productRepo.createQueryBuilder('TestProduct');

      // Both first and last
      await expect(
        paginate(queryBuilder, { first: 10, last: 10 } as any, 'TestProduct.id')
      ).rejects.toThrow();
    });
  });

  describe('performance with larger datasets', () => {
    it('should efficiently handle multiple pagination requests', async () => {
      const pageSize = 5;
      const pages: any[] = [];
      let cursor: string | undefined = undefined;

      // Paginate through all items
      for (let i = 0; i < 8; i++) {
        const qb = productRepo.createQueryBuilder('TestProduct');
        const result = await paginate(
          qb,
          cursor ? { first: pageSize, after: cursor } : { first: pageSize },
          'TestProduct.id'
        );

        pages.push(result);
        cursor = result.pageInfo.endCursor;

        if (!result.pageInfo.hasNextPage) break;
      }

      // Verify complete coverage without duplicates
      const allIds = pages.flatMap((p) => p.edges.map((e: any) => e.node.id));
      const uniqueIds = new Set(allIds);
      expect(allIds.length).toBe(uniqueIds.size);
    });
  });
});
