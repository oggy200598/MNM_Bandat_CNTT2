import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api, normalizeProperty } from "../api";
import "../App.css";
import { stripHtmlTags } from "../utils/richText";
import usePageMeta from "../hooks/usePageMeta";

const fallbackProperties = [
  {
    id: 1,
    title: "Căn hộ cao cấp Quận 1",
    price: "12 tỷ",
    address: "Nguyễn Huệ, Quận 1, TP.HCM",
    area: 120,
    type: "apartment",
    status: "Đang bán",
    agent: "Nguyễn Văn A",
    image: "https://images.unsplash.com/photo-1502672023488-70e25813eb80?q=80&w=1200&auto=format&fit=crop",
    desc: "Căn hộ trung tâm, view thành phố, tiện ích đầy đủ và kết nối giao thông thuận tiện.",
  },
  {
    id: 2,
    title: "Nhà phố Thảo Điền",
    price: "25 tỷ",
    address: "Thảo Điền, TP.Thủ Đức",
    area: 250,
    type: "house",
    status: "Nổi bật",
    agent: "Trần Thị B",
    image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=1200&auto=format&fit=crop",
    desc: "Nhà phố khu dân cư cao cấp, phù hợp ở hoặc đầu tư cho thuê dài hạn.",
  },
  {
    id: 3,
    title: "Đất nền Bình Chánh",
    price: "5 tỷ",
    address: "Bình Chánh, TP.HCM",
    area: 500,
    type: "land",
    status: "Mới",
    agent: "Lê Văn C",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1200&auto=format&fit=crop",
    desc: "Đất nền diện tích lớn, pháp lý rõ ràng, phù hợp xây nhà vườn hoặc đầu tư.",
  },
];

const fallbackAmenities = [
  { id: 1, type: "Trường học", name: "Trường THPT Nguyễn Thị Minh Khai", distance_km: 1.2 },
  { id: 2, type: "Bệnh viện", name: "Bệnh viện Nhi Đồng 2", distance_km: 2.1 },
  { id: 3, type: "Công viên", name: "Công viên Tao Đàn", distance_km: 0.95 },
  { id: 4, type: "Siêu thị", name: "Co.opmart Cống Quỳnh", distance_km: 1.7 },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "price_asc", label: "Giá tăng dần" },
  { value: "price_desc", label: "Giá giảm dần" },
  { value: "area_asc", label: "Diện tích tăng dần" },
];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildPropertyPopup(item, index = 0) {
  const property = normalizeProperty(item, index);
  const title = escapeHtml(property.title || property.name || "Bất động sản");
  const address = escapeHtml(property.address || "Đang cập nhật địa chỉ");
  const priceText = escapeHtml(property.priceText || "Liên hệ");
  const typeText = escapeHtml(property.typeText || "Bất động sản");
  const imageUrl = escapeHtml(property.imageUrl);
  const detailHref = `/property-detail/${property.id}`;

  return `
    <a class="map-property-popup" href="${detailHref}">
      <div class="map-property-popup__thumb">
        <img src="${imageUrl}" alt="${title}" loading="lazy" />
      </div>
      <div class="map-property-popup__body">
        <div class="map-property-popup__top">
          <span class="map-property-popup__type">${typeText}</span>
          <strong class="map-property-popup__price">${priceText}</strong>
        </div>
        <h4 class="map-property-popup__title">${title}</h4>
        <p class="map-property-popup__address">${address}</p>
        <span class="map-property-popup__cta">Xem chi tiết</span>
      </div>
    </a>
  `;
}

function PageHero({ eyebrow, title, desc, actions }) {
  return (
    <section className="property-page-hero">
      <div className="container hero-row">
        <div>
          {eyebrow && <p className="page-eyebrow">{eyebrow}</p>}
          <h1 className="page-title">{title}</h1>
          {desc && <p className="page-desc">{desc}</p>}
        </div>
        {actions && <div className="hero-actions-right d-flex flex-wrap gap-2 justify-content-start justify-content-lg-end">{actions}</div>}
      </div>
    </section>
  );
}

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const MARKERCLUSTER_JS = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js";
const HEAT_JS = "https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js";

function loadStyle(href, id) {
  if (document.querySelector(`link[data-openclaw-id="${id}"]`)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.openclawId = id;
    link.onload = () => resolve();
    link.onerror = reject;
    document.head.appendChild(link);
  });
}

