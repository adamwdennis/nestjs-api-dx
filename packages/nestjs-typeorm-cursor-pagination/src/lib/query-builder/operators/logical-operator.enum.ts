/**
 * Used to specify the logical operator for a filter.
 *
 * This is used to combine multiple filters.
 */
export enum LogicalOperatorEnum {
  /**
   * And operator.
   * Useful for combining multiple filters.
   * This is the same as the AND operator in SQL.
   * @example { id: { and: [{ eq: '1' }, { eq: '2' }] } }
   */
  AND = 'and',
  /**
   * Or operator.
   * Useful for combining multiple filters.
   * This is the same as the OR operator in SQL.
   * @example { id: { or: [{ eq: '1' }, { eq: '2' }] } }
   */
  OR = 'or',
}
