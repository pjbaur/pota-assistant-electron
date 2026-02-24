import { describe, expect, it, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock the ui-store module
const mockState = {
  temperatureUnit: 'celsius' as const,
  setTemperatureUnit: vi.fn(),
};

vi.mock('../../../src/renderer/stores/ui-store', () => ({
  useUIStore: (selector: (state: typeof mockState) => unknown) => selector(mockState),
}));

// Import after mocking
import { useUnits } from '../../../src/renderer/hooks/use-units';

describe('useUnits hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.temperatureUnit = 'celsius';
  });

  it('returns current temperature unit', () => {
    const { result } = renderHook(() => useUnits());

    expect(result.current.temperatureUnit).toBe('celsius');
  });

  it('returns setter for temperature unit', () => {
    const { result } = renderHook(() => useUnits());

    expect(typeof result.current.setTemperatureUnit).toBe('function');
  });

  it('calls setTemperatureUnit when updating unit', () => {
    const { result } = renderHook(() => useUnits());

    act(() => {
      result.current.setTemperatureUnit('fahrenheit');
    });

    expect(mockState.setTemperatureUnit).toHaveBeenCalledWith('fahrenheit');
  });

  it('returns isCelsius and isFahrenheit helpers', () => {
    mockState.temperatureUnit = 'celsius';
    const { result: celsiusResult } = renderHook(() => useUnits());

    expect(celsiusResult.current.isCelsius).toBe(true);
    expect(celsiusResult.current.isFahrenheit).toBe(false);

    mockState.temperatureUnit = 'fahrenheit';
    const { result: fahrenheitResult } = renderHook(() => useUnits());

    expect(fahrenheitResult.current.isCelsius).toBe(false);
    expect(fahrenheitResult.current.isFahrenheit).toBe(true);
  });

  it('provides formatTemperature helper that takes celsius and fahrenheit values', () => {
    const { result } = renderHook(() => useUnits());

    // With celsius (default) - formatTemperature(celsius, fahrenheit)
    expect(result.current.formatTemperature(25, 77)).toBe('25°C');

    // Switch to fahrenheit
    mockState.temperatureUnit = 'fahrenheit';
    const { result: fahrenheitResult } = renderHook(() => useUnits());

    expect(fahrenheitResult.current.formatTemperature(25, 77)).toBe('77°F');
  });

  it('formatTemperature rounds values', () => {
    const { result } = renderHook(() => useUnits());

    expect(result.current.formatTemperature(25.6, 78.1)).toBe('26°C');
    expect(result.current.formatTemperature(25.4, 77.6)).toBe('25°C');
  });
});
