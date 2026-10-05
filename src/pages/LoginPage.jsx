import {
  useRef,
  useState,
} from "react";

import {
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

function LoginPage() {
  const {
    login,
    isAuthenticated,
  } = useAuth();

  const navigate =
    useNavigate();

  const location =
    useLocation();

  // =========================
  // FORM STATE
  // =========================

  const [
    username,
    setUsername,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  // =========================
  // DOUBLE-SUBMIT PROTECTION
  // =========================

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const submittingRef =
    useRef(false);

  // =========================
  // ALREADY LOGGED IN
  // =========================

  if (isAuthenticated) {
    return (
      <Navigate
        to="/calendar"
        replace
      />
    );
  }

  // =========================
  // LOGIN
  // =========================

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      // Immediate protection against
      // rapid multiple clicks.
      if (
        submittingRef.current
      ) {
        return;
      }

      setError("");

      // Basic validation
      if (!username.trim()) {
        setError(
          "Username is required."
        );

        return;
      }

      if (!password) {
        setError(
          "Password is required."
        );

        return;
      }

      submittingRef.current =
        true;

      setIsSubmitting(true);

      try {
        // Login is handled by
        // AuthContext.
        const result =
          await Promise.resolve(
            login(
              username.trim(),
              password
            )
          );

        /*
          Some AuthContext implementations
          return false when authentication
          fails instead of throwing an error.
        */
        if (result === false) {
          throw new Error(
            "Invalid username or password."
          );
        }

        // If user originally tried to open
        // a protected page, return there.
        const destination =
          location.state?.from
            ?.pathname ||
          "/calendar";

        navigate(
          destination,
          {
            replace: true,
          }
        );
      } catch (
        loginError
      ) {
        console.error(
          "Login failed:",
          loginError
        );

        setError(
          loginError?.message ||
            "Invalid username or password."
        );
      } finally {
        // Re-enable login after
        // success/failure completes.
        submittingRef.current =
          false;

        setIsSubmitting(
          false
        );
      }
    };

  // =========================
  // UI
  // =========================

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">

      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">

        {/* HEADER */}
        <div className="mb-6 text-center">

          <h1 className="text-3xl font-bold text-gray-900">
            Calendar Scheduler
          </h1>

          <p className="mt-2 text-gray-500">
            Sign in to continue
          </p>

        </div>

        {/* LOGIN FORM */}
        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-5"
        >

          {/* USERNAME */}
          <div>

            <label
              htmlFor="username"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Username
            </label>

            <input
              id="username"
              type="text"
              value={
                username
              }
              onChange={(
                event
              ) =>
                setUsername(
                  event.target
                    .value
                )
              }
              disabled={
                isSubmitting
              }
              autoComplete="username"
              placeholder="Enter username"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
              autoFocus
            />

          </div>

          {/* PASSWORD */}
          <div>

            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              value={
                password
              }
              onChange={(
                event
              ) =>
                setPassword(
                  event.target
                    .value
                )
              }
              disabled={
                isSubmitting
              }
              autoComplete="current-password"
              placeholder="Enter password"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
            />

          </div>

          {/* ERROR */}
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            disabled={
              isSubmitting
            }
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? "Logging in..."
              : "Login"}
          </button>

        </form>

      </div>

    </div>
  );
}

export default LoginPage;