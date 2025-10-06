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
import { FiltersExpression } from './inputs/filters-expression.input';

/**
 * JoinBuilder recursively traverses the FiltersExpression and adds
 * a LEFT JOIN for each relationField
 *
 * Credit: https://dev.to/mgustus/filtering-graphql-query-using-typescript-and-typeorm-2l49
 */
export class JoinBuilder<T extends object> {
  private joinedEntities = new Set<string>();

  constructor(
    private readonly qb: SelectQueryBuilder<T>,
    private filtersExpression?: FiltersExpression,
  ) {}

  /**
   * Recursively traverse the FiltersExpression and add LEFT JOINs
   * for each relationField. This is necessary to ensure that the
   * WHERE clause can reference fields on related entities.
   *
   * @returns The SelectQueryBuilder with the LEFT JOINs added.
   */
  build() {
    if (!this.filtersExpression) return;
    this.buildJoinEntitiesRec(this.filtersExpression);
  }

  private buildJoinEntitiesRec(fe: FiltersExpression): void {
    const combined = [...(fe.filters ?? []), ...(fe.childExpressions ?? [])];
    for (const item of combined) {
      if ('field' in item) {
        this.addJoinEntity(item.field, item.relationField);
      } else {
        this.buildJoinEntitiesRec(item);
      }
    }
  }

  private addJoinEntity(field: string, relationField?: string) {
    const entityName = field.split('.')[0];
    if(!entityName) {
      throw new Error('Entity name is required');
    }

    if (relationField && !this.joinedEntities.has(entityName)) {
      this.qb.leftJoinAndSelect(relationField, entityName);
      this.joinedEntities.add(entityName);
    }
  }
}
