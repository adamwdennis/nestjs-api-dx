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
import { SelectQueryBuilder } from 'typeorm/query-builder/SelectQueryBuilder';

import { FiltersExpression } from './inputs/filters-expression.input';
import { JoinBuilder } from './join-builder';
import { WhereBuilder } from './where-builder';

/**
 * FilterQueryBuilder is a class that builds the WHERE and JOIN clauses of a SQL
 * query using a SelectQueryBuilder and a FiltersExpression.
 */
export class FilterQueryBuilder<T extends object> {
  private readonly qb: SelectQueryBuilder<T>;

  constructor(
    entityRepository: Repository<T>,
    private filtersExpression?: FiltersExpression,
  ) {
    this.qb = entityRepository.createQueryBuilder();
  }

  /**
   * Traverses the FiltersExpression and builds the WHERE and JOIN clauses
   * of the SQL query using the SelectQueryBuilder provided in the constructor.
   *
   * @returns The SelectQueryBuilder with the WHERE and JOIN clauses built
   */
  build() {
    const jb = new JoinBuilder<T>(this.qb, this.filtersExpression);
    jb.build();

    const wb = new WhereBuilder<T>(this.qb, this.filtersExpression);
    wb.build();

    return this.qb;
  }
}
