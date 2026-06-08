/* eslint-disable react-refresh/only-export-components */
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./bootstrap-bridge.css";
import "./ui-foundation.css";
import "./index.css";
import App from "./App.jsx";
import { api } from "./api.js";


/* ═══════════════════════════════════════
   LAYOUT
═══════════════════════════════════════ */
function Layout({ children }) {
  const currentYear = new Date().getFullYear();
  const [user, setUser] = useState(
  JSON.parse(localStorage.getItem("user"))
);
  const [navSearch, setNavSearch] = useState("");
  const [footerStats, setFooterStats] = useState({
    property_total: 0,
    agent_total: 0,
    lead_total: 0,
    featured_total: 0,
  });
  const [apiHealthy, setApiHealthy] = useState(true);

  const role = user?.role || "guest";
  const isAdmin =
    role === "admin";
  const isAgent =
    role === "agent";
  const isCustomer =
    role === "user" ||
    role === "customer";
  const isAuthenticated =
    role !== "guest";

  const dashboardHref =
    isAdmin
      ? "/admin-dashboard"
      : isAgent
      ? "/dashboard"
      : "/customer-dashboard";
  const showWishlistShortcut =
    isCustomer;
  const exploreMenuItems = [
    { href: "/properties", label: "Tất cả bất động sản" },
    { href: "/nearby", label: "Tìm quanh đây" },
    { href: "/amenities", label: "Tiện ích lân cận" },
    { href: "/compare", label: "So sánh hiện tại" },
    ...(isCustomer
      ? [
          { href: "/lead-form", label: "Gửi nhu cầu tư vấn" },
          { href: "/appointments/create", label: "Tạo lịch hẹn" },
        ]
      : []),
  ];
  const userMenuItems = isAuthenticated
    ? [
        { href: "/profile", icon: "bi-person", label: "Hồ sơ cá nhân" },
        { href: dashboardHref, icon: "bi-speedometer2", label: "Trang tổng quan" },
        ...(isCustomer
          ? [
              { href: "/wishlist", icon: "bi-heart", label: "Tin đã lưu" },
              { href: "/lead-form", icon: "bi-chat-left-text", label: "Gửi yêu cầu tư vấn" },
              { href: "/appointments/create", icon: "bi-calendar-event", label: "Tạo lịch hẹn" },
            ]
          : []),
        ...(isAgent || isAdmin
          ? [
              {
                href: "/properties/create",
                icon: "bi-plus-square",
                label: "Đăng tin mới",
                dividerBefore: true,
              },
            ]
          : []),
        ...(isAdmin
          ? [
              { href: "/admin-dashboard", icon: "bi-grid-1x2", label: "Dashboard quản trị" },
              { href: "/admin-console", icon: "bi-sliders", label: "Admin Console" },
            ]
          : []),
      ]
    : [];
  const accountLinks = isAuthenticated
    ? [
        { href: "/profile", icon: "bi-person", label: "Hồ sơ" },
        { href: dashboardHref, icon: "bi-speedometer2", label: "Dashboard" },
        ...(isCustomer ? [{ href: "/wishlist", icon: "bi-heart", label: "Tin đã lưu" }] : []),
        ...(isAgent || isAdmin ? [{ href: "/properties/create", icon: "bi-plus-square", label: "Đăng tin mới" }] : []),
        ...(isAdmin ? [{ href: "/admin-console", icon: "bi-sliders", label: "Admin Console" }] : []),
      ]
    : [
        { href: "/login", icon: "bi-box-arrow-in-right", label: "Đăng nhập" },
        { href: "/register", icon: "bi-person-plus", label: "Đăng ký" },
        { href: "/properties", icon: "bi-search", label: "Khám phá nguồn hàng" },
      ];
  const footerStatsItems = [
    {
      icon: "bi-buildings",
      label: "Bất động sản",
      value: footerStats.property_total.toLocaleString("vi-VN"),
      tone: "gold",
    },
    {
      icon: "bi-person-badge",
      label: "Môi giới",
      value: footerStats.agent_total.toLocaleString("vi-VN"),
      tone: "gold",
    },
    {
      icon: "bi-chat-left-text",
      label: "Lead đang theo dõi",
      value: footerStats.lead_total.toLocaleString("vi-VN"),
      tone: "muted",
    },
    {
      icon: "bi-stars",
      label: "Tin nổi bật",
      value: footerStats.featured_total.toLocaleString("vi-VN"),
      tone: "muted",
    },
  ];

  useEffect(() => {

    /* ── TITLE ── */
    document.title =
      "GeoEstate · Nền Tảng Bất Động Sản Thông Minh";

    /* ── META DESCRIPTION ── */
    let metaDescription = document.querySelector(
      'meta[name="description"]'
    );

    if (!metaDescription) {
      metaDescription = document.createElement("meta");

      metaDescription.name = "description";

      metaDescription.content =
        "GeoEstate — nền tảng bất động sản thông minh chạy trên Django + PostGIS.";

      document.head.appendChild(metaDescription);
    }

    /* ── META THEME COLOR ── */
    let metaTheme = document.querySelector(
      'meta[name="theme-color"]'
    );

    if (!metaTheme) {
      metaTheme = document.createElement("meta");

      metaTheme.name = "theme-color";

      metaTheme.content = "#FFFFFF";

      document.head.appendChild(metaTheme);
    }

    /* ── GOOGLE FONT ── */
    const existingFont = document.querySelector(
      'link[data-google-font="geoestate"]'
    );

    if (!existingFont) {
      const link = document.createElement("link");

      link.rel = "stylesheet";

      link.dataset.googleFont = "geoestate";

      link.href =
        "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Outfit:wght@300;400;500;600&display=swap";

      document.head.appendChild(link);
    }

    const root = document.documentElement;
    root.setAttribute("data-theme", "light");
    root.setAttribute("data-bs-theme", "light");

    localStorage.removeItem("geo_theme");

    const metaThemeTag = document.querySelector('meta[name="theme-color"]');
    if (metaThemeTag) {
      metaThemeTag.setAttribute("content", "#FFFFFF");
    }

    /* ── SCROLL TOP ── */
    const scrollBtn =
      document.getElementById("scroll-top");

    const handleScroll = () => {
      if (window.scrollY > 400) {
        scrollBtn?.classList.add("visible");
      } else {
        scrollBtn?.classList.remove("visible");
      }
    };

    window.addEventListener(
      "scroll",
      handleScroll
    );

    const scrollTop = (e) => {
      e.preventDefault();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

    scrollBtn?.addEventListener(
      "click",
      scrollTop
    );

    /* ── SHORTCUT CTRL + K ── */
    const handleKeydown = (e) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "k"
      ) {
        const input =
          document.querySelector(".nav-search");

        if (input) {
          e.preventDefault();

          input.focus();

          input.select();
        }
      }
    };

    window.addEventListener(
      "keydown",
      handleKeydown
    );
    const syncUser = () => {
  setUser(
    JSON.parse(
      localStorage.getItem("user")
    )
  );
};

    window.addEventListener(
      "storage",
      syncUser
    );
    window.addEventListener(
      "auth-changed",
      syncUser
    );

    /* CLEANUP */
    return () => {
      scrollBtn?.removeEventListener(
        "click",
        scrollTop
      );

      window.removeEventListener(
        "scroll",
        handleScroll
      );

      window.removeEventListener(
        "keydown",
        handleKeydown
      );
      window.removeEventListener(
  "storage",
  syncUser
);
      window.removeEventListener(
  "auth-changed",
  syncUser
);

    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadFooterStats() {
      const [dashboardData, healthData] = await Promise.all([
        api.dashboard(),
        api.health(),
      ]);

      if (!active) return;

      setFooterStats({
        property_total: Number(dashboardData?.property_total) || 0,
        agent_total: Number(dashboardData?.agent_total) || 0,
        lead_total: Number(dashboardData?.lead_total) || 0,
        featured_total: Number(dashboardData?.featured_total) || 0,
      });
      setApiHealthy(Boolean(healthData?.ok));
    }

    loadFooterStats();

    return () => {
      active = false;
    };
  }, []);

  function submitNavSearch(event) {
    event.preventDefault();
    const query = navSearch.trim();
    window.location.href = query
      ? `/properties?q=${encodeURIComponent(query)}`
      : "/properties";
  }

  return (
    <>
      {/* PAGE LOADER */}
      <div id="page-loader"></div>

      {/* ═════════════ NAVBAR ═════════════ */}
      <nav className="navbar navbar-expand-lg sticky-top">
        <div className="container">
          {/* LOGO */}
          <a className="nav-logo" href="/">
            <div className="logo-mark">
              <i className="bi bi-buildings-fill"></i>
            </div>

            <div className="logo-name">
              <span className="logo-primary">
                GeoEstate
              </span>

              <span className="logo-sub">
                Nền Tảng GIS
              </span>
            </div>
          </a>

          {/* MOBILE BUTTON */}
          <button
            className="navbar-toggler ms-auto me-2"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navMenu"
          >
            <i
              className="bi bi-list"
              style={{
                color: "var(--text)",
                fontSize: "20px",
              }}
            ></i>
          </button>

          {/* MENU */}
          <div
            className="collapse navbar-collapse ms-4"
            id="navMenu"
          >
            {/* LEFT MENU */}
            <ul className="navbar-nav me-auto align-items-lg-center">
              <li className="nav-item">
                <a className="nav-link" href="/properties">
                  Nhà đất bán
                </a>
              </li>

              <li className="nav-item">
                <a className="nav-link" href="/about">
                  Giới thiệu
                </a>
              </li>

              <li className="nav-item nav-dropdown">
                <button
                  type="button"
                  className="nav-link nav-dropdown-trigger"
                >
                  Khám phá
                </button>

                <ul
                  className="dropdown-menu nav-dropdown-menu"
                >
                  {exploreMenuItems.map((item) => (
                    <li key={item.href}>
                      <a
                        className="dropdown-item"
                        href={item.href}
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>

            {/* RIGHT */}
            <div className="nav-actions mt-2 mt-lg-0">
              {/* SEARCH */}
              <div className="nav-search-shell d-none d-lg-flex align-items-center gap-2 me-2">
                <form
                  className="nav-search-form"
                  onSubmit={submitNavSearch}
                >
                  <div className="nav-search-wrap">
                    <i className="bi bi-search"></i>

                    <input
                      className="nav-search"
                      type="search"
                      placeholder="Tìm theo khu vực..."
                      value={navSearch}
                      onChange={(event) => setNavSearch(event.target.value)}
                    />

                    <span className="kbd-hint">
                      ⌘K
                    </span>
                  </div>
                </form>
              </div>

              {/* THEME */}
              <div className="nav-utility-group">
                {/* WISHLIST */}
                {showWishlistShortcut && (
                  <a
                    className="nav-icon-btn"
                    href="/wishlist"
                  >
                    <i className="bi bi-heart"></i>
                  </a>
                )}
              </div>

              {isAuthenticated ? (
              <>
              <div className="nav-user-dropdown">
                <button
                  type="button"
                  className="nav-user-box nav-user-trigger"
                  aria-haspopup="menu"
                >
                  <i className="bi bi-person-circle"></i>

                  <span>
                    {user.full_name || user.username}
                  </span>
                </button>

                <ul
                  className="dropdown-menu dropdown-menu-end nav-user-menu"
                >
                  <li className="nav-user-menu-header">
                    <span className="nav-user-menu-label">Tài khoản</span>
                    <strong>{user.full_name || user.username}</strong>
                  </li>

                  {userMenuItems.map((item) => (
                    <li
                      key={item.href}
                      className={item.dividerBefore ? "nav-menu-divider" : undefined}
                    >
                      <a
                        className="dropdown-item"
                        href={item.href}
                      >
                        <i className={`bi ${item.icon}`}></i>
                        {item.label}
                      </a>
                    </li>
                  ))}

                  <li className="nav-menu-divider">
                    <a
                      className="dropdown-item dropdown-item-danger"
                      href="/login"
                      onClick={() => {
                        api.logout();
                        localStorage.removeItem("user");
                        setUser(null);
                      }}
                    >
                      <i className="bi bi-box-arrow-right"></i>
                      Đăng xuất
                    </a>
                  </li>
                </ul>
              </div>
  </>
) : (
  <div className="nav-auth-group">
    {/* LOGIN */}
    <a
      className="nav-auth-link"
      href="/login"
    >
      Đăng nhập
    </a>

    <a
      className="nav-auth-link nav-auth-link-primary"
      href="/register"
    >
      Đăng ký
    </a>
  </div>
)}
            </div>
          </div>
        </div>
      </nav>

      {/* ═════════════ MAIN ═════════════ */}
      <main>{children}</main>

      {/* ═════════════ FOOTER ═════════════ */}
      <footer>
        <div className="container">
          <div className="row g-5">
            {/* BRAND */}
            <div className="col-lg-4 col-md-6">
              <div className="footer-brand">
                Geo<span>Estate</span>
              </div>

              <p className="footer-desc">
                Nền tảng bất động sản thông minh
                chạy trên GeoDjango & PostGIS.
              </p>

              <div className="footer-hero-stats">
                <div className="footer-mini-stat">
                  <strong>{footerStats.property_total.toLocaleString("vi-VN")}</strong>
                  <span>nguồn hàng đang đồng bộ</span>
                </div>
                <div className="footer-mini-stat">
                  <strong>{footerStats.agent_total.toLocaleString("vi-VN")}</strong>
                  <span>môi giới hoạt động</span>
                </div>
              </div>

              <div className="tech-stack mt-3">
                <span className="tech-chip">
                  Django
                </span>

                <span className="tech-chip">
                  PostGIS
                </span>

                <span className="tech-chip">
                  Leaflet
                </span>

                <span className="tech-chip">
                  Bootstrap
                </span>
              </div>
            </div>

            {/* LINKS */}
            <div className="col-lg-2 col-md-3 col-6">
              <div className="footer-heading">
                Nền Tảng
              </div>

              <ul className="footer-links">
                <li>
                  <a href="/properties">
                    <i className="bi bi-grid-3x3-gap"></i>
                    Bất động sản
                  </a>
                </li>

                <li>
                  <a href="/nearby">
                    <i className="bi bi-geo-alt"></i>
                    Tìm kiếm
                  </a>
                </li>

                <li>
                  <a href="/amenities">
                    <i className="bi bi-stars"></i>
                    Tiện ích
                  </a>
                </li>
              </ul>
            </div>

            <div className="col-lg-2 col-md-3 col-6">
              <div className="footer-heading">
                Tài khoản
              </div>

              <ul className="footer-links">
                {accountLinks.map((item) => (
                  <li key={item.href}>
                    <a href={item.href}>
                      <i className={`bi ${item.icon}`}></i>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* STATUS */}
            <div className="col-lg-4 col-md-6">
              <div className="footer-heading">
                Vận hành hệ thống
              </div>

              <div className="footer-status-grid">
                {footerStatsItems.map((item) => (
                  <div className="status-box" key={item.label}>
                    <span>
                      <i className={`bi ${item.icon} me-2`}></i>
                      {item.label}
                    </span>

                    <span className={item.tone === "gold" ? "badge-gold" : "badge-muted"}>
                      {item.value}
                    </span>
                  </div>
                ))}
                <div className="status-box status-box-wide">
                  <span>
                    <i className={`bi ${apiHealthy ? "bi-broadcast" : "bi-exclamation-circle"} me-2`}></i>
                    API Status
                  </span>

                  <span className={`footer-live-badge ${apiHealthy ? "is-live" : "is-offline"}`}>
                    {apiHealthy ? "Hoạt động" : "Gián đoạn"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER BOTTOM */}
          <div className="footer-bottom">
            <p>
              © {currentYear} GeoEstate · Django +
              PostGIS
            </p>

            <p>
              Khám phá nguồn hàng, tiện ích và điều hành dữ liệu trên cùng một nền tảng
            </p>
          </div>
        </div>
      </footer>

      {/* SCROLL TOP */}
      <a href="#" id="scroll-top">
        <i className="bi bi-arrow-up"></i>
      </a>
    </>
  );
}

/* ═══════════════════════════════════════
   RENDER
═══════════════════════════════════════ */
createRoot(
  document.getElementById("root")
).render(
  <StrictMode>
    <Layout>
      <App />
    </Layout>
  </StrictMode>
);
