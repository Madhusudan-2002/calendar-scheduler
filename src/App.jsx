import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import CalendarPage from "./pages/CalendarPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>

        <Routes>

          <Route
            path="/"
            element={<Navigate to="/login" replace />}
          />

          <Route
            path="/login"
            element={<LoginPage />}
          />

          <Route
  path="/calendar"
  element={
    <ProtectedRoute>
      <CalendarPage />
    </ProtectedRoute>
  }
/>

        </Routes>

      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;