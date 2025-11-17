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

import {
  DataSource,
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { NodeEntity } from '../entities/NodeEntity';

/**
 * Test category entity for join tests
 */
@Entity('test_categories')
export class TestCategory implements NodeEntity {
  @PrimaryColumn()
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  slug?: string;
}

/**
 * Test entity for pagination tests
 */
@Entity('test_products')
export class TestProduct implements NodeEntity {
  @PrimaryColumn()
  id!: string;

  @Column()
  name!: string;

  @Column()
  price!: number;

  @Column()
  category!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'datetime' })
  createdAt!: Date;

  @Column({ type: 'int', default: 0 })
  stock!: number;

  @Column({ nullable: true })
  categoryId?: string;

  @ManyToOne(() => TestCategory, { nullable: true })
  @JoinColumn({ name: 'categoryId' })
  categoryRelation?: TestCategory;
}

/**
 * Creates an in-memory SQLite database for testing
 */
export async function createTestDatabase(): Promise<DataSource> {
  const dataSource = new DataSource({
    type: 'better-sqlite3',
    database: ':memory:',
    entities: [TestProduct, TestCategory],
    synchronize: true,
    logging: false,
  });

  await dataSource.initialize();
  return dataSource;
}

/**
 * Seeds the database with test data
 */
export async function seedTestData(dataSource: DataSource): Promise<void> {
  const categoryRepo = dataSource.getRepository(TestCategory);
  const productRepo = dataSource.getRepository(TestProduct);

  // Create test categories
  const electronics = categoryRepo.create({
    id: 'cat-1',
    name: 'Electronics',
    slug: 'electronics',
  });
  const books = categoryRepo.create({
    id: 'cat-2',
    name: 'Books',
    slug: 'books',
  });
  const clothing = categoryRepo.create({
    id: 'cat-3',
    name: 'Clothing',
    slug: 'clothing',
  });

  await categoryRepo.save([electronics, books, clothing]);

  // Create test products
  const products: Partial<TestProduct>[] = [];
  const baseDate = new Date('2024-01-01T00:00:00Z');

  // Electronics products
  for (let i = 1; i <= 15; i++) {
    products.push({
      id: `prod-${i.toString().padStart(2, '0')}`,
      name: `Laptop ${i}`,
      price: 500 + i * 100,
      category: 'Electronics',
      description: `High-performance laptop model ${i}`,
      createdAt: new Date(baseDate.getTime() + i * 86400000), // 1 day apart
      stock: i * 5,
      categoryId: 'cat-1',
    });
  }

  // Books products
  for (let i = 16; i <= 30; i++) {
    products.push({
      id: `prod-${i.toString().padStart(2, '0')}`,
      name: `Book ${i - 15}`,
      price: 10 + (i - 15) * 5,
      category: 'Books',
      description: `Interesting book ${i - 15}`,
      createdAt: new Date(baseDate.getTime() + i * 86400000),
      stock: (i - 15) * 2,
      categoryId: 'cat-2',
    });
  }

  // Clothing products
  for (let i = 31; i <= 40; i++) {
    products.push({
      id: `prod-${i.toString().padStart(2, '0')}`,
      name: `Shirt ${i - 30}`,
      price: 20 + (i - 30) * 3,
      category: 'Clothing',
      description: `Comfortable shirt ${i - 30}`,
      createdAt: new Date(baseDate.getTime() + i * 86400000),
      stock: (i - 30) * 3,
      categoryId: 'cat-3',
    });
  }

  await productRepo.save(products);
}

/**
 * Clears all test data from the database
 */
export async function clearTestData(dataSource: DataSource): Promise<void> {
  const productRepo = dataSource.getRepository(TestProduct);
  const categoryRepo = dataSource.getRepository(TestCategory);

  await productRepo.clear();
  await categoryRepo.clear();
}

/**
 * Closes the test database connection
 */
export async function closeTestDatabase(
  dataSource: DataSource
): Promise<void> {
  if (dataSource?.isInitialized) {
    await dataSource.destroy();
  }
}
