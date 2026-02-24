import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../helpers/render-with-providers';
import { WeatherWidget } from '../../../../src/renderer/components/weather/weather-widget';
import type { WeatherData } from '../../../../src/shared/types/weather';

// Mock the useUnits hook
const mockUnits = {
  temperatureUnit: 'celsius' as const,
  setTemperatureUnit: vi.fn(),
  isCelsius: true,
  isFahrenheit: false,
  formatTemperature: (celsius: number, fahrenheit: number) => `${Math.round(celsius)}°C`,
};

vi.mock('../../../../src/renderer/hooks/use-units', () => ({
  useUnits: () => mockUnits,
}));

vi.mock('../../../../src/renderer/components/weather/data-freshness', () => ({
  DataFreshness: () => <span data-testid="data-freshness">Fresh</span>,
}));

const createMockWeatherData = (): WeatherData => ({
  latitude: 40.0,
  longitude: -105.0,
  fetchedAt: new Date().toISOString(),
  source: 'Open-Meteo',
  hourly: [
    {
      hour: '2024-01-15T12:00:00Z',
      temperatureC: 15,
      temperatureF: 59,
      condition: 'partly-cloudy',
      precipitationProbability: 10,
      humidity: 45,
      windSpeedKmh: 12,
      windDirection: 180,
      uvIndex: 3,
    },
  ],
  daily: [
    {
      date: '2024-01-15',
      tempMaxC: 20,
      tempMaxF: 68,
      tempMinC: 5,
      tempMinF: 41,
      condition: 'clear',
      precipitationProbabilityMax: 0,
    },
    {
      date: '2024-01-16',
      tempMaxC: 18,
      tempMaxF: 64,
      tempMinC: 3,
      tempMinF: 37,
      condition: 'cloudy',
      precipitationProbabilityMax: 20,
    },
  ],
});

describe('WeatherWidget with units preference', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUnits.temperatureUnit = 'celsius';
    mockUnits.isCelsius = true;
    mockUnits.isFahrenheit = false;
    mockUnits.formatTemperature = (celsius: number, _fahrenheit: number) => `${Math.round(celsius)}°C`;
  });

  it('displays temperature in celsius when preference is celsius', () => {
    mockUnits.temperatureUnit = 'celsius';
    mockUnits.formatTemperature = (celsius: number, _fahrenheit: number) => `${Math.round(celsius)}°C`;

    renderWithProviders(<WeatherWidget weatherData={createMockWeatherData()} />);

    // Current temperature should show celsius
    expect(screen.getByText('15°C')).toBeInTheDocument();
  });

  it('displays temperature in fahrenheit when preference is fahrenheit', () => {
    mockUnits.temperatureUnit = 'fahrenheit';
    mockUnits.isCelsius = false;
    mockUnits.isFahrenheit = true;
    mockUnits.formatTemperature = (_celsius: number, fahrenheit: number) => `${Math.round(fahrenheit)}°F`;

    renderWithProviders(<WeatherWidget weatherData={createMockWeatherData()} />);

    // Current temperature should show fahrenheit
    expect(screen.getByText('59°F')).toBeInTheDocument();
  });

  it('displays daily forecast temperatures in the preferred unit', () => {
    mockUnits.temperatureUnit = 'fahrenheit';
    mockUnits.formatTemperature = (_celsius: number, fahrenheit: number) => `${Math.round(fahrenheit)}°F`;

    renderWithProviders(<WeatherWidget weatherData={createMockWeatherData()} />);

    // Daily high/low should show in fahrenheit
    expect(screen.getByText('68°F')).toBeInTheDocument();
    expect(screen.getByText('41°F')).toBeInTheDocument();
  });

  it('displays daily forecast temperatures in celsius by default', () => {
    mockUnits.formatTemperature = (celsius: number, _fahrenheit: number) => `${Math.round(celsius)}°C`;

    renderWithProviders(<WeatherWidget weatherData={createMockWeatherData()} />);

    // Daily high/low should show in celsius
    expect(screen.getByText('20°C')).toBeInTheDocument();
    expect(screen.getByText('5°C')).toBeInTheDocument();
  });
});
