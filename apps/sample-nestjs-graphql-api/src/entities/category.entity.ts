import { Entity, PrimaryColumn, Column } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { NodeEntity } from '@adamwdennis/nestjs-typeorm-cursor-pagination';

@Entity('categories')
@ObjectType()
export class Category implements NodeEntity {
  @PrimaryColumn()
  @Field(() => ID)
  id!: string;

  @Column()
  @Field()
  name!: string;

  @Column({ nullable: true })
  @Field({ nullable: true })
  slug?: string;
}
