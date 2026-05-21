/* eslint-disable react-refresh/only-export-components */
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";



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

  const isAdmin =
    user?.role === "admin";
  const isAgent =
    user?.role === "agent";
  const isCustomer =
    user?.role === "user" ||
    user?.role === "customer";

  const dashboardHref =
    isAdmin
      ? "/admin-dashboard"
      : isAgent
      ? "/dashboard"
      : "/customer-dashboard";
  const quickLinks = [
    { href: "/properties", icon: "bi-grid-3x3-gap", label: "Bất động sản" },
    { href: "/nearby", icon: "bi-geo-alt", label: "Tìm quanh đây" },
    { href: "/amenities", icon: "bi-stars", label: "Tiện ích" },
    { href: "/compare", icon: "bi-columns-gap", label: "So sánh" },
  ];
  const accountLinks = user
    ? [
        { href: "/profile", icon: "bi-person", label: "Hồ sơ" },
        { href: dashboardHref, icon: "bi-speedometer2", label: "Dashboard" },
        { href: "/wishlist", icon: "bi-heart", label: "Tin đã lưu" },
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

      metaTheme.content = "#0C0F1A";

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

    /* ── THEME ── */
    const root = document.documentElement;

    const STORAGE = "geo_theme";

    function setTheme(theme) {
      root.setAttribute("data-theme", theme);

      root.setAttribute("data-bs-theme", theme);

      localStorage.setItem(STORAGE, theme);

      const metaThemeTag = document.querySelector('meta[name="theme-color"]');
      if (metaThemeTag) {
        metaThemeTag.setAttribute(
          "content",
          theme === "dark" ? "#0C0F1A" : "#F5F3EE"
        );
      }

      const btn =
        document.getElementById("themeToggle");

      if (btn) {
        btn.innerHTML =
          theme === "light"
            ? '<i class="bi bi-moon-stars"></i>'
            : '<i class="bi bi-sun"></i>';
      }
    }

    const saved = localStorage.getItem(STORAGE);

    if (saved) {
      setTheme(saved);
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;

      setTheme(prefersDark ? "dark" : "light");
    }

    const btn =
      document.getElementById("themeToggle");

    const toggleTheme = () => {
      const current =
        root.getAttribute("data-theme") || "dark";

      setTheme(
        current === "dark"
          ? "light"
          : "dark"
      );
    };

    btn?.addEventListener("click", toggleTheme);

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
      btn?.removeEventListener(
        "click",
        toggleTheme
      );

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

              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                >
                  Khám phá
                </a>

                <ul
                  className="dropdown-menu border-0 shadow-sm"
                  style={{
                    borderRadius: "14px",
                    padding: "10px",
                    minWidth: "220px",
                  }}
                >
                  <li>
                    <a
                      className="dropdown-item"
                      href="/properties"
                    >
                      Tất cả bất động sản
                    </a>
                  </li>

                  <li>
                    <a
                      className="dropdown-item"
                      href="/nearby"
                    >
                      Tìm quanh đây
                    </a>
                  </li>

                  <li>
                    <a
                      className="dropdown-item"
                      href="/amenities"
                    >
                      Tiện ích lân cận
                    </a>
                  </li>

                  <li>
                    <a
                      className="dropdown-item"
                      href="/compare"
                    >
                      So sánh hiện tại
                    </a>
                  </li>

                  {isCustomer && (
                    <>
                      <li>
                        <a
                          className="dropdown-item"
                          href="/lead-form"
                        >
                          Gửi nhu cầu tư vấn
                        </a>
                      </li>

                      <li>
                        <a
                          className="dropdown-item"
                          href="/appointments/create"
                        >
                          Tạo lịch hẹn
                        </a>
                      </li>
                    </>
                  )}

                </ul>
              </li>
            </ul>

            {/* RIGHT */}
            <div className="d-flex align-items-center gap-2 mt-2 mt-lg-0">
              {/* SEARCH */}
              <div className="d-none d-lg-flex align-items-center gap-2 me-2">
                <form
                  className="nav-search-form"
                  onSubmit={submitNavSearch}
                  style={{
                    position: "relative",
                  }}
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
              <button
                className="nav-icon-btn"
                id="themeToggle"
              >
                <i className="bi bi-moon-stars"></i>
              </button>

              {/* WISHLIST */}
              <a
                className="nav-icon-btn"
                href="/wishlist"
              >
                <i className="bi bi-heart"></i>
              </a>

              {user ? (
              <>
              <div className="dropdown">
                <a
                  className="nav-user-box dropdown-toggle text-decoration-none"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="bi bi-person-circle"></i>

                  <span>
                    {user.full_name || user.username}
                  </span>
                </a>

                <ul
                  className="dropdown-menu dropdown-menu-end border-0 shadow-sm"
                  style={{
                    borderRadius: "14px",
                    padding: "10px",
                    minWidth: "220px",
                  }}
                >
                  <li>
                    <a
                      className="dropdown-item"
                      href="/profile"
                    >
                      Hồ sơ cá nhân
                    </a>
                  </li>

                  <li>
                    <a
                      className="dropdown-item"
                      href={dashboardHref}
                    >
                      Trang tổng quan
                    </a>
                  </li>

                  <li>
                    <a
                      className="dropdown-item"
                      href="/wishlist"
                    >
                      Tin đã lưu
                    </a>
                  </li>

                  {isCustomer && (
                    <>
                      <li>
                        <a
                          className="dropdown-item"
                          href="/lead-form"
                        >
                          Gửi yêu cầu tư vấn
                        </a>
                      </li>

                      <li>
                        <a
                          className="dropdown-item"
                          href="/appointments/create"
                        >
                          Tạo lịch hẹn
                        </a>
                      </li>
                    </>
                  )}

                  {(isAgent || isAdmin) && (
                    <li>
                      <a
                        className="dropdown-item"
                        href="/properties/create"
                      >
                        Đăng tin mới
                      </a>
                    </li>
                  )}

                  {isAdmin && (
                    <>
                      <li>
                        <a
                          className="dropdown-item"
                          href="/admin-dashboard"
                        >
                          Dashboard quản trị
                        </a>
                      </li>

                      <li>
                        <a
                          className="dropdown-item"
                          href="/admin-console"
                        >
                          Admin Console
                        </a>
                      </li>
                    </>
                  )}
                </ul>
              </div>

    {/* LOGOUT */}
    <a
      className="btn-geo-danger"
      href="/login"
      style={{
        padding: "9px 14px",
        fontSize: "13px",
        borderRadius: "999px",
      }}
      onClick={() => {
        api.logout();
        localStorage.removeItem("user");
        setUser(null);
      }}
    >
      Đăng xuất
    </a>
  </>
) : (
  <>
    {/* LOGIN */}
    <a
      className="btn-geo-secondary"
      href="/login"
      style={{
        padding: "9px 14px",
        fontSize: "13px",
        borderRadius: "999px",
      }}
    >
      Đăng nhập
    </a>

    <a
      className="btn-admin"
      href="/register"
      style={{
        padding: "9px 14px",
      }}
    >
      Đăng ký
    </a>
  </>
)}

              
              {/* CREATE */}
              {(isAgent || isAdmin) && (
                <a className="btn-admin" href="/properties/create">
                  <i className="bi bi-building-add"></i>

                  Đăng tin
                </a>
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
