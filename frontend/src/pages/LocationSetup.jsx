import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ── Stages ──────────────────────────────────────────────
// idle → detecting → geocoding → confirmed → error → manual

function PinIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// Reverse geocode using Nominatim
async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`;
  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  if (!res.ok) throw new Error("Geocoding failed");
  const data = await res.json();

  // Build a clean, human-readable address
  const a = data.address || {};
  const parts = [
    a.village || a.suburb || a.neighbourhood || a.hamlet || a.town,
    a.city || a.county || a.state_district,
    a.state,
    a.country,
  ].filter(Boolean);

  return {
    display: parts.join(", "),
    full: data.display_name,
    raw: a,
  };
}

// Forward geocode (manual search)
async function forwardGeocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

export default function LocationSetup() {
  const navigate = useNavigate();
  const [stage, setStage] = useState("idle"); // idle | detecting | geocoding | confirmed | error | manual
  const [coords, setCoords] = useState(null);
  const [address, setAddress] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // Manual search
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Auto-detect on mount
  useEffect(() => {
    detectLocation();
  }, []);

  function detectLocation() {
    setStage("detecting");
    setAddress(null);
    setCoords(null);
    setErrorMsg("");

    if (!navigator.geolocation) {
      setStage("error");
      setErrorMsg("Your browser doesn't support geolocation. Please enter your location manually.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        setStage("geocoding");
        try {
          const result = await reverseGeocode(lat, lng);
          setAddress(result);
          setStage("confirmed");
        } catch {
          setStage("error");
          setErrorMsg("We found your coordinates but couldn't resolve the address. Try searching manually.");
        }
      },
      (err) => {
        setStage("error");
        if (err.code === 1) {
          setErrorMsg("Location access was denied. Please enable location permission or search manually.");
        } else {
          setErrorMsg("Couldn't detect your location. Please search manually.");
        }
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const results = await forwardGeocode(query);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  }

  function selectSearchResult(result) {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setCoords({ lat, lng });
    const a = result.address || {};
    const parts = [
      a.village || a.suburb || a.neighbourhood || a.hamlet || a.town,
      a.city || a.county || a.state_district,
      a.state,
      a.country,
    ].filter(Boolean);
    setAddress({
      display: parts.join(", ") || result.display_name,
      full: result.display_name,
      raw: a,
    });
    setSearchResults([]);
    setQuery("");
    setStage("confirmed");
  }

  async function handleProceed() {
    if (!coords || !address) return;
    setSaving(true);
    try {
      await fetch("/api/farms/location/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          latitude: coords.lat,
          longitude: coords.lng,
          address: address.display,
          full_address: address.full,
        }),
      });
    } catch {
      // Non-blocking — still proceed even if save fails
    }
    setSaving(false);
    navigate("/dashboard");
  }

  const isLoading = stage === "detecting" || stage === "geocoding";

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />
      <style>{`
        .loc-root { font-family: 'DM Sans', sans-serif; }
        .font-playfair { font-family: 'Playfair Display', serif; }

        /* Animated map grid background */
        .map-bg {
          background-color: #f0ede6;
          background-image:
            linear-gradient(rgba(30,107,69,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(30,107,69,0.07) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        /* Pulsing location pin */
        .pin-pulse {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pin-pulse::before,
        .pin-pulse::after {
          content: '';
          position: absolute;
          border-radius: 50%;
          background: rgba(30,107,69,0.18);
          animation: ripple 2s ease-out infinite;
        }
        .pin-pulse::before {
          width: 80px; height: 80px;
          animation-delay: 0s;
        }
        .pin-pulse::after {
          width: 120px; height: 120px;
          animation-delay: 0.5s;
        }
        @keyframes ripple {
          0%   { transform: scale(0.6); opacity: 1; }
          100% { transform: scale(1);   opacity: 0; }
        }

        /* Spinner */
        .spinner {
          width: 20px; height: 20px;
          border: 2.5px solid rgba(30,107,69,0.2);
          border-top-color: #1e6b45;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Slide-in card */
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .slide-up { animation: slideUp 0.45s ease both; }

        /* Check circle bounce */
        @keyframes popIn {
          0%   { transform: scale(0.5); opacity: 0; }
          70%  { transform: scale(1.1); }
          100% { transform: scale(1);   opacity: 1; }
        }
        .pop-in { animation: popIn 0.4s ease both; }

        .ag-search {
          width: 100%;
          padding: 0.7rem 1rem 0.7rem 2.5rem;
          border-radius: 0.75rem;
          border: 1.5px solid #e0dbd0;
          background: #ffffff;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          color: #1a1a1a;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .ag-search::placeholder { color: #c5bfb5; }
        .ag-search:focus {
          border-color: #1e6b45;
          box-shadow: 0 0 0 3px rgba(30,107,69,0.1);
        }

        .result-item {
          padding: 0.65rem 1rem;
          cursor: pointer;
          font-size: 0.82rem;
          color: #374151;
          border-bottom: 1px solid #f3f0ea;
          transition: background 0.15s;
          line-height: 1.4;
        }
        .result-item:last-child { border-bottom: none; }
        .result-item:hover { background: #f0ede6; }
      `}</style>

      <div className="loc-root min-h-screen map-bg flex flex-col items-center justify-center px-5 py-12">

        {/* ── Top brand strip ── */}
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
            style={{ background: "#e08c2a" }}>
            🌿
          </div>
          <span className="font-playfair text-lg font-bold" style={{ color: "#1a3a2a" }}>AgroGuard AI</span>
        </div>

        {/* ── Main card ── */}
        <div className="slide-up w-full bg-white rounded-2xl overflow-hidden"
          style={{
            maxWidth: "480px",
            boxShadow: "0 8px 48px rgba(0,0,0,0.10), 0 2px 12px rgba(0,0,0,0.05)",
            border: "1px solid #e8e2d9",
          }}>

          {/* Card top bar */}
          <div className="px-8 pt-8 pb-6" style={{ borderBottom: "1px solid #f3f0ea" }}>
            <p className="text-xs font-medium tracking-widest uppercase mb-1" style={{ color: "#1e6b45" }}>
              Step 2 of 2
            </p>
            <h2 className="font-playfair font-bold" style={{ fontSize: "1.7rem", color: "#1a1a1a" }}>
              Set your farm location
            </h2>
            <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
              We use this to tailor weather, irrigation, and crop advice to your exact area.
            </p>
          </div>

          <div className="px-8 py-7">

            {/* ── DETECTING / GEOCODING state ── */}
            {isLoading && (
              <div className="flex flex-col items-center py-6 gap-5">
                <div className="pin-pulse">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center z-10 relative"
                    style={{ background: "#1e6b45", color: "white" }}>
                    <PinIcon />
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="spinner" />
                    <span className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>
                      {stage === "detecting" ? "Getting current location…" : "Resolving your address…"}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: "#9ca3af" }}>
                    {stage === "detecting"
                      ? "Please allow location access if prompted"
                      : "Almost there, hang tight"}
                  </p>
                </div>
              </div>
            )}

            {/* ── CONFIRMED state ── */}
            {stage === "confirmed" && address && (
              <div className="flex flex-col gap-5">
                <div className="rounded-xl p-4 flex items-start gap-4"
                  style={{ background: "#f4faf7", border: "1.5px solid #b6ddc9" }}>
                  <div className="pop-in w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "#1e6b45", color: "white" }}>
                    <CheckIcon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold mb-0.5" style={{ color: "#1e6b45" }}>
                      Location detected
                    </p>
                    <p className="text-sm font-semibold leading-snug" style={{ color: "#1a1a1a" }}>
                      {address.display}
                    </p>
                    {coords && (
                      <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>
                        {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Not your location? */}
                <button
                  type="button"
                  onClick={() => setStage("manual")}
                  className="flex items-center gap-1.5 text-xs font-semibold hover:underline"
                  style={{ color: "#e08c2a", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                >
                  <PinIcon /> Not your location? Search manually
                </button>

                {/* Proceed */}
                <button
                  type="button"
                  onClick={handleProceed}
                  disabled={saving}
                  className="w-full py-3.5 rounded-xl text-white text-sm font-semibold tracking-wide transition-opacity hover:opacity-90 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                  style={{ background: "#1e6b45", fontFamily: "'DM Sans', sans-serif", opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? (
                    <><span className="spinner" style={{ borderTopColor: "white", borderColor: "rgba(255,255,255,0.3)" }} /> Saving…</>
                  ) : (
                    "Proceed to Dashboard →"
                  )}
                </button>
              </div>
            )}

            {/* ── ERROR state ── */}
            {stage === "error" && (
              <div className="flex flex-col gap-5">
                <div className="rounded-xl p-4" style={{ background: "#fff8f3", border: "1.5px solid #f5c6a0" }}>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: "#b45309" }}>
                    Couldn't detect location
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: "#92400e" }}>
                    {errorMsg}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={detectLocation}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
                    style={{ background: "#f0ede6", color: "#1a1a1a", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                  >
                    <RefreshIcon /> Try again
                  </button>
                  <button
                    type="button"
                    onClick={() => setStage("manual")}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
                    style={{ background: "#1e6b45", color: "white", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Search manually
                  </button>
                </div>
              </div>
            )}

            {/* ── MANUAL SEARCH state ── */}
            {stage === "manual" && (
              <div className="flex flex-col gap-4">
                <p className="text-sm" style={{ color: "#6b7280" }}>
                  Type your village, town, LGA, or state below.
                </p>
                <form onSubmit={handleSearch} className="flex flex-col gap-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9ca3af" }}>
                      <SearchIcon />
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. Kaduna, Benue, Ogun…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="ag-search"
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={searching || !query.trim()}
                    className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
                    style={{
                      background: "#1e6b45", color: "white",
                      border: "none", cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      opacity: searching || !query.trim() ? 0.6 : 1,
                    }}
                  >
                    {searching ? <><span className="spinner" style={{ borderTopColor: "white", borderColor: "rgba(255,255,255,0.3)" }} /> Searching…</> : "Search"}
                  </button>
                </form>

                {/* Search results */}
                {searchResults.length > 0 && (
                  <div className="rounded-xl overflow-hidden" style={{ border: "1.5px solid #e0dbd0" }}>
                    {searchResults.map((r) => (
                      <div key={r.place_id} className="result-item" onClick={() => selectSearchResult(r)}>
                        <span className="font-semibold" style={{ color: "#1a1a1a" }}>
                          {r.display_name.split(",")[0]}
                        </span>
                        <br />
                        <span style={{ color: "#9ca3af" }}>
                          {r.display_name.split(",").slice(1, 4).join(",").trim()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Back to auto-detect */}
                <button
                  type="button"
                  onClick={detectLocation}
                  className="flex items-center gap-1.5 text-xs font-semibold hover:underline mt-1"
                  style={{ color: "#1e6b45", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                >
                  <RefreshIcon /> Use my current location instead
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom note */}
        <p className="text-xs mt-6 text-center" style={{ color: "#9ca3af", maxWidth: "360px" }}>
          📍 Your location is only used to personalise your farming advice. You can update it anytime from your dashboard.
        </p>
      </div>
    </>
  );
}