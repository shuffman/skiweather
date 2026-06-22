const weatherDescriptions = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Foggy", 48: "Rime fog", 51: "Light drizzle", 53: "Drizzle",
  55: "Dense drizzle", 61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
  71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow", 77: "Snow grains",
  80: "Rain showers", 81: "Rain showers", 82: "Violent showers",
  85: "Snow showers", 86: "Heavy snow showers",
  95: "Thunderstorm", 96: "Thunderstorm+hail", 99: "Thunderstorm+hail",
};

export const weatherIcons = {
  0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️", 45: "🌫️", 48: "🌫️",
  51: "🌦️", 53: "🌦️", 55: "🌧️", 61: "🌧️", 63: "🌧️", 65: "🌧️",
  71: "🌨️", 73: "🌨️", 75: "❄️", 77: "🌨️", 80: "🌦️", 81: "🌦️",
  82: "⛈️", 85: "🌨️", 86: "❄️", 95: "⛈️", 96: "⛈️", 99: "⛈️",
};

// ── Weather condition categories (for filtering) ─────────────────────────────
export const WEATHER_CATEGORIES = {
  clear:  { label: "Clear",   icon: "☀️", codes: [0, 1] },
  cloudy: { label: "Cloudy",  icon: "☁️", codes: [2, 3, 45, 48] },
  snow:   { label: "Snowing", icon: "🌨️", codes: [71, 73, 75, 77, 85, 86] },
  rain:   { label: "Rain",    icon: "🌧️", codes: [51, 53, 55, 61, 63, 65, 80, 81, 82] },
  storm:  { label: "Storm",   icon: "⛈️", codes: [95, 96, 99] },
};

export function weatherCategory(code) {
  for (const [key, { codes }] of Object.entries(WEATHER_CATEGORIES)) {
    if (codes.includes(code)) return key;
  }
  return null;
}

// Fetch current temperature + condition for every resort in batched requests.
// Returns a Map<resortIndex, { tempF, code, category }>.
export async function fetchAllWeather(resorts) {
  const CHUNK = 100;
  const map = new Map();

  for (let start = 0; start < resorts.length; start += CHUNK) {
    const chunk = resorts.slice(start, start + CHUNK);
    const params = new URLSearchParams({
      latitude: chunk.map((r) => r.lat).join(","),
      longitude: chunk.map((r) => r.lon).join(","),
      current: "temperature_2m,weather_code",
      temperature_unit: "fahrenheit",
    });

    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
      if (!res.ok) continue;
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [data];
      arr.forEach((d, i) => {
        const code = d.current?.weather_code;
        const t = d.current?.temperature_2m;
        if (t == null) return;
        map.set(start + i, {
          tempF: Math.round(t),
          code,
          category: weatherCategory(code),
        });
      });
    } catch {
      // skip this chunk on failure
    }
  }

  return map;
}

function windDirection(deg) {
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

const DAY_ABBR = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: [
      "temperature_2m","apparent_temperature","relative_humidity_2m",
      "precipitation","snowfall","snow_depth","weather_code",
      "wind_speed_10m","wind_gusts_10m","wind_direction_10m",
      "visibility","cloud_cover",
    ].join(","),
    daily: [
      "weather_code","temperature_2m_max","temperature_2m_min","snowfall_sum",
    ].join(","),
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    precipitation_unit: "inch",
    timezone: "auto",
    forecast_days: 6,
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error("Weather fetch failed");
  const data = await res.json();
  const c = data.current;
  const code = c.weather_code;
  const snowDepthIn = c.snow_depth != null ? (c.snow_depth * 39.3701).toFixed(0) : null;

  // Build 5-day forecast (skip index 0 = today)
  const forecast = data.daily.time.slice(1, 6).map((dateStr, i) => {
    const idx = i + 1;
    const d = new Date(dateStr + "T12:00:00");
    const dayCode = data.daily.weather_code[idx];
    return {
      day: DAY_ABBR[d.getDay()],
      icon: weatherIcons[dayCode] ?? "🌡️",
      highF: Math.round(data.daily.temperature_2m_max[idx]),
      lowF: Math.round(data.daily.temperature_2m_min[idx]),
      snowIn: data.daily.snowfall_sum[idx] != null
        ? (data.daily.snowfall_sum[idx] * 0.393701).toFixed(1)
        : "0.0",
    };
  });

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
    visibilityMi: c.visibility != null ? (c.visibility / 1609.34).toFixed(1) : null,
    newSnow24In: data.daily?.snowfall_sum?.[0] != null
      ? (data.daily.snowfall_sum[0] * 0.393701).toFixed(1)
      : "0.0",
    forecast,
  };
}
