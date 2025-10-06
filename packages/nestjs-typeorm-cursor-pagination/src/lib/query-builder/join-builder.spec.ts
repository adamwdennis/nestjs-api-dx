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
import { JoinBuilder } from './join-builder';
import { ComparisonOperatorEnum } from './operators/comparison-operator.enum';
import { LogicalOperatorEnum } from './operators/logical-operator.enum';
import { FiltersExpression } from './inputs/filters-expression.input';

describe('JoinBuilder', () => {
  let mockQueryBuilder: jest.Mocked<SelectQueryBuilder<any>>;

  beforeEach(() => {
    mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
    } as any;
  });

  describe('build', () => {
    it('should not add joins when filtersExpression is undefined', () => {
      const builder = new JoinBuilder(mockQueryBuilder, undefined);
      builder.build();

      expect(mockQueryBuilder.leftJoinAndSelect).not.toHaveBeenCalled();
    });

    it('should not add joins when filters have no relationField', () => {
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

      const builder = new JoinBuilder(mockQueryBuilder, filtersExpression);
      builder.build();

      expect(mockQueryBuilder.leftJoinAndSelect).not.toHaveBeenCalled();
    });

    it('should add a join for a filter with relationField', () => {
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

      const builder = new JoinBuilder(mockQueryBuilder, filtersExpression);
      builder.build();

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'User.profile',
        'Profile'
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledTimes(1);
    });

    it('should add multiple joins for different relations', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.AND,
        filters: [
          {
            field: 'Profile.bio',
            operator: ComparisonOperatorEnum.LIKE,
            value: 'developer',
            relationField: 'User.profile',
          },
          {
            field: 'Company.name',
            operator: ComparisonOperatorEnum.EQUAL,
            value: 'Acme Corp',
            relationField: 'User.company',
          },
        ],
      };

      const builder = new JoinBuilder(mockQueryBuilder, filtersExpression);
      builder.build();

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'User.profile',
        'Profile'
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'User.company',
        'Company'
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledTimes(2);
    });

    it('should not add duplicate joins for the same relation', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.AND,
        filters: [
          {
            field: 'Profile.bio',
            operator: ComparisonOperatorEnum.LIKE,
            value: 'developer',
            relationField: 'User.profile',
          },
          {
            field: 'Profile.age',
            operator: ComparisonOperatorEnum.GREATER_THAN,
            value: 25,
            relationField: 'User.profile',
          },
        ],
      };

      const builder = new JoinBuilder(mockQueryBuilder, filtersExpression);
      builder.build();

      // Should only be called once despite two filters on the same relation
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'User.profile',
        'Profile'
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledTimes(1);
    });
  });

  describe('nested expressions', () => {
    it('should add joins from child expressions', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.AND,
        filters: [
          {
            field: 'User.name',
            operator: ComparisonOperatorEnum.EQUAL,
            value: 'John',
          },
        ],
        childExpressions: [
          {
            operator: LogicalOperatorEnum.OR,
            filters: [
              {
                field: 'Profile.bio',
                operator: ComparisonOperatorEnum.LIKE,
                value: 'developer',
                relationField: 'User.profile',
              },
              {
                field: 'Company.name',
                operator: ComparisonOperatorEnum.EQUAL,
                value: 'Acme',
                relationField: 'User.company',
              },
            ],
          },
        ],
      };

      const builder = new JoinBuilder(mockQueryBuilder, filtersExpression);
      builder.build();

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'User.profile',
        'Profile'
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'User.company',
        'Company'
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledTimes(2);
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
                field: 'Profile.verified',
                operator: ComparisonOperatorEnum.EQUAL,
                value: true,
                relationField: 'User.profile',
              },
            ],
            childExpressions: [
              {
                operator: LogicalOperatorEnum.AND,
                filters: [
                  {
                    field: 'Address.country',
                    operator: ComparisonOperatorEnum.EQUAL,
                    value: 'USA',
                    relationField: 'User.address',
                  },
                  {
                    field: 'Address.verified',
                    operator: ComparisonOperatorEnum.EQUAL,
                    value: true,
                    relationField: 'User.address',
                  },
                ],
              },
            ],
          },
        ],
      };

      const builder = new JoinBuilder(mockQueryBuilder, filtersExpression);
      builder.build();

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'User.profile',
        'Profile'
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'User.address',
        'Address'
      );
      // Address should only be joined once despite two filters
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledTimes(2);
    });
  });

  describe('entity name extraction', () => {
    it('should extract entity name from field path', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.AND,
        filters: [
          {
            field: 'Category.name',
            operator: ComparisonOperatorEnum.EQUAL,
            value: 'Electronics',
            relationField: 'Product.category',
          },
        ],
      };

      const builder = new JoinBuilder(mockQueryBuilder, filtersExpression);
      builder.build();

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'Product.category',
        'Category'
      );
    });

    it('should handle nested entity paths', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.AND,
        filters: [
          {
            field: 'Author.profile.bio',
            operator: ComparisonOperatorEnum.LIKE,
            value: 'writer',
            relationField: 'Book.author',
          },
        ],
      };

      const builder = new JoinBuilder(mockQueryBuilder, filtersExpression);
      builder.build();

      // Should extract 'Author' as entity name
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'Book.author',
        'Author'
      );
    });
  });

  describe('error handling', () => {
    it('should throw error when entity name cannot be extracted', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.AND,
        filters: [
          {
            field: '', // Empty field
            operator: ComparisonOperatorEnum.EQUAL,
            value: 'test',
            relationField: 'User.profile',
          },
        ],
      };

      const builder = new JoinBuilder(mockQueryBuilder, filtersExpression);

      expect(() => builder.build()).toThrow('Entity name is required');
    });
  });

  describe('edge cases', () => {
    it('should handle empty filters array', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.AND,
        filters: [],
      };

      const builder = new JoinBuilder(mockQueryBuilder, filtersExpression);
      builder.build();

      expect(mockQueryBuilder.leftJoinAndSelect).not.toHaveBeenCalled();
    });

    it('should handle empty childExpressions array', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.AND,
        filters: [],
        childExpressions: [],
      };

      const builder = new JoinBuilder(mockQueryBuilder, filtersExpression);
      builder.build();

      expect(mockQueryBuilder.leftJoinAndSelect).not.toHaveBeenCalled();
    });

    it('should handle mixed filters with and without relationField', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.AND,
        filters: [
          {
            field: 'User.name',
            operator: ComparisonOperatorEnum.EQUAL,
            value: 'John',
            // No relationField
          },
          {
            field: 'Profile.bio',
            operator: ComparisonOperatorEnum.LIKE,
            value: 'developer',
            relationField: 'User.profile',
          },
          {
            field: 'User.email',
            operator: ComparisonOperatorEnum.LIKE,
            value: '@example.com',
            // No relationField
          },
        ],
      };

      const builder = new JoinBuilder(mockQueryBuilder, filtersExpression);
      builder.build();

      // Should only join for the filter with relationField
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'User.profile',
        'Profile'
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledTimes(1);
    });
  });

  describe('complex scenarios', () => {
    it('should handle multiple levels of nested relations', () => {
      const filtersExpression: FiltersExpression = {
        operator: LogicalOperatorEnum.AND,
        filters: [
          {
            field: 'Order.customer',
            operator: ComparisonOperatorEnum.EQUAL,
            value: 'John',
            relationField: 'Invoice.order',
          },
        ],
        childExpressions: [
          {
            operator: LogicalOperatorEnum.OR,
            filters: [
              {
                field: 'Product.name',
                operator: ComparisonOperatorEnum.LIKE,
                value: 'laptop',
                relationField: 'Order.items',
              },
              {
                field: 'Discount.code',
                operator: ComparisonOperatorEnum.EQUAL,
                value: 'SAVE20',
                relationField: 'Order.discount',
              },
            ],
          },
        ],
      };

      const builder = new JoinBuilder(mockQueryBuilder, filtersExpression);
      builder.build();

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'Invoice.order',
        'Order'
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'Order.items',
        'Product'
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'Order.discount',
        'Discount'
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledTimes(3);
    });
  });
});
