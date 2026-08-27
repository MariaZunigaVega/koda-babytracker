// Reads/writes the logged-in user's JWT-derived id and their per-user selected-child record in localStorage.

export const parseJwt = (token) => {
  if (!token) return null;

  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return null;

    const normalizedPayload = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const decodedPayload = decodeURIComponent(
      atob(normalizedPayload)
        .split("")
        .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join("")
    );

    return JSON.parse(decodedPayload);
  } catch (error) {
    return null;
  }
};

export const getCurrentUserId = () => {
  const token = localStorage.getItem("token");
  const payload = parseJwt(token);
  return payload?.id || null;
};

export const selectedChildStorageKey = (userId) => {
  if (!userId) return null;
  return `selectedChild:${userId}`;
};

export const getSelectedChildForUser = () => {
  const userId = getCurrentUserId();
  if (!userId) return null;

  const key = selectedChildStorageKey(userId);
  if (!key) return null;

  const saved = localStorage.getItem(key);
  if (!saved) return null;

  try {
    return JSON.parse(saved);
  } catch (error) {
    return null;
  }
};

export const setSelectedChildForUser = (child) => {
  const userId = getCurrentUserId();
  if (!userId) return;

  const key = selectedChildStorageKey(userId);
  if (!key) return;

  if (!child) {
    localStorage.removeItem(key);
    return;
  }

  localStorage.setItem(key, JSON.stringify(child));
};
