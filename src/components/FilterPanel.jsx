import { WEATHER_CATEGORIES } from "../utils/weather";
import "./FilterPanel.css";

export const TEMP_MIN = -20;
export const TEMP_MAX = 60;

export default function FilterPanel({
  tempRange,
  setTempRange,
  conditions,
  setConditions,
  matchCount,
  loading,
}) {
  const { min, max } = tempRange;
  const tempActive = min > TEMP_MIN || max < TEMP_MAX;
  const filtersActive = tempActive || conditions.size > 0;

  const setMin = (v) => setTempRange({ min: Math.min(v, max), max });
  const setMax = (v) => setTempRange({ min, max: Math.max(v, min) });

  const toggleCondition = (key) => {
    const next = new Set(conditions);
    next.has(key) ? next.delete(key) : next.add(key);
    setConditions(next);
  };

  const reset = () => {
    setTempRange({ min: TEMP_MIN, max: TEMP_MAX });
    setConditions(new Set());
  };

  // Position of the highlighted track segment (%)
  const pct = (v) => ((v - TEMP_MIN) / (TEMP_MAX - TEMP_MIN)) * 100;

  return (
    <div className="filter-panel">
      <div className="filter-header">
        <span className="filter-title">Find your conditions</span>
        {filtersActive && (
          <button className="filter-reset" onClick={reset}>
            Reset
          </button>
        )}
      </div>

      <div className="filter-section">
        <div className="filter-label">
          <span>Temperature</span>
          <span className="filter-value">
            {min}° – {max}°F
          </span>
        </div>
        <div className="range-slider">
          <div className="range-track" />
          <div
            className="range-fill"
            style={{ left: `${pct(min)}%`, right: `${100 - pct(max)}%` }}
          />
          <input
            type="range"
            min={TEMP_MIN}
            max={TEMP_MAX}
            value={min}
            onChange={(e) => setMin(Number(e.target.value))}
            aria-label="Minimum temperature"
          />
          <input
            type="range"
            min={TEMP_MIN}
            max={TEMP_MAX}
            value={max}
            onChange={(e) => setMax(Number(e.target.value))}
            aria-label="Maximum temperature"
          />
        </div>
      </div>

      <div className="filter-section">
        <div className="filter-label">
          <span>Conditions</span>
        </div>
        <div className="condition-chips">
          {Object.entries(WEATHER_CATEGORIES).map(([key, { label, icon }]) => (
            <button
              key={key}
              className={`condition-chip${conditions.has(key) ? " active" : ""}`}
              onClick={() => toggleCondition(key)}
            >
              <span className="chip-icon">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-footer">
        {loading
          ? "Loading conditions…"
          : filtersActive
            ? `${matchCount} resort${matchCount === 1 ? "" : "s"} match`
            : "Showing all resorts"}
      </div>
    </div>
  );
}
