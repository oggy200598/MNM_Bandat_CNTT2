import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import LoginPage
  from "../pages/auth/LoginPage";

import RegisterPage
  from "../pages/auth/RegisterPage";

import PropertyDetailPage
  from "../pages/property/PropertyDetailPage";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/register"
          element={<RegisterPage />}
        />

        <Route
          path="/property-detail"
          element={
            <PropertyDetailPage />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}