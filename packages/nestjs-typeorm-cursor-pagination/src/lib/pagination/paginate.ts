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
import { Buffer } from 'buffer';
import { LessThan, MoreThan, SelectQueryBuilder } from 'typeorm';
import { Cursor } from './cursor';
import { PageInfo } from './page-info';
import { IEdgeType, IPaginatedType } from './paginated';
import { PaginationArgs } from './pagination.args';

interface IIndexable<T = Type> {
  [key: string]: T;
}

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
  const columnId =
    cursorColumn.split('.').length > 1
      ? cursorColumn.split('.').slice(1)[0]
      : cursorColumn;

  const order = paginationArgs.reverse ? 'DESC' : 'ASC';
  query.orderBy({ [cursorColumn]: order });

  let limit = paginationArgs.first ?? paginationArgs.last ?? 25;

  let cursor: Cursor | null = null;

  if (paginationArgs.first) {
    // FORWARD pagination
    limit = paginationArgs.first;
    if (paginationArgs.after) {
      cursor = new Cursor(paginationArgs.after);
    }
  } else if (paginationArgs.last) {
    // REVERSE pagination
    limit = paginationArgs.last;
    if (paginationArgs.before) {
      cursor = new Cursor(paginationArgs.before);
    }
  }

  if (cursor) {
    const cursorWhereClause = getCursorWhereClause(
      cursor,
      columnId,
      paginationArgs,
    );
    if (query.expressionMap.wheres && query.expressionMap.wheres.length) {
      query.andWhere(cursorWhereClause);
    } else {
      query.where(cursorWhereClause);
    }
  }

  query.take(limit);

  const result: T[] = await query.getMany();

  const { countBefore, countAfter } = await getCounts(
    result,
    query,
    columnId,
    paginationArgs,
    cursor,
  );

  const edges = getEdges(result, columnId);
  const pageInfo = getPageInfo(edges, 0, 0);

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

function getCursorWhereClause(
  cursor: Cursor,
  columnId: string,
  paginationArgs: PaginationArgs,
) {
  const offsetId = cursor.decode();
  let columnIdFromOffset = offsetId;
  if (columnId === 'createdAt' || columnId === 'updatedAt') {
    columnIdFromOffset = convertBufferToDate(offsetId, columnId);
  }

  if (paginationArgs.first && paginationArgs.after) {
    if (paginationArgs.reverse) {
      return {
        [columnId]: LessThan(columnIdFromOffset),
      };
    } else {
      return {
        [columnId]: MoreThan(columnIdFromOffset),
      };
    }
  } else if (paginationArgs.last && paginationArgs.before) {
    if (paginationArgs.reverse) {
      return {
        [columnId]: MoreThan(columnIdFromOffset),
      };
    } else {
      return {
        [columnId]: LessThan(columnIdFromOffset),
      };
    }
  } else {
    throw new Error('Invalid cursor pagination arguments');
  }
}

async function getCounts<T extends object>(
  result: T[],
  query: SelectQueryBuilder<T>,
  columnId: string,
  paginationArgs: PaginationArgs,
  cursor?: Cursor | null,
) {
  const totalCountQuery = query.clone();
  const beforeQuery = totalCountQuery.clone();
  const afterQuery = totalCountQuery.clone();

  if (cursor) {
    const startCursorId =
      result.length > 0 ? (result[0] as IIndexable)[columnId] : null;
    const endCursorId =
      result.length > 0 ? (result.slice(-1)[0] as IIndexable)[columnId] : null;

    const beforeWhereClause = {
      [columnId]: paginationArgs.reverse
        ? MoreThan(startCursorId)
        : LessThan(startCursorId),
    };
    const afterWhereClause = {
      [columnId]: paginationArgs.reverse
        ? LessThan(endCursorId)
        : MoreThan(endCursorId),
    };

    if (beforeQuery.expressionMap.wheres?.length > 0) {
      beforeQuery.andWhere(beforeWhereClause);
    } else {
      beforeQuery.where(beforeWhereClause);
    }

    if (afterQuery.expressionMap.wheres?.length > 0) {
      afterQuery.andWhere(afterWhereClause);
    } else {
      afterQuery.where(afterWhereClause);
    }
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
    let bufferValue = (value as IIndexable)[columnId];
    if (columnId === 'createdAt' || columnId === 'updatedAt') {
      bufferValue = new Date(
        String(bufferValue),
      ).toISOString() as unknown as Type<T>;
    }
    return {
      node: value,
      cursor: Buffer.from(`${bufferValue}`).toString('base64'),
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
