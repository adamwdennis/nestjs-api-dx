import { Injectable, Logger } from '@nestjs/common';

import { Repository } from 'typeorm';
import { PaginationArgs } from '../pagination/pagination.args';
import { NodeEntity } from '../entities/NodeEntity';
import { IPaginatedType } from '../pagination/paginated';

/**
 * This is an abstrct, generic service class that can be used to create a
 * paginated type for a given class.
 *
 * Based on https://docs.nestjs.com/graphql/resolvers#generics
 */
@Injectable()
export abstract class BaseEntityPaginationService<
  T extends NodeEntity,
  U extends PaginationArgs,
> {
  protected readonly logger: Logger;

  constructor(
    protected readonly repository: Repository<T>,
    protected readonly entityName: string,
  ) {
    this.logger = new Logger(entityName);
  }

  /**
   * This method is used to paginate the results of a query.
   *
   * @param args The pagination arguments
   * @param filter The filter to apply to the query
   * @returns A paginated type
   */
  protected abstract getFilteredConnection(
    args: U,
    filter?: unknown,
  ): Promise<IPaginatedType<T>>;

  /**
   * This method is used to get the order by clause for a query.
   * @param sortKey The sort key to use
   * @returns The order by field
   */
  protected abstract getOrderBy(sortKey?: unknown): string;
}
