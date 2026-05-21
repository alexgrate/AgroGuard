import { useState } from "react";

// ── Crop data ──────────────────────────────────────────
const CROPS = [
  { id: "maize",   label: "Maize",   emoji: "🌽", daysToHarvest: 90  },
  { id: "cassava", label: "Cassava", emoji: "🥔", daysToHarvest: 270 },
  { id: "yam",     label: "Yam",     emoji: "🍠", daysToHarvest: 210 },
  { id: "rice",    label: "Rice",    emoji: "🌾", daysToHarvest: 120 },
  { id: "tomato",  label: "Tomato",  emoji: "🍅", daysToHarvest: 75  },
  { id: "pepper",  label: "Pepper",  emoji: "🌶️", daysToHarvest: 80  },
  { id: "soybean", label: "Soybean", emoji: "🫘", daysToHarvest: 100 },
  { id: "cowpea",  label: "Cowpea",  emoji: "🫛", daysToHarvest: 85  },
];

const GROWTH_STAGES = ["Seedling", "Vegetative", "Flowering", "Maturity"];

const SOIL_TYPES = ["Loamy", "Sandy", "Clay", "Silty", "Peaty", "Chalky"];
const IRRIGATION  = ["Rain-fed", "Drip Irrigation", "Sprinkler", "Flood / Basin", "Manual Watering"];

const PESTS_BY_CROP = {
  maize:   ["Fall Armyworm", "Stem Borer", "Maize Weevil"],
  cassava: ["Cassava Mealybug", "Whitefly", "Green Spider Mite"],
  yam:     ["Yam Beetle", "Yam Moth", "Nematodes"],
  rice:    ["Rice Blast", "Brown Planthopper", "Stem Borer"],
  tomato:  ["Tomato Leafminer", "Aphids", "Whitefly"],
  pepper:  ["Thrips", "Aphids", "Mites"],
  soybean: ["Soybean Aphid", "Bean Pod Borer", "Stink Bug"],
  cowpea:  ["Cowpea Weevil", "Aphids", "Bean Fly"],
};

// ── Helpers ────────────────────────────────────────────
function calcHarvestDays(crop, plantedDate, growthStage) {
  if (!crop) return 47;
  const base = crop.daysToHarvest;
  const stageBonus = { Seedling: 0, Vegetative: -20, Flowering: -45, Maturity: -70 };
  const bonus = stageBonus[growthStage] || 0;
  if (plantedDate) {
    const planted = new Date(plantedDate);
    const today   = new Date();
    const elapsed = Math.floor((today - planted) / (1000 * 60 * 60 * 24));
    return Math.max(0, base - elapsed);
  }
  return Math.max(0, base + bonus);
}

function calcPestRisk(pests, soil) {
  if (pests.length === 0) return "Low";
  if (pests.length === 1) return soil === "Sandy" ? "Medium" : "Low";
  if (pests.length === 2) return "Medium";
  return "High";
}

function calcYield(soil, irrigation, pests) {
  let score = 100;
  if (soil === "Sandy") score -= 15;
  if (soil === "Clay")  score -= 10;
  if (irrigation === "Rain-fed") score -= 10;
  score -= pests.length * 12;
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Poor";
}

// ── Icons ──────────────────────────────────────────────
function ArrowLeft()  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>; }
function ArrowRight() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>; }
function CheckIcon()  { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>; }
function SparkleIcon(){ return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z"/></svg>; }
function PlusIcon()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }

// ── Step header icons (emoji circles) ─────────────────
const STEP_META = [
  { icon: "🌾", title: "What crop are you growing?",      sub: "Pick the crop you want to track"   },
  { icon: "📅", title: "Timeline",                         sub: "When and where in the cycle?"      },
  { icon: "🏔️", title: "Environment",                      sub: "The land and water"                },
  { icon: "🐛", title: "Have you seen any of these pests?", sub: ""                                 },
];

// ── Empty form state ────────────────────────────────────
const emptyForm = () => ({
  crop:        null,
  plantedDate: "",
  growthStage: "Seedling",
  soilType:    "Loamy",
  irrigation:  "Rain-fed",
  pests:       [],
});

