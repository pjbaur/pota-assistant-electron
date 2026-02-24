/**
 * Weather Service
 *
 * Orchestrates weather data fetching with caching.
 * Uses Open-Meteo API and caches results for 1 hour.
 */

import { fetchWeatherData, weatherCodeToCondition } from '../api/weather-client';
import { getCachedWeather, setCachedWeather } from '../data/repositories/weather-cache-repository';
import type {
  WeatherData,
  WeatherRequestParams,
  HourlyForecast,
  DailyForecast,
} from '../../shared/types/weather';

/** Celsius to Fahrenheit conversion */
function celsiusToFahrenheit(celsius: number): number {
  return Math.round((celsius * 9) / 5 + 32);
}

/** Convert wind direction degrees to a cardinal direction string */
function degreesToCardinal(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index] ?? 'N';
}

/**
 * Transform Open-Meteo response to our WeatherData format
 */
function transformWeatherData(
  response: Awaited<ReturnType<typeof fetchWeatherData>>,
  params: WeatherRequestParams
): WeatherData | null {
  if (response?.hourly === undefined || response?.daily === undefined) {
    return null;
  }

  const { hourly, daily } = response;
  const hourlyCount = params.hourlyCount ?? 48;
  const dailyCount = params.dailyCount ?? 7;

  // Transform hourly data
  const hourlyForecasts: HourlyForecast[] = [];
  const maxHourly = Math.min(hourlyCount, hourly.time.length);

  for (let i = 0; i < maxHourly; i++) {
    const tempC = hourly.temperature_2m[i] ?? 0;
    const humidity = hourly.relative_humidity_2m[i] ?? 0;
    const windSpeed = hourly.wind_speed_10m[i] ?? 0;
    const windDir = hourly.wind_direction_10m[i] ?? 0;
    const precipProb = hourly.precipitation_probability[i] ?? 0;
    const weatherCode = hourly.weather_code[i] ?? 0;
    const uvIndex = hourly.uv_index[i];

    hourlyForecasts.push({
      time: hourly.time[i] ?? '',
      temperatureC: tempC,
      temperatureF: celsiusToFahrenheit(tempC),
      humidity,
      windSpeedKmh: windSpeed,
      windDirection: windDir,
      precipitationProbability: precipProb,
      condition: weatherCodeToCondition(weatherCode),
      uvIndex: uvIndex,
    });
  }

  // Transform daily data
  const dailyForecasts: DailyForecast[] = [];
  const maxDaily = Math.min(dailyCount, daily.time.length);

  for (let i = 0; i < maxDaily; i++) {
    const tempMaxC = daily.temperature_2m_max[i] ?? 0;
    const tempMinC = daily.temperature_2m_min[i] ?? 0;
    const precipSum = daily.precipitation_sum[i] ?? 0;
    const weatherCode = daily.weather_code[i] ?? 0;
    const sunrise = daily.sunrise[i] ?? '';
    const sunset = daily.sunset[i] ?? '';
    const uvMax = daily.uv_index_max[i] ?? 0;
    const windMax = daily.wind_speed_10m_max[i] ?? 0;

    // Format sunrise/sunset to HH:mm
    const formatTime = (isoString: string): string => {
      try {
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
      } catch {
        return '';
      }
    };

    dailyForecasts.push({
      date: daily.time[i] ?? '',
      tempMaxC,
      tempMaxF: celsiusToFahrenheit(tempMaxC),
      tempMinC,
      tempMinF: celsiusToFahrenheit(tempMinC),
      precipitationMm: precipSum,
      precipitationProbabilityMax: 0, // Will be calculated from hourly data
      condition: weatherCodeToCondition(weatherCode),
      sunrise: formatTime(sunrise),
      sunset: formatTime(sunset),
      uvIndexMax: uvMax,
      windSpeedMaxKmh: windMax,
      windDirectionDominant: 0, // Will be calculated from hourly data
    });
  }

  // Calculate max precipitation probability per day from hourly data
  // and dominant wind direction per day
  for (let dayIndex = 0; dayIndex < dailyForecasts.length; dayIndex++) {
    const dayDate = dailyForecasts[dayIndex]?.date;
    if (dayDate === undefined) continue;

    let maxPrecipProb = 0;
    const windDirections: number[] = [];

    for (let h = 0; h < hourlyForecasts.length; h++) {
      const hourlyTime = hourlyForecasts[h]?.time;
      if (hourlyTime === undefined) continue;

      if (hourlyTime.startsWith(dayDate)) {
        const precipProb = hourlyForecasts[h]?.precipitationProbability ?? 0;
        const windDir = hourlyForecasts[h]?.windDirection ?? 0;

        if (precipProb > maxPrecipProb) {
          maxPrecipProb = precipProb;
        }
        windDirections.push(windDir);
      }
    }

    if (dailyForecasts[dayIndex] !== undefined) {
      dailyForecasts[dayIndex].precipitationProbabilityMax = maxPrecipProb;

      // Calculate dominant wind direction (simple average)
      if (windDirections.length > 0) {
        const avgDir = windDirections.reduce((a, b) => a + b, 0) / windDirections.length;
        dailyForecasts[dayIndex].windDirectionDominant = Math.round(avgDir);
      }
    }
  }

  return {
    latitude: params.latitude,
    longitude: params.longitude,
    fetchedAt: new Date().toISOString(),
    source: 'Open-Meteo',
    timezone: response.timezone,
    hourly: hourlyForecasts,
    daily: dailyForecasts,
  };
}

/**
 * Get weather data for a location.
 * Checks cache first, fetches from API if cache miss or expired.
 */
export async function getWeather(
  params: WeatherRequestParams
): Promise<WeatherData | null> {
  const { latitude, longitude } = params;

  // Check cache first
  const cached = getCachedWeather(latitude, longitude);
  if (cached !== null) {
    return cached;
  }

  // Fetch from API
  const response = await fetchWeatherData(latitude, longitude, params.dailyCount ?? 7);

  if (response === null) {
    console.error('[Weather Service] Failed to fetch weather data');
    return null;
  }

  // Transform to our format
  const weatherData = transformWeatherData(response, params);

  if (weatherData === null) {
    console.error('[Weather Service] Failed to transform weather data');
    return null;
  }

  // Cache the result
  setCachedWeather(latitude, longitude, weatherData);

  return weatherData;
}

// Re-export utility functions for use in components
export { degreesToCardinal };
