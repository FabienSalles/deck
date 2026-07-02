import { describe, it, expect } from 'vitest';
import { ok, err, map, flatMap } from '../../src/shared/domain/result';

describe('Result - Railway-oriented programming', () => {
  describe('ok()', () => {
    it('should create a success result', () => {
      // GIVEN a value
      const value = 42;

      // WHEN creating an ok result
      const result = ok(value);

      // THEN it has ok=true and carries the value
      expect(result.ok).toBe(true);
      expect(result).toEqual({ ok: true, value: 42 });
    });
  });

  describe('err()', () => {
    it('should create a failure result', () => {
      // GIVEN an error
      const error = 'something went wrong';

      // WHEN creating an err result
      const result = err(error);

      // THEN it has ok=false and carries the error
      expect(result.ok).toBe(false);
      expect(result).toEqual({ ok: false, error: 'something went wrong' });
    });
  });

  describe('map()', () => {
    it('should transform the value of an ok result', () => {
      // GIVEN a success result
      const result = ok(10);

      // WHEN mapping a transform over it
      const mapped = map(result, (n) => n * 2);

      // THEN the value is transformed
      expect(mapped).toEqual({ ok: true, value: 20 });
    });

    it('should pass through errors without calling the function', () => {
      // GIVEN a failure result
      const result = err('oops');
      let called = false;

      // WHEN mapping over it
      const mapped = map(result, (_n: never) => {
        called = true;
        return 999;
      });

      // THEN the error passes through and the function is never called
      expect(mapped).toEqual({ ok: false, error: 'oops' });
      expect(called).toBe(false);
    });
  });

  describe('flatMap()', () => {
    it('should chain fallible operations on ok results', () => {
      // GIVEN a success result and a fallible function
      const result = ok(10);
      const divide = (n: number) => (n > 0 ? ok(100 / n) : err('division by zero'));

      // WHEN flatMapping
      const chained = flatMap(result, divide);

      // THEN the inner result is returned (not nested)
      expect(chained).toEqual({ ok: true, value: 10 });
    });

    it('should short-circuit on error without calling the function', () => {
      // GIVEN a failure result
      const result = err('initial error');
      let called = false;

      // WHEN flatMapping with another operation
      const chained = flatMap(result, (_n: never) => {
        called = true;
        return ok(999);
      });

      // THEN the original error is returned and the function is never called
      expect(chained).toEqual({ ok: false, error: 'initial error' });
      expect(called).toBe(false);
    });
  });
});
