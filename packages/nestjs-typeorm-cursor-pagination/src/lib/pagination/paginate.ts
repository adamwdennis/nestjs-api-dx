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

import { Type } from '@nestjs/common';
import {
  Brackets,
  LessThan,
  MoreThan,
  ObjectLiteral,
  SelectQueryBuilder,
} from 'typeorm';
import { Cursor } from './cursor';
import { PageInfo } from './page-info';
import { IPaginatedType, IEdgeType } from './paginated';
import { PaginationArgs } from './pagination.args';

interface IIndexable<T = Type> {
  [key: string]: T;
}

const multiColumnDelimiter = '|';
/**
 * Inspired by:
 * - https://gist.github.com/tumainimosha/6652deb0aea172f7f2c4b2077c72d16c
 * - https://gist.github.com/VojtaSim/6b03466f1964a6c81a3dbf1f8cec8d5c
 */
export async function paginate<T extends object>(
  query: SelectQueryBuilder<T>,
  paginationArgs: PaginationArgs,
  cursorColumn = 'id',
): Promise<IPaginatedType<T>> {
  const totalCountQuery = query.clone();
  const columnId =
    cursorColumn.split('.').length > 1
      ? cursorColumn.split('.').slice(1)[0]
      : cursorColumn;

  let cursor: Cursor | null = null;
  let order: 'ASC' | 'DESC' = paginationArgs.reverse ? 'DESC' : 'ASC';
  let limit = paginationArgs.first ?? paginationArgs.last ?? 25;

  if (paginationArgs.first) {
    // FORWARD pagination
    limit = paginationArgs.first;
    order = paginationArgs.reverse ? 'DESC' : 'ASC';
    if (paginationArgs.after) {
      cursor = new Cursor(paginationArgs.after, cursorColumn);
    }
  } else if (paginationArgs.last) {
    // REVERSE pagination
    limit = paginationArgs.last;
    order = paginationArgs.reverse ? 'ASC' : 'DESC';
    if (paginationArgs.before) {
      cursor = new Cursor(paginationArgs.before, cursorColumn);
    }
  }
  // Apply the order by clause
  query.orderBy({ [cursorColumn]: order });

  // If the cursor column is not the id (unique, primary key), we need to
  // add a secondary order by id to ensure that the results are deterministic.
  // This is necessary because the cursor column may not be unique.
  if (columnId !== 'id') {
    query.addOrderBy('id', order);
  }

  if (cursor) {
    getCursorWhereClause(query, cursor, columnId, paginationArgs);
  }
  query.take(limit);

  let result: T[] = await query.getMany();
  if (paginationArgs.last) {
    result = result.reverse();
  }

  const { countBefore, countAfter } = await getCounts(
    result,
    totalCountQuery,
    query,
    columnId,
    paginationArgs,
  );

  const edges = getEdges(result, columnId);
  const pageInfo = getPageInfo(edges, countBefore, countAfter);

  return {
    edges,
    pageInfo,
    totalCount: countAfter + countBefore + edges.length,
  };
}

function convertBufferToDate(offsetId: string, columnId: string): string {
  let columnIdFromOffset = offsetId;
  if (columnId === 'createdAt' || columnId === 'updatedAt') {
    columnIdFromOffset = new Date(
      new Date(offsetId).getTime() -
        new Date(offsetId.slice(0, -1)).getTimezoneOffset() * 60000,
    ).toISOString();
  }
  return columnIdFromOffset;
}

function getCursorWhereClause<T extends object>(
  query: SelectQueryBuilder<T>,
  cursor: Cursor,
  columnId: string,
  paginationArgs: PaginationArgs,
): ObjectLiteral {
  const offsetId = cursor.decode();

  let primaryColumnOffset: string | null = null;
  let secondaryColumnOffset: string | null = null;
  if (columnId === 'id') {
    primaryColumnOffset = offsetId;
  } else {
    primaryColumnOffset = offsetId.split(multiColumnDelimiter)[0];
    secondaryColumnOffset = offsetId.split(multiColumnDelimiter)[1];
  }
  // if (columnId === 'createdAt' || columnId === 'updatedAt') {
  //   nonIdColumnOffset = convertBufferToDate(offsetId, columnId);
  // }

  const whereClause: ObjectLiteral = {};

  let findOperator: typeof LessThan | typeof MoreThan;

  if (paginationArgs.first && paginationArgs.after) {
    findOperator = paginationArgs.reverse ? LessThan : MoreThan;
  } else if (paginationArgs.last && paginationArgs.before) {
    findOperator = paginationArgs.reverse ? MoreThan : LessThan;
  } else {
    throw new Error('Invalid cursor pagination arguments');
  }

  const whereExpression = new Brackets((qb) => {
    qb.where({ [columnId]: findOperator(primaryColumnOffset) });
    if (columnId !== 'id') {
      qb.orWhere(
        new Brackets((qb) => {
          qb.where({
            [columnId]: primaryColumnOffset,
          }).andWhere({
            id: findOperator(secondaryColumnOffset),
          });
        }),
      );
    }
  });
  if (query.expressionMap.wheres && query.expressionMap.wheres.length) {
    query.andWhere(whereExpression);
  } else {
    query.where(whereExpression);
  }
  return whereClause;
}

