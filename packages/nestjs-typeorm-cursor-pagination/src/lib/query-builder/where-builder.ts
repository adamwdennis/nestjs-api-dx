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
import { ComparisonOperatorEnum } from './operators/comparison-operator.enum';

import { FilterInput } from './inputs/filter.input';
import { FiltersExpression } from './inputs/filters-expression.input';

type ParamValue = string | number | Array<string | number>;

/**
 * WhereBuilder recursively goes over the filters expression tree and
 * builds the WHERE clause of the SQL query.
 *
 * Credit: https://dev.to/mgustus/filtering-graphql-query-using-typescript-and-typeorm-2l49
 */
export class WhereBuilder<T extends object> {
  private params: Record<string, ParamValue> = {};
  private paramsCount = 0;

  constructor(
    private readonly qb: SelectQueryBuilder<T>,
    private filtersExpression?: FiltersExpression,
  ) {}

  /**
   * Traverse the FiltersExpression and build the WHERE clause of the SQL query
   * using the SelectQueryBuilder provided in the constructor.
   *
   * If the FiltersExpression is not empty, this method will build the WHERE
   * clause of the SQL query and set the parameters of the query.
   *
   * @returns The WHERE clause of the SQL query
   */
  build() {
    if (!this.filtersExpression) return;

    const whereSql = this.buildExpressionRec(this.filtersExpression);
    this.qb.where(whereSql, this.params);
  }

  private buildExpressionRec(fe: FiltersExpression): string {
    const filtersWithValues = fe.filters?.filter(
      (f) => f.value && f.value.length > 0,
    );
    const filters = filtersWithValues?.map((f) => this.buildFilter(f)) || [];
    const children =
      fe.childExpressions?.map((child) => this.buildExpressionRec(child)) || [];

    const allSqlBlocks = [...filters, ...children];
    const sqLExpr = allSqlBlocks.join(` ${fe.operator} `);
    return sqLExpr === '' ? '' : `(${sqLExpr})`;
  }

  private buildFilter(filter: FilterInput) {
    if (!filter.value || filter.value.length === 0) {
      return; //throw new Error(`filter must have one or more values`);
    }
    const paramName = `${filter.field}_${++this.paramsCount}`;
    switch (filter.operator) {
      case ComparisonOperatorEnum.EQUAL: {
        this.params[paramName] = filter.value;
        return `${filter.field} = :${paramName}`;
      }
      case ComparisonOperatorEnum.BETWEEN: {
        this.params[paramName] = filter.value[0];
        this.params[paramName + 1] = filter.value[1];
        return `${filter.field} BETWEEN :${paramName} AND :${paramName + 1}`;
      }
      case ComparisonOperatorEnum.IN: {
        this.params[paramName] = filter.value;
        return `${filter.field} IN (:...${paramName})`;
      }
      case ComparisonOperatorEnum.ILIKE: {
        this.params[paramName] = `%${filter.value}%`;
        return `${filter.field} ILIKE :${paramName}`;
      }
      case ComparisonOperatorEnum.LIKE: {
        this.params[paramName] = `%${filter.value}%`;
        return `${filter.field} LIKE :${paramName}`;
      }
      case ComparisonOperatorEnum.GREATER_THAN: {
        this.params[paramName] = filter.value;
        return `${filter.field} > :${paramName}`;
      }
      case ComparisonOperatorEnum.GREATER_THAN_OR_EQUAL: {
        this.params[paramName] = filter.value;
        return `${filter.field} >= :${paramName}`;
      }
      case ComparisonOperatorEnum.LESS_THAN: {
        this.params[paramName] = filter.value;
        return `${filter.field} < :${paramName}`;
      }
      case ComparisonOperatorEnum.LESS_THAN_OR_EQUAL: {
        this.params[paramName] = filter.value;
        return `${filter.field} <= :${paramName}`;
      }
      case ComparisonOperatorEnum.NOT: {
        this.params[paramName] = filter.value;
        return `${filter.field} != :${paramName}`;
      }
      default: {
        throw new Error(`Unknown filter operation: ${filter.operator}`);
      }
    }
  }
}
