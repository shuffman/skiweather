import { useRef, useCallback, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { resorts } from "../data/resorts";
import { fetchWeather } from "../utils/weather";
import WeatherPopup from "./WeatherPopup";
import SearchBox from "./SearchBox";
import "./ResortMap.css";

// Cache so repeated hovers don't re-fetch within a session
const weatherCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getMarkerColor(country) {
  return country === "CA" ? "#e8a020" : "#2563a8";
}

function ResortMarker({ resort }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleOpen = useCallback(async () => {
    const key = `${resort.lat},${resort.lon}`;
    const cached = weatherCache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setWeather(cached.data);
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

  const color = getMarkerColor(resort.country);

  return (
    <CircleMarker
      center={[resort.lat, resort.lon]}
      radius={6}
      pathOptions={{
        fillColor: color,
        color: "#fff",
        weight: 1.5,
        opacity: 1,
        fillOpacity: 0.85,
      }}
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
        />
      </Popup>
    </CircleMarker>
  );
}

function MapControls({ onLocate }) {
  const map = useMap();

  const handleLocate = () => {
    navigator.geolocation?.getCurrentPosition(({ coords }) => {
      map.flyTo([coords.latitude, coords.longitude], 9, { duration: 1.2 });
    });
  };

  return (
    <div className="map-controls">
      <SearchBox map={map} />
      <button
        className="locate-btn"
        onClick={handleLocate}
        title="Find nearest resorts"
      >
        ⊕
      </button>
    </div>
  );
}

export default function ResortMap() {
  return (
    <div className="map-wrapper">
      <MapContainer
        center={[47, -96]}
        zoom={4}
        minZoom={3}
        maxZoom={14}
        scrollWheelZoom
        className="leaflet-map"
        worldCopyJump={false}
        maxBounds={[
          [15, -170],
          [85, -50],
        ]}
        maxBoundsViscosity={0.8}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />
        {resorts.map((resort, i) => (
          <ResortMarker key={i} resort={resort} />
        ))}
        <MapControls />
      </MapContainer>
      <div className="map-legend">
        <span className="legend-dot us" /> US Resorts
        <span className="legend-dot ca" /> Canadian Resorts
      </div>
    </div>
  );
}
