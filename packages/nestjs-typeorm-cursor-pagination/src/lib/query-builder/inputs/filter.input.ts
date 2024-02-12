import { Field } from '@nestjs/graphql';
import { IsDefined, IsEnum, IsString } from 'class-validator';
import { ComparisonOperatorEnum } from '../operators/comparison-operator.enum';

export class FilterInput {
  @Field(() => String, {
    description: 'The field to filter on',
    nullable: false,
  })
  @IsString()
  @IsDefined()
  field!: string; // keyof T;

  @Field(() => ComparisonOperatorEnum, {
    description: 'The comparison operator to use',
    nullable: false,
  })
  @IsEnum(ComparisonOperatorEnum)
  @IsDefined()
  operator!: ComparisonOperatorEnum;

  @Field(() => String, {
    description: 'The value to compare against',
    nullable: false,
  })
  @IsString()
  @IsDefined()
  value!: string;

  /**
   * The field to filter on in the relation
   * For internal use only.
   */
  relationField?: string;
}
