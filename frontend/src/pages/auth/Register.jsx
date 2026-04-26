import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI, saveTokens } from "../../services/api";

const features = [
  {
    icon: "🌤",
    title: "Location-Based Weather",
    desc: "Real-time forecasts tailored to your farm's coordinates",
  },
  {
    icon: "💧",
    title: "Smart Irrigation",
    desc: "Personalized watering schedules & water-saving advice",
  },
  {
    icon: "🛡",
    title: "Heat Stress Alerts",
    desc: "Protect your crops from extreme Nigerian weather",
  },
  {
    icon: "🌱",
    title: "Crop Recommendations",
    desc: "AI-powered planting advice for your region & season",
  },
];

function EyeIcon({ open }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {open ? (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      )}
    </svg>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "",
    phone: "", password: "", confirm: "", terms: false,
  });

  const set = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const data = await authAPI.register({
        first_name:      form.firstName,
        last_name:       form.lastName,
        email:           form.email,
        phone_number:    form.phone,
        password:        form.password,
        confirm_password: form.confirm,
      });

      // Save JWT tokens returned by the backend
      saveTokens(data.tokens);

      // Store user's first name for a personalized experience
      localStorage.setItem("first_name", data.user.first_name);

      // Send user to location setup next
      navigate("/location-setup");
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />
      <style>{`
        .register-root { font-family: 'DM Sans', sans-serif; }
        .font-playfair { font-family: 'Playfair Display', serif; }
        .farm-bg {
          background-image: url('/farm-bg.jpg');
          background-size: cover;
          background-position: center;
        }
        .panel-overlay {
          background: linear-gradient(
            160deg,
            rgba(20,50,30,0.90) 0%,
            rgba(30,107,69,0.74) 50%,
            rgba(22,80,45,0.93) 100%
          );
        }
        .ag-input {
          width: 100%;
          padding: 0.72rem 1rem;
          border-radius: 0.75rem;
          border: 1.5px solid #e0dbd0;
          background: #fdfcf9;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          color: #1a1a1a;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
          appearance: none;
        }
        .ag-input::placeholder { color: #c5bfb5; }
        .ag-input:focus {
          border-color: #1e6b45;
          box-shadow: 0 0 0 3px rgba(30,107,69,0.1);
        }
        .ag-input-pw { padding-right: 2.75rem; }
        .ag-input-error { border-color: #dc2626 !important; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.42s ease both; }
        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="register-root flex" style={{ minHeight: "100vh" }}>

        {/* ── LEFT PANEL ── */}
        <div className="hidden lg:flex flex-shrink-0 relative farm-bg" style={{ width: "51%", minHeight: "100vh" }}>
          <div className="panel-overlay absolute inset-0" />
          <div className="relative z-10 flex flex-col justify-between w-full p-12 xl:p-16" style={{ minHeight: "100vh" }}>

            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: "#e08c2a" }}>
                🌿
              </div>
              <div>
                <h1 className="font-playfair text-white text-xl font-bold leading-tight">AgroGuard AI</h1>
                <p className="text-white/60 text-xs tracking-wide" style={{ fontWeight: 300 }}>Climate-Smart Agriculture</p>
              </div>
            </div>

            {/* Hero Copy */}
            <div className="flex flex-col justify-center flex-1 py-12">
              <p className="text-white/50 text-xs font-medium tracking-widest uppercase mb-3">
                Built for Nigerian Farmers
              </p>
              <h2 className="font-playfair text-white font-bold leading-tight mb-4" style={{ fontSize: "3rem" }}>
                Grow Smarter,{" "}
                <span style={{ color: "#f5a623" }}>Farm Better</span>
              </h2>
              <p className="text-white/55 text-sm leading-relaxed mb-10" style={{ maxWidth: "360px" }}>
                Join thousands of Nigerian farmers using AI to beat climate change and boost yields.
              </p>

              <div className="flex flex-col gap-5">
                {features.map((f) => (
                  <div key={f.title} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0 mt-0.5"
                      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)" }}>
                      {f.icon}
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">{f.title}</p>
                      <p className="text-white/50 text-xs leading-snug mt-0.5">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-white/35 text-xs flex items-center gap-1.5">
              <span>🔒</span> Secured by AgroGuard AI Technology
            </p>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="flex-1 flex items-center justify-center px-8 py-12 sm:px-12" style={{ background: "#f9f6f0" }}>
          <div className="fade-up w-full" style={{ maxWidth: "460px" }}>

            <div className="mb-8">
              <h2 className="font-playfair font-bold mb-1" style={{ fontSize: "2rem", color: "#1a1a1a" }}>
                Create your account
              </h2>
              <p className="text-sm" style={{ color: "#1e6b45" }}>
                Join AgroGuard AI — it takes under 2 minutes
              </p>
            </div>

            {/* API Error banner */}
            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl text-sm font-medium"
                style={{ background: "#fff3f3", border: "1.5px solid #fca5a5", color: "#dc2626" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              {/* Name Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "#1a1a1a" }}>
                    First Name
                  </label>
                  <input type="text" placeholder="John" value={form.firstName}
                    onChange={set("firstName")} required className="ag-input" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "#1a1a1a" }}>
                    Last Name
                  </label>
                  <input type="text" placeholder="Doe" value={form.lastName}
                    onChange={set("lastName")} required className="ag-input" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "#1a1a1a" }}>
                  Email Address
                </label>
                <input type="email" placeholder="you@example.com" value={form.email}
                  onChange={set("email")} required className="ag-input" />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "#1a1a1a" }}>
                  Phone Number
                </label>
                <input type="tel" placeholder="+234 800 000 0000" value={form.phone}
                  onChange={set("phone")} required className="ag-input" />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "#1a1a1a" }}>
                  Password
                </label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} placeholder="Min. 8 characters"
                    value={form.password} onChange={set("password")} minLength={8} required
                    className="ag-input ag-input-pw" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "#9ca3af", background: "none", border: "none", cursor: "pointer", display: "flex" }}>
                    <EyeIcon open={showPw} />
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "#1a1a1a" }}>
                  Confirm Password
                </label>
                <div className="relative">
                  <input type={showConfirm ? "text" : "password"} placeholder="Repeat your password"
                    value={form.confirm} onChange={set("confirm")} minLength={8} required
                    className={`ag-input ag-input-pw ${form.confirm && form.confirm !== form.password ? "ag-input-error" : ""}`} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "#9ca3af", background: "none", border: "none", cursor: "pointer", display: "flex" }}>
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>
                {/* Inline mismatch hint */}
                {form.confirm && form.confirm !== form.password && (
                  <p className="text-xs mt-1" style={{ color: "#dc2626" }}>Passwords do not match</p>
                )}
              </div>

              {/* Terms */}
              <label className="flex items-start gap-2.5 cursor-pointer text-xs leading-relaxed" style={{ color: "#6b7280" }}>
                <input type="checkbox" checked={form.terms} onChange={set("terms")} required
                  className="mt-0.5 w-4 h-4 flex-shrink-0" style={{ accentColor: "#1e6b45" }} />
                <span>
                  By creating an account you agree to AgroGuard AI's{" "}
                  <button type="button" className="font-semibold hover:underline"
                    style={{ color: "#e08c2a", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem" }}>
                    Terms of Service
                  </button>{" "}and{" "}
                  <button type="button" className="font-semibold hover:underline"
                    style={{ color: "#e08c2a", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem" }}>
                    Privacy Policy
                  </button>.
                </span>
              </label>

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl text-white text-sm font-semibold tracking-wide transition-opacity hover:opacity-90 active:scale-[0.99] mt-1 cursor-pointer flex items-center justify-center gap-2"
                style={{ background: "#1e6b45", fontFamily: "'DM Sans', sans-serif", opacity: loading ? 0.75 : 1 }}>
                {loading ? <><span className="spinner" /> Creating account…</> : "Create Account"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ background: "#e0dbd0" }} />
              <span className="text-xs" style={{ color: "#6b7280" }}>or</span>
              <div className="flex-1 h-px" style={{ background: "#e0dbd0" }} />
            </div>

            <p className="text-center text-sm" style={{ color: "#6b7280" }}>
              Already have an account?{" "}
              <Link to="/login" className="font-semibold hover:underline" style={{ color: "#e08c2a" }}>
                Sign in
              </Link>
            </p>

            <div className="flex justify-center gap-5 mt-6 pt-5" style={{ borderTop: "1px solid #e0dbd0" }}>
              {[
                { icon: "🔒", label: "Secure Signup" },
                { icon: "🌿", label: "Free to Start" },
                { icon: "🌍", label: "Nigeria-Optimised" },
              ].map((t) => (
                <div key={t.label} className="flex items-center gap-1.5 text-xs" style={{ color: "#6b7280" }}>
                  <span>{t.icon}</span><span>{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}