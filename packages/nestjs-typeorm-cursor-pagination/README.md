# @adamwdennis/nestjs-typeorm-cursor-pagination

[![npm version](https://img.shields.io/npm/v/@adamwdennis/nestjs-typeorm-cursor-pagination.svg)](https://www.npmjs.com/package/@adamwdennis/nestjs-typeorm-cursor-pagination)
[![npm downloads](https://img.shields.io/npm/dm/@adamwdennis/nestjs-typeorm-cursor-pagination.svg)](https://www.npmjs.com/package/@adamwdennis/nestjs-typeorm-cursor-pagination)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Production-ready cursor pagination for NestJS + GraphQL + TypeORM**

Add Relay-spec cursor pagination to your NestJS GraphQL API in minutes. No boilerplate, just add 3 lines of code.

```typescript
const queryBuilder = this.userRepository.createQueryBuilder('user');
return paginate(queryBuilder, paginationArgs, 'user.id');
```

**That's it.** You now have:
- ✅ Relay-compliant cursor pagination
- ✅ Forward and backward navigation
- ✅ Complete `PageInfo` metadata
- ✅ Automatic query optimization
- ✅ No manual cursor encoding

---

## Why Use Cursor Pagination?

**Offset pagination breaks at scale.** When users navigate to page 1000, your database has to scan and skip 999,999 rows. Cursor pagination solves this:

- **⚡ Constant-time performance** - Page 1 and page 1,000,000 take the same time
- **🔒 Consistent results** - No duplicate/missing items when data changes during pagination
- **📱 Infinite scroll friendly** - Perfect for mobile apps and modern UIs
- **🌐 Relay/GraphQL standard** - Works with Apollo Client, Relay, and all GraphQL clients

## When to Use This Package

✅ **Use cursor pagination when:**
- Building APIs for mobile apps with infinite scroll
- Working with large datasets (10,000+ rows)
- You need real-time data consistency (e.g., social feeds, notifications)
- Building public APIs that follow GraphQL best practices
- Using Apollo Client, Relay, or any Relay-compliant client

⚠️ **Consider offset pagination when:**
- You need traditional "page 1, 2, 3" navigation
- Working with small, static datasets (<1000 rows)
- Users need to jump to arbitrary pages (e.g., "go to page 47")
- You're building an internal admin panel

## Features

- ✅ **Drop-in solution** - Works with your existing TypeORM entities and repositories
- ✅ **Full Relay spec** - Compatible with all GraphQL clients (Apollo, Relay, urql)
- ✅ **Bidirectional** - Navigate forwards (`first`/`after`) and backwards (`last`/`before`)
- ✅ **Advanced filtering** - Complex filters with AND/OR logic and 15+ comparison operators
- ✅ **Type-safe** - Full TypeScript support with intelligent auto-completion
- ✅ **Optimized queries** - Automatic JOIN detection and query optimization
- ✅ **Battle-tested** - 180+ tests, production-ready

## Installation

```bash
npm install @adamwdennis/nestjs-typeorm-cursor-pagination
```

**Peer dependencies** (you probably already have these):
```bash
npm install @nestjs/common @nestjs/graphql typeorm
```

## 🚀 Try the Live Example

Clone the repo and run the sample app to see it in action:

```bash
git clone https://github.com/adamwdennis/nestjs-api-dx.git
cd nestjs-api-dx
pnpm install
pnpm nx serve sample-nestjs-graphql-api
```

Open `http://localhost:3000/graphql` - you'll see **7 ready-to-run example queries** demonstrating:
- ✅ Basic pagination (forward/backward)
- ✅ Cursor-based navigation
- ✅ Category filtering
- ✅ Price range filtering
- ✅ Complex nested queries

All queries work out of the box with auto-seeded data (40 products, 3 categories).

👉 [View all example queries](../../apps/sample-nestjs-graphql-api/SAMPLE-QUERIES.md)

---

## Table of Contents

- [Quick Start](#quick-start)
- [What You Get](#what-you-get)
- [Usage Examples](#usage-examples)
- [Advanced Features](#advanced-usage)
- [API Reference](#api-reference)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

**3 steps to add cursor pagination:**

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

### 3. Use in Your Resolver

```typescript
import { Resolver, Query, Args } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginate, PaginationArgs } from '@adamwdennis/nestjs-typeorm-cursor-pagination';

@Resolver(() => User)
export class UserResolver {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  @Query(() => UserConnection)
  async users(@Args() args: PaginationArgs): Promise<UserConnection> {
    const qb = this.userRepository.createQueryBuilder('user');
    return paginate(qb, args, 'user.id');
  }
}
```

**That's it!** Your API now supports:
- Forward pagination: `users(first: 10, after: "cursor")`
- Backward pagination: `users(last: 10, before: "cursor")`
- Full `PageInfo` metadata with `hasNextPage`, `hasPreviousPage`, etc.

---

## What You Get

When you use `paginate()`, your GraphQL query returns:

```graphql
{
  users(first: 10) {
    edges {
      node {
        id
        name
        email
      }
      cursor  # Opaque cursor for this item
    }
    pageInfo {
      hasNextPage      # Boolean
      hasPreviousPage  # Boolean
      startCursor      # First item's cursor
      endCursor        # Last item's cursor
      totalCount       # Total items across all pages
      countBefore      # Items before this page
      countAfter       # Items after this page
    }
  }
}
```

**No manual cursor encoding**, **no offset math**, **no performance issues at scale**.

---

## Usage Examples

### Basic Pagination

```graphql
# Get first 10 users
query {
  users(first: 10) {
    edges {
      node { id name email }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
      totalCount
    }
  }
}
```

### Navigate to Next Page

```graphql
# Use endCursor from previous query
query {
  users(first: 10, after: "encoded_cursor_here") {
    edges {
      node { id name }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

### Backward Pagination

```graphql
# Get previous 10 users
query {
  users(last: 10, before: "encoded_cursor_here") {
    edges {
      node { id name }
    }
    pageInfo {
      hasPreviousPage
      startCursor
    }
  }
}
```

### Reverse Sort Order

```graphql
# Get latest users first
query {
  users(first: 10, reverse: true) {
    edges {
      node { id name createdAt }
    }
  }
}
```

---

## Advanced Features

### Custom Sort Columns

Sort by any field in your entity:

```typescript
// Sort by creation date (newest first with reverse: true)
paginate(queryBuilder, args, 'user.createdAt');

// Sort by name
paginate(queryBuilder, args, 'user.name');

// Sort by custom field
paginate(queryBuilder, args, 'user.score');
```

**Note:** Non-unique columns automatically get `id` as a secondary sort for deterministic ordering.

### Filtering

Add complex filters with AND/OR logic:

```typescript
import { FilterQueryBuilder } from '@adamwdennis/nestjs-typeorm-cursor-pagination';

@Query(() => UserConnection)
async users(
  @Args() args: PaginationArgs,
  @Args('filter', { nullable: true }) filter?: FiltersExpression
) {
  const filterBuilder = new FilterQueryBuilder(this.userRepository, filter);
  const queryBuilder = filterBuilder.build();
  return paginate(queryBuilder, args, 'user.createdAt');
}
```

Example filter query:

```graphql
{
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
    edges { node { id name } }
  }
}
```

**Supported operators:** `eq`, `not`, `in`, `not_in`, `like`, `ilike`, `gt`, `gte`, `lt`, `lte`, `between`, `contains`, `any`, `overlap`

### Reusable Service Pattern

Extend `BaseEntityPaginationService` for cleaner code:

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

Use in resolver:

```typescript
@Resolver(() => User)
export class UserResolver {
  constructor(private userService: UserPaginationService) {}

  @Query(() => UserConnection)
  async users(@Args() args: PaginationArgs) {
    return this.userService.getFilteredConnection(args);
  }
}
```

### Nested Filters with OR Logic

```graphql
{
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
            { field: "user.status", operator: "eq", value: "active" }
            { field: "user.verified", operator: "eq", value: true }
          ]
        }
      ]
    }
  ) {
    edges { node { id name role } }
  }
}
```

## API Reference

### Core Function

```typescript
paginate<T>(
  query: SelectQueryBuilder<T>,
  args: PaginationArgs,
  cursorColumn: string
): Promise<IPaginatedType<T>>
```

**Example:**
```typescript
return paginate(queryBuilder, paginationArgs, 'user.createdAt');
```

### Pagination Arguments

```typescript
interface PaginationArgs {
  first?: number;    // Forward pagination: get first N items
  after?: string;    // Forward: cursor to start from
  last?: number;     // Backward pagination: get last N items
  before?: string;   // Backward: cursor to end at
  reverse?: boolean; // Reverse the sort order
}
```

### Filter Operators

**Comparison:** `eq`, `not`, `gt`, `gte`, `lt`, `lte`, `like`, `ilike`, `in`, `not_in`, `between`, `contains`, `any`, `overlap`

**Logical:** `AND`, `OR`

### TypeScript Types

```typescript
interface NodeEntity {
  id: string;
}

interface IPaginatedType<T> {
  edges: IEdgeType<T>[];
  pageInfo: PageInfo;
}

interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
  totalCount: number;
  countBefore: number;
  countAfter: number;
}
```

For complete type definitions, see the [source code](src/index.ts).

## Best Practices

1. **Always specify cursor column** - Use `paginate(qb, args, 'user.createdAt')` for predictable ordering
2. **Index your cursor columns** - Add database indexes to columns used for cursors
3. **Set max page size** - Implement limits in your resolver (e.g., max `first: 100`)
4. **Use appropriate sort columns** - Choose indexed columns for best performance
5. **Test with large datasets** - Pagination performance is most noticeable with 10,000+ rows

---

## Troubleshooting

### "Expected 2 arguments, but got 1" error with `Paginated()`

```typescript
// ❌ Wrong
export class UserConnection extends Paginated(User) {}

// ✅ Correct
export class UserConnection extends Paginated(User, 'User') {}
```

The second argument is the GraphQL type name for the Edge type.

### "Cannot read property 'totalCount' of undefined"

Make sure you're querying `pageInfo.totalCount`, not `totalCount` directly:

```graphql
# ❌ Wrong
{ users(first: 10) { totalCount } }

# ✅ Correct
{ users(first: 10) { pageInfo { totalCount } } }
```

### Slow queries with large offsets

This is expected with offset pagination. Switch to cursor pagination for consistent performance:

```typescript
// ❌ Offset pagination - slow at high pages
.skip(page * limit).take(limit)

// ✅ Cursor pagination - always fast
paginate(queryBuilder, args, 'user.id')
```

### "Entity must implement NodeEntity"

Your entity needs an `id: string` field:

```typescript
@Entity()
export class User implements NodeEntity {
  @PrimaryColumn()  // or @PrimaryGeneratedColumn('uuid')
  id!: string;
  // ...
}
```

### Working with numeric IDs

Convert to string in your entity:

```typescript
@PrimaryGeneratedColumn()
@Field(() => ID)
get id(): string {
  return this._id.toString();
}

@Column()
private _id!: number;
```

### Need more help?

- 📖 [See the example app](../../apps/sample-nestjs-graphql-api)
- 🐛 [Report an issue](https://github.com/adamwdennis/nestjs-api-dx/issues)
- 💬 [Start a discussion](https://github.com/adamwdennis/nestjs-api-dx/discussions)

---

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

Adam Dennis (@adamwdennis)
