import "./WeatherPopup.css";

export default function WeatherPopup({ resort, weather, loading, error }) {
  return (
    <div className="weather-popup">
      <div className="popup-header">
        <span className="popup-resort-name">{resort.name}</span>
        <span className="popup-location">
          {resort.state}, {resort.country}
        </span>
      </div>

      {loading && (
        <div className="popup-loading">
          <div className="spinner" />
          <span>Fetching conditions…</span>
        </div>
      )}

      {error && (
        <div className="popup-error">
          ⚠️ Could not load weather
        </div>
      )}

      {!loading && !error && weather && (
        <div className="popup-body">
          <div className="condition-row">
            <span className="condition-icon">{weather.icon}</span>
            <div className="condition-text">
              <span className="condition-label">{weather.condition}</span>
              <span className="temp-main">{weather.tempF}°F</span>
              <span className="feels-like">Feels like {weather.feelsLikeF}°F</span>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat">
              <span className="stat-label">New Snow (24h)</span>
              <span className="stat-value snow">{weather.newSnow24In}"</span>
            </div>
            <div className="stat">
              <span className="stat-label">Snow Depth</span>
              <span className="stat-value snow">
                {weather.snowDepthIn != null ? `${weather.snowDepthIn}"` : "N/A"}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Wind</span>
              <span className="stat-value">
                {weather.windMph} mph {weather.windDir}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Gusts</span>
              <span className="stat-value">{weather.gustsMph} mph</span>
            </div>
            <div className="stat">
              <span className="stat-label">Humidity</span>
              <span className="stat-value">{weather.humidity}%</span>
            </div>
            <div className="stat">
              <span className="stat-label">Cloud Cover</span>
              <span className="stat-value">{weather.cloudCover}%</span>
            </div>
            {weather.visibilityMi != null && (
              <div className="stat">
                <span className="stat-label">Visibility</span>
                <span className="stat-value">{weather.visibilityMi} mi</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
