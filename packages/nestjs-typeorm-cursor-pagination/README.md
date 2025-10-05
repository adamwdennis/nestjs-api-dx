# NestJS TypeORM Cursor Pagination Tools

[![npm](https://img.shields.io/npm/v/@adamwdennis/nestjs-typeorm-cursor-pagination)](https://www.npmjs.com/package/@adamwdennis/nestjs-typeorm-cursor-pagination)
[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/@adamwdennis/nestjs-api-dx/CI)](https://img.shields.io/github/workflow/status/@adamwdennis/nestjs-api-dx/CI)

A comprehensive toolkit for implementing [Relay GraphQL Cursor Connections](https://relay.dev/graphql/connections.htm)-compliant cursor-based pagination in your NestJS GraphQL API with TypeORM. This library provides efficient, type-safe pagination with advanced filtering capabilities.

## Features

- ✅ **Relay-compliant cursor pagination** - Full support for forward and backward pagination
- ✅ **Advanced filtering** - Complex filters with logical operators (AND/OR) and comparison operators
- ✅ **Multi-column sorting** - Sort by any field with deterministic ordering
- ✅ **Type-safe** - Full TypeScript support with generics
- ✅ **Efficient queries** - Optimized TypeORM queries with automatic JOIN detection
- ✅ **Nested filtering** - Filter on related entities
- ✅ **GraphQL decorators** - Ready-to-use GraphQL types and input objects

## Installation

```bash
npm install @adamwdennis/nestjs-typeorm-cursor-pagination
```

or

```bash
yarn add @adamwdennis/nestjs-typeorm-cursor-pagination
```

or

```bash
pnpm install @adamwdennis/nestjs-typeorm-cursor-pagination
```

### Peer Dependencies

Ensure you have these peer dependencies installed:

```bash
npm install @nestjs/common @nestjs/graphql typeorm
```

## Quick Start

### 1. Define Your Entity

Your entity must implement the `NodeEntity` interface (requires an `id: string` field):

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { NodeEntity } from '@adamwdennis/nestjs-typeorm-cursor-pagination';

@Entity()
@ObjectType()
export class User implements NodeEntity {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => ID)
  id!: string;

  @Column()
  @Field()
  name!: string;

  @Column()
  @Field()
  email!: string;

  @Column()
  @Field()
  createdAt!: Date;
}
```

### 2. Create a Paginated Type

Use the `Paginated` function to create a GraphQL-compatible paginated type:

```typescript
import { ObjectType } from '@nestjs/graphql';
import { Paginated } from '@adamwdennis/nestjs-typeorm-cursor-pagination';
import { User } from './user.entity';

@ObjectType()
export class UserConnection extends Paginated(User, 'User') {}
```

This creates a type with:
- `edges: UserEdge[]` - Array of edges containing cursor and node
- `pageInfo: PageInfo` - Pagination metadata (hasNextPage, hasPreviousPage, startCursor, endCursor)
- `totalCount: number` - Total number of items

### 3. Implement in Your Resolver

#### Simple Pagination

```typescript
import { Resolver, Query, Args } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  paginate,
  PaginationArgs
} from '@adamwdennis/nestjs-typeorm-cursor-pagination';
import { User } from './user.entity';
import { UserConnection } from './user.connection';

@Resolver(() => User)
export class UserResolver {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  @Query(() => UserConnection)
  async users(
    @Args() paginationArgs: PaginationArgs,
  ): Promise<UserConnection> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    return paginate(queryBuilder, paginationArgs, 'user.id');
  }
}
```

#### With Filtering

```typescript
import {
  FilterQueryBuilder,
  FiltersExpression,
  LogicalOperatorEnum,
  ComparisonOperatorEnum
} from '@adamwdennis/nestjs-typeorm-cursor-pagination';

