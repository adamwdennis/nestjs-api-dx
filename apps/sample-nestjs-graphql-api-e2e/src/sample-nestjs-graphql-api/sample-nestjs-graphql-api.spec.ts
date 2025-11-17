import axios from 'axios';

const GRAPHQL_ENDPOINT = '/graphql';

describe('GraphQL Cursor Pagination E2E', () => {
  const graphql = async (query: string, variables?: any) => {
    const res = await axios.post(GRAPHQL_ENDPOINT, {
      query,
      variables,
    });
    return res.data;
  };

  describe('Products pagination', () => {
    it('should fetch first 5 products', async () => {
      const query = `
        query GetProducts($first: Int!) {
          products(first: $first) {
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
      `;

      const result = await graphql(query, { first: 5 });
      expect(result.errors).toBeUndefined();
      expect(result.data.products.edges).toHaveLength(5);
      expect(result.data.products.pageInfo.hasNextPage).toBe(true);
      expect(result.data.products.pageInfo.hasPreviousPage).toBe(false);
      expect(result.data.products.pageInfo.totalCount).toBe(40);
    });

    it('should support forward pagination with cursor', async () => {
      const query = `
        query GetProducts($first: Int!, $after: String) {
          products(first: $first, after: $after) {
            edges {
              node {
                id
                name
              }
              cursor
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
          }
        }
      `;

      // First page
      const firstPage = await graphql(query, { first: 5 });
      expect(firstPage.data.products.edges).toHaveLength(5);

      const endCursor = firstPage.data.products.pageInfo.endCursor;

      // Second page
      const secondPage = await graphql(query, { first: 5, after: endCursor });
      expect(secondPage.data.products.edges).toHaveLength(5);
      expect(secondPage.data.products.pageInfo.hasPreviousPage).toBe(true);

      // Verify no overlap
      const firstPageIds = firstPage.data.products.edges.map(
        (e: any) => e.node.id
      );
      const secondPageIds = secondPage.data.products.edges.map(
        (e: any) => e.node.id
      );
      expect(firstPageIds).not.toContain(secondPageIds[0]);
    });

    it('should support backward pagination', async () => {
      const query = `
        query GetProducts($last: Int!, $before: String) {
          products(last: $last, before: $before) {
            edges {
              node {
                id
              }
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
          }
        }
      `;

      // Get last 5 products
      const result = await graphql(query, { last: 5 });
      expect(result.data.products.edges).toHaveLength(5);
      expect(result.data.products.pageInfo.hasNextPage).toBe(false);
      expect(result.data.products.pageInfo.hasPreviousPage).toBe(true);

      const startCursor = result.data.products.pageInfo.startCursor;

      // Get previous page
      const prevPage = await graphql(query, { last: 5, before: startCursor });
      expect(prevPage.data.products.edges).toHaveLength(5);
      expect(prevPage.data.products.pageInfo.hasPreviousPage).toBe(true);
    });

    it('should filter products by category', async () => {
      const query = `
        query GetProductsByCategory($categoryName: String!, $first: Int!) {
          productsByCategory(categoryName: $categoryName, first: $first) {
            edges {
              node {
                id
                name
                category
              }
            }
            pageInfo {
              totalCount
            }
          }
        }
      `;

      const result = await graphql(query, {
        categoryName: 'Electronics',
        first: 20,
      });

      expect(result.errors).toBeUndefined();
      expect(result.data.productsByCategory.pageInfo.totalCount).toBe(15);
      expect(
        result.data.productsByCategory.edges.every(
          (e: any) => e.node.category === 'Electronics'
        )
      ).toBe(true);
    });

    it('should filter products by price range', async () => {
      const query = `
        query GetProductsByPriceRange($minPrice: Float!, $maxPrice: Float!, $first: Int!) {
          productsByPriceRange(minPrice: $minPrice, maxPrice: $maxPrice, first: $first) {
            edges {
              node {
                id
                name
                price
              }
            }
            pageInfo {
              totalCount
            }
          }
        }
      `;

      const result = await graphql(query, {
        minPrice: 500,
        maxPrice: 1000,
        first: 20,
      });

      expect(result.errors).toBeUndefined();
      expect(
        result.data.productsByPriceRange.edges.every(
          (e: any) => e.node.price >= 500 && e.node.price <= 1000
        )
      ).toBe(true);
    });
  });

  describe('Categories pagination', () => {
    it('should fetch all categories', async () => {
      const query = `
        query GetCategories($first: Int!) {
          categories(first: $first) {
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
              hasPreviousPage
              totalCount
            }
          }
        }
      `;

      const result = await graphql(query, { first: 10 });
      expect(result.errors).toBeUndefined();
      expect(result.data.categories.pageInfo.totalCount).toBe(3);
      expect(result.data.categories.edges).toHaveLength(3);
      expect(result.data.categories.pageInfo.hasNextPage).toBe(false);
    });
  });

  describe('Cursor stability', () => {
    it('should maintain stable cursors across queries', async () => {
      const query = `
        query GetProducts($first: Int!) {
          products(first: $first) {
            edges {
              cursor
            }
            pageInfo {
              endCursor
            }
          }
        }
      `;

      const result1 = await graphql(query, { first: 5 });
      const result2 = await graphql(query, { first: 5 });

      expect(result1.data.products.pageInfo.endCursor).toEqual(
        result2.data.products.pageInfo.endCursor
      );
    });
  });
});
