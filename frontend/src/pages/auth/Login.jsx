import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI, saveTokens } from "../../services/api";

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

export default function Login() {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await authAPI.login({ email, password });

      // Save JWT tokens
      saveTokens(data.tokens);

      // Go straight to dashboard on login (location already set from registration)
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
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
        .login-root { font-family: 'DM Sans', sans-serif; }
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
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          border: 1.5px solid #e0dbd0;
          background: #fdfcf9;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          color: #1a1a1a;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }
        .ag-input::placeholder { color: #c5bfb5; }
        .ag-input:focus {
          border-color: #1e6b45;
          box-shadow: 0 0 0 3px rgba(30,107,69,0.1);
        }
        .ag-input-pw { padding-right: 2.75rem; }
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

      <div className="login-root flex" style={{ minHeight: "100vh" }}>

        {/* ── LEFT PANEL ── */}
        <div className="hidden lg:flex flex-shrink-0 relative farm-bg" style={{ width: "55%", minHeight: "100vh" }}>
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
              <h2 className="font-playfair text-white font-bold leading-tight mb-6" style={{ fontSize: "3rem" }}>
                Welcome Back,{" "}
                <span style={{ color: "#f5a623" }}>Smart Farmer</span>
              </h2>

              <p className="text-white/70 text-base leading-relaxed mb-8" style={{ maxWidth: "380px" }}>
                Every great harvest starts with the right information. Your fields are waiting — let's make today count.
              </p>

              <div className="flex flex-col gap-4" style={{ maxWidth: "360px" }}>
                {[
                  { value: "12,000+", label: "Nigerian farmers trust AgroGuard AI" },
                  { value: "30%",     label: "Average yield increase reported by users" },
                  { value: "24 / 7",  label: "Real-time alerts and personalized advice" },
                ].map((s) => (
                  <div key={s.value} className="flex items-center gap-4 rounded-xl px-4 py-3"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>
                    <span className="font-playfair font-bold text-xl flex-shrink-0" style={{ color: "#f5a623" }}>
                      {s.value}
                    </span>
                    <span className="text-white/60 text-xs leading-snug">{s.label}</span>
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
                Sign in to your account
              </h2>
              <p className="text-sm" style={{ color: "#1e6b45" }}>
                Access your personalized farming dashboard
              </p>
            </div>

            {/* API Error banner */}
            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl text-sm font-medium"
                style={{ background: "#fff3f3", border: "1.5px solid #fca5a5", color: "#dc2626" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "#1a1a1a" }}>
                  Email Address
                </label>
                <input type="email" placeholder="you@example.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} required className="ag-input" />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "#1a1a1a" }}>
                  Password
                </label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} placeholder="Enter your password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    required className="ag-input ag-input-pw" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "#9ca3af", background: "none", border: "none", cursor: "pointer", display: "flex" }}>
                    <EyeIcon open={showPw} />
                  </button>
                </div>
              </div>

              {/* Remember / Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: "#6b7280" }}>
                  <input type="checkbox" checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded" style={{ accentColor: "#1e6b45" }} />
                  Remember me
                </label>
                <button type="button" className="text-sm font-semibold hover:underline"
                  style={{ color: "#e08c2a", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  Forgot password?
                </button>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl text-white text-sm font-semibold tracking-wide transition-opacity hover:opacity-90 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                style={{ background: "#1e6b45", fontFamily: "'DM Sans', sans-serif", opacity: loading ? 0.75 : 1 }}>
                {loading ? <><span className="spinner" /> Signing in…</> : "Sign In"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ background: "#e0dbd0" }} />
              <span className="text-xs" style={{ color: "#6b7280" }}>or</span>
              <div className="flex-1 h-px" style={{ background: "#e0dbd0" }} />
            </div>

            <p className="text-center text-sm" style={{ color: "#6b7280" }}>
              New to AgroGuard AI?{" "}
              <Link to="/register" className="font-semibold hover:underline" style={{ color: "#e08c2a" }}>
                Create an account
              </Link>
            </p>

            <div className="flex justify-center gap-5 mt-6 pt-5" style={{ borderTop: "1px solid #e0dbd0" }}>
              {[
                { icon: "🔒", label: "Secure Login" },
                { icon: "📡", label: "Real-time Data" },
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