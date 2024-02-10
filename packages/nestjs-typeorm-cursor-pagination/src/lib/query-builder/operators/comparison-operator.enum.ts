/**
 * This is used to specify the comparison operator for a filter.
 */
export enum ComparisonOperatorEnum {
  /**
   * Any operator.
   * Useful for arrays.
   * This is the same as the ANY operator in SQL, which means "is any of the values in the list".
   * @example { id: { any: ['1', '2'] } }
   */
  ANY = 'any',
  /**
   * Contains operator.
   * Useful for strings.
   * This is the same as the LIKE operator in SQL with a wildcard before and after the value, which means "contains".
   * @example { id: { contains: 'test' } }
   */
  CONTAINS = 'contains',
  /**
   * Equal operator.
   * Useful for strings, numbers, or dates.
   * This is the same as the = operator in SQL.
   * @example { id: { eq: 'test' } }
   */
  EQUAL = 'eq',
  /**
   * Greater than operator.
   * Useful for numbers or dates.
   * This is the same as the > operator in SQL.
   * @example { id: { gt: 4 } }
   */
  GREATER_THAN = 'gt',
  /**
   * Greater than or equal operator.
   * Useful for numbers or dates.
   * This is the same as the >= operator in SQL.
   * @example { id: { gte: 4 } }
   */
  GREATER_THAN_OR_EQUAL = 'gte',
  /**
   * In operator.
   * Useful for arrays.
   * This is the same as the IN operator in SQL, which means "is in the list".
   * @example { id: { in: ['1', '2'] } }
   */
  IN = 'in',
  /**
   * Less than operator.
   * Useful for numbers or dates.
   * This is the same as the < operator in SQL.
   * @example { id: { lt: 4 } }
   */
  LESS_THAN = 'lt',
  /**
   * Less than or equal operator.
   * Useful for numbers or dates.
   * This is the same as the <= operator in SQL.
   * @example { id: { lte: 4 } }
   */
  LESS_THAN_OR_EQUAL = 'lte',
  /**
   * Case-insensitive like operator.
   * Useful for strings.
   * This is the same as the ILIKE operator in SQL, which means "is like the value, ignoring case".
   * @example { id: { ilike: 'test' } }
   */
  ILIKE = 'ilike',
  /**
   * Like operator.
   * Useful for strings.
   * This is the same as the LIKE operator in SQL, which means "is like the value".
   * @example { id: { like: 'test' } }
   */
  LIKE = 'like',
  /**
   * Not operator.
   * Useful for strings, numbers, or dates.
   * This is the same as the != operator in SQL, which means "is not equal to".
   * @example { id: { not: 'test' } }
   */
  NOT = 'not',
  /**
   * Not in operator.
   * Useful for arrays.
   * This is the same as the NOT IN operator in SQL, which means "is not in the list".
   * @example { id: { not_in: ['1', '2'] } }
   */
  NOT_IN = 'not_in',
  /**
   * Not like operator.
   * Useful for strings.
   * This is the same as the NOT LIKE operator in SQL, which means "is not like the value".
   * @example { id: { not_like: 'test' } }
   */
  NOT_LIKE = 'not_like',

  /**
   * Overlap operator.
   * Useful for arrays.
   * This is the same as the && operator in SQL, which means "has any elements in common".
   * @example { id: { overlap: ['1', '2'] } }
   */
  OVERLAP = 'overlap',
}
