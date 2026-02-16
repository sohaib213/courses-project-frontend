import api from "./api";

const TOKEN_KEY = "token";
const USER_KEY = "auth_user";

const parseJwtPayload = (token) => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const decoded = atob(padded);

    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

const isTokenExpired = (token) => {
  const payload = parseJwtPayload(token);
  if (!payload?.exp) return false;
  return Date.now() >= payload.exp * 1000;
};

const saveUser = (user) => {
  if (user && typeof user === "object") {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

const extractToken = (response) =>
  response.data.token ||
  response.data.accessToken ||
  response.data.data?.token ||
  response.data.data?.accessToken;

const extractData = (response) => response.data.data || response.data;

const mapTokenPayloadToUser = (payload) => {
  if (!payload || typeof payload !== "object") return null;

  return {
    id: payload.id || payload.sub || payload.userId,
    email: payload.email,
    username: payload.username || payload.userName,
    role: payload.role,
    type: payload.type,
    image: payload.image,
  };
};

const extractUser = (token) => {
  const payloadUser = mapTokenPayloadToUser(parseJwtPayload(token));
  if (!payloadUser) return null;

  const hasAnyField = Object.values(payloadUser).some(Boolean);
  return hasAnyField ? payloadUser : null;
};

const extractUserFromData = (data) => {
  if (!data || typeof data !== "object") return null;
  if (data.user && typeof data.user === "object") return data.user;

  const looksLikeUser =
    "id" in data || "email" in data || "username" in data || "type" in data;

  if (looksLikeUser) return data;
  return null;
};

const clearStoredAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

const fetchAndStoreCurrentUser = async () => {
  const response = await api.get("/users/me");
  const data = extractData(response);
  const user = extractUserFromData(data) || data;
  saveUser(user);
  return user;
};

const completeTokenAuth = async (response) => {
  const data = extractData(response);
  const token = extractToken(response);
  const fallbackUser = extractUser(token);

  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  if (!token) {
    saveUser(fallbackUser);
    return { ...data, user: fallbackUser };
  }

  try {
    const user = await fetchAndStoreCurrentUser();
    return { ...data, user };
  } catch {
    saveUser(fallbackUser);
    return { ...data, user: fallbackUser };
  }
};

export const authService = {
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    return completeTokenAuth(response);
  },

  register: async (userData) => {
    // Check if userData is FormData (for image upload)
    const isFormData = userData instanceof FormData;

    const response = await api.post("/auth/register", userData, {
      headers: isFormData
        ? {
            "Content-Type": "multipart/form-data",
          }
        : undefined,
    });

    // Don't store token yet - user needs to verify email first
    return extractData(response);
  },

  logout: () => {
    clearStoredAuth();
  },

  getCurrentUser: async () => {
    return fetchAndStoreCurrentUser();
  },

  updateProfile: async (userData) => {
    // Check if userData is FormData (for image upload)
    const isFormData = userData instanceof FormData;

    const response = await api.patch("/users", userData, {
      headers: isFormData
        ? {
            "Content-Type": "multipart/form-data",
          }
        : undefined,
    });

    const data = extractData(response);
    const user = extractUserFromData(data);
    saveUser(user);
    return data;
  },

  // Email verification
  verifyEmail: async (email, code) => {
    const response = await api.post("/auth/verify", { email, code });
    const data = await completeTokenAuth(response);
    return data;
  },

  resendVerification: async (email) => {
    const response = await api.post("/auth/resend-verification", { email });
    return extractData(response);
  },

  // Password reset
  resetPasswordRequest: async (email) => {
    const response = await api.post("/auth/request-password-reset", { email });
    return extractData(response);
  },

  checkPasswordResetCode: async (email, code) => {
    const response = await api.post("/auth/verify-reset-code", { email, code });
    return extractData(response);
  },

  resetPassword: async (resetData) => {
    const response = await api.post("/auth/reset-password", resetData);
    return extractData(response);
  },

  // Google OAuth
  googleCallback: async (code) => {
    const response = await api.get(`/auth/google/callback?code=${code}`);
    return completeTokenAuth(response);
  },

  completeProfile: async (profileData) => {
    const response = await api.patch("/auth/complete-profile", profileData);
    return completeTokenAuth(response);
  },

  restoreSession: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      throw new Error("No token");
    }

    if (isTokenExpired(token)) {
      clearStoredAuth();
      throw new Error("Token expired");
    }

    try {
      const user = await fetchAndStoreCurrentUser();
      return user;
    } catch {
      const storedUser = localStorage.getItem(USER_KEY);
      if (storedUser) {
        try {
          return JSON.parse(storedUser);
        } catch {
          clearStoredAuth();
          throw new Error("Invalid user data");
        }
      }

      const userFromToken = mapTokenPayloadToUser(parseJwtPayload(token));
      if (!userFromToken) {
        clearStoredAuth();
        throw new Error("Invalid token");
      }

      const hasAnyField = Object.values(userFromToken).some(Boolean);
      if (!hasAnyField) {
        clearStoredAuth();
        throw new Error("No user info in token");
      }

      saveUser(userFromToken);
      return userFromToken;
    }
  },
};
