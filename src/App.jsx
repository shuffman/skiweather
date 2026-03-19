import ResortMap from "./components/ResortMap";
import "./App.css";

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <span className="header-logo">⛷️</span>
          <div>
            <h1>Ski Resort Weather</h1>
            <p>Hover or tap a resort for live conditions</p>
          </div>
        </div>
      </header>
      <main className="app-main">
        <ResortMap />
      </main>
    </div>
  );
}
