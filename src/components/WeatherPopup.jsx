import "./WeatherPopup.css";

function DepthBar({ label, inches }) {
  if (inches == null) return null;
  return (
    <div className="depth-row">
      <span className="depth-label">{label}</span>
      <div className="depth-bar-wrap">
        <div
          className="depth-bar-fill"
          style={{ width: `${Math.min(100, (inches / 120) * 100)}%` }}
        />
      </div>
      <span className="depth-val">{Math.round(inches)}"</span>
    </div>
  );
}

export default function WeatherPopup({ resort, weather, loading, error, conditions }) {
  const hasConditions = conditions && (
    conditions.baseDepthIn != null ||
    conditions.openLifts != null ||
    conditions.openTrails != null
  );

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
        <div className="popup-error">⚠️ Could not load weather</div>
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

      {hasConditions && (
        <div className="conditions-body">
          <div className="conditions-title">
            ⛷ Resort Conditions
            {conditions.surfaceConditions && (
              <span className="surface-badge">{conditions.surfaceConditions}</span>
            )}
          </div>

          {(conditions.baseDepthIn != null || conditions.midDepthIn != null || conditions.summitDepthIn != null) && (
            <div className="depth-section">
              <DepthBar label="Base" inches={conditions.baseDepthIn} />
              <DepthBar label="Mid" inches={conditions.midDepthIn} />
              <DepthBar label="Summit" inches={conditions.summitDepthIn} />
            </div>
          )}

          <div className="conditions-grid">
            {conditions.newSnow24In != null && (
              <div className="stat">
                <span className="stat-label">New Snow (24h)</span>
                <span className="stat-value snow">{conditions.newSnow24In}"</span>
              </div>
            )}
            {conditions.newSnow48In != null && (
              <div className="stat">
                <span className="stat-label">New Snow (48h)</span>
                <span className="stat-value snow">{conditions.newSnow48In}"</span>
              </div>
            )}
            {conditions.seasonTotalIn != null && (
              <div className="stat">
                <span className="stat-label">Season Total</span>
                <span className="stat-value snow">{conditions.seasonTotalIn}"</span>
              </div>
            )}
            {conditions.openLifts != null && (
              <div className="stat">
                <span className="stat-label">Lifts Open</span>
                <span className="stat-value">
                  {conditions.openLifts}
                  {conditions.totalLifts ? ` / ${conditions.totalLifts}` : ""}
                </span>
              </div>
            )}
            {conditions.openTrails != null && (
              <div className="stat">
                <span className="stat-label">Trails Open</span>
                <span className="stat-value">
                  {conditions.openTrails}
                  {conditions.totalTrails ? ` / ${conditions.totalTrails}` : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