// ── Single crop result card ─────────────────────────────
function ResultCard({ entry, onAddAnother }) {
  const crop       = CROPS.find(c => c.id === entry.crop);
  const days       = calcHarvestDays(crop, entry.plantedDate, entry.growthStage);
  const pestRisk   = calcPestRisk(entry.pests, entry.soilType);
  const yieldFcast = calcYield(entry.soilType, entry.irrigation, entry.pests);

  const riskColor  = { Low: "#16a34a", Medium: "#d97706", High: "#dc2626" };
  const yieldColor = { Excellent: "#16a34a", Good: "#1e6b45", Fair: "#d97706", Poor: "#dc2626" };

  return (
    <div className="result-card slide-up">
      {/* Check */}
      <div className="result-check-wrap">
        <div className="result-check"><CheckIcon /></div>
      </div>

      <h2 className="result-title">Your Field Plan is Ready!</h2>
      <p className="result-sub">
        AgroGuard AI has analysed your {crop?.emoji} <strong>{crop?.label}</strong> field. Here's what we found.
      </p>

      {/* 3 stat tiles */}
      <div className="result-tiles">
        <div className="result-tile">
          <span className="tile-icon">📅</span>
          <p className="tile-label">DAYS TO HARVEST</p>
          <p className="tile-value">{days}</p>
        </div>
        <div className="result-tile">
          <span className="tile-icon">🐛</span>
          <p className="tile-label">PEST RISK</p>
          <p className="tile-value" style={{ color: riskColor[pestRisk] }}>{pestRisk}</p>
        </div>
        <div className="result-tile">
          <span className="tile-icon">📈</span>
          <p className="tile-label">YIELD FORECAST</p>
          <p className="tile-value" style={{ color: yieldColor[yieldFcast] }}>{yieldFcast}</p>
        </div>
      </div>

      {/* Advice blurb */}
      <div className="result-advice">
        <p>
          {entry.pests.length > 0
            ? `⚠️ Watch out for ${entry.pests.join(", ")}. Consider applying neem-based pesticide and monitoring weekly.`
            : `✅ No pest pressure reported. Maintain your ${entry.irrigation.toLowerCase()} schedule and monitor weekly.`}
          {" "}Your <strong>{entry.soilType}</strong> soil with <strong>{entry.irrigation}</strong> irrigation
          gives a <strong>{yieldFcast.toLowerCase()}</strong> yield outlook.
        </p>
      </div>

      <button className="btn-add-crop" onClick={onAddAnother}>
        <PlusIcon /> Add another crop
      </button>
    </div>
  );
}

