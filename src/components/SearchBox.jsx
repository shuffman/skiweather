import { useState, useRef } from "react";
import { resorts } from "../data/resorts";
import "./SearchBox.css";

export default function SearchBox({ map }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (val.length < 2) {
      setResults([]);
      return;
    }
    const lower = val.toLowerCase();
    setResults(
      resorts
        .filter(
          (r) =>
            r.name.toLowerCase().includes(lower) ||
            r.state.toLowerCase().includes(lower)
        )
        .slice(0, 8)
    );
  };

  const handleSelect = (resort) => {
    map.flyTo([resort.lat, resort.lon], 11, { duration: 1.2 });
    setQuery(resort.name);
    setResults([]);
    inputRef.current?.blur();
  };

  return (
    <div className="search-box">
      <input
        ref={inputRef}
        type="text"
        placeholder="Search ski resort…"
        value={query}
        onChange={handleChange}
        onBlur={() => setTimeout(() => setResults([]), 150)}
      />
      {results.length > 0 && (
        <ul className="search-results">
          {results.map((r, i) => (
            <li key={i} onMouseDown={() => handleSelect(r)}>
              <span className="result-name">{r.name}</span>
              <span className="result-loc">
                {r.state}, {r.country}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
