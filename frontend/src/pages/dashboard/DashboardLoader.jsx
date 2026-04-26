import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated } from "../../services/api";

const MESSAGES = [
  "Analysing your farm location…",
  "Pulling today's weather data…",
  "Calibrating soil moisture levels…",
  "Checking heat stress forecasts…",
  "Preparing your field intelligence…",
];

export default function DashboardLoader() {
  const navigate  = useNavigate();
  const [msgIdx, setMsgIdx]     = useState(0);
  const [progress, setProgress] = useState(0);
  const [done, setDone]         = useState(false);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
    }
  }, []);

  // Cycle through loading messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((i) => {
        if (i < MESSAGES.length - 1) return i + 1;
        clearInterval(interval);
        return i;
      });
    }, 650);
    return () => clearInterval(interval);
  }, []);

  // Animate progress bar
  useEffect(() => {
    let v = 0;
    const timer = setInterval(() => {
      v += Math.random() * 18 + 6;
      if (v >= 100) {
        v = 100;
        clearInterval(timer);
        setTimeout(() => setDone(true), 400);
      }
      setProgress(Math.min(v, 100));
    }, 300);
    return () => clearInterval(timer);
  }, []);

  // Navigate once done
  useEffect(() => {
    if (done) navigate("/dashboard", { replace: true });
  }, [done]);

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />
      <style>{`
        .loader-root {
          min-height: 100vh;
          background: #1a3a2a;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* Subtle grid overlay */
        .loader-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        /* Glowing orb */
        .loader-orb {
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(30,107,69,0.25) 0%, transparent 70%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: pulse-orb 3s ease-in-out infinite;
        }
        @keyframes pulse-orb {
          0%, 100% { transform: translate(-50%, -50%) scale(1);   opacity: 0.8; }
          50%       { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
        }

        .loader-content {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          text-align: center;
        }

        /* Animated logo */
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-8px); }
        }
        .logo-wrap {
          width: 72px; height: 72px;
          background: #e08c2a;
          border-radius: 20px;
          display: flex; align-items: center; justify-content: center;
          font-size: 2rem;
          margin-bottom: 1.5rem;
          animation: float 3s ease-in-out infinite;
          box-shadow: 0 8px 32px rgba(224,140,42,0.35);
        }

        .loader-title {
          font-family: 'Playfair Display', serif;
          color: white;
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.35rem;
        }

        .loader-sub {
          color: rgba(255,255,255,0.45);
          font-size: 0.82rem;
          margin-bottom: 3rem;
          letter-spacing: 0.04em;
        }

        /* Rotating ring */
        .ring-wrap {
          position: relative;
          width: 88px; height: 88px;
          margin-bottom: 2rem;
        }
        .ring {
          width: 88px; height: 88px;
          border-radius: 50%;
          border: 3px solid rgba(255,255,255,0.08);
          border-top-color: #1e6b45;
          border-right-color: #e08c2a;
          animation: spin 1.2s linear infinite;
          position: absolute;
          top: 0; left: 0;
        }
        .ring-inner {
          width: 60px; height: 60px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.05);
          border-bottom-color: rgba(30,107,69,0.5);
          animation: spin 0.9s linear infinite reverse;
          position: absolute;
          top: 14px; left: 14px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .ring-dot {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          font-size: 1.5rem;
        }

        /* Message */
        @keyframes fadeSwap {
          0%   { opacity: 0; transform: translateY(6px); }
          15%  { opacity: 1; transform: translateY(0); }
          85%  { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-6px); }
        }
        .loader-msg {
          color: rgba(255,255,255,0.75);
          font-size: 0.88rem;
          font-weight: 500;
          height: 1.4rem;
          margin-bottom: 2.5rem;
          animation: fadeSwap 0.65s ease both;
        }

        /* Progress bar */
        .progress-track {
          width: 280px;
          height: 4px;
          background: rgba(255,255,255,0.1);
          border-radius: 99px;
          overflow: hidden;
          margin-bottom: 0.6rem;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #1e6b45, #e08c2a);
          border-radius: 99px;
          transition: width 0.3s ease;
        }
        .progress-pct {
          font-size: 0.72rem;
          color: rgba(255,255,255,0.3);
          font-weight: 600;
        }
      `}</style>

      <div className="loader-root">
        <div className="loader-orb" />

        <div className="loader-content">
          <div className="logo-wrap">🌿</div>
          <h1 className="loader-title">AgroGuard AI</h1>
          <p className="loader-sub">Climate-Smart Agriculture · Nigeria</p>

          <div className="ring-wrap">
            <div className="ring" />
            <div className="ring-inner" />
            <div className="ring-dot">🌱</div>
          </div>

          <p key={msgIdx} className="loader-msg">{MESSAGES[msgIdx]}</p>

          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="progress-pct">{Math.round(progress)}%</p>
        </div>
      </div>
    </>
  );
}