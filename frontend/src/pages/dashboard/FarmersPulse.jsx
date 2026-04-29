import { useState, useEffect } from "react";

// ── Weather via Open-Meteo (free, no key) ─────────────
async function fetchWeather(lat, lng) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weathercode,windspeed_10m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=auto&forecast_days=7`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather fetch failed");
  return res.json();
}

function weatherLabel(code) {
  if (code === 0) return "Clear Sky";
  if (code <= 3) return "Partly Cloudy";
  if (code <= 9) return "Foggy";
  if (code <= 19) return "Drizzle";
  if (code <= 29) return "Rain";
  if (code <= 39) return "Snow";
  if (code <= 49) return "Sleet";
  if (code <= 59) return "Rain Showers";
  if (code <= 69) return "Heavy Rain";
  if (code <= 79) return "Snow Showers";
  if (code <= 84) return "Rain & Snow";
  if (code <= 99) return "Thunderstorm";
  return "Unknown";
}

function weatherEmoji(code) {
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 9) return "🌫️";
  if (code <= 29) return "🌧️";
  if (code <= 49) return "🌫️";
  if (code <= 69) return "🌧️";
  if (code <= 79) return "❄️";
  if (code <= 99) return "⛈️";
  return "🌡️";
}

function isHeatStress(temp) { return temp >= 35; }

// ── Icons ──────────────────────────────────────────────
function CalendarIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function BugIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2l1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6z"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 4-4"/><path d="M17.47 9c1.93-.2 3.53-1.9 3.53-4"/><path d="M18 13h4"/><path d="M21 21c0-2.1-1.7-3.9-4-4"/></svg>;
}
function DropIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>;
}
function SoilIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V12"/><path d="M5 3a7 7 0 0 0 7 7"/><path d="M19 3a7 7 0 0 1-7 7"/><path d="M5 3h14"/></svg>;
}
function CheckCircleIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
}
function MessageIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
}
function TrendUpIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
}
function WarnIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
}

// ── Skeleton loader ────────────────────────────────────
function Skeleton({ h = "1rem", w = "100%", radius = "8px" }) {
  return <div className="skeleton" style={{ height: h, width: w, borderRadius: radius }} />;
}

// ── Progress bar ───────────────────────────────────────
function ProgressBar({ label, value, color = "#1e6b45" }) {
  return (
    <div style={{ marginBottom: "0.6rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
        <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{label}</span>
        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#1a1a1a" }}>{value}%</span>
      </div>
      <div style={{ height: "6px", background: "#ede8df", borderRadius: "99px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: "99px", transition: "width 1s ease" }} />
      </div>
    </div>
  );
}

export default function FarmersPulse() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [taskDone, setTaskDone] = useState(false);

  const firstName = localStorage.getItem("first_name") || "Farmer";
  // Get saved coords from localStorage (set during LocationSetup)
  const lat = parseFloat(localStorage.getItem("farm_lat") || "9.0820");
  const lng = parseFloat(localStorage.getItem("farm_lng") || "8.6753");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await fetchWeather(lat, lng);
        if (!cancelled) setWeather(data);
      } catch {
        // fall through with null — show placeholder values
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [lat, lng]);

  const current  = weather?.current;
  const daily    = weather?.daily;
  const temp     = current ? Math.round(current.temperature_2m) : null;
  const humidity = current ? current.relative_humidity_2m : null;
  const wind     = current ? Math.round(current.windspeed_10m) : null;
  const wCode    = current?.weathercode ?? 0;
  const rainfall = daily ? daily.precipitation_sum.slice(0, 7).reduce((a, b) => a + b, 0).toFixed(1) : null;
  const heatAlert = temp !== null && isHeatStress(temp);

  // Simulated farm data (would come from backend later)
  const harvestDays = 47;
  const soilMoisture = 34;
  const pestRisk = "Medium";
  const growthScore = 82;

  const today = new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" });

  return (
    <>
      <style>{`
        .pulse-root {}
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .stagger-1 { animation: fadeInUp 0.4s ease 0.05s both; }
        .stagger-2 { animation: fadeInUp 0.4s ease 0.12s both; }
        .stagger-3 { animation: fadeInUp 0.4s ease 0.20s both; }
        .stagger-4 { animation: fadeInUp 0.4s ease 0.28s both; }
        .stagger-5 { animation: fadeInUp 0.4s ease 0.36s both; }

        .stat-card {
          background: white;
          border-radius: 16px;
          padding: 1.25rem 1.4rem;
          border: 1px solid #ede8df;
          transition: box-shadow 0.2s;
        }
        .stat-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.07); }

        .task-card {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid #ede8df;
          flex: 1;
        }
        .growth-card {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid #ede8df;
          min-width: 280px;
          max-width: 320px;
        }

        .alert-banner {
          border-radius: 16px;
          padding: 1.25rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .alert-heat {
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
        }
        .alert-good {
          background: linear-gradient(135deg, #bbf7d0, #86efac);
        }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 0.55rem 1.1rem;
          border-radius: 9px;
          background: #1e6b45;
          color: white;
          border: none;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: opacity 0.15s;
        }
        .btn-primary:hover { opacity: 0.88; }
        .btn-primary.done { background: #6b7280; }

        .btn-ghost {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 0.55rem 1rem;
          border-radius: 9px;
          background: none;
          color: #6b7280;
          border: 1.5px solid #ede8df;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: border-color 0.15s, color 0.15s;
        }
        .btn-ghost:hover { border-color: #1e6b45; color: #1e6b45; }

        .skeleton {
          background: linear-gradient(90deg, #ede8df 25%, #f5f2ec 50%, #ede8df 75%);
          background-size: 400px 100%;
          animation: shimmer 1.4s ease infinite;
          border-radius: 10px;
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }

        .weather-chip {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 0.3rem 0.75rem;
          border-radius: 99px;
          font-size: 0.75rem;
          font-weight: 600;
        }
      `}</style>

      <div className="pulse-root">
        {/* Page header */}
        <div className="stagger-1" style={{ marginBottom: "1.75rem" }}>
          <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "2px" }}>{today}</p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.9rem", fontWeight: 700, color: "#1a1a1a", marginBottom: "0.2rem" }}>
            Farmer's Pulse
          </h1>
          <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>Your daily field intelligence, {firstName}</p>
        </div>

        {/* ── HEAT / WEATHER ALERT BANNER ── */}
        <div className={`stagger-2 alert-banner ${heatAlert ? "alert-heat" : "alert-good"}`} style={{ marginBottom: "1.5rem" }}>
          <div style={{
            width: 44, height: 44, borderRadius: "12px",
            background: heatAlert ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.4rem", flexShrink: 0,
          }}>
            {loading ? "🌡️" : weatherEmoji(wCode)}
          </div>
          <div style={{ flex: 1 }}>
            {heatAlert && (
              <span style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", color: "rgba(0,0,0,0.5)", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>
                ⚠ Urgent
              </span>
            )}
            <p style={{ fontWeight: 700, fontSize: "1.05rem", color: heatAlert ? "#1a1a1a" : "#14532d", marginBottom: "2px" }}>
              {loading ? "Loading weather…" : heatAlert
                ? `Heat Wave Warning: ${temp}°C`
                : `${weatherLabel(wCode)} · ${temp}°C`}
            </p>
            <p style={{ fontSize: "0.82rem", color: heatAlert ? "rgba(0,0,0,0.6)" : "rgba(20,83,45,0.7)" }}>
              {loading
                ? "Fetching your local forecast…"
                : heatAlert
                  ? "Next 3 days. Water crops at dawn or dusk."
                  : `Humidity ${humidity}% · Wind ${wind} km/h · Good conditions today`}
            </p>
          </div>
          {heatAlert && !loading && (
            <button className="btn-ghost" style={{ background: "white", flexShrink: 0 }}>
              <MessageIcon /> Send to SMS
            </button>
          )}
        </div>

        {/* ── STAT CARDS ── */}
        <div className="stagger-3" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
          {/* Days to harvest */}
          <div className="stat-card">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.75rem" }}>
              <div style={{ width: 32, height: 32, borderRadius: "9px", background: "#f0faf5", display: "flex", alignItems: "center", justifyContent: "center", color: "#1e6b45" }}>
                <CalendarIcon />
              </div>
            </div>
            <p style={{ fontSize: "0.68rem", fontWeight: 600, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "4px" }}>Days to Harvest</p>
            <p style={{ fontSize: "1.7rem", fontWeight: 700, color: "#1a1a1a", lineHeight: 1 }}>{harvestDays} <span style={{ fontSize: "0.85rem", fontWeight: 400, color: "#6b7280" }}>days</span></p>
          </div>

          {/* Pest risk */}
          <div className="stat-card">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.75rem" }}>
              <div style={{ width: 32, height: 32, borderRadius: "9px", background: "#fef9ec", display: "flex", alignItems: "center", justifyContent: "center", color: "#d97706" }}>
                <BugIcon />
              </div>
            </div>
            <p style={{ fontSize: "0.68rem", fontWeight: 600, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "4px" }}>Pest Risk</p>
            <p style={{ fontSize: "1.7rem", fontWeight: 700, color: "#d97706", lineHeight: 1 }}>{pestRisk}</p>
          </div>

          {/* Rainfall */}
          <div className="stat-card">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.75rem" }}>
              <div style={{ width: 32, height: 32, borderRadius: "9px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6" }}>
                <DropIcon />
              </div>
            </div>
            <p style={{ fontSize: "0.68rem", fontWeight: 600, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "4px" }}>Rainfall (7d)</p>
            {loading
              ? <Skeleton h="1.8rem" w="60%" />
              : <p style={{ fontSize: "1.7rem", fontWeight: 700, color: "#1a1a1a", lineHeight: 1 }}>{rainfall} <span style={{ fontSize: "0.85rem", fontWeight: 400, color: "#6b7280" }}>mm</span></p>
            }
          </div>

          {/* Soil moisture */}
          <div className="stat-card">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.75rem" }}>
              <div style={{ width: 32, height: 32, borderRadius: "9px", background: "#fdf4ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#a855f7" }}>
                <SoilIcon />
              </div>
            </div>
            <p style={{ fontSize: "0.68rem", fontWeight: 600, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "4px" }}>Soil Moisture</p>
            <p style={{ fontSize: "1.7rem", fontWeight: 700, color: "#1a1a1a", lineHeight: 1 }}>{soilMoisture}<span style={{ fontSize: "0.85rem", fontWeight: 400, color: "#6b7280" }}>%</span></p>
          </div>
        </div>

        {/* ── 7-DAY FORECAST STRIP ── */}
        {!loading && daily && (
          <div className="stagger-4" style={{ background: "white", borderRadius: "16px", border: "1px solid #ede8df", padding: "1.25rem 1.5rem", marginBottom: "1.5rem" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.85rem" }}>7-Day Forecast</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.5rem" }}>
              {daily.time.slice(0, 7).map((day, i) => {
                const d = new Date(day);
                const label = i === 0 ? "Today" : d.toLocaleDateString("en", { weekday: "short" });
                return (
                  <div key={day} style={{
                    textAlign: "center", padding: "0.6rem 0.25rem",
                    borderRadius: "10px",
                    background: i === 0 ? "#f0faf5" : "transparent",
                    border: i === 0 ? "1px solid #b6ddc9" : "1px solid transparent",
                  }}>
                    <p style={{ fontSize: "0.7rem", color: i === 0 ? "#1e6b45" : "#9ca3af", fontWeight: 600, marginBottom: "4px" }}>{label}</p>
                    <p style={{ fontSize: "1.1rem", marginBottom: "4px" }}>{weatherEmoji(daily.weathercode[i])}</p>
                    <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1a1a1a" }}>{Math.round(daily.temperature_2m_max[i])}°</p>
                    <p style={{ fontSize: "0.68rem", color: "#9ca3af" }}>{Math.round(daily.temperature_2m_min[i])}°</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TODAY'S TASK + GROWTH SCORE ── */}
        <div className="stagger-5" style={{ display: "flex", gap: "1rem", alignItems: "stretch" }}>
          {/* Today's task */}
          <div className="task-card">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.5rem" }}>
              <div style={{ width: 30, height: 30, borderRadius: "8px", background: "#f0faf5", display: "flex", alignItems: "center", justifyContent: "center", color: "#1e6b45", fontSize: "1rem" }}>
                🌱
              </div>
              <div>
                <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1a1a1a" }}>Today's Task</p>
                <p style={{ fontSize: "0.72rem", color: "#9ca3af" }}>AI recommended for your farm</p>
              </div>
            </div>

            <div style={{ margin: "1rem 0", padding: "0.85rem 1rem", background: "#f9f6f0", borderRadius: "10px", borderLeft: "3px solid #1e6b45" }}>
              <p style={{ fontSize: "0.88rem", color: "#1a1a1a", lineHeight: 1.5 }}>
                💧 Soil moisture is low. Apply mulching today to retain water around your crop roots.
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.6rem" }}>
              <button
                className={`btn-primary ${taskDone ? "done" : ""}`}
                onClick={() => setTaskDone(true)}
              >
                <CheckCircleIcon />
                {taskDone ? "Done ✓" : "Mark as Done"}
              </button>
              <button className="btn-ghost">
                <MessageIcon /> Send to SMS
              </button>
            </div>
          </div>

          {/* Growth score */}
          <div className="growth-card">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem" }}>
              <div style={{ width: 30, height: 30, borderRadius: "8px", background: "#f0faf5", display: "flex", alignItems: "center", justifyContent: "center", color: "#1e6b45" }}>
                <TrendUpIcon />
              </div>
              <div>
                <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1a1a1a" }}>Growth Score</p>
                <p style={{ fontSize: "0.72rem", color: "#9ca3af" }}>This week</p>
              </div>
            </div>

            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "3rem", fontWeight: 700, color: "#1a1a1a", lineHeight: 1, marginBottom: "2px" }}>
              {growthScore}<span style={{ fontSize: "1rem", color: "#9ca3af", fontFamily: "'DM Sans', sans-serif", fontWeight: 400 }}>/100</span>
            </p>
            <p style={{ fontSize: "0.78rem", color: "#1e6b45", fontWeight: 600, marginBottom: "1.25rem" }}>
              Vegetative stage · on track
            </p>

            <ProgressBar label="Leaf health"   value={90} color="#1e6b45" />
            <ProgressBar label="Soil quality"  value={78} color="#1e6b45" />
            <ProgressBar label="Pest control"  value={72} color="#d97706" />
          </div>
        </div>
      </div>
    </>
  );
}