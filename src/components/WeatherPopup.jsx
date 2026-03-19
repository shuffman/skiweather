import "./WeatherPopup.css";

function tempColor(f) {
  if (f <= 10)  return "#93c5fd";
  if (f <= 25)  return "#60a5fa";
  if (f <= 32)  return "#3b82f6";
  if (f <= 40)  return "#818cf8";
  if (f <= 50)  return "#a78bfa";
  if (f <= 60)  return "#f59e0b";
  return "#ef4444";
}

function DepthBar({ label, inches }) {
  if (inches == null) return null;
  const pct = Math.min(100, (parseFloat(inches) / 120) * 100);
  return (
    <div className="depth-row">
      <span className="depth-label">{label}</span>
      <div className="depth-bar-wrap">
        <div className="depth-bar-fill" style={{ "--pct": `${pct}%` }} />
      </div>
      <span className="depth-val">{Math.round(parseFloat(inches))}"</span>
    </div>
  );
}

function ForecastStrip({ forecast }) {
  if (!forecast?.length) return null;
  return (
    <div className="forecast-strip">
      {forecast.map((day, i) => (
        <div key={i} className="forecast-day">
          <span className="fc-day">{day.day}</span>
          <span className="fc-icon">{day.icon}</span>
          <span className="fc-high">{day.highF}°</span>
          <span className="fc-low">{day.lowF}°</span>
          {parseFloat(day.snowIn) > 0 && (
            <span className="fc-snow">❄{day.snowIn}"</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function WeatherPopup({ resort, weather, loading, error, conditions }) {
  const powderAlert = parseFloat(conditions?.newSnow24In) >= 6;

  const hasConditions = conditions && (
    conditions.baseDepthIn != null ||
    conditions.openLifts != null ||
    conditions.openTrails != null
  );

  return (
    <div className="weather-popup">
      <div className="popup-header">
        <span className="popup-resort-name">{resort.name}</span>
        <span className="popup-location">{resort.state}, {resort.country}</span>
      </div>

      {powderAlert && (
        <div className="powder-alert">
          ❄️ POWDER ALERT — {conditions.newSnow24In}" in 24h!
        </div>
      )}

      {loading && (
        <div className="popup-loading">
          <div className="spinner" />
          <span>Fetching conditions…</span>
        </div>
      )}

      {error && <div className="popup-error">⚠️ Could not load weather</div>}

      {!loading && !error && weather && (
        <div className="popup-body">
          <div className="condition-row">
            <span className="condition-icon">{weather.icon}</span>
            <div className="condition-text">
              <span className="condition-label">{weather.condition}</span>
              <span className="temp-main" style={{ color: tempColor(weather.tempF) }}>
                {weather.tempF}°F
              </span>
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
              <span className="stat-value">{weather.windMph} mph {weather.windDir}</span>
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

          <ForecastStrip forecast={weather.forecast} />
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
                  {conditions.openLifts}{conditions.totalLifts ? ` / ${conditions.totalLifts}` : ""}
                </span>
              </div>
            )}
            {conditions.openTrails != null && (
              <div className="stat">
                <span className="stat-label">Trails Open</span>
                <span className="stat-value">
                  {conditions.openTrails}{conditions.totalTrails ? ` / ${conditions.totalTrails}` : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
