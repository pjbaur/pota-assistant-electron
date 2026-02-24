import { describe, expect, it } from 'vitest';
import {
  createGridSquare,
  createParkReference,
} from '../../../src/shared/types/park';

describe('createParkReference', () => {
  it.each(['K-0039', 'VE-1234', 'DL-00123'])(
    'accepts valid park reference: %s',
    (reference) => {
      expect(createParkReference(reference)).toBe(reference);
    }
  );

  it.each(['K0039', 'k-0039', 'ABCD-0039', 'K-039', ''])(
    'rejects invalid park reference: %s',
    (reference) => {
      expect(() => createParkReference(reference)).toThrowError();
    }
  );
});

describe('createGridSquare', () => {
  it('accepts valid 4-character grid square', () => {
    expect(createGridSquare('DN44')).toBe('DN44');
  });

  it('accepts valid 6-character grid square and uppercases output', () => {
    expect(createGridSquare('DN44xk')).toBe('DN44XK');
  });

  it.each(['D4', 'dn44', 'DN4'])('rejects invalid grid square: %s', (grid) => {
    expect(() => createGridSquare(grid)).toThrowError();
  });
});
