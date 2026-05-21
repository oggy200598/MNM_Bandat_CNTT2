import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

/* ======================
   PUBLIC PAGES
====================== */

import Home from "./pages/Home";
import About from "./pages/About";

import {
  AmenitySearchPage,
  ComparePage,
  NearbySearchPage,
  PropertyListPage
} from "./pages/PropertyPages";

import PropertyDetailPage
  from "./pages/property/PropertyDetailPage";

/* ======================
   AUTH PAGES
====================== */

import LoginPage
  from "./pages/auth/LoginPage";

import RegisterPage
  from "./pages/auth/RegisterPage";

import PasswordResetPage
  from "./pages/auth/PasswordResetPage";
import GoogleAuthCallbackPage
  from "./pages/auth/GoogleAuthCallbackPage";

/* ======================
   USER PAGES
====================== */

import WishlistPage
  from "./pages/property/WishlistPage";

import DashboardPage
  from "./pages/dashboard/DashboardPage";

import CustomerDashboardPage
  from "./pages/dashboard/CustomerDashboardPage";

import ProfilePage
  from "./pages/profile/ProfilePage";

import AgentProfilePage
  from "./pages/profile/AgentProfilePage";

import LeadFormPage
  from "./pages/lead/LeadFormPage";

import AppointmentCreatePage
  from "./pages/lead/AppointmentCreatePage";

/* ======================
   PROPERTY MANAGEMENT
====================== */

import PropertyFormPage
  from "./pages/property/PropertyFormPage";

import ImagesManagePage
  from "./pages/admin/ImagesManagePage";

/* ======================
   ADMIN PAGES
====================== */

import AdminDashboardPage
  from "./pages/admin/AdminDashboardPage";

import AdminConsolePage
  from "./pages/admin/AdminConsolePage";

/* ======================
   SYSTEM
====================== */

import ErrorPage
  from "./pages/system/ErrorPage";

/* ======================
   PROTECTED ROUTE
====================== */

function ProtectedRoute({
  children,
  allowedRoles = []
}) {

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  // chưa login
  if (!user) {
    return <Navigate to="/login" />;
  }

  // sai quyền
  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(user.role)
  ) {
    return <Navigate to="/403" />;
  }

  return children;
}

/* ======================
   APP
====================== */

export default function App() {

  return (
    <BrowserRouter>

      <Routes>

        {/* ======================
            PUBLIC ROUTES
        ====================== */}

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
          path="/property-detail/:id"
          element={<PropertyDetailPage />}
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

        {/* ======================
            AUTH ROUTES
        ====================== */}

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
          path="/auth/google/callback"
          element={<GoogleAuthCallbackPage />}
        />

        {/* ======================
            USER ROUTES
        ====================== */}

        <Route
          path="/wishlist"
          element={
            <ProtectedRoute
              allowedRoles={[
                "customer",
                "user",
                "agent",
                "admin"
              ]}
            >
              <WishlistPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute
              allowedRoles={[
                "customer",
                "user",
                "agent",
                "admin"
              ]}
            >
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/agent-profile/:id"
          element={
            <ProtectedRoute
              allowedRoles={[
                "customer",
                "user",
                "agent",
                "admin"
              ]}
            >
              <AgentProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              allowedRoles={[
                "agent",
                "admin"
              ]}
            >
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer-dashboard"
          element={
            <ProtectedRoute
              allowedRoles={[
                "customer",
                "user",
                "admin"
              ]}
            >
              <CustomerDashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/lead-form"
          element={
            <ProtectedRoute
              allowedRoles={[
                "customer",
                "user",
                "admin"
              ]}
            >
              <LeadFormPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/appointments/create"
          element={
            <ProtectedRoute
              allowedRoles={[
                "customer",
                "user",
                "admin"
              ]}
            >
              <AppointmentCreatePage />
            </ProtectedRoute>
          }
        />

        {/* ======================
            PROPERTY MANAGEMENT
        ====================== */}

        <Route
          path="/properties/create"
          element={
            <ProtectedRoute
              allowedRoles={[
                "agent",
                "admin"
              ]}
            >
              <PropertyFormPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/properties/edit/:id"
          element={
            <ProtectedRoute
              allowedRoles={[
                "agent",
                "admin"
              ]}
            >
              <PropertyFormPage edit />
            </ProtectedRoute>
          }
        />

        <Route
          path="/properties/images/:id"
          element={
            <ProtectedRoute
              allowedRoles={[
                "agent",
                "admin"
              ]}
            >
              <ImagesManagePage />
            </ProtectedRoute>
          }
        />

        {/* ======================
            ADMIN ROUTES
        ====================== */}

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
            >
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-console/*"
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
            >
              <AdminConsolePage />
            </ProtectedRoute>
          }
        />

        {/* ======================
            ERROR ROUTES
        ====================== */}

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
