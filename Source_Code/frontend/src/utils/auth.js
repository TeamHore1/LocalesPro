const AUTH_STORAGE_KEY = "locales_auth_session";
const LEGACY_TOKEN_KEY = "token";
const LEGACY_USER_KEY = "user";
export const AUTH_SESSION_EVENT = "locales_auth_session_changed";

const notifyAuthSessionChange = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
  }
};

const decodeJwtPayload = (token) => {
  try {
    const parts = String(token || "").split(".");
    if (parts.length !== 3) {
      return null;
    }

    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );

    return JSON.parse(window.atob(padded));
  } catch {
    return null;
  }
};

const normalizeSession = (session) => {
  if (!session || typeof session !== "object") {
    return null;
  }

  const token = typeof session.token === "string" ? session.token : "";
  const user = session.user && typeof session.user === "object" ? session.user : null;
  const payload = decodeJwtPayload(token);
  const expiresAt = Number(session.expiresAt || payload?.exp || 0);

  if (!token || !user || !Number.isFinite(expiresAt) || expiresAt <= 0) {
    return null;
  }

  return {
    token,
    user,
    expiresAt,
  };
};

const readRawSession = () => {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      return normalizeSession(JSON.parse(stored));
    }
  } catch {
    return null;
  }

  try {
    const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEY);
    const legacyUser = localStorage.getItem(LEGACY_USER_KEY);

    if (!legacyToken || !legacyUser) {
      return null;
    }

    return normalizeSession({
      token: legacyToken,
      user: JSON.parse(legacyUser),
    });
  } catch {
    return null;
  }
};

export const clearAuthSession = ({ silent = false } = {}) => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem(LEGACY_USER_KEY);

  if (!silent) {
    notifyAuthSessionChange();
  }
};

export const getAuthSession = () => {
  const session = readRawSession();

  if (!session) {
    clearAuthSession({ silent: true });
    return null;
  }

  if (session.expiresAt * 1000 <= Date.now()) {
    clearAuthSession({ silent: true });
    return null;
  }

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem(LEGACY_USER_KEY);

  return session;
};

export const setAuthSession = ({ token, user, expiresAt, expiresIn }) => {
  const payload = decodeJwtPayload(token);
  const resolvedExpiresAt =
    Number(expiresAt) ||
    Number(payload?.exp || 0) ||
    Math.floor(Date.now() / 1000) + Number(expiresIn || 0);

  const session = normalizeSession({
    token,
    user,
    expiresAt: resolvedExpiresAt,
  });

  if (!session) {
    throw new Error("Sesi login tidak valid.");
  }

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem(LEGACY_USER_KEY);
  notifyAuthSessionChange();

  return session;
};

export const getAuthToken = () => getAuthSession()?.token || null;

export const getAuthUser = () => getAuthSession()?.user || null;

export const getAuthExpiry = () => getAuthSession()?.expiresAt || null;
