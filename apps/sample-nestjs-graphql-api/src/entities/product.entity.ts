import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';
import { NodeEntity } from '@adamwdennis/nestjs-typeorm-cursor-pagination';
import { Category } from './category.entity';

@Entity('products')
@ObjectType()
export class Product implements NodeEntity {
  @PrimaryColumn()
  @Field(() => ID)
  id!: string;

  @Column()
  @Field()
  name!: string;

  @Column('float')
  @Field(() => Float)
  price!: number;

  @Column()
  @Field()
  category!: string;

  @Column({ nullable: true })
  @Field({ nullable: true })
  description?: string;

  @Column({ type: 'datetime' })
  @Field()
  createdAt!: Date;

  @Column({ type: 'int', default: 0 })
  @Field(() => Int)
  stock!: number;

  @Column({ nullable: true })
  categoryId?: string;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'categoryId' })
  @Field(() => Category, { nullable: true })
  categoryRelation?: Category;
}
