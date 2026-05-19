import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import Home from "./pages/Home";
import About from "./pages/About";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import PasswordResetPage from "./pages/auth/PasswordResetPage";

import PropertyDetailPage from "./pages/property/PropertyDetailPage";
import PropertyFormPage from "./pages/property/PropertyFormPage";
import WishlistPage from "./pages/property/WishlistPage";

import DashboardPage from "./pages/dashboard/DashboardPage";
import CustomerDashboardPage from "./pages/dashboard/CustomerDashboardPage";

import ProfilePage from "./pages/profile/ProfilePage";
import AgentProfilePage from "./pages/profile/AgentProfilePage";

import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminConsolePage from "./pages/admin/AdminConsolePage";
import ImagesManagePage from "./pages/admin/ImagesManagePage";

import LeadFormPage from "./pages/lead/LeadFormPage";
import AppointmentCreatePage from "./pages/lead/AppointmentCreatePage";

import ErrorPage from "./pages/system/ErrorPage";

import {
  AmenitySearchPage,
  ComparePage,
  NearbySearchPage,
  PropertyListPage
} from "./pages/PropertyPages";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/about"
          element={<About />}
        />

        <Route
          path="/properties"
          element={<PropertyListPage />}
        />

        <Route
          path="/nearby"
          element={<NearbySearchPage />}
        />

        <Route
          path="/amenities"
          element={<AmenitySearchPage />}
        />

        <Route
          path="/compare"
          element={<ComparePage />}
        />

        <Route
          path="/property-detail"
          element={<PropertyDetailPage />}
        />

        <Route
          path="/properties/create"
          element={<PropertyFormPage />}
        />

        <Route
          path="/properties/edit"
          element={<PropertyFormPage edit />}
        />

        <Route
          path="/properties/images"
          element={<ImagesManagePage />}
        />

        <Route
          path="/profile"
          element={<ProfilePage />}
        />

        <Route
          path="/agent-profile"
          element={<AgentProfilePage />}
        />

        <Route
          path="/appointments/create"
          element={<AppointmentCreatePage />}
        />

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/register"
          element={<RegisterPage />}
        />
        <Route
          path="/password-reset"
          element={<PasswordResetPage />}
        />

        <Route
          path="/wishlist"
          element={<WishlistPage />}
        />

        <Route
          path="/lead-form"
          element={<LeadFormPage />}
        />

        <Route
          path="/dashboard"
          element={<DashboardPage />}
        />

        <Route
          path="/customer-dashboard"
          element={
            <CustomerDashboardPage />
          }
        />

        <Route
          path="/admin-dashboard"
          element={<AdminDashboardPage />}
        />

        <Route
          path="/admin-console"
          element={<AdminConsolePage />}
        />

        <Route
          path="/403"
          element={
            <ErrorPage code="403" />
          }
        />

        <Route
          path="/404"
          element={
            <ErrorPage code="404" />
          }
        />

        <Route
          path="*"
          element={
            <ErrorPage code="404" />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}