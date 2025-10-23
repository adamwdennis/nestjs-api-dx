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

import { isEmptyValue } from './is-empty-value';

describe('isEmptyValue', () => {
  describe('null and undefined', () => {
    it('should return true for null', () => {
      expect(isEmptyValue(null)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(isEmptyValue(undefined)).toBe(true);
    });
  });

  describe('arrays', () => {
    it('should return true for empty array', () => {
      expect(isEmptyValue([])).toBe(true);
    });

    it('should return false for non-empty array', () => {
      expect(isEmptyValue([1, 2, 3])).toBe(false);
    });

    it('should return false for array with single element', () => {
      expect(isEmptyValue([0])).toBe(false);
    });

    it('should return false for array with null values', () => {
      expect(isEmptyValue([null])).toBe(false);
    });

    it('should return false for array with undefined values', () => {
      expect(isEmptyValue([undefined])).toBe(false);
    });

    it('should return false for array of strings', () => {
      expect(isEmptyValue(['a', 'b', 'c'])).toBe(false);
    });

    it('should return false for array of mixed types', () => {
      expect(isEmptyValue([1, 'test', true, null])).toBe(false);
    });
  });

  describe('strings', () => {
    it('should return true for empty string', () => {
      expect(isEmptyValue('')).toBe(true);
    });

    it('should return false for non-empty string', () => {
      expect(isEmptyValue('hello')).toBe(false);
    });

    it('should return false for string with whitespace', () => {
      expect(isEmptyValue(' ')).toBe(false);
    });

    it('should return false for string with newline', () => {
      expect(isEmptyValue('\n')).toBe(false);
    });

    it('should return false for string with tab', () => {
      expect(isEmptyValue('\t')).toBe(false);
    });

    it('should return false for string "0"', () => {
      expect(isEmptyValue('0')).toBe(false);
    });

    it('should return false for string "false"', () => {
      expect(isEmptyValue('false')).toBe(false);
    });
  });

  describe('numbers', () => {
    it('should return false for zero', () => {
      expect(isEmptyValue(0)).toBe(false);
    });

    it('should return false for positive integer', () => {
      expect(isEmptyValue(42)).toBe(false);
    });

    it('should return false for negative integer', () => {
      expect(isEmptyValue(-42)).toBe(false);
    });

    it('should return false for positive float', () => {
      expect(isEmptyValue(3.14)).toBe(false);
    });

    it('should return false for negative float', () => {
      expect(isEmptyValue(-3.14)).toBe(false);
    });

    it('should return false for Number.MIN_VALUE', () => {
      expect(isEmptyValue(Number.MIN_VALUE)).toBe(false);
    });

    it('should return false for Number.MAX_VALUE', () => {
      expect(isEmptyValue(Number.MAX_VALUE)).toBe(false);
    });

    it('should return false for Infinity', () => {
      expect(isEmptyValue(Infinity)).toBe(false);
    });

    it('should return false for -Infinity', () => {
      expect(isEmptyValue(-Infinity)).toBe(false);
    });

    it('should return false for NaN', () => {
      expect(isEmptyValue(NaN)).toBe(false);
    });
  });

  describe('booleans', () => {
    it('should return false for true', () => {
      expect(isEmptyValue(true)).toBe(false);
    });

    it('should return false for false', () => {
      expect(isEmptyValue(false)).toBe(false);
    });
  });

  describe('objects', () => {
    it('should return false for empty object', () => {
      expect(isEmptyValue({})).toBe(false);
    });

    it('should return false for non-empty object', () => {
      expect(isEmptyValue({ key: 'value' })).toBe(false);
    });

    it('should return false for Date object', () => {
      expect(isEmptyValue(new Date())).toBe(false);
    });

    it('should return false for RegExp object', () => {
      expect(isEmptyValue(/test/)).toBe(false);
    });
  });

  describe('functions', () => {
    it('should return false for function', () => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      expect(isEmptyValue(() => {})).toBe(false);
    });

    it('should return false for named function', () => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      expect(isEmptyValue(function test() {})).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should return false for Symbol', () => {
      expect(isEmptyValue(Symbol('test'))).toBe(false);
    });

    it('should return false for BigInt', () => {
      expect(isEmptyValue(BigInt(123))).toBe(false);
    });

    it('should return false for BigInt zero', () => {
      expect(isEmptyValue(BigInt(0))).toBe(false);
    });
  });

  describe('real-world filter scenarios', () => {
    it('should correctly identify valid numeric filters', () => {
      // These should all be considered valid (not empty)
      expect(isEmptyValue(0)).toBe(false); // stock: 0
      expect(isEmptyValue(100)).toBe(false); // price: 100
      expect(isEmptyValue(-10)).toBe(false); // temperature: -10
    });

    it('should correctly identify valid array filters', () => {
      // These should all be considered valid (not empty)
      expect(isEmptyValue(['admin', 'user'])).toBe(false); // roles IN filter
      expect(isEmptyValue([1, 2, 3])).toBe(false); // ids IN filter
    });

    it('should correctly identify empty filters', () => {
      // These should all be considered empty (invalid)
      expect(isEmptyValue(null)).toBe(true);
      expect(isEmptyValue(undefined)).toBe(true);
      expect(isEmptyValue('')).toBe(true);
      expect(isEmptyValue([])).toBe(true);
    });

    it('should handle BETWEEN operator values', () => {
      // BETWEEN uses array of two values
      expect(isEmptyValue([10, 100])).toBe(false);
      expect(isEmptyValue([0, 1])).toBe(false);
    });
  });
});
