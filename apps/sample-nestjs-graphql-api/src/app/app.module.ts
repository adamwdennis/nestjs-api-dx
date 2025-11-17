import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../entities/product.entity';
import { Category } from '../entities/category.entity';
import { ProductService } from '../services/product.service';
import { CategoryService } from '../services/category.service';
import { SeedService } from '../services/seed.service';
import { ProductResolver } from '../resolvers/product.resolver';
import { CategoryResolver } from '../resolvers/category.resolver';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      introspection: true,
      playground: {
        settings: {
          'request.credentials': 'include',
        },
        tabs: [
          {
            name: '1. Basic Pagination',
            endpoint: '/graphql',
            query: `# Fetch first 5 products
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
}`,
          },
          {
            name: '2. Forward Pagination',
            endpoint: '/graphql',
            query: `# Use endCursor from previous query as 'after' param
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
}`,
            variables: JSON.stringify({ after: 'cHJvZC0wNQ==' }, null, 2),
          },
          {
            name: '3. Backward Pagination',
            endpoint: '/graphql',
            query: `# Use startCursor from previous query as 'before' param
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
}`,
            variables: JSON.stringify({ before: 'cHJvZC0xMA==' }, null, 2),
          },
          {
            name: '4. Filter by Category',
            endpoint: '/graphql',
            query: `# Get products in Electronics category
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
}`,
          },
          {
            name: '5. Filter by Price Range',
            endpoint: '/graphql',
            query: `# Get products between $500 and $1000
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
}`,
          },
          {
            name: '6. Get Categories',
            endpoint: '/graphql',
            query: `# Fetch all categories
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
}`,
          },
          {
            name: '7. Complex Example',
            endpoint: '/graphql',
            query: `# Get Books with pagination, including related category
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
}`,
          },
        ],
      },
    }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [Product, Category],
      synchronize: true,
      logging: false,
    }),
    TypeOrmModule.forFeature([Product, Category]),
  ],
  providers: [
    ProductService,
    CategoryService,
    SeedService,
    ProductResolver,
    CategoryResolver,
  ],
})
export class AppModule {}
