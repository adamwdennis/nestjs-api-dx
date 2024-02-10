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

import { Field, InputType } from '@nestjs/graphql';
import { IsArray, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { LogicalOperatorEnum } from '../operators/logical-operator.enum';
import { FilterInput } from './filter.input';

@InputType({ description: 'A non-leaf node in the expression tree' })
export class FiltersExpression {
  @Field(() => [FilterInput], {
    description: 'Descendant atomic filters (leaf nodes) of this node',
    nullable: true,
  })
  @IsArray({ each: true })
  @IsOptional()
  @ValidateNested()
  filters?: FilterInput[];

  @Field(() => LogicalOperatorEnum, {
    description:
      'The logical operator put between all the descendants of this node when building the logical expression of the given FiltersExpression node',
    nullable: true,
  })
  @IsEnum(LogicalOperatorEnum)
  operator?: LogicalOperatorEnum;

  @Field(() => [FiltersExpression], {
    description: 'Descendant sub expressions (sub trees)',
    nullable: true,
  })
  @IsArray({ each: true })
  @IsOptional()
  childExpressions?: FiltersExpression[];
}
