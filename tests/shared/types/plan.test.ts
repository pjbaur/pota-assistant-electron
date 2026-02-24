import { describe, expect, it } from 'vitest';
import { createPlanId } from '../../../src/shared/types/plan';

describe('createPlanId', () => {
  it('accepts a valid UUID v4 and returns lowercased PlanId', () => {
    expect(createPlanId('550E8400-E29B-41D4-A716-446655440000')).toBe(
      '550e8400-e29b-41d4-a716-446655440000'
    );
  });

  it.each([
    'not-a-uuid',
    '550e8400-e29b-11d4-a716-446655440000',
    '550e8400e29b41d4a716446655440000',
    '',
  ])('rejects invalid plan id: %s', (planId) => {
    expect(() => createPlanId(planId)).toThrowError();
  });
});
