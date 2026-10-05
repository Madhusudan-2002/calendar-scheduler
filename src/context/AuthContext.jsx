import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

import {
  login as loginApi,
  getCurrentUser,
} from "../services/authService";

const AuthContext = createContext(null);

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "calendar_auth_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // =========================
  // CLEAR AUTH
  // =========================

  const clearAuth = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    setUser(null);
  }, []);

  // =========================
  // SAVE USER
  // =========================

  const saveUser = useCallback((userData) => {
    setUser(userData);

    localStorage.setItem(
      USER_KEY,
      JSON.stringify(userData)
    );
  }, []);

  // =========================
  // LOGIN
  // =========================

  const login = async (username, password) => {
    if (isLoggingIn) {
      return;
    }

    if (!username?.trim() || !password) {
      throw new Error(
        "Username and password are required."
      );
    }

    setIsLoggingIn(true);

    try {
      // Uses authService ->
      // shared Axios instance.
      const data = await loginApi(
        username.trim(),
        password
      );

      if (!data?.accessToken) {
        throw new Error(
          "Access token was not returned."
        );
      }

      localStorage.setItem(
        ACCESS_TOKEN_KEY,
        data.accessToken
      );

      if (data.refreshToken) {
        localStorage.setItem(
          REFRESH_TOKEN_KEY,
          data.refreshToken
        );
      }

      const authenticatedUser = {
        id: data.id,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        image: data.image,
      };

      saveUser(authenticatedUser);

      return authenticatedUser;
    } finally {
      setIsLoggingIn(false);
    }
  };

  // =========================
  // LOGOUT
  // =========================

  const logout = useCallback(() => {
    clearAuth();

    /*
      storage event handles other
      browser tabs because the
      token/user keys were removed.
    */
  }, [clearAuth]);

  // =========================
  // RESTORE SESSION
  // =========================

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      const accessToken =
        localStorage.getItem(
          ACCESS_TOKEN_KEY
        );

      const refreshToken =
        localStorage.getItem(
          REFRESH_TOKEN_KEY
        );

      if (!accessToken && !refreshToken) {
        if (active) {
          clearAuth();
          setLoading(false);
        }

        return;
      }

      try {
        /*
          /auth/me goes through Axios.

          If accessToken is expired:
          axiosInstance:
          401
            ->
          refresh
            ->
          retry /auth/me
        */
        const currentUser =
          await getCurrentUser();

        if (!active) {
          return;
        }

        const restoredUser = {
          id: currentUser.id,
          username:
            currentUser.username,
          firstName:
            currentUser.firstName,
          lastName:
            currentUser.lastName,
          email:
            currentUser.email,
          image:
            currentUser.image,
        };

        saveUser(restoredUser);
      } catch (error) {
        console.error(
          "Session restore failed:",
          error
        );

        if (active) {
          clearAuth();
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      active = false;
    };
  }, [clearAuth, saveUser]);

  // =========================
  // AXIOS FORCED LOGOUT
  // =========================

  useEffect(() => {
    const handleAuthLogout = () => {
      clearAuth();
    };

    window.addEventListener(
      "auth:logout",
      handleAuthLogout
    );

    return () => {
      window.removeEventListener(
        "auth:logout",
        handleAuthLogout
      );
    };
  }, [clearAuth]);

  // =========================
  // MULTI-TAB SYNC
  // =========================

  useEffect(() => {
    const handleStorageChange = (
      event
    ) => {
      /*
        Logout from another tab.
      */
      if (
        event.key ===
          ACCESS_TOKEN_KEY &&
        !event.newValue
      ) {
        setUser(null);
        return;
      }

      if (
        event.key === USER_KEY
      ) {
        if (!event.newValue) {
          setUser(null);
          return;
        }

        try {
          const updatedUser =
            JSON.parse(
              event.newValue
            );

          setUser(updatedUser);
        } catch {
          setUser(null);
        }
      }
    };

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChange
      );
    };
  }, []);

  // =========================
  // CONTEXT VALUE
  // =========================

  const value = {
    user,

    loading,

    isAuthenticated:
      Boolean(user),

    isLoggingIn,

    login,

    logout,
  };

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

// =========================
// AUTH HOOK
// =========================

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
}

export default AuthContext;