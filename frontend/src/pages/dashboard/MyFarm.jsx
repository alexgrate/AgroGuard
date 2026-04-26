import { useState, useEffect, useRef } from "react";
import { farmsAPI } from "../../services/api";

// ── Icons ──────────────────────────────────────────────
function PinIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
}
function TargetIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
}
function SaveIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
}
function SearchIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
}
function CheckIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}

// Reverse geocode via Nominatim
async function reverseGeocode(lat, lng) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
    { headers: { "Accept-Language": "en" } }
  );
  const data = await res.json();
  const a = data.address || {};
  const parts = [
    a.village || a.suburb || a.neighbourhood || a.hamlet || a.town,
    a.city || a.county || a.state_district,
    a.state,
    a.country,
  ].filter(Boolean);
  return { display: parts.join(", "), full: data.display_name };
}

async function forwardGeocode(query) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
    { headers: { "Accept-Language": "en" } }
  );
  return res.json();
}

export default function MyFarm() {
  const mapRef        = useRef(null);
  const leafletMapRef = useRef(null);
  const markerRef     = useRef(null);

  const savedLat  = parseFloat(localStorage.getItem("farm_lat")  || "9.0820");
  const savedLng  = parseFloat(localStorage.getItem("farm_lng")  || "8.6753");
  const savedAddr = localStorage.getItem("farm_address") || "";

  const [coords,   setCoords]   = useState({ lat: savedLat, lng: savedLng });
  const [address,  setAddress]  = useState(savedAddr);
  const [landmark, setLandmark] = useState("");
  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState([]);
  const [searching, setSearching] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // ── Load Leaflet dynamically ───────────────────────
  useEffect(() => {
    if (window.L) { setMapReady(true); return; }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setMapReady(true);
    document.head.appendChild(script);
  }, []);

  // ── Init map once Leaflet is ready ────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current || leafletMapRef.current) return;

    const L   = window.L;
    const map = L.map(mapRef.current, { zoomControl: true }).setView([coords.lat, coords.lng], 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    // Custom green marker
    const greenIcon = L.divIcon({
      html: `<div style="width:32px;height:32px;background:#1e6b45;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
      className: "",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    const marker = L.marker([coords.lat, coords.lng], { icon: greenIcon, draggable: true }).addTo(map);

    // Drag to repin
    marker.on("dragend", async (e) => {
      const { lat, lng } = e.target.getLatLng();
      setCoords({ lat, lng });
      try {
        const addr = await reverseGeocode(lat, lng);
        setAddress(addr.display);
      } catch { /* ignore */ }
    });

    // Click map to repin
    map.on("click", async (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      setCoords({ lat, lng });
      try {
        const addr = await reverseGeocode(lat, lng);
        setAddress(addr.display);
      } catch { /* ignore */ }
    });

    leafletMapRef.current = map;
    markerRef.current     = marker;
  }, [mapReady]);

  // ── Move marker when coords change ────────────────
  useEffect(() => {
    if (!leafletMapRef.current || !markerRef.current) return;
    markerRef.current.setLatLng([coords.lat, coords.lng]);
    leafletMapRef.current.flyTo([coords.lat, coords.lng], 15, { duration: 1.2 });
  }, [coords]);

  // ── Auto-detect ───────────────────────────────────
  async function autoDetect() {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        try {
          const addr = await reverseGeocode(lat, lng);
          setAddress(addr.display);
        } catch { /* ignore */ }
        setDetecting(false);
      },
      () => setDetecting(false),
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  // ── Manual search ─────────────────────────────────
  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setResults([]);
    try {
      const data = await forwardGeocode(query);
      setResults(data);
    } catch { /* ignore */ }
    setSearching(false);
  }

  function selectResult(r) {
    setCoords({ lat: parseFloat(r.lat), lng: parseFloat(r.lon) });
    const a = r.address || {};
    const parts = [
      a.village || a.suburb || a.neighbourhood || a.hamlet || a.town,
      a.city || a.county || a.state_district,
      a.state,
      a.country,
    ].filter(Boolean);
    setAddress(parts.join(", ") || r.display_name);
    setResults([]);
    setQuery("");
  }

  // ── Save to backend ───────────────────────────────
  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await farmsAPI.saveLocation({
        latitude:     coords.lat,
        longitude:    coords.lng,
        address:      address,
        full_address: address,
      });
      localStorage.setItem("farm_lat",     coords.lat);
      localStorage.setItem("farm_lng",     coords.lng);
      localStorage.setItem("farm_address", address);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { /* ignore */ }
    setSaving(false);
  }

  return (
    <>
      <style>{`
        .myfarm-root {}
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fi1 { animation: fadeInUp 0.4s ease 0.05s both; }
        .fi2 { animation: fadeInUp 0.4s ease 0.12s both; }

        .map-container {
          border-radius: 16px;
          overflow: hidden;
          border: 1.5px solid #ede8df;
          height: 480px;
          flex: 1;
        }
        .panel-card {
          background: white;
          border-radius: 16px;
          border: 1px solid #ede8df;
          padding: 1.25rem;
          margin-bottom: 1rem;
        }
        .panel-card h3 {
          font-size: 0.9rem;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 0.85rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .coord-box {
          background: #f9f6f0;
          border-radius: 10px;
          padding: 0.65rem 0.9rem;
          font-size: 0.8rem;
          color: #6b7280;
          margin-bottom: 0.85rem;
        }
        .coord-box strong { color: #1a1a1a; font-weight: 600; }

        .landmark-input {
          width: 100%;
          padding: 0.65rem 0.9rem;
          border-radius: 10px;
          border: 1.5px solid #ede8df;
          background: #fdfcf9;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.83rem;
          color: #1a1a1a;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
          margin-bottom: 0.75rem;
        }
        .landmark-input::placeholder { color: #c5bfb5; }
        .landmark-input:focus {
          border-color: #1e6b45;
          box-shadow: 0 0 0 3px rgba(30,107,69,0.1);
        }

        .search-result-item {
          padding: 0.6rem 0.85rem;
          font-size: 0.8rem;
          color: #374151;
          cursor: pointer;
          border-bottom: 1px solid #f3f0ea;
          transition: background 0.15s;
          line-height: 1.4;
        }
        .search-result-item:last-child { border-bottom: none; }
        .search-result-item:hover { background: #f5f2ec; }

        .btn-detect {
          width: 100%;
          padding: 0.65rem;
          border-radius: 10px;
          border: 1.5px solid #ede8df;
          background: white;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.83rem;
          font-weight: 600;
          color: #1a1a1a;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          transition: border-color 0.15s, background 0.15s;
          margin-bottom: 0.75rem;
        }
        .btn-detect:hover { border-color: #1e6b45; background: #f0faf5; color: #1e6b45; }

        .btn-save {
          width: 100%;
          padding: 0.7rem;
          border-radius: 10px;
          border: none;
          background: #1e6b45;
          color: white;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          transition: opacity 0.15s;
        }
        .btn-save:hover { opacity: 0.88; }
        .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-save.saved { background: #16a34a; }

        .address-tag {
          font-size: 0.78rem;
          color: #1e6b45;
          font-weight: 600;
          background: #f0faf5;
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
          margin-bottom: 0.85rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .map-hint {
          font-size: 0.72rem;
          color: #9ca3af;
          text-align: center;
          margin-top: 0.5rem;
        }

        .spinner-sm {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="myfarm-root">
        {/* Page header */}
        <div className="fi1" style={{ marginBottom: "1.75rem" }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.9rem", fontWeight: 700, color: "#1a1a1a", marginBottom: "0.2rem" }}>
            Smart-Map: My Farm
          </h1>
          <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>Pin your land so we can guard it</p>
        </div>

        {/* Content layout */}
        <div className="fi2" style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>

          {/* MAP */}
          <div className="map-container" ref={mapRef}>
            {!mapReady && (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f2ec", color: "#9ca3af", fontSize: "0.85rem" }}>
                Loading map…
              </div>
            )}
          </div>

          {/* SIDE PANEL */}
          <div style={{ width: "300px", flexShrink: 0 }}>

            {/* Auto-detect */}
            <div className="panel-card">
              <h3><TargetIcon /> Auto-Detect</h3>
              <button className="btn-detect" onClick={autoDetect} disabled={detecting}>
                {detecting
                  ? <><span className="spinner-sm" style={{ borderTopColor: "#1e6b45", borderColor: "rgba(30,107,69,0.2)" }} /> Detecting…</>
                  : <><PinIcon /> Pin My Farm</>
                }
              </button>
              {address && (
                <div className="address-tag">
                  <PinIcon /> {address}
                </div>
              )}
              <p style={{ fontSize: "0.72rem", color: "#9ca3af" }}>
                Click anywhere on the map or drag the pin to reposition.
              </p>
            </div>

            {/* Manual search */}
            <div className="panel-card">
              <h3><SearchIcon /> Manual Search</h3>

              <form onSubmit={handleSearch} style={{ marginBottom: results.length ? "0" : "0.1rem" }}>
                <input
                  type="text"
                  className="landmark-input"
                  placeholder="e.g. Behind St. Mary Church, Owerri"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={searching || !query.trim()}
                  style={{
                    width: "100%", padding: "0.6rem", borderRadius: "10px",
                    border: "none", background: "#f0faf5", color: "#1e6b45",
                    fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: "0.82rem",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                    opacity: searching || !query.trim() ? 0.6 : 1,
                  }}
                >
                  <SearchIcon /> {searching ? "Searching…" : "Search"}
                </button>
              </form>

              {results.length > 0 && (
                <div style={{ borderRadius: "10px", border: "1.5px solid #ede8df", overflow: "hidden", marginTop: "0.75rem" }}>
                  {results.map((r) => (
                    <div key={r.place_id} className="search-result-item" onClick={() => selectResult(r)}>
                      <strong style={{ color: "#1a1a1a" }}>{r.display_name.split(",")[0]}</strong><br />
                      <span style={{ color: "#9ca3af" }}>{r.display_name.split(",").slice(1, 3).join(",").trim()}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Coords display */}
              <div className="coord-box" style={{ marginTop: "0.85rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Latitude<br /><strong>{coords.lat.toFixed(5)}</strong></span>
                  <span style={{ textAlign: "right" }}>Longitude<br /><strong>{coords.lng.toFixed(5)}</strong></span>
                </div>
              </div>

              {/* Optional nearest landmark */}
              <input
                type="text"
                className="landmark-input"
                placeholder="📍 Nearest Landmark (optional)"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
              />

              {/* Save */}
              <button
                className={`btn-save ${saved ? "saved" : ""}`}
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? <><span className="spinner-sm" /> Saving…</>
                  : saved
                    ? <><CheckIcon /> Location Saved!</>
                    : <><SaveIcon /> Save Farm Location</>
                }
              </button>
            </div>

            <p className="map-hint">📍 Your location data is private and only used for farm advice.</p>
          </div>
        </div>
      </div>
    </>
  );
}