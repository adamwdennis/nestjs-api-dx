# Sample NestJS GraphQL API with Cursor Pagination

Demo app showcasing `@adamwdennis/nestjs-typeorm-cursor-pagination` in a real NestJS GraphQL application.

## Features

- **GraphQL API** with Apollo Server
- **Cursor-based pagination** (Relay spec-compliant)
- **TypeORM** with in-memory SQLite
- **Auto-seeding** with 40 products across 3 categories
- **Multiple query patterns**: basic pagination, category filtering, price range filtering

## Quick Start

```bash
# Run the app
pnpm nx serve sample-nestjs-graphql-api

# Run e2e tests
pnpm nx e2e sample-nestjs-graphql-api-e2e
```

Access GraphQL Playground at `http://localhost:3000/graphql`

The Playground includes **7 pre-configured example tabs** to explore all pagination features:
1. Basic Pagination - First 5 products
2. Forward Pagination - Using `after` cursor
3. Backward Pagination - Using `before` cursor
4. Filter by Category - Electronics products
5. Filter by Price Range - $500-$1000
6. Get Categories - All categories
7. Complex Example - Books with relations & full pageInfo

## Example Queries

All these queries are available as default tabs in the GraphQL Playground!

### Basic Forward Pagination

```graphql
query GetProducts {
  products(first: 5) {
    edges {
      node {
        id
        name
        price
        category
      }
      cursor
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

### Pagination with Cursor

```graphql
query GetNextPage {
  products(first: 5, after: "cHJvZC0wNQ==") {
    edges {
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

### Backward Pagination

```graphql
query GetPreviousPage {
  products(last: 5, before: "cHJvZC0xMA==") {
    edges {
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

### Filter by Category

```graphql
query GetElectronics {
  productsByCategory(categoryName: "Electronics", first: 10) {
    edges {
      node {
        id
        name
        price
        category
      }
    }
    totalCount
  }
}
```

### Filter by Price Range

```graphql
query GetProductsInPriceRange {
  productsByPriceRange(minPrice: 500, maxPrice: 1000, first: 10) {
    edges {
      node {
        id
        name
        price
      }
    }
    totalCount
  }
}
```

### Categories

```graphql
query GetCategories {
  categories(first: 10) {
    edges {
      node {
        id
        name
        slug
      }
    }
    totalCount
  }
}
```

## Project Structure

```
src/
├── app/
│   └── app.module.ts          # Module configuration
├── entities/
│   ├── product.entity.ts      # Product entity (NodeEntity)
│   └── category.entity.ts     # Category entity (NodeEntity)
├── dto/
│   └── pagination.types.ts    # GraphQL connection types
├── services/
│   ├── product.service.ts     # Product pagination logic
│   ├── category.service.ts    # Category pagination logic
│   └── seed.service.ts        # Auto-seed data on startup
├── resolvers/
│   ├── product.resolver.ts    # Product GraphQL queries
│   └── category.resolver.ts   # Category GraphQL queries
└── main.ts                    # Bootstrap
```

## Seed Data

Auto-seeds on startup:
- 15 Electronics products (Laptop 1-15)
- 15 Books products (Book 1-15)
- 10 Clothing products (Shirt 1-10)
- 3 Categories (Electronics, Books, Clothing)

## Implementation Patterns

### Entity with NodeEntity

```typescript
@Entity('products')
@ObjectType()
export class Product implements NodeEntity {
  @PrimaryColumn()
  @Field(() => ID)
  id!: string;

  @Column()
  @Field()
  name!: string;

  // ... additional fields
}
```

### Service with Pagination

```typescript
@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>
  ) {}

  async getPaginatedProducts(args: PaginationArgs): Promise<IPaginatedType<Product>> {
    const queryBuilder = this.productRepo
      .createQueryBuilder('product')
      .orderBy('product.id', 'ASC');
    return paginate(queryBuilder, args, 'product.id');
  }
}
```

### GraphQL Resolver

```typescript
@Resolver()
export class ProductResolver {
  constructor(private readonly productService: ProductService) {}

  @Query(() => ProductConnection, { name: 'products' })
  async getProducts(@Args() args: PaginationArgs): Promise<ProductConnection> {
    return this.productService.getPaginatedProducts(args);
  }
}
```

## Testing

E2E tests cover:
- Forward pagination with `first` and `after`
- Backward pagination with `last` and `before`
- Category filtering
- Price range filtering
- Cursor stability
- PageInfo metadata accuracy

Run tests:
```bash
pnpm nx e2e sample-nestjs-graphql-api-e2e
```
