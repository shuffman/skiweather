import { useCallback, useState, useEffect, useMemo, memo } from "react";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";
import { resorts } from "../data/resorts";
import { fetchWeather, fetchAllWeather } from "../utils/weather";
import { fetchAllConditions } from "../utils/conditions";
import WeatherPopup from "./WeatherPopup";
import SearchBox from "./SearchBox";
import FilterPanel, { TEMP_MIN, TEMP_MAX } from "./FilterPanel";
import "./ResortMap.css";

const weatherCache = new Map();
const WEATHER_TTL = 10 * 60 * 1000;

// ── Snow depth → marker color ─────────────────────────────────────────────────
function snowDepthColor(depthIn, country) {
  if (depthIn == null) return country === "CA" ? "#f59e0b" : "#6b7280";
  const d = parseFloat(depthIn);
  if (d <= 0)   return "#9ca3af";
  if (d < 12)   return "#bfdbfe";
  if (d < 36)   return "#60a5fa";
  if (d < 60)   return "#2563a8";
  if (d < 96)   return "#1e40af";
  return "#e0f2fe"; // 96"+ — near-white for epic conditions
}

function createResortIcon(color, hasFreshSnow, matchState, border = "rgba(255,255,255,0.9)") {
  const stateClass =
    matchState === "match" ? " matched" : matchState === "dim" ? " dimmed" : "";
  return L.divIcon({
    className: "",
    html: `<div class="resort-dot${hasFreshSnow ? " fresh-snow" : ""}${stateClass}" style="background:${color};border-color:${border}"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  });
}

function createClusterIcon(cluster) {
  const count = cluster.getChildCount();
  const size = count < 10 ? 32 : count < 50 ? 38 : 44;
  return L.divIcon({
    html: `<div class="cluster-icon" style="width:${size}px;height:${size}px"><span>${count}</span></div>`,
    className: "",
    iconSize: L.point(size, size),
    iconAnchor: [size / 2, size / 2],
  });
}

// ── Individual resort marker ──────────────────────────────────────────────────
const ResortMarker = memo(function ResortMarker({ resort, conditions, matchState }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleOpen = useCallback(async () => {
    const key = `${resort.lat},${resort.lon}`;
    const hit = weatherCache.get(key);
    if (hit && Date.now() - hit.ts < WEATHER_TTL) {
      setWeather(hit.data);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const data = await fetchWeather(resort.lat, resort.lon);
      weatherCache.set(key, { data, ts: Date.now() });
      setWeather(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [resort]);

  const hasFreshSnow = parseFloat(conditions?.newSnow24In) > 0;
  const color = snowDepthColor(conditions?.baseDepthIn, resort.country);
  const icon = useMemo(
    () => createResortIcon(color, hasFreshSnow, matchState),
    [color, hasFreshSnow, matchState]
  );

  return (
    <Marker
      position={[resort.lat, resort.lon]}
      icon={icon}
      eventHandlers={{ mouseover: handleOpen, click: handleOpen }}
    >
      <Popup
        autoPan={false}
        className="resort-popup"
        closeButton={false}
        offset={[0, -4]}
      >
        <WeatherPopup
          resort={resort}
          weather={weather}
          loading={loading}
          error={error}
          conditions={conditions}
        />
      </Popup>
    </Marker>
  );
});

// ── Map controls overlay ──────────────────────────────────────────────────────
function MapControls() {
  const map = useMap();
  const handleLocate = () => {
    navigator.geolocation?.getCurrentPosition(({ coords }) => {
      map.flyTo([coords.latitude, coords.longitude], 9, { duration: 1.2 });
    });
  };
  return (
    <div className="map-controls">
      <SearchBox map={map} />
      <button className="locate-btn" onClick={handleLocate} title="Find nearest resorts">
        ⊕
      </button>
    </div>
  );
}

// ── Main map ──────────────────────────────────────────────────────────────────
export default function ResortMap() {
  const [conditionsMap, setConditionsMap] = useState(new Map());
  const [weatherMap, setWeatherMap] = useState(new Map());
  const [weatherLoading, setWeatherLoading] = useState(true);

  // Filter state
  const [tempRange, setTempRange] = useState({ min: TEMP_MIN, max: TEMP_MAX });
  const [conditions, setConditions] = useState(new Set());

  // Pre-load all conditions + current weather in batch requests on mount
  useEffect(() => {
    fetchAllConditions(resorts).then(setConditionsMap).catch(() => {});
    fetchAllWeather(resorts)
      .then(setWeatherMap)
      .catch(() => {})
      .finally(() => setWeatherLoading(false));
  }, []);

  const filtersActive =
    tempRange.min > TEMP_MIN ||
    tempRange.max < TEMP_MAX ||
    conditions.size > 0;

  // Per-resort match: "match" | "dim" | "none"
  const matchStates = useMemo(() => {
    const states = new Map();
    resorts.forEach((_, i) => {
      if (!filtersActive) {
        states.set(i, "none");
        return;
      }
      const w = weatherMap.get(i);
      const ok =
        w &&
        w.tempF >= tempRange.min &&
        w.tempF <= tempRange.max &&
        (conditions.size === 0 || conditions.has(w.category));
      states.set(i, ok ? "match" : "dim");
    });
    return states;
  }, [filtersActive, weatherMap, tempRange, conditions]);

  const matchCount = useMemo(() => {
    if (!filtersActive) return resorts.length;
    let n = 0;
    matchStates.forEach((s) => s === "match" && n++);
    return n;
  }, [matchStates, filtersActive]);

  return (
    <div className="map-wrapper">
      <FilterPanel
        tempRange={tempRange}
        setTempRange={setTempRange}
        conditions={conditions}
        setConditions={setConditions}
        matchCount={matchCount}
        loading={weatherLoading}
      />
      <MapContainer
        center={[47, -96]}
        zoom={4}
        minZoom={3}
        maxZoom={14}
        scrollWheelZoom
        className="leaflet-map"
        worldCopyJump={false}
        maxBounds={[[15, -170], [85, -50]]}
        maxBoundsViscosity={0.8}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterIcon}
          showCoverageOnHover={false}
          maxClusterRadius={45}
          spiderfyOnMaxZoom
          disableClusteringAtZoom={9}
        >
          {resorts.map((resort, i) => (
            <ResortMarker
              key={i}
              resort={resort}
              conditions={conditionsMap.get(i)}
              matchState={matchStates.get(i)}
            />
          ))}
        </MarkerClusterGroup>
        <MapControls />
      </MapContainer>

      <div className="map-legend">
        <div className="legend-snow">
          <span>Snow depth:</span>
          {[
            { color: "#9ca3af", label: "None" },
            { color: "#bfdbfe", label: '<12"' },
            { color: "#60a5fa", label: '<36"' },
            { color: "#2563a8", label: '<60"' },
            { color: "#1e40af", label: '<96"' },
            { color: "#e0f2fe", label: '96"+' },
          ].map(({ color, label }) => (
            <span key={label} className="legend-item">
              <span className="legend-dot" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
        <div className="legend-pulse">
          <span className="resort-dot fresh-snow legend-pulse-dot" style={{ background: "#60a5fa" }} />
          Fresh snow
        </div>
      </div>
    </div>
  );
}