@Resolver(() => User)
export class UserResolver {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  @Query(() => UserConnection)
  async users(
    @Args() paginationArgs: PaginationArgs,
    @Args('filter', { nullable: true }) filter?: FiltersExpression,
  ): Promise<UserConnection> {
    // Build query with filters
    const filterBuilder = new FilterQueryBuilder(this.userRepository, filter);
    const queryBuilder = filterBuilder.build();

    return paginate(queryBuilder, paginationArgs, 'user.createdAt');
  }
}
```

### 4. Query Your API

#### Forward Pagination

```graphql
query {
  users(first: 10) {
    edges {
      cursor
      node {
        id
        name
        email
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
```

#### Paginate Through Results

```graphql
query {
  users(first: 10, after: "encoded_cursor_here") {
    edges {
      cursor
      node {
        id
        name
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

#### Backward Pagination

```graphql
query {
  users(last: 10, before: "encoded_cursor_here") {
    edges {
      cursor
      node {
        id
        name
      }
    }
    pageInfo {
      hasPreviousPage
      startCursor
    }
  }
}
```

## Advanced Usage

### Using BaseEntityPaginationService

Create a reusable service for your entities:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BaseEntityPaginationService,
  PaginationArgs,
  IPaginatedType,
  FilterQueryBuilder,
  FiltersExpression,
  paginate,
} from '@adamwdennis/nestjs-typeorm-cursor-pagination';
import { User } from './user.entity';

@Injectable()
export class UserPaginationService extends BaseEntityPaginationService<
  User,
  PaginationArgs
> {
  constructor(
    @InjectRepository(User)
    protected readonly repository: Repository<User>,
  ) {
    super(repository, 'user');
  }

  async getFilteredConnection(
    args: PaginationArgs,
    filter?: FiltersExpression,
  ): Promise<IPaginatedType<User>> {
    const filterBuilder = new FilterQueryBuilder(this.repository, filter);
    const queryBuilder = filterBuilder.build();

    return paginate(queryBuilder, args, this.getOrderBy());
  }

  protected getOrderBy(): string {
    return 'user.createdAt';
  }
}
```

Then use it in your resolver:

```typescript
@Resolver(() => User)
export class UserResolver {
  constructor(private userService: UserPaginationService) {}

  @Query(() => UserConnection)
  async users(
    @Args() paginationArgs: PaginationArgs,
    @Args('filter', { nullable: true }) filter?: FiltersExpression,
  ): Promise<UserConnection> {
    return this.userService.getFilteredConnection(paginationArgs, filter);
  }
}
```

### Complex Filtering

#### Define GraphQL Input Types

```typescript
import { InputType, Field } from '@nestjs/graphql';
import {
  FiltersExpression,
  FilterInput,
  LogicalOperatorEnum,
  ComparisonOperatorEnum
} from '@adamwdennis/nestjs-typeorm-cursor-pagination';

@InputType()
export class UserFilterInput extends FiltersExpression {
  @Field(() => [UserFilterInput], { nullable: true })
  childExpressions?: UserFilterInput[];
}
```

#### Example: AND/OR Filters

```graphql
query {
  users(
    first: 10
    filter: {
      operator: AND
      filters: [
        { field: "user.name", operator: "ilike", value: "john" }
        { field: "user.createdAt", operator: "gte", value: "2024-01-01" }
      ]
    }
  ) {
    edges {
      node {
        id
        name
        createdAt
      }
    }
  }
}
```

#### Example: Nested Filters

```graphql
query {
  users(
    first: 10
    filter: {
      operator: OR
      childExpressions: [
        {
          operator: AND
          filters: [
            { field: "user.name", operator: "ilike", value: "john" }
            { field: "user.role", operator: "eq", value: "admin" }
          ]
        }
        {
          operator: AND
          filters: [
            { field: "user.name", operator: "ilike", value: "jane" }
            { field: "user.role", operator: "eq", value: "moderator" }
          ]
        }
      ]
    }
  ) {
    edges {
      node {
        id
        name
        role
      }
    }
  }
}
```

### Sorting by Different Fields

You can sort by any field in your entity:

```typescript
// Sort by ID (default)
paginate(queryBuilder, paginationArgs, 'user.id');

// Sort by creation date
paginate(queryBuilder, paginationArgs, 'user.createdAt');

// Sort by name
paginate(queryBuilder, paginationArgs, 'user.name');
```

**Note:** When sorting by non-unique fields, the library automatically adds `id` as a secondary sort column to ensure deterministic ordering.

### Reverse Sorting

Use the `reverse` parameter to invert the sort order:

```graphql
query {
  users(first: 10, reverse: true) {
    edges {
      node {
        id
        name
      }
    }
  }
}
```

## API Reference

### Core Functions

#### `paginate<T>(query, paginationArgs, cursorColumn)`

Main pagination function.

**Parameters:**
- `query: SelectQueryBuilder<T>` - TypeORM query builder
- `paginationArgs: PaginationArgs` - Pagination arguments
- `cursorColumn: string` - Column to use for cursor (default: 'id')

**Returns:** `Promise<IPaginatedType<T>>`

### Classes

#### `PaginationArgs`

GraphQL arguments for pagination.

**Fields:**
- `first?: number` - Number of items to fetch from the start
- `after?: string` - Cursor to start from (forward pagination)
- `last?: number` - Number of items to fetch from the end
- `before?: string` - Cursor to end at (backward pagination)
- `reverse?: boolean` - Reverse the sort order (default: false)

#### `FilterQueryBuilder<T>`

Builds TypeORM queries from filter expressions.

**Constructor:**
- `entityRepository: Repository<T>` - TypeORM repository
- `filtersExpression?: FiltersExpression` - Filter expression tree

**Methods:**
- `build(): SelectQueryBuilder<T>` - Builds and returns the query

#### `FiltersExpression`

Represents a filter expression tree.

**Fields:**
- `operator?: LogicalOperatorEnum` - Logical operator (AND/OR)
- `filters?: FilterInput[]` - Leaf node filters
- `childExpressions?: FiltersExpression[]` - Sub-expressions

#### `FilterInput`

Represents a single filter condition.

**Fields:**
- `field: string` - Field to filter (e.g., 'user.name')
- `operator?: ComparisonOperatorEnum` - Comparison operator
- `value?: any` - Value to compare against

### Enums

#### `ComparisonOperatorEnum`

- `EQUAL` ('eq') - Equal to
- `NOT` ('not') - Not equal to
- `IN` ('in') - In array
- `NOT_IN` ('not_in') - Not in array
- `LIKE` ('like') - Like (case-sensitive)
- `ILIKE` ('ilike') - Like (case-insensitive)
- `GREATER_THAN` ('gt') - Greater than
- `GREATER_THAN_OR_EQUAL` ('gte') - Greater than or equal
- `LESS_THAN` ('lt') - Less than
- `LESS_THAN_OR_EQUAL` ('lte') - Less than or equal
- `BETWEEN` ('between') - Between two values
- `CONTAINS` ('contains') - Contains string
- `ANY` ('any') - Any of the values
- `OVERLAP` ('overlap') - Array overlap

#### `LogicalOperatorEnum`

- `AND` ('and') - Logical AND
- `OR` ('or') - Logical OR

### Interfaces

#### `NodeEntity`

Base interface for entities.

```typescript
interface NodeEntity {
  id: string;
}
```

#### `NodeEntityWithDates`

Extended interface with timestamps.

```typescript
type NodeEntityWithDates = NodeEntity & {
  createdAt: Date;
  updatedAt?: Date;
};
```

#### `IPaginatedType<T>`

Paginated result structure.

```typescript
interface IPaginatedType<T> {
  edges: IEdgeType<T>[];
  pageInfo: PageInfo;
  totalCount: number;
}
```

#### `IEdgeType<T>`

Edge structure.

```typescript
interface IEdgeType<T> {
  cursor: string;
  node: T;
}
```

#### `PageInfo`

Pagination metadata.

```typescript
class PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
}
```

## Best Practices

1. **Always use a cursor column** - Specify the column you're sorting by for predictable results
2. **Index your sort columns** - Add database indexes to columns used in `cursorColumn`
3. **Limit page size** - Implement maximum page size limits to prevent performance issues
4. **Use filters wisely** - Complex filters can impact query performance
5. **Cache results** - Consider caching paginated results for frequently accessed data

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

Adam Dennis (@adamwdennis)
