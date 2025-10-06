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

import { Repository } from 'typeorm';
import { FilterQueryBuilder } from './filter-query-builder';
import { ComparisonOperatorEnum } from './operators/comparison-operator.enum';
import { LogicalOperatorEnum } from './operators/logical-operator.enum';
import { FiltersExpression } from './inputs/filters-expression.input';

describe('FilterQueryBuilder', () => {
  let mockRepository: jest.Mocked<Repository<any>>;
  let mockQueryBuilder: any;

  beforeEach(() => {
    mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
    };

    mockRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as any;
  });

  describe('build', () => {
    it('should create a query builder from repository', () => {
      const builder = new FilterQueryBuilder(mockRepository);
      builder.build();

      expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
    });

    it('should return the query builder instance', () => {
      const builder = new FilterQueryBuilder(mockRepository);
      const result = builder.build();

      expect(result).toBe(mockQueryBuilder);
    });

    it('should not add filters when filtersExpression is undefined', () => {
      const builder = new FilterQueryBuilder(mockRepository, undefined);
      builder.build();

      expect(mockQueryBuilder.leftJoinAndSelect).not.toHaveBeenCalled();
      expect(mockQueryBuilder.where).not.toHaveBeenCalled();
    });

    it('should build WHERE clause for simple filter', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.AND,
        filters: [
          {
            field: 'User.name',
            operator: ComparisonOperatorEnum.EQUAL,
            value: 'John',
          },
        ],
      };

      const builder = new FilterQueryBuilder(mockRepository, filtersExpression);
      builder.build();

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(User.name = :User.name_1)',
        expect.objectContaining({
          'User.name_1': 'John',
        })
      );
    });

    it('should build JOIN for filter with relationField', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.AND,
        filters: [
          {
            field: 'Profile.bio',
            operator: ComparisonOperatorEnum.LIKE,
            value: 'developer',
            relationField: 'User.profile',
          },
        ],
      };

      const builder = new FilterQueryBuilder(mockRepository, filtersExpression);
      builder.build();

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'User.profile',
        'Profile'
      );
    });

    it('should build both JOIN and WHERE for related entity filter', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.AND,
        filters: [
          {
            field: 'Profile.verified',
            operator: ComparisonOperatorEnum.EQUAL,
            value: true,
            relationField: 'User.profile',
          },
        ],
      };

      const builder = new FilterQueryBuilder(mockRepository, filtersExpression);
      builder.build();

      // Should add the join first
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'User.profile',
        'Profile'
      );

      // Then add the where clause
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(Profile.verified = :Profile.verified_1)',
        expect.objectContaining({
          'Profile.verified_1': true,
        })
      );
    });
  });

  describe('complex filtering scenarios', () => {
    it('should handle multiple filters with joins', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.AND,
        filters: [
          {
            field: 'User.name',
            operator: ComparisonOperatorEnum.LIKE,
            value: 'John',
          },
          {
            field: 'Profile.verified',
            operator: ComparisonOperatorEnum.EQUAL,
            value: true,
            relationField: 'User.profile',
          },
          {
            field: 'Company.active',
            operator: ComparisonOperatorEnum.EQUAL,
            value: true,
            relationField: 'User.company',
          },
        ],
      };

      const builder = new FilterQueryBuilder(mockRepository, filtersExpression);
      builder.build();

      // Should add joins for related entities
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'User.profile',
        'Profile'
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'User.company',
        'Company'
      );

      // Should add all filters to where clause
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      const whereCall = mockQueryBuilder.where.mock.calls[0];
      expect(whereCall[0]).toContain('User.name LIKE');
      expect(whereCall[0]).toContain('Profile.verified =');
      expect(whereCall[0]).toContain('Company.active =');
    });

    it('should handle nested expressions with multiple joins', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.AND,
        filters: [
          {
            field: 'User.status',
            operator: ComparisonOperatorEnum.EQUAL,
            value: 'active',
          },
        ],
        childExpressions: [
          {
            operator: LogicalOperatorEnum.OR,
            filters: [
              {
                field: 'Profile.verified',
                operator: ComparisonOperatorEnum.EQUAL,
                value: true,
                relationField: 'User.profile',
              },
              {
                field: 'Company.trusted',
                operator: ComparisonOperatorEnum.EQUAL,
                value: true,
                relationField: 'User.company',
              },
            ],
          },
        ],
      };

      const builder = new FilterQueryBuilder(mockRepository, filtersExpression);
      builder.build();

      // Should add both joins
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'User.profile',
        'Profile'
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'User.company',
        'Company'
      );

      // Should combine filters correctly
      expect(mockQueryBuilder.where).toHaveBeenCalled();
    });

    it('should not add duplicate joins for same relation used multiple times', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.AND,
        filters: [
          {
            field: 'Profile.verified',
            operator: ComparisonOperatorEnum.EQUAL,
            value: true,
            relationField: 'User.profile',
          },
          {
            field: 'Profile.active',
            operator: ComparisonOperatorEnum.EQUAL,
            value: true,
            relationField: 'User.profile',
          },
          {
            field: 'Profile.age',
            operator: ComparisonOperatorEnum.GREATER_THAN,
            value: 18,
            relationField: 'User.profile',
          },
        ],
      };

      const builder = new FilterQueryBuilder(mockRepository, filtersExpression);
      builder.build();

      // Should only join once
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledTimes(1);
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'User.profile',
        'Profile'
      );

      // But should include all filters in WHERE clause
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      const whereCall = mockQueryBuilder.where.mock.calls[0];
      expect(whereCall[0]).toContain('Profile.verified');
      expect(whereCall[0]).toContain('Profile.active');
      expect(whereCall[0]).toContain('Profile.age');
    });
  });

  describe('operator variations', () => {
    it('should support IN operator with joins', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.AND,
        filters: [
          {
            field: 'Category.slug',
            operator: ComparisonOperatorEnum.IN,
            value: ['electronics', 'computers', 'phones'],
            relationField: 'Product.category',
          },
        ],
      };

      const builder = new FilterQueryBuilder(mockRepository, filtersExpression);
      builder.build();

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'Product.category',
        'Category'
      );

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(Category.slug IN (:...Category.slug_1))',
        expect.objectContaining({
          'Category.slug_1': ['electronics', 'computers', 'phones'],
        })
      );
    });

    it('should support BETWEEN operator with joins', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.AND,
        filters: [
          {
            field: 'Order.total',
            operator: ComparisonOperatorEnum.BETWEEN,
            value: [100, 500],
            relationField: 'Invoice.order',
          },
        ],
      };

      const builder = new FilterQueryBuilder(mockRepository, filtersExpression);
      builder.build();

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'Invoice.order',
        'Order'
      );

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(Order.total BETWEEN :Order.total_1 AND :Order.total_2)',
        expect.objectContaining({
          'Order.total_1': 100,
          'Order.total_2': 500,
        })
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty filters array', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.AND,
        filters: [],
      };

      const builder = new FilterQueryBuilder(mockRepository, filtersExpression);
      const result = builder.build();

      expect(result).toBe(mockQueryBuilder);
      expect(mockQueryBuilder.leftJoinAndSelect).not.toHaveBeenCalled();
    });

    it('should handle filters with no values gracefully', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.AND,
        filters: [
          {
            field: 'User.name',
            operator: ComparisonOperatorEnum.EQUAL,
            value: undefined,
          },
        ],
      };

      const builder = new FilterQueryBuilder(mockRepository, filtersExpression);
      builder.build();

      // Should still create query builder but skip the filter
      expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('integration with both builders', () => {
    it('should properly integrate JoinBuilder and WhereBuilder', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.AND,
        filters: [
          {
            field: 'User.email',
            operator: ComparisonOperatorEnum.LIKE,
            value: '@example.com',
          },
        ],
        childExpressions: [
          {
            operator: LogicalOperatorEnum.OR,
            filters: [
              {
                field: 'Profile.country',
                operator: ComparisonOperatorEnum.EQUAL,
                value: 'USA',
                relationField: 'User.profile',
              },
              {
                field: 'Address.country',
                operator: ComparisonOperatorEnum.EQUAL,
                value: 'USA',
                relationField: 'User.address',
              },
            ],
          },
        ],
      };

      const builder = new FilterQueryBuilder(mockRepository, filtersExpression);
      const result = builder.build();

      // Verify joins were added
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'User.profile',
        'Profile'
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'User.address',
        'Address'
      );

      // Verify where clause was built
      expect(mockQueryBuilder.where).toHaveBeenCalled();

      // Verify the same query builder instance is returned
      expect(result).toBe(mockQueryBuilder);
    });
  });
});
