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
import { FilterInput } from './inputs/filter.input';
import { FiltersExpression } from './inputs/filters-expression.input';
import { ComparisonOperatorEnum } from './operators/comparison-operator.enum';
import { LogicalOperatorEnum } from './operators/logical-operator.enum';

/**
 * Builds a FiltersExpression from a query string.
 * It will split the query string into search terms and create a filter for
 * each relevant FoodEntity field.
 *
 * @param query The query string to build the FiltersExpression from
 * @returns The FiltersExpression built from the query string
 */
export function buildFiltersExpressionFromQueryString(
  query: string,
  entityName: string,
  fieldNames: string[],
) {
  const searchTerms = query.includes('"')
    ? query
        .split(/"([\s\S]+)"/g)
        .map((s) => s.trim().replace(/"/g, '').split(/[\s]+/g))
        .flat()
    : query.split(/\s+/g);

  const filterInputs: FilterInput[] = [];
  for (const searchTerm of searchTerms) {
    for (const fieldName of fieldNames) {
      filterInputs.push({
        field: `${entityName}.${fieldName}`,
        operator: ComparisonOperatorEnum.ILIKE,
        value: searchTerm,
      });
    }
  }

  const filters: FilterInput[] = [...filterInputs];

  const filtersExpression: FiltersExpression = {
    operator: LogicalOperatorEnum.OR,
    filters,
  };
  return filtersExpression;
}
