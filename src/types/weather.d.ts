export interface WeatherData {
  current_weather: {
    temperature: number;
    weathercode: number;
    [key: string]: unknown;
  };
  daily: {
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    weathercode: number[];
    sunrise?: string[];
    sunset?: string[];
    time?: string[];
    [key: string]: unknown;
  };
  hourly: {
    temperature_2m: number[];
    precipitation: number[];
    time: string[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
