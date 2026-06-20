import MapViewer from "./components/MapViewer";
import "./App.css";

function App() {
  return (
    <div className="app">
      <h1>Map Location Viewer</h1>
      <p>
        Enter latitude and longitude to display a location on the map (powered
        by OpenStreetMap + Leaflet).
      </p>
      <MapViewer />
    </div>
  );
}

export default App
