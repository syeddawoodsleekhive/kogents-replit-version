export const getToken = (): string => {
  let token = "";

  try {
    if (typeof window === "undefined") {
      // Running in a non-browser environment (e.g., SSR) → No cookies
      return token;
    }

    const cookies = document.cookie.split(";");

    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();

      // Check for "token=" prefix
      if (cookie.startsWith("token=")) {
        token = cookie.substring("token=".length);
        break;
      }
    }

    // Alternative (shorter) approach: Using regex (commented out)
    // const match = document.cookie.match(/(?:^|; )token=([^;]*)/);
    // token = match ? match[1] : "";

  } catch (error) {
    console.error("getToken error:", error);
  }

  return token;
};

export const getSessionId = () => {
  try {
    if (typeof window === "undefined") return "";
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const trimmed = cookie.trim();
      if (trimmed.startsWith("sessionId=")) {
        return trimmed.substring("sessionId=".length);
      }
    }
    const stored = window.localStorage.getItem("kogents_session");
    if (stored) {
      try {
        const { id, expires } = JSON.parse(stored);
        if (!expires || Date.now() < expires) {
          return id;
        } else {
          window.localStorage.removeItem("kogents_session");
        }
      } catch {}
    }
  } catch (err) {
    console.error("Error getting sessionId:", err);
    return "";
  }
};
