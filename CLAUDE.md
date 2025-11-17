# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nx monorepo containing `@adamwdennis/nestjs-typeorm-cursor-pagination` - a NestJS library that provides Relay GraphQL Cursor Connections-compliant cursor-based pagination for TypeORM entities.

## Common Commands

### Building
```bash
# Build all packages
pnpm nx run-many --target=build --all

# Build the pagination library
pnpm nx build nestjs-typeorm-cursor-pagination
```

### Testing
```bash
# Run tests for the pagination library
pnpm nx test nestjs-typeorm-cursor-pagination
```

### Linting
```bash
# Lint the pagination library
pnpm nx lint nestjs-typeorm-cursor-pagination
```

### Publishing
```bash
# Full publish workflow
pnpm nx build nestjs-typeorm-cursor-pagination
npm publish dist/packages/nestjs-typeorm-cursor-pagination

# Or use Nx release
pnpm nx release publish
```

### Nx Utilities
```bash
# View project dependency graph
pnpm nx graph

# List available plugins
pnpm nx list

# See generators for a plugin
pnpm nx list <plugin-name>
```

## Architecture

### Core Pagination System

The library implements Relay-style cursor pagination with bidirectional support:

**Forward Pagination**: Uses `first` and `after` parameters
**Backward Pagination**: Uses `last` and `before` parameters

The `paginate()` function in `src/lib/pagination/paginate.ts` is the main entry point:
- Accepts a TypeORM `SelectQueryBuilder<T>`, `PaginationArgs`, and optional `cursorColumn`
- Returns `IPaginatedType<T>` with `edges`, `pageInfo`, and `totalCount`
- Handles multi-column cursors for non-unique sort fields (format: `columnValue|id`)
- Always adds `id` as secondary sort when using non-unique `cursorColumn` for deterministic ordering

**Cursor Encoding**: Cursors are base64-encoded strings containing the column value(s) needed to resume pagination

**Count Queries**: Executes separate queries to determine `countBefore` and `countAfter` for accurate `hasNextPage`/`hasPreviousPage` flags

### Filter Query System

The `FilterQueryBuilder` (in `src/lib/query-builder/filter-query-builder.ts`) constructs TypeORM queries from `FiltersExpression` objects:

**JoinBuilder**: Traverses the filter expression tree to determine necessary JOIN clauses for nested entity filtering

**WhereBuilder**: Recursively builds WHERE clauses with parameterized queries
- Supports logical operators (AND/OR) via `LogicalOperatorEnum`
- Supports comparison operators: EQUAL, BETWEEN, IN, LIKE, ILIKE, GREATER_THAN, LESS_THAN, etc.
- Builds nested expressions from `FiltersExpression.childExpressions`

**Filter Structure**:
- `FiltersExpression` contains `operator` (AND/OR), `filters` array, and optional `childExpressions`
- `FilterInput` specifies `field`, `operator`, and `value`

### Base Service Pattern

`BaseEntityPaginationService` in `src/lib/services/base-entity-pagination.service.ts` is an abstract generic class:
- Type parameter `T extends NodeEntity` (requires entity with `id: string` field)
- Type parameter `U extends PaginationArgs`
- Expects subclasses to implement `getFilteredConnection()` and `getOrderBy()`
- Designed to work with TypeORM repositories

### Entity Requirements

Entities must implement `NodeEntity` interface (has `id: string` field)
- Optional `NodeEntityWithDates` type adds `createdAt` and `updatedAt?` fields

### Technology Stack

- **Nx 21.6.3**: Monorepo tooling with `@nx/js:tsc` executor
- **NestJS 10.x**: Core framework (peer dependency)
- **TypeORM 0.3.20**: ORM (peer dependency)
- **@nestjs/graphql 12.x**: For GraphQL type definitions
- **Jest 30.x**: Testing with `ts-jest` transform
- **TypeScript 5.3.3**: Compiled with strict typing

### Package Configuration

- Published as **ESM** (`"type": "module"`)
- Main entry: `dist/packages/nestjs-typeorm-cursor-pagination/src/index.js`
- Exports from `src/index.ts` define the public API
- Build output includes markdown, JSON (excluding tsconfig), JS, and `.d.ts` files


<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors

# CI Error Guidelines

If the user wants help with fixing an error in their CI pipeline, use the following flow:
- Retrieve the list of current CI Pipeline Executions (CIPEs) using the `nx_cloud_cipe_details` tool
- If there are any errors, use the `nx_cloud_fix_cipe_failure` tool to retrieve the logs for a specific task
- Use the task logs to see what's wrong and help the user fix their problem. Use the appropriate tools if necessary
- Make sure that the problem is fixed by running the task that you passed into the `nx_cloud_fix_cipe_failure` tool


<!-- nx configuration end-->