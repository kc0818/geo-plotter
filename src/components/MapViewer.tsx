import { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Papa from "papaparse";

const defaultCenter: [number, number] = [35.6811964185803, 139.7671364982573]; // Tokyo Station

interface CsvRow {
  lat: number;
  lon: number;
  [key: string]: unknown;
}

export default function MapViewer() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const csvMarkersRef = useRef<L.Marker[]>([]);

  const [lat, setLat] = useState<string>("35.6811964185803");
  const [lng, setLng] = useState<string>("139.7671364982573");
  const [error, setError] = useState<string | null>(null);

  // CSV state
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [csvFileName, setCsvFileName] = useState<string>("");

  const clearCsvMarkers = useCallback(() => {
    csvMarkersRef.current.forEach((m) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(m);
      }
    });
    csvMarkersRef.current = [];
  }, []);

  const plotCsvPoints = useCallback(
    (rows: CsvRow[]) => {
      if (!mapInstanceRef.current) return;

      clearCsvMarkers();

      if (rows.length === 0) return;

      const bounds = L.latLngBounds([]);
      const markers: L.Marker[] = [];

      rows.forEach((row, index) => {
        const marker = L.marker([row.lat, row.lon]).addTo(
          mapInstanceRef.current!
        );
        marker.bindPopup(
          `<b>Point #${index + 1}</b><br/>Lat: ${row.lat}<br/>Lng: ${row.lon}`
        );
        markers.push(marker);
        bounds.extend([row.lat, row.lon]);
      });

      csvMarkersRef.current = markers;
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    },
    [clearCsvMarkers]
  );

  useEffect(() => {
    if (mapContainerRef.current == null || mapInstanceRef.current != null) {
      return;
    }

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 15,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker(defaultCenter).addTo(map);
    marker
      .bindPopup(
        `<b>Location</b><br/>Lat: ${defaultCenter[0]}<br/>Lng: ${defaultCenter[1]}`
      )
      .openPopup();

    mapInstanceRef.current = map;
    markerRef.current = marker;

    // Force invalidate size after render to fix container sizing issues
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Re-plot CSV markers when csvData changes (e.g. after map is ready)
  useEffect(() => {
    if (mapInstanceRef.current && csvData.length > 0) {
      plotCsvPoints(csvData);
    }
  }, [csvData, plotCsvPoints]);

  const handleShowLocation = () => {
    setError(null);

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      setError("Please enter valid latitude and longitude values.");
      return;
    }

    if (parsedLat < -90 || parsedLat > 90) {
      setError("Latitude must be between -90 and 90.");
      return;
    }

    if (parsedLng < -180 || parsedLng > 180) {
      setError("Longitude must be between -180 and 180.");
      return;
    }

    const newCenter: L.LatLngExpression = [parsedLat, parsedLng];

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo(newCenter, 15);
      markerRef.current.setLatLng(newCenter);
      markerRef.current
        .bindPopup(
          `<b>Location</b><br/>Lat: ${parsedLat}<br/>Lng: ${parsedLng}`
        )
        .openPopup();
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: CsvRow[] = [];
        const errors: string[] = [];

        (results.data as Record<string, unknown>[]).forEach((row, index) => {
          const rawLat = row["lat"];
          const rawLon = row["lon"];

          if (rawLat == null || rawLon == null) {
            errors.push(`Row ${index + 1}: missing "lat" or "lon" column.`);
            return;
          }

          const parsedLat = parseFloat(String(rawLat));
          const parsedLon = parseFloat(String(rawLon));

          if (isNaN(parsedLat) || isNaN(parsedLon)) {
            errors.push(
              `Row ${index + 1}: invalid numeric value (lat=${rawLat}, lon=${rawLon}).`
            );
            return;
          }

          if (parsedLat < -90 || parsedLat > 90) {
            errors.push(`Row ${index + 1}: latitude ${parsedLat} out of range.`);
            return;
          }

          if (parsedLon < -180 || parsedLon > 180) {
            errors.push(
              `Row ${index + 1}: longitude ${parsedLon} out of range.`
            );
            return;
          }

          rows.push({ lat: parsedLat, lon: parsedLon, ...row });
        });

        if (rows.length === 0) {
          setError(
            "No valid coordinate rows found in the CSV. " +
              (errors.length > 0 ? errors[0] : "")
          );
          setCsvData([]);
          return;
        }

        setCsvData(rows);

        if (errors.length > 0) {
          setError(
            `Plotted ${rows.length} point(s). ${errors.length} row(s) had errors (first: ${errors[0]}).`
          );
        }
      },
      error: () => {
        setError("Failed to parse CSV file.");
      },
    });

    // Reset input value so the same file can be re-uploaded
    e.target.value = "";
  };

  const handleClearCsv = () => {
    clearCsvMarkers();
    setCsvData([]);
    setCsvFileName("");
    setError(null);

    // Fly back to the single marker if it exists
    if (mapInstanceRef.current && markerRef.current) {
      const latlng = markerRef.current.getLatLng();
      mapInstanceRef.current.flyTo([latlng.lat, latlng.lng], 15);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleShowLocation();
    }
  };

  return (
    <div className="map-viewer">
      <div className="input-group">
        <label>
          Latitude:
          <input
            type="text"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. 35.6762"
          />
        </label>
        <label>
          Longitude:
          <input
            type="text"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. 139.6503"
          />
        </label>
        <button onClick={handleShowLocation}>Show Location</button>
      </div>

      <div className="csv-upload-group">
        <label className="csv-upload-label">
          <span>Upload CSV (with <code>lat</code>, <code>lon</code> columns):</span>
          <input
            type="file"
            accept=".csv"
            onChange={handleCsvUpload}
            className="csv-file-input"
          />
        </label>
        {csvFileName && (
          <div className="csv-status">
            <span className="csv-file-name">{csvFileName}</span>
            <span className="csv-point-count">
              ({csvData.length} point{csvData.length !== 1 ? "s" : ""})
            </span>
            <button className="csv-clear-btn" onClick={handleClearCsv}>
              Clear
            </button>
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div ref={mapContainerRef} className="map-container" />
    </div>
  );
}