# Sample GraphQL Queries

These queries are pre-configured in the GraphQL Playground at `http://localhost:3000/graphql`

## 1. Basic Pagination

Fetch first 5 products with complete pagination metadata.

```graphql
query GetFirstProducts {
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
      totalCount
    }
  }
}
```

## 2. Forward Pagination

Use `endCursor` from previous query as `after` parameter to get next page.

```graphql
query GetNextPage($after: String!) {
  products(first: 5, after: $after) {
    edges {
      node {
        id
        name
        price
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      endCursor
      totalCount
    }
  }
}
```

**Variables:**
```json
{
  "after": "cHJvZC0wNQ=="
}
```

## 3. Backward Pagination

Use `startCursor` from previous query as `before` parameter to get previous page.

```graphql
query GetPreviousPage($before: String!) {
  products(last: 5, before: $before) {
    edges {
      node {
        id
        name
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      totalCount
    }
  }
}
```

**Variables:**
```json
{
  "before": "cHJvZC0xMA=="
}
```

## 4. Filter by Category

Get all products in the Electronics category.

```graphql
query GetElectronics {
  productsByCategory(categoryName: "Electronics", first: 10) {
    edges {
      node {
        id
        name
        price
        category
        stock
      }
    }
    pageInfo {
      hasNextPage
      totalCount
    }
  }
}
```

**Available Categories:**
- Electronics (15 products)
- Books (15 products)
- Clothing (10 products)

## 5. Filter by Price Range

Get products between $500 and $1000.

```graphql
query GetProductsInPriceRange {
  productsByPriceRange(minPrice: 500, maxPrice: 1000, first: 20) {
    edges {
      node {
        id
        name
        price
        category
      }
    }
    pageInfo {
      totalCount
    }
  }
}
```

## 6. Get Categories

Fetch all categories with pagination.

```graphql
query GetCategories {
  categories(first: 10) {
    edges {
      node {
        id
        name
        slug
      }
      cursor
    }
    pageInfo {
      hasNextPage
      totalCount
    }
  }
}
```

## 7. Complex Example with Relations

Get Books with full pagination metadata and related category entity.

```graphql
query GetBooksWithCategories {
  productsByCategory(categoryName: "Books", first: 5) {
    edges {
      node {
        id
        name
        price
        description
        stock
        createdAt
        categoryRelation {
          id
          name
          slug
        }
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
      countBefore
      countAfter
      totalCount
    }
  }
}
```

## Pagination Metadata Explained

### PageInfo Fields

- `hasNextPage`: Boolean - Whether more items exist after this page
- `hasPreviousPage`: Boolean - Whether more items exist before this page
- `startCursor`: String - Cursor of first item in current page
- `endCursor`: String - Cursor of last item in current page
- `countBefore`: Int - Number of items before this page
- `countAfter`: Int - Number of items after this page
- `totalCount`: Int - Total number of items across all pages

### Pagination Arguments

- `first`: Int - Number of items to fetch from start
- `after`: String - Cursor to start from (for forward pagination)
- `last`: Int - Number of items to fetch from end
- `before`: String - Cursor to end at (for backward pagination)
- `reverse`: Boolean - Reverse the sort order (optional)

## Tips

1. **Getting cursors**: Use `edges[].cursor` or `pageInfo.endCursor`/`pageInfo.startCursor`
2. **Next page**: Use `first` with `after: pageInfo.endCursor`
3. **Previous page**: Use `last` with `before: pageInfo.startCursor`
4. **Check for more**: Use `pageInfo.hasNextPage` and `pageInfo.hasPreviousPage`
5. **Cursor format**: Cursors are opaque base64-encoded strings - don't parse or construct them manually
