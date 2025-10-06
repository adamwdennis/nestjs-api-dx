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

import { SelectQueryBuilder } from 'typeorm';
import { WhereBuilder } from './where-builder';
import { ComparisonOperatorEnum } from './operators/comparison-operator.enum';
import { LogicalOperatorEnum } from './operators/logical-operator.enum';
import { FiltersExpression } from './inputs/filters-expression.input';

describe('WhereBuilder', () => {
  let mockQueryBuilder: jest.Mocked<SelectQueryBuilder<any>>;

  beforeEach(() => {
    mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
    } as any;
  });

  describe('build', () => {
    it('should not call where when filtersExpression is undefined', () => {
      const builder = new WhereBuilder(mockQueryBuilder, undefined);
      builder.build();

      expect(mockQueryBuilder.where).not.toHaveBeenCalled();
    });

    it('should build simple EQUAL filter', () => {
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

      const builder = new WhereBuilder(mockQueryBuilder, filtersExpression);
      builder.build();

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(User.name = :User.name_1)',
        expect.objectContaining({
          'User.name_1': 'John',
        })
      );
    });

    it('should build IN filter with array values', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.AND,
        filters: [
          {
            field: 'User.role',
            operator: ComparisonOperatorEnum.IN,
            value: ['admin', 'moderator', 'user'],
          },
        ],
      };

      const builder = new WhereBuilder(mockQueryBuilder, filtersExpression);
      builder.build();

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(User.role IN (:...User.role_1))',
        expect.objectContaining({
          'User.role_1': ['admin', 'moderator', 'user'],
        })
      );
    });

    it('should build BETWEEN filter', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.AND,
        filters: [
          {
            field: 'Product.price',
            operator: ComparisonOperatorEnum.BETWEEN,
            value: [10, 100],
          },
        ],
      };

      const builder = new WhereBuilder(mockQueryBuilder, filtersExpression);
      builder.build();

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(Product.price BETWEEN :Product.price_1 AND :Product.price_2)',
        expect.objectContaining({
          'Product.price_1': 10,
          'Product.price_2': 100,
        })
      );
    });

    it('should build LIKE filter with wildcards', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.AND,
        filters: [
          {
            field: 'Product.name',
            operator: ComparisonOperatorEnum.LIKE,
            value: 'laptop',
          },
        ],
      };

      const builder = new WhereBuilder(mockQueryBuilder, filtersExpression);
      builder.build();

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(Product.name LIKE :Product.name_1)',
        expect.objectContaining({
          'Product.name_1': '%laptop%',
        })
      );
    });

    it('should build ILIKE filter with wildcards', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.AND,
        filters: [
          {
            field: 'Product.description',
            operator: ComparisonOperatorEnum.ILIKE,
            value: 'Gaming',
          },
        ],
      };

      const builder = new WhereBuilder(mockQueryBuilder, filtersExpression);
      builder.build();

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(Product.description ILIKE :Product.description_1)',
        expect.objectContaining({
          'Product.description_1': '%Gaming%',
        })
      );
    });

    it('should build GREATER_THAN filter', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.AND,
        filters: [
          {
            field: 'Product.stock',
            operator: ComparisonOperatorEnum.GREATER_THAN,
            value: 0,
          },
        ],
      };

      const builder = new WhereBuilder(mockQueryBuilder, filtersExpression);
      builder.build();

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(Product.stock > :Product.stock_1)',
        expect.objectContaining({
          'Product.stock_1': 0,
        })
      );
    });

    it('should build GREATER_THAN_OR_EQUAL filter', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.AND,
        filters: [
          {
            field: 'Product.rating',
            operator: ComparisonOperatorEnum.GREATER_THAN_OR_EQUAL,
            value: 4,
          },
        ],
      };

      const builder = new WhereBuilder(mockQueryBuilder, filtersExpression);
      builder.build();

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(Product.rating >= :Product.rating_1)',
        expect.objectContaining({
          'Product.rating_1': 4,
        })
      );
    });

    it('should build LESS_THAN filter', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.AND,
        filters: [
          {
            field: 'Product.price',
            operator: ComparisonOperatorEnum.LESS_THAN,
            value: 100,
          },
        ],
      };

      const builder = new WhereBuilder(mockQueryBuilder, filtersExpression);
      builder.build();

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(Product.price < :Product.price_1)',
        expect.objectContaining({
          'Product.price_1': 100,
        })
      );
    });

    it('should build LESS_THAN_OR_EQUAL filter', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.AND,
        filters: [
          {
            field: 'Product.discount',
            operator: ComparisonOperatorEnum.LESS_THAN_OR_EQUAL,
            value: 50,
          },
        ],
      };

      const builder = new WhereBuilder(mockQueryBuilder, filtersExpression);
      builder.build();

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(Product.discount <= :Product.discount_1)',
        expect.objectContaining({
          'Product.discount_1': 50,
        })
      );
    });

    it('should build NOT filter', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.AND,
        filters: [
          {
            field: 'User.status',
            operator: ComparisonOperatorEnum.NOT,
            value: 'deleted',
          },
        ],
      };

      const builder = new WhereBuilder(mockQueryBuilder, filtersExpression);
      builder.build();

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(User.status != :User.status_1)',
        expect.objectContaining({
          'User.status_1': 'deleted',
        })
      );
    });
  });

  describe('multiple filters with AND operator', () => {
    it('should combine multiple filters with AND', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.AND,
        filters: [
          {
            field: 'Product.category',
            operator: ComparisonOperatorEnum.EQUAL,
            value: 'Electronics',
          },
          {
            field: 'Product.price',
            operator: ComparisonOperatorEnum.LESS_THAN,
            value: 500,
          },
        ],
      };

      const builder = new WhereBuilder(mockQueryBuilder, filtersExpression);
      builder.build();

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(Product.category = :Product.category_1 and Product.price < :Product.price_2)',
        expect.objectContaining({
          'Product.category_1': 'Electronics',
          'Product.price_2': 500,
        })
      );
    });
  });

  describe('multiple filters with OR operator', () => {
    it('should combine multiple filters with OR', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.OR,
        filters: [
          {
            field: 'User.role',
            operator: ComparisonOperatorEnum.EQUAL,
            value: 'admin',
          },
          {
            field: 'User.role',
            operator: ComparisonOperatorEnum.EQUAL,
            value: 'moderator',
          },
        ],
      };

      const builder = new WhereBuilder(mockQueryBuilder, filtersExpression);
      builder.build();

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(User.role = :User.role_1 or User.role = :User.role_2)',
        expect.objectContaining({
          'User.role_1': 'admin',
          'User.role_2': 'moderator',
        })
      );
    });
  });

  describe('nested expressions', () => {
    it('should handle nested child expressions', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.AND,
        filters: [
          {
            field: 'Product.category',
            operator: ComparisonOperatorEnum.EQUAL,
            value: 'Electronics',
          },
        ],
        childExpressions: [
          {
            operator: LogicalOperatorEnum.OR,
            filters: [
              {
                field: 'Product.brand',
                operator: ComparisonOperatorEnum.EQUAL,
                value: 'Apple',
              },
              {
                field: 'Product.brand',
                operator: ComparisonOperatorEnum.EQUAL,
                value: 'Samsung',
              },
            ],
          },
        ],
      };

      const builder = new WhereBuilder(mockQueryBuilder, filtersExpression);
      builder.build();

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        expect.stringContaining('Product.category = :Product.category_1'),
        expect.any(Object)
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        expect.stringContaining('Product.brand = :Product.brand_2'),
        expect.any(Object)
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        expect.stringContaining('Product.brand = :Product.brand_3'),
        expect.any(Object)
      );
    });

    it('should handle deeply nested expressions', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.AND,
        filters: [],
        childExpressions: [
          {
            operator: LogicalOperatorEnum.OR,
            filters: [
              {
                field: 'User.country',
                operator: ComparisonOperatorEnum.EQUAL,
                value: 'USA',
              },
              {
                field: 'User.age',
                operator: ComparisonOperatorEnum.GREATER_THAN,
                value: 18,
              },
              {
                field: 'User.verified',
                operator: ComparisonOperatorEnum.EQUAL,
                value: true,
              },
            ],
          },
        ],
      };

      const builder = new WhereBuilder(mockQueryBuilder, filtersExpression);
      builder.build();

      expect(mockQueryBuilder.where).toHaveBeenCalled();
      const callArgs = mockQueryBuilder.where.mock.calls[0];
      expect(callArgs[0]).toContain('User.country');
      expect(callArgs[0]).toContain('User.age');
      expect(callArgs[0]).toContain('User.verified');
    });
  });

  describe('edge cases', () => {
    it('should skip filters with no value', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.AND,
        filters: [
          {
            field: 'Product.name',
            operator: ComparisonOperatorEnum.EQUAL,
            value: undefined,
          },
          {
            field: 'Product.category',
            operator: ComparisonOperatorEnum.EQUAL,
            value: 'Electronics',
          },
        ],
      };

      const builder = new WhereBuilder(mockQueryBuilder, filtersExpression);
      builder.build();

      // Should only include the filter with a value
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        '(Product.category = :Product.category_1)',
        expect.objectContaining({
          'Product.category_1': 'Electronics',
        })
      );
    });

    it('should skip filters with empty string value', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.AND,
        filters: [
          {
            field: 'Product.name',
            operator: ComparisonOperatorEnum.EQUAL,
            value: '',
          },
        ],
      };

      const builder = new WhereBuilder(mockQueryBuilder, filtersExpression);
      builder.build();

      // Empty expression
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('', expect.any(Object));
    });

    it('should handle empty filters array', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.AND,
        filters: [],
      };

      const builder = new WhereBuilder(mockQueryBuilder, filtersExpression);
      builder.build();

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('', expect.any(Object));
    });

    it('should throw error for unknown operator', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.AND,
        filters: [
          {
            field: 'Product.name',
            operator: 'INVALID_OPERATOR' as any,
            value: 'test',
          },
        ],
      };

      const builder = new WhereBuilder(mockQueryBuilder, filtersExpression);

      expect(() => builder.build()).toThrow('Unknown filter operation');
    });
  });

  describe('parameter naming', () => {
    it('should create unique parameter names for each filter', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.AND,
        filters: [
          {
            field: 'Product.price',
            operator: ComparisonOperatorEnum.GREATER_THAN,
            value: '10',
          },
          {
            field: 'Product.price',
            operator: ComparisonOperatorEnum.LESS_THAN,
            value: '100',
          },
        ],
      };

      const builder = new WhereBuilder(mockQueryBuilder, filtersExpression);
      builder.build();

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        expect.stringContaining('Product.price >'),
        expect.objectContaining({
          'Product.price_1': '10',
          'Product.price_2': '100',
        })
      );
    });
  });
});
