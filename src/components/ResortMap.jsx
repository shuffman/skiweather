import { useCallback, useState } from "react";
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
import { fetchConditions } from "../utils/conditions";
import WeatherPopup from "./WeatherPopup";
import SearchBox from "./SearchBox";
import "./ResortMap.css";

const weatherCache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

function getMarkerColor(country) {
  return country === "CA" ? "#e8a020" : "#2563a8";
}

function ResortMarker({ resort }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [conditions, setConditions] = useState(null);

  const handleOpen = useCallback(async () => {
    const key = `${resort.lat},${resort.lon}`;
    const cached = weatherCache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setWeather(cached.data);
    } else {
      setLoading(true);
      setError(false);
      fetchWeather(resort.lat, resort.lon)
        .then((data) => {
          weatherCache.set(key, { data, ts: Date.now() });
          setWeather(data);
        })
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    }

    if (resort.conditions) {
      fetchConditions(resort.conditions)
        .then((data) => setConditions(data))
        .catch(() => {});
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
          conditions={conditions}
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
