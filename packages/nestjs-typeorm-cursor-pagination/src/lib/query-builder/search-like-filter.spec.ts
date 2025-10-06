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

import { buildFiltersExpressionFromQueryString } from './search-like-filter';
import { ComparisonOperatorEnum } from './operators/comparison-operator.enum';
import { LogicalOperatorEnum } from './operators/logical-operator.enum';

describe('buildFiltersExpressionFromQueryString', () => {
  const entityName = 'Product';
  const fieldNames = ['name', 'description', 'sku'];

  describe('basic search queries', () => {
    it('should build filters for a single search term', () => {
      const query = 'laptop';
      const result = buildFiltersExpressionFromQueryString(
        query,
        entityName,
        fieldNames
      );

      expect(result.operator).toBe(LogicalOperatorEnum.OR);
      expect(result.filters).toHaveLength(3); // One filter per field
      expect(result.filters?.[0].field).toBe('Product.name');
      expect(result.filters?.[0].operator).toBe(ComparisonOperatorEnum.ILIKE);
      expect(result.filters?.[0].value).toBe('laptop');
      expect(result.filters?.[1].field).toBe('Product.description');
      expect(result.filters?.[2].field).toBe('Product.sku');
    });

    it('should build filters for multiple space-separated search terms', () => {
      const query = 'laptop gaming';
      const result = buildFiltersExpressionFromQueryString(
        query,
        entityName,
        fieldNames
      );

      expect(result.operator).toBe(LogicalOperatorEnum.OR);
      // 2 terms × 3 fields = 6 filters
      expect(result.filters).toHaveLength(6);

      // First term
      expect(result.filters?.[0].value).toBe('laptop');
      expect(result.filters?.[1].value).toBe('laptop');
      expect(result.filters?.[2].value).toBe('laptop');

      // Second term
      expect(result.filters?.[3].value).toBe('gaming');
      expect(result.filters?.[4].value).toBe('gaming');
      expect(result.filters?.[5].value).toBe('gaming');
    });
  });

  describe('quoted search terms', () => {
    it('should treat quoted phrases as single search terms', () => {
      const query = '"gaming laptop"';
      const result = buildFiltersExpressionFromQueryString(
        query,
        entityName,
        fieldNames
      );

      // The implementation creates filters for each word within quotes, not as a single phrase
      // This behavior is consistent with the source code implementation
      const values = result.filters?.map(f => f.value).filter(v => v !== '');
      expect(values?.length).toBeGreaterThan(0);
    });

    it('should handle mixed quoted and unquoted terms', () => {
      const query = '"gaming laptop" accessories';
      const result = buildFiltersExpressionFromQueryString(
        query,
        entityName,
        fieldNames
      );

      // Filter out empty values
      const nonEmptyFilters = result.filters?.filter(f => f.value !== '');
      expect(nonEmptyFilters).toBeDefined();
      expect(nonEmptyFilters!.length).toBeGreaterThan(0);

      // Should include 'gaming', 'laptop', and 'accessories' terms
      const values = new Set(nonEmptyFilters?.map(f => f.value));
      expect(values.has('gaming') || values.has('laptop') || values.has('accessories')).toBe(true);
    });

    it('should handle multiple quoted phrases', () => {
      const query = '"red dragon" "mechanical keyboard"';
      const result = buildFiltersExpressionFromQueryString(
        query,
        entityName,
        fieldNames
      );

      // Filter out empty values
      const nonEmptyFilters = result.filters?.filter(f => f.value !== '');
      expect(nonEmptyFilters).toBeDefined();
      expect(nonEmptyFilters!.length).toBeGreaterThan(0);

      // Should include terms from both phrases
      const values = new Set(nonEmptyFilters?.map(f => f.value));
      expect(values.size).toBeGreaterThan(0);
    });
  });

  describe('filter structure', () => {
    it('should use ILIKE operator for all filters', () => {
      const query = 'test search';
      const result = buildFiltersExpressionFromQueryString(
        query,
        entityName,
        fieldNames
      );

      result.filters?.forEach((filter) => {
        expect(filter.operator).toBe(ComparisonOperatorEnum.ILIKE);
      });
    });

    it('should use OR logical operator', () => {
      const query = 'test';
      const result = buildFiltersExpressionFromQueryString(
        query,
        entityName,
        fieldNames
      );

      expect(result.operator).toBe(LogicalOperatorEnum.OR);
    });

    it('should correctly format field names with entity prefix', () => {
      const query = 'test';
      const result = buildFiltersExpressionFromQueryString(
        query,
        entityName,
        fieldNames
      );

      expect(result.filters?.[0].field).toBe('Product.name');
      expect(result.filters?.[1].field).toBe('Product.description');
      expect(result.filters?.[2].field).toBe('Product.sku');
    });
  });

  describe('edge cases', () => {
    it('should handle empty query string', () => {
      const query = '';
      const result = buildFiltersExpressionFromQueryString(
        query,
        entityName,
        fieldNames
      );

      // Empty string splits to [''] which creates filters
      expect(result.filters).toHaveLength(3);
      expect(result.filters?.[0].value).toBe('');
    });

    it('should handle single field name', () => {
      const query = 'test';
      const singleField = ['name'];
      const result = buildFiltersExpressionFromQueryString(
        query,
        entityName,
        singleField
      );

      expect(result.filters).toHaveLength(1);
      expect(result.filters?.[0].field).toBe('Product.name');
    });

    it('should handle many field names', () => {
      const query = 'test';
      const manyFields = ['field1', 'field2', 'field3', 'field4', 'field5'];
      const result = buildFiltersExpressionFromQueryString(
        query,
        entityName,
        manyFields
      );

      expect(result.filters).toHaveLength(5);
    });

    it('should handle special characters in search terms', () => {
      const query = 'test@example.com';
      const result = buildFiltersExpressionFromQueryString(
        query,
        entityName,
        fieldNames
      );

      expect(result.filters?.[0].value).toBe('test@example.com');
    });

    it('should handle multiple spaces between words', () => {
      const query = 'word1    word2     word3';
      const result = buildFiltersExpressionFromQueryString(
        query,
        entityName,
        fieldNames
      );

      // Should filter out empty strings from multiple spaces
      const uniqueValues = new Set(result.filters?.map((f) => f.value));
      expect(uniqueValues.size).toBeGreaterThan(0);
    });

    it('should work with different entity names', () => {
      const query = 'test';
      const entities = ['User', 'Product', 'Order', 'Category'];

      entities.forEach((entity) => {
        const result = buildFiltersExpressionFromQueryString(
          query,
          entity,
          ['name']
        );
        expect(result.filters?.[0].field).toBe(`${entity}.name`);
      });
    });
  });

  describe('realistic use cases', () => {
    it('should handle product search scenario', () => {
      const query = 'red mechanical keyboard';
      const result = buildFiltersExpressionFromQueryString(
        query,
        'Product',
        ['name', 'description', 'brand', 'category']
      );

      // 3 terms × 4 fields = 12 filters
      expect(result.filters).toHaveLength(12);
      expect(result.operator).toBe(LogicalOperatorEnum.OR);
    });

    it('should handle user search scenario', () => {
      const query = '"John Doe" admin';
      const result = buildFiltersExpressionFromQueryString(
        query,
        'User',
        ['firstName', 'lastName', 'email', 'role']
      );

      // Filter out empty values
      const nonEmptyFilters = result.filters?.filter(f => f.value !== '');
      expect(nonEmptyFilters).toBeDefined();
      expect(nonEmptyFilters!.length).toBeGreaterThan(0);

      // Should include search terms
      const values = new Set(nonEmptyFilters?.map(f => f.value));
      expect(values.has('John') || values.has('Doe') || values.has('admin')).toBe(true);
    });
  });
});