async function getCounts<T extends object>(
  result: T[],
  totalCountQuery: SelectQueryBuilder<T>,
  query: SelectQueryBuilder<T>,
  columnId: string,
  paginationArgs: PaginationArgs,
) {
  const beforeQuery = totalCountQuery.clone();
  const afterQuery = totalCountQuery.clone();

  let primaryStartCursorId: Type | null = null;
  let primaryEndCursorId: Type | null = null;
  let secondaryStartCursorId: Type | null;
  let secondaryEndCursorId: Type | null;

  if (result.length > 0) {
    primaryStartCursorId = (result[0] as IIndexable)[columnId];
    primaryEndCursorId = (result.slice(-1)[0] as IIndexable)[columnId];
    if (columnId !== 'id') {
      secondaryStartCursorId = (result[0] as IIndexable)['id'];
      secondaryEndCursorId = (result.slice(-1)[0] as IIndexable)['id'];
    }
  }

  let findOperatorBefore: typeof LessThan | typeof MoreThan;
  let findOperatorAfter: typeof LessThan | typeof MoreThan;

  if (paginationArgs.reverse) {
    findOperatorBefore = MoreThan;
    findOperatorAfter = LessThan;
  } else {
    findOperatorBefore = LessThan;
    findOperatorAfter = MoreThan;
  }

  const whereExpressionBefore = new Brackets((qb) => {
    qb.where({ [columnId]: findOperatorBefore(primaryStartCursorId) });
    if (columnId !== 'id') {
      qb.orWhere(
        new Brackets((qb) => {
          qb.where({
            [columnId]: primaryStartCursorId,
          }).andWhere({
            id: findOperatorBefore(secondaryStartCursorId),
          });
        }),
      );
    }
  });

  const whereExpressionAfter = new Brackets((qb) => {
    qb.where({ [columnId]: findOperatorAfter(primaryEndCursorId) });
    if (columnId !== 'id') {
      qb.orWhere(
        new Brackets((qb) => {
          qb.where({
            [columnId]: primaryEndCursorId,
          }).andWhere({
            id: findOperatorAfter(secondaryEndCursorId),
          });
        }),
      );
    }
  });

  if (beforeQuery.expressionMap.wheres?.length > 0) {
    beforeQuery.andWhere(whereExpressionBefore);
  } else {
    beforeQuery.where(whereExpressionBefore);
  }

  if (afterQuery.expressionMap.wheres?.length > 0) {
    afterQuery.andWhere(whereExpressionAfter);
  } else {
    afterQuery.where(whereExpressionAfter);
  }

  const countBefore = await beforeQuery.getCount();
  const countAfter = await afterQuery.getCount();

  return {
    countBefore,
    countAfter,
  };
}

function getEdges<T>(result: T[], columnId: string): IEdgeType<T>[] {
  return result.map((value) => {
    let cursor: string | null = null;
    if (columnId !== 'id') {
      const nonIdColumn = (value as IIndexable)[columnId];
      const id = (value as IIndexable)['id'];
      cursor = new Cursor(
        `${nonIdColumn}${multiColumnDelimiter}${id}`,
        columnId,
      ).encode();
    } else {
      const id = (value as IIndexable)[columnId];
      cursor = new Cursor(`${id}`, columnId).encode();
    }

    return {
      node: value,
      cursor: cursor,
    };
  });
}

function getPageInfo<T>(
  edges: IEdgeType<T>[],
  countBefore: number,
  countAfter: number,
): PageInfo {
  const pageInfo = new PageInfo();
  pageInfo.startCursor = edges.length > 0 ? edges[0].cursor : undefined;
  pageInfo.endCursor = edges.length > 0 ? edges.slice(-1)[0].cursor : undefined;
  pageInfo.hasNextPage = countAfter > 0;
  pageInfo.hasPreviousPage = countBefore > 0;

  return pageInfo;
}