function loadScript(src, id) {
  if (document.querySelector(`script[data-openclaw-id="${id}"]`)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset.openclawId = id;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function boundsToBbox(bounds) {
  if (!bounds) return '';
  const west = bounds.getWest().toFixed(6);
  const south = bounds.getSouth().toFixed(6);
  const east = bounds.getEast().toFixed(6);
  const north = bounds.getNorth().toFixed(6);
  return [west, south, east, north].join(',');
}

async function fetchPlaceSuggestions(query, limit = 5) {
  const keyword = String(query || "").trim();
  if (!keyword) return [];

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=${limit}&q=${encodeURIComponent(keyword)}`
  );
  const results = await response.json();
  if (!Array.isArray(results)) return [];

  return results.map((item) => ({
    label: item.display_name,
    lat: Number(item.lat),
    lng: Number(item.lon),
  }));
}

function LeafletMap({ items, center, height = 420, chip = 'TP.HCM · GIS MAP', onBoundsChange, heatMode = false, radiusKm = 0, showRadius = false }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef({ markers: null, heat: null, radius: null });
  const suppressMoveRef = useRef(false);
  const previousCenterRef = useRef(null);
  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();

  useEffect(() => {
    let disposed = false;
    async function boot() {
      await loadStyle(LEAFLET_CSS, 'leaflet-css');
      await Promise.all([
        loadScript(LEAFLET_JS, 'leaflet-js'),
        loadScript(MARKERCLUSTER_JS, 'leaflet-cluster-js'),
        loadScript(HEAT_JS, 'leaflet-heat-js'),
      ]);
      if (disposed || !containerRef.current || !window.L || mapRef.current) return;
      const map = window.L.map(containerRef.current, {
        scrollWheelZoom: false,
        zoomControl: false,
      }).setView([center.lat, center.lng], 12);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);
      mapRef.current = map;
      const sync = () => {
        if (suppressMoveRef.current) {
          suppressMoveRef.current = false;
          return;
        }
        onBoundsChange?.(boundsToBbox(map.getBounds()));
      };
      map.on('moveend', sync);
      sync();
    }
    boot();
    return () => {
      disposed = true
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.L) return;
    const prev = layersRef.current;
    if (prev.markers) prev.markers.remove();
    if (prev.heat) prev.heat.remove();
    if (prev.radius) prev.radius.remove();

    const cluster = window.L.markerClusterGroup ? window.L.markerClusterGroup() : window.L.layerGroup();
    const heatPoints = [];
    (items || []).forEach((item, index) => {
      const lat = Number(item.lat ?? item.latitude);
      const lng = Number(item.lng ?? item.lon ?? item.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const marker = window.L.marker([lat, lng]);
      marker.bindPopup(buildPropertyPopup(item, index), {
        className: "map-property-popup-shell",
        maxWidth: 300,
      });
      cluster.addLayer(marker);
      heatPoints.push([lat, lng, 1]);
    });
    cluster.addTo(map);
    layersRef.current.markers = cluster;

    if (heatMode && window.L.heatLayer && heatPoints.length) {
      const heat = window.L.heatLayer(heatPoints, { radius: 25, blur: 18, maxZoom: 17 });
      heat.addTo(map);
      layersRef.current.heat = heat;
    }

    if (showRadius && Number.isFinite(center?.lat) && Number.isFinite(center?.lng) && radiusKm > 0) {
      const radius = window.L.circle([center.lat, center.lng], {
        radius: radiusKm * 1000,
        color: '#c59d4f',
        weight: 2,
        fillColor: '#d4b06a',
        fillOpacity: 0.14,
      }).addTo(map);

      layersRef.current.radius = radius;
      suppressMoveRef.current = true;
      map.fitBounds(radius.getBounds(), { padding: [24, 24] });
      previousCenterRef.current = {
        lat: center.lat,
        lng: center.lng,
      };
    } else if (Number.isFinite(center?.lat) && Number.isFinite(center?.lng)) {
      const previousCenter = previousCenterRef.current;
      const centerChanged =
        !previousCenter ||
        Math.abs(previousCenter.lat - center.lat) > 0.000001 ||
        Math.abs(previousCenter.lng - center.lng) > 0.000001;

      if (!centerChanged) {
        return;
      }

      suppressMoveRef.current = true;
      map.setView([center.lat, center.lng], map.getZoom());
      previousCenterRef.current = {
        lat: center.lat,
        lng: center.lng,
      };
    }
  }, [items, heatMode, center?.lat, center?.lng, radiusKm, showRadius]);

  return (
    <div className="gis-map-box leaflet-box" style={{ height }}>
      <div ref={containerRef} className="leaflet-map" />
      <div className="gis-map-overlay" />
      <div className="gis-map-chip">{chip}</div>
      <div className="gis-map-zoom" aria-label="Điều khiển zoom bản đồ">
        <button type="button" className="gis-map-zoom-btn" onClick={handleZoomIn} aria-label="Phóng to bản đồ">+</button>
        <button type="button" className="gis-map-zoom-btn" onClick={handleZoomOut} aria-label="Thu nhỏ bản đồ">-</button>
      </div>
    </div>
  );
}


function PropertyCard({
  property,
  compact = false,
  onDelete,
  onWishlist,
  onCompare,
  compareActive = false,
  wishlistActive,
  canManageStatus = false,
  onStageChange,
  canDelete = false,
}) {
  const p = normalizeProperty(property);
  return (
    <article className="listing-card">
      <div className="listing-media" style={{ backgroundImage: `url(${p.imageUrl})` }}>
        <span className="listing-badge">{p.statusText}</span>
      </div>
      <div className="listing-body">
        <div className="listing-price">{p.priceText}</div>
        <h3>{p.title}</h3>
        <p className="listing-address">📍 {p.address}</p>
        {!compact && <p className="listing-desc">{stripHtmlTags(p.description || p.desc)}</p>}
        <div className="listing-meta">
          <span><strong>{p.area}</strong> m²</span>
          <span><strong>{p.typeText}</strong></span>
          <span><strong>{p.agentName}</strong></span>
        </div>
        {canManageStatus && onStageChange && (
          <div className="property-status-admin-row">
            {[
              { value: "active", label: "Đang bán" },
              { value: "sold", label: "Đã bán" },
              { value: "hidden", label: "Đã ẩn" },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                className={`status-mini-chip ${property.listing_status === item.value ? "active" : ""}`}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onStageChange(property, item.value);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
        <div className="listing-actions">

  <a
    className="btn-geo-primary"
      href={`/property-detail/${p.id}`}  >
    Chi tiết
  </a>

  {onCompare && (
    <button
      type="button"
      className="btn-geo-secondary"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onCompare(property);
      }}
    >
      {compareActive ? "Mở so sánh" : "So sánh"}
    </button>
  )}

  {onWishlist && (
  <button
    type="button"
    className="btn-geo-secondary"
    onClick={(event) => {
      event.preventDefault();
      event.stopPropagation();
      onWishlist(property);
    }}
  >
    {wishlistActive
      ? "Bỏ lưu"
      : "Lưu tin"}
  </button>
)}


</div>
      </div>
    </article>
  );
}

function FilterPanel({ filters, onChange, onSubmit, onReset }) {
  const activeFilterCount = [
    filters.type,
    filters.status,
    filters.q,
    filters.priceMin,
    filters.priceMax,
    filters.areaMin,
    filters.areaMax,
  ].filter(Boolean).length;

  return (
    <aside className="filter-panel ui-control-surface is-soft">
      <div className="filter-head">
        <span>⚙️ Bộ lọc</span>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onReset}>Xóa tất cả</button>
      </div>
      <div className="filter-summary-row">
        <span className="filter-summary-pill">{activeFilterCount} bộ lọc đang bật</span>
        <span className="filter-summary-text">Tối ưu theo nhu cầu, ngân sách và diện tích.</span>
      </div>
      <form onSubmit={onSubmit}>
        <div className="filter-section">
          <label>Loại bất động sản</label>
          <div className="chip-group">
            {[
              { value: "", label: "🏘️ Tất cả" },
              { value: "apartment", label: "🏢 Căn hộ" },
              { value: "house", label: "🏠 Nhà" },
              { value: "land", label: "🌿 Đất" },
            ].map((item) => (
              <button
                key={item.value || 'all'}
                type="button"
                className={`chip ${filters.type === item.value ? 'active' : ''}`}
                onClick={() => onChange('type', item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <label>Từ khóa</label>
          <input className="form-control" value={filters.q} onChange={(e) => onChange('q', e.target.value)} placeholder="Tiêu đề, địa chỉ..." />
        </div>

        <div className="filter-section">
          <label>Khoảng giá</label>
          <div className="range-inputs">
            <input className="form-control" value={filters.priceMin} onChange={(e) => onChange('priceMin', e.target.value)} type="number" placeholder="Tối thiểu" />
            <input className="form-control" value={filters.priceMax} onChange={(e) => onChange('priceMax', e.target.value)} type="number" placeholder="Tối đa" />
          </div>
        </div>

        <div className="filter-section">
          <label>Diện tích</label>
          <div className="range-inputs">
            <input className="form-control" value={filters.areaMin} onChange={(e) => onChange('areaMin', e.target.value)} type="number" placeholder="Từ m²" />
            <input className="form-control" value={filters.areaMax} onChange={(e) => onChange('areaMax', e.target.value)} type="number" placeholder="Đến m²" />
          </div>
        </div>

        <div className="filter-section">
          <label>Trạng thái</label>
          <div className="chip-group">
            {[
              { value: "", label: "Tất cả" },
              { value: "active", label: "Đang bán" },
              { value: "sold", label: "Đã bán" },
              { value: "hidden", label: "Đã ẩn" },
              { value: "pending", label: "Chờ duyệt" },
            ].map((item) => (
              <button
                key={item.value || "all-status"}
                type="button"
                className={`chip ${filters.status === item.value ? "active" : ""}`}
                onClick={() => onChange("status", item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="ui-inline-actions mt-3">
          <button type="submit" className="apply-filter btn btn-primary">Áp dụng bộ lọc</button>
          <button type="button" className="btn btn-outline-secondary" onClick={onReset}>Đặt lại nhanh</button>
        </div>
      </form>
    </aside>
  );
}

function PropertyCardSkeleton() {
  return (
    <article className="listing-card">
      <div className="listing-media ui-skeleton" />
      <div className="listing-body ui-section-stack">
        <span className="ui-skeleton ui-skeleton-line" style={{ width: "34%" }}></span>
        <span className="ui-skeleton ui-skeleton-line" style={{ width: "72%", minHeight: 22 }}></span>
        <span className="ui-skeleton ui-skeleton-line" style={{ width: "56%" }}></span>
        <div className="listing-meta">
          <span className="ui-skeleton ui-skeleton-chip" style={{ width: 76 }}></span>
          <span className="ui-skeleton ui-skeleton-chip" style={{ width: 90 }}></span>
          <span className="ui-skeleton ui-skeleton-chip" style={{ width: 110 }}></span>
        </div>
        <div className="listing-actions">
          <span className="ui-skeleton ui-skeleton-button" style={{ flex: 1 }}></span>
          <span className="ui-skeleton ui-skeleton-button" style={{ flex: 1 }}></span>
          <span className="ui-skeleton ui-skeleton-button" style={{ flex: 1 }}></span>
        </div>
      </div>
    </article>
  );
}

function PaginationControls({ pagination, onPageChange, loading }) {
  if (!pagination || pagination.totalPages <= 1) return null;

  const currentPage = pagination.page || 1;
  const totalPages = pagination.totalPages || 1;
  const pages = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  return (
    <nav className="pagination-bar d-flex align-items-center flex-wrap gap-2" aria-label="Phan trang bat dong san">
      <button type="button" className="btn-geo-secondary btn btn-outline-secondary" onClick={() => onPageChange(currentPage - 1)} disabled={!pagination.hasPrev || loading}>
        Trước
      </button>
      {start > 1 && (
        <>
          <button type="button" className={`page-chip ${currentPage === 1 ? "active" : ""}`} onClick={() => onPageChange(1)} disabled={loading}>
            1
          </button>
          {start > 2 && <span className="pagination-ellipsis">...</span>}
        </>
      )}
      {pages.map((page) => (
        <button key={page} type="button" className={`page-chip ${currentPage === page ? "active" : ""}`} onClick={() => onPageChange(page)} disabled={loading}>
          {page}
        </button>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="pagination-ellipsis">...</span>}
          <button type="button" className={`page-chip ${currentPage === totalPages ? "active" : ""}`} onClick={() => onPageChange(totalPages)} disabled={loading}>
            {totalPages}
          </button>
        </>
      )}
      <button type="button" className="btn-geo-secondary btn btn-outline-secondary" onClick={() => onPageChange(currentPage + 1)} disabled={!pagination.hasNext || loading}>
        Sau
      </button>
    </nav>
  );
}

export function PropertyListPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const resultsRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = currentUser?.role === "admin";
  const canCreateProperty = ["agent", "admin"].includes(currentUser?.role);
  const [items, setItems] = useState(fallbackProperties);
  const [actionMessage, setActionMessage] = useState("");
  const [mapData, setMapData] = useState({ items: [], center: { lat: 10.7769, lng: 106.7009 } });
  const [loading, setLoading] = useState(false);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [compareIds, setCompareIds] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [heatMode, setHeatMode] = useState(false);
  const [bbox, setBbox] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 12, totalItems: fallbackProperties.length, totalPages: 1, hasPrev: false, hasNext: false });
  const [filters, setFilters] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      type: params.get("type") || "",
      status: params.get("status") || "",
      q: params.get("q") || "",
      priceMin: params.get("priceMin") || "",
      priceMax: params.get("priceMax") || "",
      areaMin: params.get("areaMin") || "",
      areaMax: params.get("areaMax") || "",
      sort: params.get("sort") || "newest",
    };
  });

  usePageMeta({
    title: "Danh sách bất động sản | GeoEstate",
    description: "Khám phá bất động sản bằng bộ lọc thông minh, bản đồ khu vực, tiện ích lân cận và danh sách được đồng bộ trực tiếp từ hệ thống.",
  });

  const syncCollections = async () => {
    const token = api.getToken();
    const [wishlist, compare, searches] = await Promise.all([
      token ? api.wishlist() : [],
      token ? api.compare() : [],
      api.savedSearches(),
    ]);
    setWishlistIds(Array.isArray(wishlist) ? wishlist.map((item) => item.id) : []);
    setCompareIds(Array.isArray(compare) ? compare.map((item) => item.id) : []);
    setSavedSearches(Array.isArray(searches) ? searches : []);
  };

  const loadItems = async (
    nextFilters = filters,
    nextBbox = bbox,
    nextPage = pagination.page || 1
  ) => {
    setLoading(true);

    const query = {
      type: nextFilters.type || undefined,
      status: nextFilters.status || undefined,
      q: nextFilters.q || undefined,
      priceMin: nextFilters.priceMin || undefined,
      priceMax: nextFilters.priceMax || undefined,
      areaMin: nextFilters.areaMin || undefined,
      areaMax: nextFilters.areaMax || undefined,
      sort: nextFilters.sort || "newest",
      bbox: nextBbox || undefined,
      page: nextPage,
      limit: 12,
    };

    const [propertyPage, map] = await Promise.all([
      api.propertiesPage(query),
      api.mapData({
        ...query,
        limit: 200,
      }),
    ]);

    if (propertyPage && Array.isArray(propertyPage.items)) {
      setItems(propertyPage.items);
      setPagination(
        propertyPage.pagination || {
          page: 1,
          limit: query.limit,
          totalItems: propertyPage.items.length,
          totalPages: 1,
          hasPrev: false,
          hasNext: false,
        }
      );
    } else {
      setItems(fallbackProperties);
      setPagination({
        page: 1,
        limit: fallbackProperties.length,
        totalItems: fallbackProperties.length,
        totalPages: 1,
        hasPrev: false,
        hasNext: false,
      });
    }

    if (map) {
      setMapData(map);
    }

    setLoading(false);
  };

useEffect(() => {

  const init = async () => {
    const params = new URLSearchParams(location.search);
    const nextFilters = {
      type: params.get("type") || "",
      status: params.get("status") || "",
      q: params.get("q") || "",
      priceMin: params.get("priceMin") || "",
      priceMax: params.get("priceMax") || "",
      areaMin: params.get("areaMin") || "",
      areaMax: params.get("areaMax") || "",
      sort: params.get("sort") || "newest",
    };

    setFilters(nextFilters);
    await loadItems(nextFilters, "", 1);
    await syncCollections();
  };

  init();

}, [location.search]);

  const handleChange = (field, value) => {
    const updated = {
      ...filters,
      [field]: value,
    };

    setFilters(updated);
  };
  const scrollToResults = () => {
    window.requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    await loadItems(filters, bbox, 1);
    scrollToResults();
  };
  const handleReset = () => {
    const cleared = { type: "", status: "", q: "", priceMin: "", priceMax: "", areaMin: "", areaMax: "", sort: "newest" };
    setFilters(cleared);
    setBbox('');
    loadItems(cleared, '', 1);
  };
  const handleDelete = async (property) => {
    setActionMessage("");
    const result = await api.deleteProperty(property.id);
    if (result?.ok) {
      setItems((prev) => prev.filter((item) => item.id !== property.id));
      setActionMessage(`Đã xóa tin "${property.title}".`);
      return;
    }
    setActionMessage(`Chưa xóa được tin "${property.title}".`);
  };
  const handleStageChange = async (property, nextStatus) => {
    if (property.listing_status === nextStatus) return;
    setActionMessage("");
    const result = await api.updatePropertyStage(property.id, { listing_status: nextStatus });
    if (result?.id) {
      setActionMessage(`Đã chuyển "${property.title}" sang ${nextStatus === "active" ? "Đang bán" : nextStatus === "sold" ? "Đã bán" : "Đã ẩn"}.`);
      await loadItems(filters, bbox, pagination.page);
      return;
    }
    setActionMessage(`Chưa cập nhật được trạng thái cho "${property.title}".`);
  };
  const openWishlistForProperty = async (property) => {
    if (wishlistIds.includes(property.id)) {
      const result = await api.toggleWishlist(property.id);
      if (result?.ids) setWishlistIds(result.ids);
      return;
    }

    const result = await api.toggleWishlist(property.id);
    if (result?.ids) {
      setWishlistIds(result.ids);
      navigate("/wishlist");
    }
  };
  const toggleCompare = async (property) => {
    const result = await api.toggleCompare(property.id);
    if (result?.ids) setCompareIds(result.ids);
  };
  const openCompareForProperty = async (property) => {
    if (compareIds.includes(property.id)) {
      navigate("/compare");
      return;
    }

    const result = await api.toggleCompare(property.id);
    if (result?.ids) {
      setCompareIds(result.ids);
      navigate("/compare");
    }
  };
  const saveSearch = async () => {
    const result = await api.createSavedSearch({ name: filters.q ? `Tìm: ${filters.q}` : 'Bộ lọc hiện tại', filters: { ...filters, bbox } });
    if (result?.id) {
      setSavedSearches((prev) => [result, ...prev]);
      navigate("/wishlist");
    }
  };

  return (
    <div className="property-page">
      <PageHero
        eyebrow="Danh sách bất động sản"
        title="Khám phá bất động sản"
        actions={
          <>
            {canCreateProperty && <a href="/properties/create" className="btn-geo-secondary btn btn-outline-secondary">Đăng tin mới</a>}
            <a href="/nearby" className="btn-geo-secondary btn btn-outline-secondary">Tìm quanh đây</a>
            <a href="/compare" className="btn-geo-primary btn btn-primary">So sánh hiện tại</a>
            {currentUser && <button type="button" className="btn-geo-secondary btn btn-outline-secondary" onClick={saveSearch}>Lưu bộ lọc</button>}
          </>
        }
      />
      <div className="container list-layout">
        <FilterPanel filters={filters} onChange={handleChange} onSubmit={handleSubmit} onReset={handleReset} />
        <main className="results-stack">
          <section className="map-card">
            <div className="map-card-header">
              <div>
                <div className="map-card-title">Khám phá bản đồ</div>
                <p>
                  {mapData.items.length} tin trên bản đồ
                  {bbox ? " · đang quét theo vùng bạn chọn" : " · kéo bản đồ để khám phá thêm khu vực"}
                </p>
              </div>
              <div className="map-card-actions">
                <button type="button" onClick={() => loadItems(filters, bbox, pagination.page)}>Quét lại</button>
                <button type="button" onClick={() => setHeatMode((prev) => !prev)}>{heatMode ? 'Tắt nhiệt' : 'Bản đồ nhiệt'}</button>
                <button type="button" onClick={handleReset}>Reset bản đồ</button>
              </div>
            </div>
            <LeafletMap
              items={mapData.items}
              center={mapData.center}
              chip=""
              heatMode={heatMode}
              onBoundsChange={(nextBbox) => {
                if (!nextBbox || nextBbox === bbox) return;
                setBbox(nextBbox);
                loadItems(filters, nextBbox, 1);
              }}
            />
          </section>

          <div className="results-topbar" ref={resultsRef}>
            <div>
              <span className="results-num">{pagination.totalItems}</span>
              <span className="results-label"> bất động sản phù hợp</span>
              {loading && <span className="results-label"> · đang tải</span>}
            </div>
            <div className="sort-chip-row" role="tablist" aria-label="Sắp xếp bất động sản">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`sort-chip ${filters.sort === option.value ? "active" : ""}`}
                  onClick={() => {
                    const nextFilters = {
                      ...filters,
                      sort: option.value,
                    };
                    setFilters(nextFilters);
                    loadItems(nextFilters, bbox, 1);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          {actionMessage && <p className="muted-line">{actionMessage}</p>}

          <div className="property-card-list">
            {loading
              ? Array.from({ length: 6 }, (_, index) => <PropertyCardSkeleton key={`property-skeleton-${index}`} />)
              : items.map((property) => (
              <PropertyCard
                property={property}
                key={property.id}
                onDelete={isAdmin ? handleDelete : undefined}
                canDelete={isAdmin}
                onWishlist={currentUser ? openWishlistForProperty : undefined}
                wishlistActive={wishlistIds.includes(property.id)}
                onCompare={openCompareForProperty}
                compareActive={compareIds.includes(property.id)}
                canManageStatus={false}
                onStageChange={undefined}
              />
            ))}
          </div>
          {!items.length && !loading && <div className="empty-state-panel">Không có bất động sản phù hợp với bộ lọc hiện tại.</div>}
          <div className="results-footer">
            <PaginationControls pagination={pagination} loading={loading} onPageChange={(page) => loadItems(filters, bbox, page)} />
          </div>
          {savedSearches.length > 0 && (
            <section className="map-card">
              <div className="map-card-header">
                <div>
                  <div className="map-card-title">Bộ lọc đã lưu</div>
                  <p>{savedSearches.length} bộ lọc</p>
                </div>
              </div>
              <div className="row g-3">
                {savedSearches.map((item) => (
                  <div className="col-12 col-md-6 col-xl-4" key={item.id}>
                    <article className="amenity-card h-100">
                      <h6>{item.name}</h6>
                      <p className="listing-desc">
                        {Object.entries(item.filters || {})
                          .filter(([, value]) => value)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(" · ") || "Không có điều kiện"}
                      </p>
                      <div className="listing-actions">
                        <button
                          type="button"
                          className="btn-geo-secondary btn btn-outline-secondary"
                          onClick={async () => {
                            await api.deleteSavedSearch(item.id);
                            setSavedSearches((prev) => prev.filter((row) => row.id !== item.id));
                          }}
                        >
                          Xóa
                        </button>
                      </div>
                    </article>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export function NearbySearchPage() {
  const [center, setCenter] = useState({ lat: 10.7769, lng: 106.7009 });
  const [radiusKm, setRadiusKm] = useState(5);
  const [items, setItems] = useState(fallbackProperties);
  const [loading, setLoading] = useState(false);
  const [locationMode, setLocationMode] = useState("current");
  const [placeQuery, setPlaceQuery] = useState("");
  const [locationLabel, setLocationLabel] = useState("TP.HCM");
  const [locationMessage, setLocationMessage] = useState("");
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [placeSuggesting, setPlaceSuggesting] = useState(false);

  const search = async (payload = { center, radiusKm }) => {
    setLoading(true);
    const data = await api.nearbyProperties({ lat: payload.center.lat, lng: payload.center.lng, radiusKm: payload.radiusKm, limit: 30 });
    if (Array.isArray(data?.items)) {
      setItems(data.items);
      if (data.items.length) {
        setLocationMessage("");
      } else {
        setLocationMessage("Không có bất động sản nào trong bán kính đã chọn.");
      }
    } else {
      setItems([]);
      setLocationMessage("Không tải được dữ liệu bất động sản gần đây.");
    }
    setLoading(false);
  };

  async function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationMessage("Trình duyệt này chưa hỗ trợ lấy vị trí hiện tại.");
      return;
    }

    setLoading(true);
    setLocationMessage("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextCenter = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setCenter(nextCenter);
        setLocationLabel("Vị trí hiện tại");
        setLoading(false);
        await search({ center: nextCenter, radiusKm });
      },
      () => {
        setLoading(false);
        setLocationMessage("Không lấy được vị trí hiện tại. Hãy kiểm tra quyền truy cập vị trí.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }

  async function useSpecificPlace() {
    const keyword = placeQuery.trim();

    if (!keyword) {
      setLocationMessage("Vui lòng nhập địa điểm cụ thể.");
      return;
    }

    setLoading(true);
    setLocationMessage("");

    try {
      const data = await fetchPlaceSuggestions(keyword, 1);
      const first = data?.[0];

      if (!first) {
        setLocationMessage("Không tìm thấy địa điểm phù hợp.");
        setLoading(false);
        return;
      }

      const nextCenter = {
        lat: Number(first.lat),
        lng: Number(first.lng),
      };

      setCenter(nextCenter);
      setLocationLabel(first.label || keyword);
      setPlaceSuggestions([]);
      setLoading(false);
      await search({ center: nextCenter, radiusKm });
    } catch {
      setLoading(false);
      setLocationMessage("Không tra cứu được địa điểm lúc này.");
    }
  }

useEffect(() => {

  const init = async () => {

    await search();

  };

  init();

}, []);

useEffect(() => {
  if (locationMode !== "manual") {
    setPlaceSuggestions([]);
    setPlaceSuggesting(false);
    return;
  }

  const keyword = placeQuery.trim();
  if (keyword.length < 2) {
    setPlaceSuggestions([]);
    setPlaceSuggesting(false);
    return;
  }

  let active = true;
  setPlaceSuggesting(true);
  const timer = window.setTimeout(async () => {
    try {
      const suggestions = await fetchPlaceSuggestions(keyword, 5);
      if (active) {
        setPlaceSuggestions(suggestions);
      }
    } catch {
      if (active) {
        setPlaceSuggestions([]);
      }
    } finally {
      if (active) {
        setPlaceSuggesting(false);
      }
    }
  }, 250);

  return () => {
    active = false;
    window.clearTimeout(timer);
  };
}, [locationMode, placeQuery]);

  return (
    <div className="property-page">
      <PageHero title="Tìm kiếm quanh đây" desc="Chọn vị trí hiện tại hoặc nhập địa điểm cụ thể để tìm bất động sản lân cận." />
      <div className="container search-panel-wrap">
        <form
          className="search-panel"
          onSubmit={(e) => {
            e.preventDefault();
            if (locationMode === "current") {
              useCurrentLocation();
              return;
            }
            useSpecificPlace();
          }}
        >
          <div className="form-group">
            <label>Chế độ vị trí</label>
            <select value={locationMode} onChange={(e) => setLocationMode(e.target.value)}>
              <option value="current">Vị trí hiện tại</option>
              <option value="manual">Nhập địa điểm cụ thể</option>
            </select>
          </div>
          <div className="form-group">
            <label>{locationMode === "current" ? "Điểm xuất phát" : "Địa điểm cụ thể"}</label>
            {locationMode === "current" ? (
              <div className="search-static-field">Dùng GPS của thiết bị để lấy vị trí hiện tại</div>
            ) : (
              <div className="search-autocomplete">
                <input
                  value={placeQuery}
                  onChange={(e) => setPlaceQuery(e.target.value)}
                  type="text"
                  placeholder="Ví dụ: Landmark 81, Bình Thạnh"
                />
                {(placeSuggesting || placeSuggestions.length > 0) && (
                  <div className="search-suggestion-list">
                    {placeSuggesting && !placeSuggestions.length ? (
                      <button type="button" className="search-suggestion-item muted" disabled>
                        Đang gợi ý địa điểm...
                      </button>
                    ) : (
                      placeSuggestions.map((item) => (
                        <button
                          key={`${item.lat}-${item.lng}-${item.label}`}
                          type="button"
                          className="search-suggestion-item"
                          onClick={async () => {
                            setPlaceQuery(item.label);
                            setPlaceSuggestions([]);
                            setCenter({ lat: item.lat, lng: item.lng });
                            setLocationLabel(item.label);
                            setLocationMessage("");
                            await search({ center: { lat: item.lat, lng: item.lng }, radiusKm });
                          }}
                        >
                          {item.label}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Bán kính: <span className="gold-text">{radiusKm}</span> km</label>
            <input type="range" min="1" max="20" value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} />
          </div>
          <button type="submit" className="btn-geo-primary search-submit">{loading ? 'Đang tìm...' : 'Tìm kiếm'}</button>
        </form>
        <div className="search-location-summary">
          <strong>Đang tìm quanh:</strong> {locationLabel}
          {locationMessage && <p className="muted-line">{locationMessage}</p>}
        </div>
      </div>
      <main className="container page-body">
        <LeafletMap items={items} center={center} height={500} chip={`${locationLabel} · ${radiusKm} KM`} heatMode={false} radiusKm={radiusKm} showRadius />
        <div className="section-topline">
          <h2 className="section-heading">Kết quả tìm kiếm</h2>
          <span className="stat-pill">{items.length} bất động sản trong vùng đệm</span>
        </div>
        {loading && <div className="empty-state-panel">Đang tìm bất động sản quanh khu vực bạn chọn...</div>}
        {!loading && !items.length && <div className="empty-state-panel">Chưa có bất động sản phù hợp trong vùng tìm kiếm này.</div>}
        <div className="property-card-list compact-list">
          {items.map((property) => (
            <div key={property.id}>
              <PropertyCard property={property} compact />
              {property.distance_km !== undefined && <p className="muted-line">Cách tâm: {property.distance_km} km</p>}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export function AmenitySearchPage() {
  const [center, setCenter] = useState({ lat: 10.7769, lng: 106.7009 });
  const [radiusKm, setRadiusKm] = useState(3);
  const [items, setItems] = useState(fallbackAmenities);
  const [loading, setLoading] = useState(false);
  const [locationMode, setLocationMode] = useState("current");
  const [placeQuery, setPlaceQuery] = useState("");
  const [locationLabel, setLocationLabel] = useState("Vị trí hiện tại");
  const [locationMessage, setLocationMessage] = useState("");
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [placeSuggesting, setPlaceSuggesting] = useState(false);

  const search = async (targetCenter = center, nextLabel = locationLabel) => {
    setLoading(true);
    setLocationLabel(nextLabel);
    const data = await api.nearbyAmenities({ lat: targetCenter.lat, lng: targetCenter.lng, radiusKm, limit: 50 });
    if (data?.items?.length) setItems(data.items);
    else setItems([]);
    setLoading(false);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage("Thiết bị này không hỗ trợ lấy vị trí hiện tại.");
      return;
    }

    setLocationMessage("Đang lấy vị trí hiện tại...");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextCenter = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setCenter(nextCenter);
        setLocationMessage("Đã xác định vị trí hiện tại của bạn.");
        await search(nextCenter, "Vị trí hiện tại");
      },
      () => {
        setLocationMessage("Không thể lấy vị trí hiện tại. Hãy kiểm tra quyền truy cập vị trí của trình duyệt.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const useSpecificPlace = async () => {
    const keyword = placeQuery.trim();
    if (!keyword) {
      setLocationMessage("Hãy nhập địa điểm cụ thể để tìm tiện ích.");
      return;
    }

    setLoading(true);
    setLocationMessage("Đang tìm vị trí từ địa điểm bạn nhập...");

    try {
      const results = await fetchPlaceSuggestions(keyword, 1);
      const first = Array.isArray(results) ? results[0] : null;

      if (!first) {
        setLocationMessage("Không tìm thấy địa điểm phù hợp. Bạn thử nhập cụ thể hơn nhé.");
        setLoading(false);
        return;
      }

      const nextCenter = {
        lat: Number(first.lat),
        lng: Number(first.lng),
      };
      const nextLabel = first.label || keyword;

      setCenter(nextCenter);
      setLocationMessage("Đã chuyển sang vị trí bạn chọn.");
      setPlaceSuggestions([]);
      await search(nextCenter, nextLabel);
    } catch {
      setLocationMessage("Không thể tra cứu địa điểm lúc này. Bạn thử lại sau giúp mình.");
      setLoading(false);
    }
  };

useEffect(() => {

  const init = async () => {

    await search();

  };

  init();

}, []);

useEffect(() => {
  if (locationMode !== "manual") {
    setPlaceSuggestions([]);
    setPlaceSuggesting(false);
    return;
  }

  const keyword = placeQuery.trim();
  if (keyword.length < 2) {
    setPlaceSuggestions([]);
    setPlaceSuggesting(false);
    return;
  }

  let active = true;
  setPlaceSuggesting(true);
  const timer = window.setTimeout(async () => {
    try {
      const suggestions = await fetchPlaceSuggestions(keyword, 5);
      if (active) {
        setPlaceSuggestions(suggestions);
      }
    } catch {
      if (active) {
        setPlaceSuggestions([]);
      }
    } finally {
      if (active) {
        setPlaceSuggesting(false);
      }
    }
  }, 250);

  return () => {
    active = false;
    window.clearTimeout(timer);
  };
}, [locationMode, placeQuery]);

  return (
    <div className="property-page">
      <PageHero title="Tiện ích khu vực" desc="Chọn vị trí hiện tại hoặc nhập địa điểm cụ thể để xem tiện ích lân cận." />
      <div className="container search-panel-wrap">
        <form
          className="search-panel amenities-panel"
          onSubmit={(e) => {
            e.preventDefault();
            if (locationMode === "current") {
              useCurrentLocation();
              return;
            }
            useSpecificPlace();
          }}
        >
          <div className="form-group">
            <label>Chế độ vị trí</label>
            <select value={locationMode} onChange={(e) => setLocationMode(e.target.value)}>
              <option value="current">Vị trí hiện tại</option>
              <option value="manual">Nhập địa điểm cụ thể</option>
            </select>
          </div>
          <div className="form-group">
            <label>{locationMode === "current" ? "Điểm xuất phát" : "Địa điểm cụ thể"}</label>
            {locationMode === "current" ? (
              <div className="search-static-field">Dùng GPS của thiết bị để lấy vị trí hiện tại</div>
            ) : (
              <div className="search-autocomplete">
                <input
                  value={placeQuery}
                  onChange={(e) => setPlaceQuery(e.target.value)}
                  type="text"
                  placeholder="Ví dụ: Chợ Bến Thành, Quận 1"
                />
                {(placeSuggesting || placeSuggestions.length > 0) && (
                  <div className="search-suggestion-list">
                    {placeSuggesting && !placeSuggestions.length ? (
                      <button type="button" className="search-suggestion-item muted" disabled>
                        Đang gợi ý địa điểm...
                      </button>
                    ) : (
                      placeSuggestions.map((item) => (
                        <button
                          key={`${item.lat}-${item.lng}-${item.label}`}
                          type="button"
                          className="search-suggestion-item"
                          onClick={async () => {
                            setPlaceQuery(item.label);
                            setPlaceSuggestions([]);
                            setCenter({ lat: item.lat, lng: item.lng });
                            setLocationLabel(item.label);
                            setLocationMessage("");
                            await search({ lat: item.lat, lng: item.lng }, item.label);
                          }}
                        >
                          {item.label}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Bán kính: <span className="gold-text">{radiusKm}</span> km</label>
            <input type="range" min="1" max="10" value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} />
          </div>
          <button type="submit" className="btn-geo-primary search-submit">{loading ? 'Đang tìm...' : 'Tìm'}</button>
        </form>
        <div className="search-location-summary">
          <strong>Đang tìm quanh:</strong> {locationLabel}
          {locationMessage && <p className="muted-line">{locationMessage}</p>}
        </div>
      </div>
      <main className="container page-body">
        <LeafletMap items={items} center={center} height={450} chip={`${locationLabel} · ${radiusKm} KM`} heatMode={false} radiusKm={radiusKm} showRadius />
        {loading && <div className="empty-state-panel">Đang tải tiện ích quanh khu vực bạn chọn...</div>}
        {!loading && !items.length && <div className="empty-state-panel">Chưa có tiện ích nào trong bán kính hiện tại.</div>}
        <div className="amenity-grid">
          {items.map((amenity) => (
            <article className="amenity-card" key={amenity.id}>
              <h6>{amenity.type || amenity.amenity_type}</h6>
              <h3>{amenity.name}</h3>
              <p>{amenity.distance_km ? `${amenity.distance_km} km từ tâm tìm kiếm` : 'Trong vùng tìm kiếm'}</p>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}

export function ComparePage() {
  const [compareItems, setCompareItems] = useState(fallbackProperties.slice(0, 3));

  const refresh = async () => {
    const data = await api.compare();
    setCompareItems(Array.isArray(data) ? data.slice(0, 3) : []);
  };

  const handleRemoveCompare = async (property) => {
    const confirmed = window.confirm(
      "Bạn có muốn xóa bất động sản này khỏi danh sách so sánh không?"
    );

    if (!confirmed) return;

    setCompareItems((prev) =>
      prev.filter((item) => item.id !== property.id)
    );

    await api.removeCompare(property.id);
  };

useEffect(() => {

  const init = async () => {

    await refresh();

  };

  init();

}, []);

  return (
    <div className="property-page">
      <main className="container compare-page-body">
        <section className="compare-hero">
          <div>
            <p className="section-eyebrow">Khu vực so sánh</p>
            <h1 className="section-heading">So sánh bất động sản</h1>
          </div>
          <div className="compare-hero-pills">
            <span>Tối đa 3 tin</span>
            <span>{compareItems.length} tin đang so sánh</span>
            <span>Dữ liệu cập nhật theo backend</span>
          </div>
          <a className="btn-geo-secondary" href="/properties">← Quay lại danh sách</a>
        </section>

        {!compareItems.length ? (
          <div className="empty-state-panel">
            Chưa có bất động sản nào trong danh sách so sánh. Hãy bấm `So sánh` từ trang danh sách để thêm bài.
          </div>
        ) : (
          <>
            <div className="compare-grid">
              {compareItems.map((property) => {
                const p = normalizeProperty(property);
                return (
                  <article className="compare-card" key={property.id}>
                    <div className="compare-card-media" style={{ backgroundImage: `url(${p.imageUrl})` }} />
                    <div className="compare-card-body">
                      <h3>{property.title}</h3>
                      <div className="compare-card-badges">
                        <span>{p.typeText}</span>
                        <span>{p.statusText}</span>
                      </div>
                      <div className="compare-card-price">{p.priceText}</div>
                      <p>{property.description || property.desc}</p>
                      <div className="compare-card-meta">
                        <span>📐 {property.area} m²</span>
                        <span>👤 {p.agentName}</span>
                        <span>📍 {property.address}</span>
                      </div>
                      <div className="listing-actions">
                        <button
                          type="button"
                          className="btn-geo-secondary danger-btn"
                          onClick={() => handleRemoveCompare(property)}
                        >
                          Bỏ so sánh
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="compare-table-wrapper">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th>Thuộc tính</th>
                    {compareItems.map((property) => <th key={property.id}>{property.title}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr><th>Giá</th>{compareItems.map((p) => <td key={p.id}>{normalizeProperty(p).priceText}</td>)}</tr>
                  <tr><th>Diện tích</th>{compareItems.map((p) => <td key={p.id}>{p.area} m²</td>)}</tr>
                  <tr><th>Loại hình</th>{compareItems.map((p) => <td key={p.id}>{normalizeProperty(p).typeText}</td>)}</tr>
                  <tr><th>Vị trí</th>{compareItems.map((p) => <td key={p.id}>{p.address}</td>)}</tr>
                  <tr><th>Môi giới</th>{compareItems.map((p) => <td key={p.id}>{normalizeProperty(p).agentName}</td>)}</tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