// ── Main component ──────────────────────────────────────
export default function CropIntelligence() {
  const [step,       setStep]       = useState(1);   // 1-4 = form, 5 = result
  const [form,       setForm]       = useState(emptyForm());
  const [predicting, setPredicting] = useState(false);
  const [results,    setResults]    = useState([]);   // array of completed entries
  const [showResult, setShowResult] = useState(false);

  const cropObj = CROPS.find(c => c.id === form.crop);
  const pests   = PESTS_BY_CROP[form.crop] || [];

  function togglePest(pest) {
    setForm(f => ({
      ...f,
      pests: f.pests.includes(pest) ? f.pests.filter(p => p !== pest) : [...f.pests, pest],
    }));
  }

  function canNext() {
    if (step === 1) return !!form.crop;
    if (step === 2) return true; // date optional
    if (step === 3) return true;
    return true;
  }

  async function handleNext() {
    if (step < 4) { setStep(s => s + 1); return; }
    // Step 4 → AI prediction
    setPredicting(true);
    await new Promise(r => setTimeout(r, 2200)); // simulate AI thinking
    setResults(prev => [...prev, { ...form }]);
    setShowResult(true);
    setPredicting(false);
  }

  function handleAddAnother() {
    setForm(emptyForm());
    setStep(1);
    setShowResult(false);
  }

  // ── RESULT SCREEN ──
  if (showResult) {
    const latest = results[results.length - 1];
    return (
      <>
        {sharedStyles}
        <div className="ci-root">
          <div className="ci-header">
            <h1 className="ci-title">Digital Field</h1>
            <p className="ci-subtitle">Tell us about your crop</p>
          </div>

          {/* Previous crops summary bar */}
          {results.length > 1 && (
            <div className="crops-bar">
              {results.slice(0, -1).map((r, i) => {
                const c = CROPS.find(x => x.id === r.crop);
                return (
                  <div key={i} className="crop-chip">
                    {c?.emoji} {c?.label}
                    <span className="chip-days">{calcHarvestDays(c, r.plantedDate, r.growthStage)}d</span>
                  </div>
                );
              })}
            </div>
          )}

          <ResultCard entry={latest} onAddAnother={handleAddAnother} />
        </div>
      </>
    );
  }

  // ── PREDICTING SCREEN ──
  if (predicting) {
    return (
      <>
        {sharedStyles}
        <div className="ci-root">
          <div className="ci-header">
            <h1 className="ci-title">Digital Field</h1>
            <p className="ci-subtitle">Tell us about your crop</p>
          </div>
          <div className="predicting-card slide-up">
            <div className="pred-orb">
              <div className="pred-ring" />
              <div className="pred-ring pred-ring-2" />
              <span className="pred-emoji">{cropObj?.emoji || "🌱"}</span>
            </div>
            <h3 className="pred-title">Analysing your {cropObj?.label} field…</h3>
            <p className="pred-sub">AgroGuard AI is calculating harvest timing, pest risk, and yield forecast</p>
            <div className="pred-steps">
              {["Reading soil conditions", "Checking pest pressure", "Forecasting yield", "Building your plan"].map((s, i) => (
                <div key={s} className="pred-step" style={{ animationDelay: `${i * 0.5}s` }}>
                  <span className="pred-dot" />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  const meta = STEP_META[step - 1];

  return (
    <>
      {sharedStyles}
      <div className="ci-root">

        {/* Page title */}
        <div className="ci-header">
          <h1 className="ci-title">Digital Field</h1>
          <p className="ci-subtitle">Tell us about your crop</p>
        </div>

        {/* Progress bar */}
        <div className="progress-bar-track">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`progress-segment ${s <= step ? "filled" : ""}`} />
          ))}
        </div>
        <p className="step-label">Step {step} of 4</p>

        {/* Previous crops summary bar */}
        {results.length > 0 && (
          <div className="crops-bar">
            {results.map((r, i) => {
              const c = CROPS.find(x => x.id === r.crop);
              return (
                <div key={i} className="crop-chip">
                  {c?.emoji} {c?.label}
                  <span className="chip-days">{calcHarvestDays(c, r.plantedDate, r.growthStage)}d</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Form card */}
        <div className="form-card slide-up" key={step}>

          {/* Step header */}
          <div className="step-header">
            <div className="step-icon-circle">{meta.icon}</div>
            <div>
              <p className="step-title">{meta.title}</p>
              {meta.sub && <p className="step-sub">{meta.sub}</p>}
              {step === 4 && cropObj && (
                <p className="step-sub">Tailored to your {cropObj.emoji} {cropObj.label}</p>
              )}
            </div>
          </div>

          <div className="step-divider" />

          {/* ── STEP 1: Crop selection ── */}
          {step === 1 && (
            <div className="crop-grid">
              {CROPS.map(c => (
                <button
                  key={c.id}
                  className={`crop-btn ${form.crop === c.id ? "selected" : ""}`}
                  onClick={() => setForm(f => ({ ...f, crop: c.id, pests: [] }))}
                >
                  <span className="crop-emoji">{c.emoji}</span>
                  <span className="crop-label">{c.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* ── STEP 2: Timeline ── */}
          {step === 2 && (
            <div className="step-body">
              <label className="field-label">
                <span className="label-icon">📅</span> Date planted
              </label>
              <input
                type="date"
                className="field-input"
                value={form.plantedDate}
                onChange={e => setForm(f => ({ ...f, plantedDate: e.target.value }))}
                max={new Date().toISOString().split("T")[0]}
              />

              <label className="field-label" style={{ marginTop: "1.25rem" }}>
                <span className="label-icon">🌱</span> Current growth stage
              </label>
              <div className="stage-grid">
                {GROWTH_STAGES.map(s => (
                  <button
                    key={s}
                    className={`stage-btn ${form.growthStage === s ? "selected" : ""}`}
                    onClick={() => setForm(f => ({ ...f, growthStage: s }))}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 3: Environment ── */}
          {step === 3 && (
            <div className="step-body">
              <div className="env-row">
                <div className="env-col">
                  <label className="field-label">
                    <span className="label-icon">⛰️</span> Soil type
                  </label>
                  <div className="select-wrap">
                    <select
                      className="field-select"
                      value={form.soilType}
                      onChange={e => setForm(f => ({ ...f, soilType: e.target.value }))}
                    >
                      {SOIL_TYPES.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <span className="select-arrow">▾</span>
                  </div>
                </div>
                <div className="env-col">
                  <label className="field-label">
                    <span className="label-icon">💧</span> Irrigation method
                  </label>
                  <div className="select-wrap">
                    <select
                      className="field-select"
                      value={form.irrigation}
                      onChange={e => setForm(f => ({ ...f, irrigation: e.target.value }))}
                    >
                      {IRRIGATION.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <span className="select-arrow">▾</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 4: Pests ── */}
          {step === 4 && (
            <div className="step-body">
              <div className="pest-list">
                {pests.map(pest => (
                  <label key={pest} className={`pest-item ${form.pests.includes(pest) ? "selected" : ""}`}>
                    <span className="pest-radio">
                      <input
                        type="checkbox"
                        checked={form.pests.includes(pest)}
                        onChange={() => togglePest(pest)}
                        style={{ display: "none" }}
                      />
                      <span className={`radio-circle ${form.pests.includes(pest) ? "checked" : ""}`} />
                    </span>
                    <span className="pest-emoji">🐛</span>
                    <span className="pest-label">{pest}</span>
                  </label>
                ))}
                {pests.length === 0 && (
                  <p style={{ color: "#9ca3af", fontSize: "0.85rem" }}>No known pests for this crop.</p>
                )}
              </div>
            </div>
          )}

          <div className="step-divider" style={{ marginTop: "auto" }} />

          {/* Navigation */}
          <div className="step-nav">
            <button
              className="btn-back"
              onClick={() => step > 1 ? setStep(s => s - 1) : null}
              disabled={step === 1}
            >
              <ArrowLeft /> Back
            </button>

            <button
              className={`btn-next ${step === 4 ? "btn-predict" : ""}`}
              onClick={handleNext}
              disabled={!canNext()}
            >
              {step === 4 ? (
                <><SparkleIcon /> ✨ Get My Plan</>
              ) : (
                <>Next <ArrowRight /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Shared styles ──────────────────────────────────────
const sharedStyles = (
  <style>{`
    .ci-root {
      font-family: 'DM Sans', sans-serif;
      max-width: 780px;
    }

    .ci-header { margin-bottom: 1.25rem; }
    .ci-title {
      font-family: 'Playfair Display', serif;
      font-size: 1.9rem;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 0.15rem;
    }
    .ci-subtitle { font-size: 0.85rem; color: #6b7280; }

    /* Progress */
    .progress-bar-track {
      display: flex;
      gap: 6px;
      margin-bottom: 0.5rem;
    }
    .progress-segment {
      flex: 1;
      height: 5px;
      border-radius: 99px;
      background: #e5e7eb;
      transition: background 0.35s ease;
    }
    .progress-segment.filled { background: #1e6b45; }
    .step-label { font-size: 0.78rem; color: #6b7280; margin-bottom: 1.25rem; }

    /* Crops already added bar */
    .crops-bar {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }
    .crop-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 0.3rem 0.75rem;
      border-radius: 99px;
      background: #f0faf5;
      border: 1px solid #b6ddc9;
      font-size: 0.78rem;
      font-weight: 600;
      color: #1e6b45;
    }
    .chip-days {
      background: #1e6b45;
      color: white;
      border-radius: 99px;
      padding: 1px 7px;
      font-size: 0.7rem;
    }

    /* Form card */
    .form-card {
      background: white;
      border-radius: 18px;
      border: 1px solid #e5e7eb;
      padding: 1.75rem;
      display: flex;
      flex-direction: column;
      gap: 0;
      box-shadow: 0 2px 16px rgba(0,0,0,0.05);
      min-height: 340px;
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateX(18px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    .slide-up { animation: slideIn 0.3s ease both; }

    /* Step header */
    .step-header {
      display: flex;
      align-items: flex-start;
      gap: 0.85rem;
      margin-bottom: 1.1rem;
    }
    .step-icon-circle {
      width: 44px; height: 44px;
      background: #f0faf5;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.25rem;
      flex-shrink: 0;
      border: 1px solid #d1fae5;
    }
    .step-title { font-size: 0.95rem; font-weight: 700; color: #1a1a1a; margin-bottom: 2px; }
    .step-sub   { font-size: 0.78rem; color: #6b7280; }

    .step-divider { height: 1px; background: #f3f4f6; margin: 1rem 0; }

    /* ── Step 1: Crop grid ── */
    .crop-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.65rem;
      margin-bottom: 0.5rem;
    }
    .crop-btn {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      border: 1.5px solid #e5e7eb;
      background: white;
      cursor: pointer;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.9rem;
      font-weight: 500;
      color: #374151;
      transition: border-color 0.15s, background 0.15s, transform 0.1s;
      text-align: left;
    }
    .crop-btn:hover { border-color: #1e6b45; background: #f9fffe; }
    .crop-btn.selected {
      border-color: #1e6b45;
      background: #f0faf5;
      color: #1e6b45;
      font-weight: 600;
    }
    .crop-btn:active { transform: scale(0.98); }
    .crop-emoji { font-size: 1.15rem; }
    .crop-label { font-size: 0.88rem; }

    /* ── Step 2: Timeline ── */
    .step-body { display: flex; flex-direction: column; gap: 0.5rem; flex: 1; }
    .field-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.82rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.45rem;
    }
    .label-icon { font-size: 0.9rem; }
    .field-input {
      width: 100%;
      padding: 0.72rem 1rem;
      border-radius: 10px;
      border: 1.5px solid #e5e7eb;
      background: #fdfcf9;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.875rem;
      color: #1a1a1a;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      box-sizing: border-box;
    }
    .field-input:focus {
      border-color: #1e6b45;
      box-shadow: 0 0 0 3px rgba(30,107,69,0.1);
    }

    .stage-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.5rem;
    }
    .stage-btn {
      padding: 0.6rem 0.5rem;
      border-radius: 10px;
      border: 1.5px solid #e5e7eb;
      background: white;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.8rem;
      font-weight: 500;
      color: #374151;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
      text-align: center;
    }
    .stage-btn:hover { border-color: #1e6b45; background: #f9fffe; }
    .stage-btn.selected {
      background: #1e6b45;
      color: white;
      border-color: #1e6b45;
      font-weight: 600;
    }

    /* ── Step 3: Environment ── */
    .env-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .env-col  { display: flex; flex-direction: column; }

    .select-wrap { position: relative; }
    .field-select {
      width: 100%;
      padding: 0.72rem 2.25rem 0.72rem 1rem;
      border-radius: 10px;
      border: 1.5px solid #e5e7eb;
      background: #fdfcf9;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.875rem;
      color: #1a1a1a;
      outline: none;
      appearance: none;
      cursor: pointer;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .field-select:focus {
      border-color: #1e6b45;
      box-shadow: 0 0 0 3px rgba(30,107,69,0.1);
    }
    .select-arrow {
      position: absolute;
      right: 0.85rem;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      color: #9ca3af;
      font-size: 0.75rem;
    }

    /* ── Step 4: Pests ── */
    .pest-list { display: flex; flex-direction: column; gap: 0.6rem; flex: 1; }
    .pest-item {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.85rem 1rem;
      border-radius: 12px;
      border: 1.5px solid #e5e7eb;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
      user-select: none;
    }
    .pest-item:hover { border-color: #1e6b45; background: #f9fffe; }
    .pest-item.selected { border-color: #1e6b45; background: #f0faf5; }

    .radio-circle {
      width: 18px; height: 18px;
      border-radius: 50%;
      border: 2px solid #d1d5db;
      display: flex; align-items: center; justify-content: center;
      transition: border-color 0.15s, background 0.15s;
      flex-shrink: 0;
    }
    .radio-circle.checked {
      border-color: #1e6b45;
      background: #1e6b45;
    }
    .radio-circle.checked::after {
      content: '';
      width: 7px; height: 7px;
      border-radius: 50%;
      background: white;
    }
    .pest-emoji { font-size: 1.1rem; }
    .pest-label { font-size: 0.88rem; font-weight: 500; color: #374151; }
    .pest-item.selected .pest-label { color: #1e6b45; font-weight: 600; }

    /* Nav buttons */
    .step-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 0.5rem;
    }
    .btn-back {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 0.6rem 1.1rem;
      border-radius: 10px;
      border: 1.5px solid #e5e7eb;
      background: white;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.83rem;
      font-weight: 600;
      color: #374151;
      cursor: pointer;
      transition: border-color 0.15s;
    }
    .btn-back:hover:not(:disabled) { border-color: #1e6b45; color: #1e6b45; }
    .btn-back:disabled { opacity: 0.4; cursor: not-allowed; }

    .btn-next {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 0.65rem 1.4rem;
      border-radius: 10px;
      border: none;
      background: #1e6b45;
      color: white;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.15s, transform 0.1s;
    }
    .btn-next:hover:not(:disabled) { opacity: 0.88; }
    .btn-next:active { transform: scale(0.98); }
    .btn-next:disabled { opacity: 0.45; cursor: not-allowed; }
    .btn-predict { background: linear-gradient(135deg, #1e6b45, #2d8a5e); padding: 0.7rem 1.5rem; }

    /* ── Predicting screen ── */
    .predicting-card {
      background: white;
      border-radius: 18px;
      border: 1px solid #e5e7eb;
      padding: 3rem 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      text-align: center;
      box-shadow: 0 2px 16px rgba(0,0,0,0.05);
    }
    .pred-orb {
      position: relative;
      width: 80px; height: 80px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 0.5rem;
    }
    .pred-ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 3px solid transparent;
      border-top-color: #1e6b45;
      border-right-color: #e08c2a;
      animation: spin 1.1s linear infinite;
    }
    .pred-ring-2 {
      inset: 10px;
      border-top-color: #e08c2a;
      border-right-color: #1e6b45;
      animation-duration: 0.8s;
      animation-direction: reverse;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .pred-emoji { font-size: 1.8rem; z-index: 2; }
    .pred-title { font-family: 'Playfair Display', serif; font-size: 1.3rem; font-weight: 700; color: #1a1a1a; }
    .pred-sub   { font-size: 0.82rem; color: #6b7280; max-width: 340px; }
    .pred-steps { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem; }
    .pred-step {
      display: flex; align-items: center; gap: 0.6rem;
      font-size: 0.8rem; color: #6b7280;
      animation: fadeStep 0.5s ease both;
    }
    @keyframes fadeStep {
      from { opacity: 0; transform: translateX(-10px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    .pred-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: #1e6b45;
      animation: blink 1s ease infinite;
    }
    @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

    /* ── Result card ── */
    .result-card {
      background: white;
      border-radius: 18px;
      border: 1px solid #e5e7eb;
      padding: 2.5rem 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      text-align: center;
      box-shadow: 0 2px 16px rgba(0,0,0,0.05);
    }
    .result-check-wrap {
      width: 56px; height: 56px;
      border-radius: 50%;
      background: #f0faf5;
      border: 2px solid #b6ddc9;
      display: flex; align-items: center; justify-content: center;
      color: #1e6b45;
      margin-bottom: 0.25rem;
    }
    .result-title {
      font-family: 'Playfair Display', serif;
      font-size: 1.6rem;
      font-weight: 700;
      color: #1a1a1a;
    }
    .result-sub { font-size: 0.85rem; color: #6b7280; max-width: 360px; }

    .result-tiles {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.85rem;
      width: 100%;
      margin: 0.5rem 0;
    }
    .result-tile {
      background: #f9f6f0;
      border-radius: 14px;
      padding: 1.1rem 0.75rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
    }
    .tile-icon  { font-size: 1.5rem; }
    .tile-label { font-size: 0.65rem; font-weight: 700; color: #9ca3af; letter-spacing: 0.08em; text-transform: uppercase; }
    .tile-value { font-size: 1.4rem; font-weight: 800; color: #1a1a1a; font-family: 'Playfair Display', serif; }

    .result-advice {
      background: #f9f6f0;
      border-radius: 12px;
      padding: 1rem 1.25rem;
      font-size: 0.83rem;
      color: #374151;
      line-height: 1.6;
      text-align: left;
      width: 100%;
      max-width: 500px;
    }

    .btn-add-crop {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 0.65rem 1.5rem;
      border-radius: 99px;
      border: 1.5px solid #e5e7eb;
      background: white;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.85rem;
      font-weight: 600;
      color: #374151;
      cursor: pointer;
      margin-top: 0.5rem;
      transition: border-color 0.15s, background 0.15s;
    }
    .btn-add-crop:hover { border-color: #1e6b45; background: #f0faf5; color: #1e6b45; }
  `}</style>
);