import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearTokens } from "../../services/api";

// ── Icons ──────────────────────────────────────────────
function PulseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
function FarmIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
function CropIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V12" />
      <path d="M5 3a7 7 0 0 0 7 7" />
      <path d="M19 3a7 7 0 0 1-7 7" />
      <path d="M5 3h14" />
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

const NAV_ITEMS = [
  { to: "/dashboard",             label: "Farmer's Pulse",    icon: <PulseIcon /> },
  { to: "/dashboard/farm",        label: "My Farm",           icon: <FarmIcon /> },
  { to: "/dashboard/crops",       label: "Crop Intelligence", icon: <CropIcon /> },
  { to: "/dashboard/alerts",      label: "Climate Alerts",    icon: <AlertIcon /> },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  // Pull user's name from localStorage (saved at login/register)
  const firstName = localStorage.getItem("first_name") || "Farmer";
  const farmLocation = localStorage.getItem("farm_address") || "Nigeria";

  function handleLogout() {
    clearTokens();
    localStorage.removeItem("first_name");
    localStorage.removeItem("farm_address");
    navigate("/login");
  }

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />
      <style>{`
        .dash-root { font-family: 'DM Sans', sans-serif; display: flex; min-height: 100vh; background: #f5f2ec; }
        .font-playfair { font-family: 'Playfair Display', serif; }

        /* Sidebar */
        .sidebar {
          width: 220px;
          min-height: 100vh;
          background: #1a3a2a;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          transition: width 0.25s ease;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow: hidden;
        }
        .sidebar.collapsed { width: 68px; }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 1.5rem 1.25rem 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .brand-icon {
          width: 36px; height: 36px;
          background: #e08c2a;
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem;
          flex-shrink: 0;
        }
        .brand-text { overflow: hidden; white-space: nowrap; }
        .brand-text h2 { font-family: 'Playfair Display', serif; color: white; font-size: 0.95rem; font-weight: 700; line-height: 1.1; }
        .brand-text p  { color: rgba(255,255,255,0.4); font-size: 0.65rem; margin-top: 1px; }

        .sidebar-nav { flex: 1; padding: 1rem 0.75rem; display: flex; flex-direction: column; gap: 2px; }

        .nav-link-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0.65rem 0.85rem;
          border-radius: 10px;
          color: rgba(255,255,255,0.5);
          text-decoration: none;
          font-size: 0.83rem;
          font-weight: 500;
          white-space: nowrap;
          transition: background 0.15s, color 0.15s;
        }
        .nav-link-item:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.8); }
        .nav-link-item.active { background: rgba(30,107,69,0.55); color: white; }
        .nav-link-item .nav-icon { flex-shrink: 0; }
        .nav-label { overflow: hidden; }

        .sidebar-footer {
          padding: 1rem 0.75rem;
          border-top: 1px solid rgba(255,255,255,0.07);
        }
        .logout-btn {
          display: flex; align-items: center; gap: 10px;
          width: 100%; padding: 0.6rem 0.85rem;
          border-radius: 10px; border: none;
          background: none; color: rgba(255,255,255,0.35);
          font-size: 0.8rem; font-weight: 500;
          cursor: pointer; white-space: nowrap;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.15s, color 0.15s;
        }
        .logout-btn:hover { background: rgba(220,38,38,0.15); color: #fca5a5; }
        .version-tag { color: rgba(255,255,255,0.2); font-size: 0.65rem; margin-top: 0.6rem; padding-left: 0.85rem; white-space: nowrap; overflow: hidden; }

        /* Main area */
        .dash-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }

        /* Top bar */
        .topbar {
          background: white;
          border-bottom: 1px solid #ede8df;
          padding: 0 2rem;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .topbar-left p { font-size: 0.72rem; color: #9ca3af; margin-bottom: 1px; }
        .topbar-left h3 { font-size: 0.95rem; font-weight: 600; color: #1a1a1a; }
        .topbar-right { display: flex; align-items: center; gap: 0.75rem; }
        .topbar-bell {
          position: relative;
          width: 36px; height: 36px;
          border-radius: 9px;
          border: 1.5px solid #ede8df;
          background: white;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #6b7280;
          transition: border-color 0.15s;
        }
        .topbar-bell:hover { border-color: #1e6b45; color: #1e6b45; }
        .bell-dot {
          position: absolute; top: 6px; right: 6px;
          width: 7px; height: 7px;
          background: #e08c2a; border-radius: 50%;
          border: 1.5px solid white;
        }
        .topbar-avatar {
          width: 34px; height: 34px;
          border-radius: 50%;
          background: #1e6b45;
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 0.8rem; font-weight: 700;
          cursor: pointer;
        }

        /* Page content */
        .dash-content { flex: 1; padding: 2rem 2.5rem; overflow-y: auto; }

        /* Loading screen */
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-in-up { animation: fadeInUp 0.5s ease both; }

        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .skeleton {
          background: linear-gradient(90deg, #ede8df 25%, #f5f2ec 50%, #ede8df 75%);
          background-size: 400px 100%;
          animation: shimmer 1.4s ease infinite;
          border-radius: 10px;
        }
      `}</style>

      <div className="dash-root">
        {/* ── SIDEBAR ── */}
        <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
          <div className="sidebar-brand" style={{ cursor: "pointer" }} onClick={() => setCollapsed(!collapsed)}>
            <div className="brand-icon">🌿</div>
            {!collapsed && (
              <div className="brand-text">
                <h2>AgroGuard AI</h2>
                <p>Tech for the Dirt</p>
              </div>
            )}
          </div>

          <nav className="sidebar-nav">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/dashboard"}
                className={({ isActive }) => `nav-link-item ${isActive ? "active" : ""}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {!collapsed && <span className="nav-label">{item.label}</span>}
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-footer">
            <button className="logout-btn" onClick={handleLogout}>
              <LogoutIcon />
              {!collapsed && <span>Log out</span>}
            </button>
            {!collapsed && <p className="version-tag">v1.0 · AgroGuard AI</p>}
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div className="dash-main">
          {/* Top bar */}
          <header className="topbar">
            <div className="topbar-left">
              <p>Welcome back</p>
              <h3>{firstName}'s Farm · {farmLocation}</h3>
            </div>
            <div className="topbar-right">
              <button className="topbar-bell">
                <BellIcon />
                <span className="bell-dot" />
              </button>
              <div className="topbar-avatar">
                {firstName.charAt(0).toUpperCase()}
              </div>
            </div>
          </header>

          {/* Page content rendered by child routes */}
          <main className="dash-content">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}