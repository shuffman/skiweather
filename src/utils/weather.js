// Weather code descriptions from WMO
const weatherDescriptions = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Slight snowfall",
  73: "Moderate snowfall",
  75: "Heavy snowfall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

const weatherIcons = {
  0: "☀️",
  1: "🌤️",
  2: "⛅",
  3: "☁️",
  45: "🌫️",
  48: "🌫️",
  51: "🌦️",
  53: "🌦️",
  55: "🌧️",
  61: "🌧️",
  63: "🌧️",
  65: "🌧️",
  71: "🌨️",
  73: "🌨️",
  75: "❄️",
  77: "🌨️",
  80: "🌦️",
  81: "🌦️",
  82: "⛈️",
  85: "🌨️",
  86: "❄️",
  95: "⛈️",
  96: "⛈️",
  99: "⛈️",
};

function windDirection(deg) {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
                "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

export async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "precipitation",
      "snowfall",
      "snow_depth",
      "weather_code",
      "wind_speed_10m",
      "wind_gusts_10m",
      "wind_direction_10m",
      "visibility",
      "cloud_cover",
    ].join(","),
    daily: "snowfall_sum,precipitation_sum",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    precipitation_unit: "inch",
    timezone: "auto",
    forecast_days: 1,
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error("Weather fetch failed");
  const data = await res.json();
  const c = data.current;

  const code = c.weather_code;
  const snowDepthIn = c.snow_depth != null ? (c.snow_depth * 39.3701).toFixed(0) : null;

  return {
    icon: weatherIcons[code] ?? "🌡️",
    condition: weatherDescriptions[code] ?? "Unknown",
    tempF: Math.round(c.temperature_2m),
    feelsLikeF: Math.round(c.apparent_temperature),
    humidity: c.relative_humidity_2m,
    windMph: Math.round(c.wind_speed_10m),
    gustsMph: Math.round(c.wind_gusts_10m),
    windDir: windDirection(c.wind_direction_10m),
    snowfallIn: c.snowfall != null ? (c.snowfall * 0.0393701).toFixed(1) : "0.0",
    snowDepthIn,
    cloudCover: c.cloud_cover,
    visibilityMi:
      c.visibility != null ? (c.visibility / 1609.34).toFixed(1) : null,
    newSnow24In:
      data.daily?.snowfall_sum?.[0] != null
        ? (data.daily.snowfall_sum[0] * 0.393701).toFixed(1)
        : "0.0",
  };
}
