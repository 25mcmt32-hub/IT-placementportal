const AUTH_STORAGE_KEY = "placement_portal_auth";
const SESSION_DURATION_MS = 20 * 60 * 1000;

export function saveAuthUser(user) {
  const expiresAt =
    user.expiresAt && user.expiresAt > Date.now()
      ? user.expiresAt
      : Date.now() + SESSION_DURATION_MS;

  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      ...user,
      expiresAt,
    })
  );
}

export function getAuthUser() {
  const rawUser = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    const user = JSON.parse(rawUser);

    if (!user.expiresAt) {
      saveAuthUser(user);
      return getAuthUser();
    }

    if (Date.now() > user.expiresAt) {
      clearAuthUser();
      return null;
    }

    return user;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function clearAuthUser() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
