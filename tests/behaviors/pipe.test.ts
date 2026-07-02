import { describe, it, expect } from 'vitest';
import { pipe } from '../../src/shared/domain/pipe';

describe('pipe - Function composition', () => {
  it('should apply a single function to the value', () => {
    // GIVEN a value and a single transform
    const double = (n: number) => n * 2;

    // WHEN piping through one function
    const result = pipe(5, double);

    // THEN it returns the transformed value
    expect(result).toBe(10);
  });

  it('should chain two functions left-to-right', () => {
    // GIVEN two transforms
    const double = (n: number) => n * 2;
    const addOne = (n: number) => n + 1;

    // WHEN piping through both
    const result = pipe(5, double, addOne);

    // THEN it applies them in order: (5 * 2) + 1 = 11
    expect(result).toBe(11);
  });

  it('should chain three functions left-to-right', () => {
    // GIVEN three transforms
    const double = (n: number) => n * 2;
    const addOne = (n: number) => n + 1;
    const toString = (n: number) => `value: ${n}`;

    // WHEN piping through all three
    const result = pipe(5, double, addOne, toString);

    // THEN it applies them in order: (5 * 2) + 1 = 11 => "value: 11"
    expect(result).toBe('value: 11');
  });

  it('should chain five functions (max overload)', () => {
    // GIVEN five transforms
    const add1 = (n: number) => n + 1;
    const double = (n: number) => n * 2;
    const sub3 = (n: number) => n - 3;
    const square = (n: number) => n * n;
    const negate = (n: number) => -n;

    // WHEN piping through all five
    // (3 + 1) = 4, * 2 = 8, - 3 = 5, ^ 2 = 25, negate = -25
    const result = pipe(3, add1, double, sub3, square, negate);

    // THEN it produces the correctly chained result
    expect(result).toBe(-25);
  });

  it('should preserve types through the chain', () => {
    // GIVEN a chain that transforms number -> string -> string[] -> number
    const toString = (n: number) => String(n);
    const toArray = (s: string) => s.split('');
    const getLength = (arr: string[]) => arr.length;

    // WHEN piping through the chain
    const result = pipe(123, toString, toArray, getLength);

    // THEN the final result has the correct type and value
    expect(result).toBe(3);
    expect(typeof result).toBe('number');
  });
});
