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

import { Type } from '@nestjs/common';
import { Field, ObjectType } from '@nestjs/graphql';
import { IsDefined, IsObject, IsString } from 'class-validator';
import { PageInfo } from './page-info';

export interface IEdgeType<T> {
  cursor: string;
  node: T;
}

export interface IPaginatedType<T> {
  edges: IEdgeType<T>[];
  pageInfo: PageInfo;
  totalCount: number;
}

/**
 * This is a generic type that can be used to create a paginated type for a
 * given class. It is used to create a paginated type for a given class.
 *
 * Based on https://docs.nestjs.com/graphql/resolvers#generics
 *
 * @param classRef
 */
export function Paginated<T>(
  classRef: Type<T>,
  name: string,
): Type<IPaginatedType<T>> {
  @ObjectType(`${name}Edge`, { isAbstract: true })
  abstract class EdgeType<T> {
    @Field(() => String)
    @IsString()
    @IsDefined()
    cursor!: string;

    @Field(() => classRef)
    @IsObject()
    @IsDefined()
    node!: T;
  }

  @ObjectType({ isAbstract: true })
  abstract class PaginatedType<T> {
    @Field(() => [EdgeType<T>])
    @IsDefined()
    @IsObject({ each: true })
    edges!: EdgeType<T>[];

    @Field(() => PageInfo)
    @IsDefined()
    @IsObject()
    pageInfo!: PageInfo;
  }
  return PaginatedType as Type<IPaginatedType<T>>;
}
