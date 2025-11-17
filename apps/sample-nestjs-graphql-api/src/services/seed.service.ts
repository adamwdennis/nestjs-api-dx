import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { Category } from '../entities/category.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>
  ) {}

  async onModuleInit() {
    await this.seed();
  }

  private async seed() {
    // Check if already seeded
    const count = await this.productRepo.count();
    if (count > 0) {
      return;
    }

    // Create categories
    const electronics = this.categoryRepo.create({
      id: 'cat-1',
      name: 'Electronics',
      slug: 'electronics',
    });
    const books = this.categoryRepo.create({
      id: 'cat-2',
      name: 'Books',
      slug: 'books',
    });
    const clothing = this.categoryRepo.create({
      id: 'cat-3',
      name: 'Clothing',
      slug: 'clothing',
    });

    await this.categoryRepo.save([electronics, books, clothing]);

    // Create products
    const products: Partial<Product>[] = [];
    const baseDate = new Date('2024-01-01T00:00:00Z');

    // Electronics products (15)
    for (let i = 1; i <= 15; i++) {
      products.push({
        id: `prod-${i.toString().padStart(2, '0')}`,
        name: `Laptop ${i}`,
        price: 500 + i * 100,
        category: 'Electronics',
        description: `High-performance laptop model ${i}`,
        createdAt: new Date(baseDate.getTime() + i * 86400000),
        stock: i * 5,
        categoryId: 'cat-1',
      });
    }

    // Books products (15)
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

    // Clothing products (10)
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

    await this.productRepo.save(products);
    console.log('✅ Database seeded with 40 products and 3 categories');
  }
}
