/* eslint-disable react-refresh/only-export-components */
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";



import "./index.css";
import App from "./App.jsx";


/* ═══════════════════════════════════════
   LAYOUT
═══════════════════════════════════════ */
function Layout({ children }) {

  const [user, setUser] = useState(
  JSON.parse(localStorage.getItem("user"))
);

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

    };
  }, []);

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
                </ul>
              </li>
            </ul>

            {/* RIGHT */}
            <div className="d-flex align-items-center gap-2 mt-2 mt-lg-0">
              {/* SEARCH */}
              <div className="d-none d-lg-flex align-items-center gap-2 me-2">
                <form
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
              {/* USER */}
            <div className="nav-user-box">
              <i className="bi bi-person-circle"></i>

              <span>
                {user.full_name || user.username}
              </span>
            </div>

    {/* LOGOUT */}
    <a
      className="btn-geo-danger"
      href="/logout"
      style={{
        padding: "9px 14px",
        fontSize: "13px",
        borderRadius: "999px",
      }}
      onClick={() => {
        localStorage.removeItem("user");
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
  </>
)}

              
              {/* CREATE */}
              <a className="btn-admin" href="/properties/create">
                <i className="bi bi-building-add"></i>

                Đăng tin
              </a>
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
                  <a href="#">
                    <i className="bi bi-grid-3x3-gap"></i>
                    Bất động sản
                  </a>
                </li>

                <li>
                  <a href="#">
                    <i className="bi bi-geo-alt"></i>
                    Tìm kiếm
                  </a>
                </li>

                <li>
                  <a href="#">
                    <i className="bi bi-stars"></i>
                    Tiện ích
                  </a>
                </li>
              </ul>
            </div>

            {/* STATUS */}
            <div className="col-lg-4 col-md-6">
              <div className="footer-heading">
                Trạng Thái
              </div>

              <div className="d-flex flex-column gap-2">
                <div className="status-box">
                  <span>
                    <i className="bi bi-buildings me-2"></i>
                    Bất Động Sản
                  </span>

                  <span className="badge-gold">
                    2,450
                  </span>
                </div>

                <div className="status-box">
                  <span>
                    <i className="bi bi-person-badge me-2"></i>
                    Môi Giới
                  </span>

                  <span className="badge-gold">
                    120
                  </span>
                </div>

                <div className="status-box">
                  <span>
                    <i className="bi bi-circle-fill me-2 text-success"></i>
                    API Status
                  </span>

                  <span className="text-success fw-semibold">
                    Hoạt động
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER BOTTOM */}
          <div className="footer-bottom">
            <p>
              © 2025 GeoEstate · Django +
              PostGIS
            </p>

            <p>
              Nhấn <code>⌘K</code> để tìm
              kiếm
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