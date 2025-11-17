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

import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({
  description: `Returns details about the current page of results`,
})
export class PageInfo {
  constructor({
    startCursor,
    endCursor,
    hasPreviousPage,
    hasNextPage,
    countBefore,
    countAfter,
    totalCount,
  }: PageInfo) {
    this.startCursor = startCursor;
    this.endCursor = endCursor;
    this.hasPreviousPage = hasPreviousPage;
    this.hasNextPage = hasNextPage;
    this.countBefore = countBefore;
    this.countAfter = countAfter;
    this.totalCount = totalCount;
  }

  @Field({ nullable: true })
  startCursor?: string;

  @Field({ nullable: true })
  endCursor?: string;

  @Field(() => Boolean, {
    description: `Whether there are more results before this page`,
  })
  hasPreviousPage!: boolean;

  @Field(() => Boolean, {
    description: `Whether there are more results after this page`,
  })
  hasNextPage!: boolean;

  @Field(() => Int, {
    description: `The number of records before this page`,
  })
  countBefore!: number;

  @Field(() => Int, {
    description: `The number of records after this page`,
  })
  countAfter!: number;

  @Field(() => Int, {
    description: `The total number of records`,
  })
  totalCount!: number;
}
