import { describe, expect, it } from 'vitest';
import {
  IPC_CHANNELS,
  VALID_CHANNELS,
  VALID_EVENT_CHANNELS,
  isValidChannel,
  isValidEventChannel,
} from '../../../src/shared/ipc/channels';

describe('channel validators', () => {
  it('isValidChannel returns true for parks:search', () => {
    expect(isValidChannel('parks:search')).toBe(true);
  });

  it('isValidChannel returns false for invalid:channel', () => {
    expect(isValidChannel('invalid:channel')).toBe(false);
  });

  it('isValidChannel returns false for empty string', () => {
    expect(isValidChannel('')).toBe(false);
  });

  it('isValidEventChannel returns true for event:parks:import:progress', () => {
    expect(isValidEventChannel('event:parks:import:progress')).toBe(true);
  });

  it('isValidEventChannel returns false for parks:search', () => {
    expect(isValidEventChannel('parks:search')).toBe(false);
  });
});

describe('channel collections', () => {
  it('VALID_CHANNELS contains exactly 17 entries', () => {
    expect(VALID_CHANNELS).toHaveLength(17);
  });

  it('VALID_EVENT_CHANNELS contains exactly 3 entries', () => {
    expect(VALID_EVENT_CHANNELS).toHaveLength(3);
  });

  it('all IPC_CHANNELS values are strings with expected prefixes', () => {
    const channelValues = Object.values(IPC_CHANNELS);
    const validPrefixes = [
      'parks:',
      'plans:',
      'weather:',
      'bands:',
      'config:',
      'system:',
    ];

    expect(channelValues.every((value) => typeof value === 'string')).toBe(true);
    expect(
      channelValues.every((value) =>
        validPrefixes.some((prefix) => value.startsWith(prefix))
      )
    ).toBe(true);
  });
});
