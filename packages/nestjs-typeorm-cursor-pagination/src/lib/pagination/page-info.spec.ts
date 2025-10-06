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

import { PageInfo } from './page-info';

describe('PageInfo', () => {
  describe('constructor', () => {
    it('should create a PageInfo instance with all fields', () => {
      const pageInfo = new PageInfo({
        startCursor: 'cursor-start',
        endCursor: 'cursor-end',
        hasPreviousPage: true,
        hasNextPage: true,
        countBefore: 10,
        countAfter: 15,
        totalCount: 50,
      });

      expect(pageInfo.startCursor).toBe('cursor-start');
      expect(pageInfo.endCursor).toBe('cursor-end');
      expect(pageInfo.hasPreviousPage).toBe(true);
      expect(pageInfo.hasNextPage).toBe(true);
      expect(pageInfo.countBefore).toBe(10);
      expect(pageInfo.countAfter).toBe(15);
      expect(pageInfo.totalCount).toBe(50);
    });

    it('should create a PageInfo instance with undefined cursors', () => {
      const pageInfo = new PageInfo({
        startCursor: undefined,
        endCursor: undefined,
        hasPreviousPage: false,
        hasNextPage: false,
        countBefore: 0,
        countAfter: 0,
        totalCount: 0,
      });

      expect(pageInfo.startCursor).toBeUndefined();
      expect(pageInfo.endCursor).toBeUndefined();
      expect(pageInfo.hasPreviousPage).toBe(false);
      expect(pageInfo.hasNextPage).toBe(false);
      expect(pageInfo.countBefore).toBe(0);
      expect(pageInfo.countAfter).toBe(0);
      expect(pageInfo.totalCount).toBe(0);
    });
  });

  describe('first page scenarios', () => {
    it('should represent the first page correctly with no previous page', () => {
      const pageInfo = new PageInfo({
        startCursor: 'first-cursor',
        endCursor: 'last-cursor',
        hasPreviousPage: false,
        hasNextPage: true,
        countBefore: 0,
        countAfter: 20,
        totalCount: 45,
      });

      expect(pageInfo.hasPreviousPage).toBe(false);
      expect(pageInfo.hasNextPage).toBe(true);
      expect(pageInfo.countBefore).toBe(0);
      expect(pageInfo.countAfter).toBe(20);
      expect(pageInfo.totalCount).toBe(45);
    });

    it('should represent a single page with no additional pages', () => {
      const pageInfo = new PageInfo({
        startCursor: 'only-cursor-start',
        endCursor: 'only-cursor-end',
        hasPreviousPage: false,
        hasNextPage: false,
        countBefore: 0,
        countAfter: 0,
        totalCount: 10,
      });

      expect(pageInfo.hasPreviousPage).toBe(false);
      expect(pageInfo.hasNextPage).toBe(false);
      expect(pageInfo.countBefore).toBe(0);
      expect(pageInfo.countAfter).toBe(0);
    });
  });

  describe('middle page scenarios', () => {
    it('should represent a middle page with both previous and next pages', () => {
      const pageInfo = new PageInfo({
        startCursor: 'middle-start',
        endCursor: 'middle-end',
        hasPreviousPage: true,
        hasNextPage: true,
        countBefore: 25,
        countAfter: 25,
        totalCount: 75,
      });

      expect(pageInfo.hasPreviousPage).toBe(true);
      expect(pageInfo.hasNextPage).toBe(true);
      expect(pageInfo.countBefore).toBe(25);
      expect(pageInfo.countAfter).toBe(25);
      expect(pageInfo.totalCount).toBe(75);
    });
  });

  describe('last page scenarios', () => {
    it('should represent the last page correctly with no next page', () => {
      const pageInfo = new PageInfo({
        startCursor: 'last-page-start',
        endCursor: 'last-page-end',
        hasPreviousPage: true,
        hasNextPage: false,
        countBefore: 40,
        countAfter: 0,
        totalCount: 50,
      });

      expect(pageInfo.hasPreviousPage).toBe(true);
      expect(pageInfo.hasNextPage).toBe(false);
      expect(pageInfo.countBefore).toBe(40);
      expect(pageInfo.countAfter).toBe(0);
    });
  });

  describe('empty results scenarios', () => {
    it('should handle empty results with no cursors', () => {
      const pageInfo = new PageInfo({
        startCursor: undefined,
        endCursor: undefined,
        hasPreviousPage: false,
        hasNextPage: false,
        countBefore: 0,
        countAfter: 0,
        totalCount: 0,
      });

      expect(pageInfo.startCursor).toBeUndefined();
      expect(pageInfo.endCursor).toBeUndefined();
      expect(pageInfo.hasPreviousPage).toBe(false);
      expect(pageInfo.hasNextPage).toBe(false);
      expect(pageInfo.totalCount).toBe(0);
    });
  });

  describe('count validation', () => {
    it('should correctly calculate total from countBefore + countAfter + page size', () => {
      const pageSize = 25;
      const countBefore = 10;
      const countAfter = 15;
      const totalCount = countBefore + countAfter + pageSize;

      const pageInfo = new PageInfo({
        startCursor: 'test-start',
        endCursor: 'test-end',
        hasPreviousPage: countBefore > 0,
        hasNextPage: countAfter > 0,
        countBefore,
        countAfter,
        totalCount,
      });

      expect(pageInfo.totalCount).toBe(50);
      expect(pageInfo.countBefore + pageInfo.countAfter).toBeLessThan(
        pageInfo.totalCount
      );
    });

    it('should handle large count values', () => {
      const pageInfo = new PageInfo({
        startCursor: 'large-start',
        endCursor: 'large-end',
        hasPreviousPage: true,
        hasNextPage: true,
        countBefore: 1000000,
        countAfter: 999999,
        totalCount: 2000024,
      });

      expect(pageInfo.countBefore).toBe(1000000);
      expect(pageInfo.countAfter).toBe(999999);
      expect(pageInfo.totalCount).toBe(2000024);
    });
  });
});
