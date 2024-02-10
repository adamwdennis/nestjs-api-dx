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
import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

@ArgsType()
export class PaginationArgs {
  @Field(() => String, {
    nullable: true,
    description: 'Returns the elements that come after the specified cursor.',
  })
  @IsString()
  @IsOptional()
  after?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Returns the elements that come before the specified cursor.',
  })
  @IsString()
  @IsOptional()
  before?: string;

  @Field(() => Int, {
    nullable: true,
    description: 'Returns up to the first `n` elements from the list.',
  })
  @IsNumber()
  @IsOptional()
  first?: number;

  @Field(() => Int, {
    nullable: true,
    description: 'Returns up to the last `n` elements from the list.',
  })
  @IsNumber()
  @IsOptional()
  last?: number;

  @Field(() => Boolean, {
    defaultValue: false,
    nullable: true,
    description: 'Reverse the order of the underlying list.',
  })
  @IsBoolean()
  @IsOptional()
  reverse?: boolean;
}
