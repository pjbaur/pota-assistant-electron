import { useUIStore, type TemperatureUnit } from '../stores/ui-store';

export function useUnits(): {
  temperatureUnit: TemperatureUnit;
  setTemperatureUnit: (unit: TemperatureUnit) => void;
  isCelsius: boolean;
  isFahrenheit: boolean;
  formatTemperature: (celsius: number, fahrenheit: number) => string;
} {
  const temperatureUnit = useUIStore((state) => state.temperatureUnit);
  const setTemperatureUnit = useUIStore((state) => state.setTemperatureUnit);

  const isCelsius = temperatureUnit === 'celsius';
  const isFahrenheit = temperatureUnit === 'fahrenheit';

  const formatTemperature = (celsius: number, fahrenheit: number): string => {
    const temp = isCelsius ? celsius : fahrenheit;
    const unit = isCelsius ? 'C' : 'F';
    return `${Math.round(temp)}°${unit}`;
  };

  return {
    temperatureUnit,
    setTemperatureUnit,
    isCelsius,
    isFahrenheit,
    formatTemperature,
  };
}
