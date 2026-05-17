import { useEffect, useState } from "react";
import About from "./pages/About";
import {
  AdminConsolePage,
  AdminDashboardPage,
  AgentProfilePage,
  AppointmentCreatePage,
  CustomerDashboardPage,
  DashboardPage,
  ErrorPage,
  ImagesManagePage,
  LeadFormPage,
  LoginPage,
  LogoutPage,
  PasswordResetPage,
  ProfilePage,
  PropertyDetailPage,
  PropertyFormPage,
  RegisterPage,
  WishlistPage,
} from "./pages/ExtraPages";
import Home from "./pages/Home";
import {
  AmenitySearchPage,
  ComparePage,
  NearbySearchPage,
  PropertyListPage,
} from "./pages/PropertyPages";

const INTERNAL_ROUTES = [
  "/",
  "/about",
  "/properties",
  "/nearby",
  "/amenities",
  "/compare",
  "/property-detail",
  "/properties/create",
  "/properties/edit",
  "/properties/images",
  "/profile",
  "/agent-profile",
  "/appointments/create",
  "/login",
  "/register",
  "/logout",
  "/password-reset",
  "/wishlist",
  "/lead-form",
  "/dashboard",
  "/customer-dashboard",
  "/admin-dashboard",
  "/admin-console",
  "/403",
  "/404",
];

function getRoute() {
  return window.location.pathname.toLowerCase();
}

function App() {
  const [route, setRoute] = useState(getRoute);

  useEffect(() => {
    const handleRouteChange = () => setRoute(getRoute());

    window.addEventListener("popstate", handleRouteChange);

    const handleClick = (event) => {
      const link = event.target.closest("a[href]");
      if (!link) return;

      const url = new URL(link.href);
      const isSameOrigin = url.origin === window.location.origin;
      const isInternalRoute = isSameOrigin && INTERNAL_ROUTES.includes(url.pathname);

      if (!isInternalRoute || link.hash) return;

      event.preventDefault();
      window.history.pushState({}, "", url.pathname);
      handleRouteChange();
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    document.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
      document.removeEventListener("click", handleClick);
    };
  }, []);

  if (route === "/about") return <About />;
  if (route === "/properties") return <PropertyListPage />;
  if (route === "/nearby") return <NearbySearchPage />;
  if (route === "/amenities") return <AmenitySearchPage />;
  if (route === "/compare") return <ComparePage />;
  if (route === "/property-detail") return <PropertyDetailPage />;
  if (route === "/properties/create") return <PropertyFormPage />;
  if (route === "/properties/edit") return <PropertyFormPage edit />;
  if (route === "/properties/images") return <ImagesManagePage />;
  if (route === "/profile") return <ProfilePage />;
  if (route === "/agent-profile") return <AgentProfilePage />;
  if (route === "/appointments/create") return <AppointmentCreatePage />;
  if (route === "/login") return <LoginPage />;
  if (route === "/register") return <RegisterPage />;
  if (route === "/logout") return <LogoutPage />;
  if (route === "/properties/create") return <PropertyFormPage />;
  if (route === "/password-reset") return <PasswordResetPage />;
  if (route === "/wishlist") return <WishlistPage />;
  if (route === "/lead-form") return <LeadFormPage />;
  if (route === "/dashboard") return <DashboardPage />;
  if (route === "/customer-dashboard") return <CustomerDashboardPage />;
  if (route === "/admin-dashboard") return <AdminDashboardPage />;
  if (route === "/admin-console") return <AdminConsolePage />;
  if (route === "/403") return <ErrorPage code="403" />;
  if (route === "/404") return <ErrorPage code="404" />;

  return <Home />;
}

export default App;
