// ─────────────────────────────────────────────
//  AgroGuard AI — Central API Service
// ─────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

// ── Token helpers ──────────────────────────────
export const getAccessToken  = () => localStorage.getItem("access_token");
export const getRefreshToken = () => localStorage.getItem("refresh_token");

export const saveTokens = ({ access, refresh }) => {
  localStorage.setItem("access_token",  access);
  localStorage.setItem("refresh_token", refresh);
};

export const clearTokens = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
};

export const isAuthenticated = () => !!getAccessToken();

// ── Base fetch wrapper ─────────────────────────
async function request(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.auth && { Authorization: `Bearer ${getAccessToken()}` }),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method:  options.method  || "GET",
    headers,
    body:    options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Surface the first readable error message from DRF
    const message =
      data?.detail ||
      data?.non_field_errors?.[0] ||
      Object.values(data)?.[0]?.[0] ||
      "Something went wrong.";
    throw new Error(message);
  }

  return data;
}

// ── Auth endpoints ─────────────────────────────
export const authAPI = {
  register: (payload) =>
    request("/users/auth/register/", {
      method: "POST",
      body: payload,
      // { first_name, last_name, email, phone_number, password, confirm_password }
    }),

  login: (payload) =>
    request("/users/auth/login/", {
      method: "POST",
      body: payload,
      // { email, password }
    }),

  refreshToken: () =>
    request("/users/auth/refresh/", {
      method: "POST",
      body: { refresh: getRefreshToken() },
    }),
};

// ── Farm / Location endpoints ──────────────────
export const farmsAPI = {
  saveLocation: (payload) =>
    request("/farms/location/", {
      method: "POST",
      auth:   true,
      body:   payload,
      // { latitude, longitude, address, full_address }
    }),

  getLocation: () =>
    request("/farms/location/", {
      method: "GET",
      auth:   true,
    }),
};