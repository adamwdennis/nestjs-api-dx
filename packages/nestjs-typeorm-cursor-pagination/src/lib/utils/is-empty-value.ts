
/**
 * Check if a filter value is empty or invalid
 */
export function isEmptyValue(value: any): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (typeof value === 'string') {
    return value.length === 0;
  }
  // Numbers (including 0) are valid values
  return false;
}
