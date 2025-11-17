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

import { Cursor } from './cursor';

describe('Cursor', () => {
  describe('encode', () => {
    it('should encode a simple string value', () => {
      const cursor = new Cursor('123', 'id');
      const encoded = cursor.encode();
      expect(encoded).toBe(Buffer.from('123').toString('base64'));
      expect(encoded).toBe('MTIz');
    });

    it('should encode a multi-column cursor value', () => {
      const cursor = new Cursor('2024-01-01|abc-123', 'createdAt');
      const encoded = cursor.encode();
      expect(encoded).toBe(Buffer.from('2024-01-01|abc-123').toString('base64'));
    });

    it('should encode special characters correctly', () => {
      const cursor = new Cursor('test@example.com', 'email');
      const encoded = cursor.encode();
      expect(encoded).toBe(Buffer.from('test@example.com').toString('base64'));
    });

    it('should encode numeric values as strings', () => {
      const cursor = new Cursor('42', 'age');
      const encoded = cursor.encode();
      expect(encoded).toBe(Buffer.from('42').toString('base64'));
    });
  });

  describe('decode', () => {
    it('should decode a simple string value', () => {
      const originalValue = '123';
      const encoded = Buffer.from(originalValue).toString('base64');
      const cursor = new Cursor(encoded, 'id');
      const decoded = cursor.decode();
      expect(decoded).toBe(originalValue);
    });

    it('should decode a multi-column cursor value', () => {
      const originalValue = '2024-01-01|abc-123';
      const encoded = Buffer.from(originalValue).toString('base64');
      const cursor = new Cursor(encoded, 'createdAt');
      const decoded = cursor.decode();
      expect(decoded).toBe(originalValue);
    });

    it('should decode special characters correctly', () => {
      const originalValue = 'test@example.com';
      const encoded = Buffer.from(originalValue).toString('base64');
      const cursor = new Cursor(encoded, 'email');
      const decoded = cursor.decode();
      expect(decoded).toBe(originalValue);
    });

    it('should handle empty strings', () => {
      const cursor = new Cursor('', 'id');
      const encoded = cursor.encode();
      const decodeCursor = new Cursor(encoded, 'id');
      expect(decodeCursor.decode()).toBe('');
    });
  });

  describe('round-trip encoding', () => {
    it('should maintain data integrity through encode/decode cycle', () => {
      const testValues = [
        '123',
        'abc-def-ghi',
        'test@example.com',
        '2024-01-01T00:00:00Z',
        '1234|5678',
        'special!@#$%^&*()chars',
      ];

      testValues.forEach((value) => {
        const cursor = new Cursor(value, 'testField');
        const encoded = cursor.encode();
        const decodeCursor = new Cursor(encoded, 'testField');
        expect(decodeCursor.decode()).toBe(value);
      });
    });

    it('should maintain data integrity for unicode characters', () => {
      const unicodeValue = 'Hello 世界 🌍';
      const cursor = new Cursor(unicodeValue, 'name');
      const encoded = cursor.encode();
      const decodeCursor = new Cursor(encoded, 'name');
      expect(decodeCursor.decode()).toBe(unicodeValue);
    });
  });

  describe('edge cases', () => {
    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000);
      const cursor = new Cursor(longString, 'description');
      const encoded = cursor.encode();
      const decodeCursor = new Cursor(encoded, 'description');
      expect(decodeCursor.decode()).toBe(longString);
    });

    it('should work with different column IDs', () => {
      const value = 'test-value';
      const columnIds = ['id', 'createdAt', 'updatedAt', 'customField'];

      columnIds.forEach((columnId) => {
        const cursor = new Cursor(value, columnId);
        const encoded = cursor.encode();
        expect(typeof encoded).toBe('string');
        expect(encoded.length).toBeGreaterThan(0);
      });
    });
  });
});
