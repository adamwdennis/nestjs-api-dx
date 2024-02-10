import { Field, registerEnumType } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum SortDirectionEnum {
  ASC = 'asc',
  DESC = 'desc',
}
registerEnumType(SortDirectionEnum, {
  name: 'SortDirectionEnum',
  description: 'The direction to sort the results',
  valuesMap: {
    ASC: {
      description: 'Sort in ascending order',
    },
    DESC: {
      description: 'Sort in descending order',
    },
  },
});

/**
 * This class is used to define the sort input for a query.
 */
export class SortDto {
  @Field(() => String, {
    description: 'The field to sort on',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  field?: string;

  @Field(() => SortDirectionEnum, {
    description: 'The direction to sort the results',
    nullable: true,
    defaultValue: SortDirectionEnum.ASC,
  })
  @IsEnum(SortDirectionEnum)
  @IsOptional()
  direction?: SortDirectionEnum;
}
