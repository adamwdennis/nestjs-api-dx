import { IsDefined, IsEnum, IsOptional, IsString } from 'class-validator';
import { ComparisonOperatorEnum } from '../operators/comparison-operator.enum';

/**
 * This class represents the input for a filter
 * @example { field: 'Entity.field', operator: ComparisonOperatorEnum.EQUALS, value: 'value' }
 * @example { field: 'Entity.field', operator: ComparisonOperatorEnum.IN, value: ['value1', 'value2'] }
 * @example { field: 'RelatedEntity.id', relationField: 'Entity.manyToOneField' }
 */
export class FilterInput {
  /**
   * The field to filter on
   * @example 'Entity.field'
   * @type {string}
   */
  @IsString()
  @IsDefined()
  field!: string;

  /**
   * The operator to use for the filter
   * @type {ComparisonOperatorEnum}
   */
  @IsEnum(ComparisonOperatorEnum)
  @IsOptional()
  operator?: ComparisonOperatorEnum;

  /**
   * The value to filter on
   * @type {any}
   */
  @IsString()
  @IsOptional()
  value?: any;

  /**
   * The field to filter on in the relation
   * For internal use only.
   * @type {string}
   * @example 'RelatedEntity.field'
   */
  relationField?: string;
}
