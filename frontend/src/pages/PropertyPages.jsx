import { useEffect, useRef, useState } from "react";
import { api, normalizeProperty } from "../api";
import "./PropertyPages.css";

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
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200&auto=format&fit=crop",
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
    image: "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200&auto=format&fit=crop",
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
    image: "https://images.unsplash.com/photo-1448630360428-65456885c650?q=80&w=1200&auto=format&fit=crop",
    desc: "Đất nền diện tích lớn, pháp lý rõ ràng, phù hợp xây nhà vườn hoặc đầu tư.",
  },
];

const fallbackAmenities = [
  { id: 1, type: "Trường học", name: "Trường THPT Nguyễn Thị Minh Khai", distance_km: 1.2 },
  { id: 2, type: "Bệnh viện", name: "Bệnh viện Nhi Đồng 2", distance_km: 2.1 },
  { id: 3, type: "Công viên", name: "Công viên Tao Đàn", distance_km: 0.95 },
  { id: 4, type: "Siêu thị", name: "Co.opmart Cống Quỳnh", distance_km: 1.7 },
];

function PageHero({ eyebrow, title, desc, actions }) {
  return (
    <section className="property-page-hero">
      <div className="container hero-row">
        <div>
          {eyebrow && <p className="page-eyebrow">{eyebrow}</p>}
          <h1 className="page-title">{title}</h1>
          {desc && <p className="page-desc">{desc}</p>}
        </div>
        {actions && <div className="hero-actions-right">{actions}</div>}
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

function LeafletMap({ items, center, height = 420, chip = 'TP.HCM · GIS MAP', onBoundsChange, heatMode = false }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef({ markers: null, heat: null });

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
      const map = window.L.map(containerRef.current, { scrollWheelZoom: false }).setView([center.lat, center.lng], 12);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);
      mapRef.current = map;
      const sync = () => onBoundsChange?.(boundsToBbox(map.getBounds()));
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

    const cluster = window.L.markerClusterGroup ? window.L.markerClusterGroup() : window.L.layerGroup();
    const heatPoints = [];
    (items || []).forEach((item) => {
      const lat = Number(item.lat ?? item.latitude);
      const lng = Number(item.lng ?? item.lon ?? item.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const marker = window.L.marker([lat, lng]);
      marker.bindPopup(`<strong>${item.title || item.name || 'Bất động sản'}</strong><br/>${item.address || ''}`);
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
  }, [items, heatMode]);

  return <div className="gis-map-box leaflet-box" style={{ height }}><div ref={containerRef} className="leaflet-map" /><div className="gis-map-overlay" /><div className="gis-map-chip">{chip}</div></div>;
}


function PropertyCard({ property, compact = false, onDelete, onWishlist, wishlistActive, onCompare, compareActive }) {
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
        {!compact && <p className="listing-desc">{p.description || p.desc}</p>}
        <div className="listing-meta">
          <span><strong>{p.area}</strong> m²</span>
          <span><strong>{p.typeText}</strong></span>
          <span><strong>{p.agentName}</strong></span>
        </div>
        <div className="listing-actions">

  <a
    className="btn-geo-primary"
    href={`/property-detail?id=${p.id}`}
  >
    Chi tiết
  </a>

  <a
    className="btn-geo-secondary"
    href="/compare"
  >
    So sánh
  </a>

  {onWishlist && (
  <button
    type="button"
    className="btn-geo-secondary"
    onClick={() => {

      if (!wishlistActive) {
        window.location.href = "/wishlist";
      }

      onWishlist(property);

    }}
  >
    {wishlistActive
      ? "Bỏ lưu"
      : "Lưu tin"}
  </button>
)}


  {onDelete && (
    <button
      type="button"
      className="btn-geo-secondary danger-btn"
      onClick={() => onDelete(property)}
    >
      Xóa
    </button>
  )}

</div>
      </div>
    </article>
  );
}

function FilterPanel({ filters, onChange, onSubmit, onReset }) {
  return (
    <aside className="filter-panel">
      <div className="filter-head">
        <span>⚙️ Bộ lọc</span>
        <button type="button" onClick={onReset}>Xóa tất cả</button>
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
          <input value={filters.q} onChange={(e) => onChange('q', e.target.value)} placeholder="Tiêu đề, địa chỉ..." />
        </div>

        <div className="filter-section">
          <label>Khoảng giá</label>
          <div className="range-inputs">
            <input value={filters.priceMin} onChange={(e) => onChange('priceMin', e.target.value)} type="number" placeholder="Tối thiểu" />
            <input value={filters.priceMax} onChange={(e) => onChange('priceMax', e.target.value)} type="number" placeholder="Tối đa" />
          </div>
        </div>

        <div className="filter-section">
          <label>Diện tích</label>
          <div className="range-inputs">
            <input value={filters.areaMin} onChange={(e) => onChange('areaMin', e.target.value)} type="number" placeholder="Từ m²" />
            <input value={filters.areaMax} onChange={(e) => onChange('areaMax', e.target.value)} type="number" placeholder="Đến m²" />
          </div>
        </div>

        <div className="filter-section">
          <label>Trạng thái</label>
          <select value={filters.status} onChange={(e) => onChange('status', e.target.value)}>
            <option value="">Tất cả</option>
            <option value="active">Đang bán</option>
            <option value="pending">Chờ duyệt</option>
            <option value="sold">Đã bán</option>
            <option value="hidden">Ẩn</option>
          </select>
        </div>

        <button type="submit" className="apply-filter">Áp dụng bộ lọc</button>
      </form>
    </aside>
  );
}

export function PropertyListPage() {
  const [items, setItems] = useState(fallbackProperties);
  const [mapData, setMapData] = useState({ items: [], center: { lat: 10.7769, lng: 106.7009 } });
  const [loading, setLoading] = useState(false);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [compareIds, setCompareIds] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [heatMode, setHeatMode] = useState(false);
  const [bbox, setBbox] = useState('');
  const [filters, setFilters] = useState({ type: "", status: "", q: "", priceMin: "", priceMax: "", areaMin: "", areaMax: "", sort: "newest" });

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
  nextBbox = bbox
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
    limit: 50,
  };

  let properties = await api.properties(query);

  /* FALLBACK FILTER */
  if (!properties || !properties.length) {
    properties = fallbackProperties;
  }

  let filtered = [...properties];

  /* TYPE */
  if (nextFilters.type) {
    filtered = filtered.filter(
      (item) =>
        item.property_type === nextFilters.type ||
        item.type === nextFilters.type
    );
  }

  /* KEYWORD */
  if (nextFilters.q) {
    const keyword =
      nextFilters.q.toLowerCase();

    filtered = filtered.filter(
      (item) =>
        item.title
          ?.toLowerCase()
          .includes(keyword) ||
        item.address
          ?.toLowerCase()
          .includes(keyword)
    );
  }

  /* PRICE */
  if (nextFilters.priceMin) {
    filtered = filtered.filter(
      (item) =>
        Number(item.price) >=
        Number(nextFilters.priceMin)
    );
  }

  if (nextFilters.priceMax) {
    filtered = filtered.filter(
      (item) =>
        Number(item.price) <=
        Number(nextFilters.priceMax)
    );
  }

  /* AREA */
  if (nextFilters.areaMin) {
    filtered = filtered.filter(
      (item) =>
        Number(item.area) >=
        Number(nextFilters.areaMin)
    );
  }

  if (nextFilters.areaMax) {
    filtered = filtered.filter(
      (item) =>
        Number(item.area) <=
        Number(nextFilters.areaMax)
    );
  }

  /* SORT */
  if (nextFilters.sort === "price_asc") {
    filtered.sort((a, b) => a.price - b.price);
  }

  if (nextFilters.sort === "price_desc") {
    filtered.sort((a, b) => b.price - a.price);
  }

  if (nextFilters.sort === "area_asc") {
    filtered.sort((a, b) => a.area - b.area);
  }

  setItems(filtered);

  const map = await api.mapData({
    ...query,
    limit: 200,
  });

  if (map) {
    setMapData(map);
  }

  setLoading(false);
};

  useEffect(() => {
    loadItems();
    syncCollections();
  }, []);

  const handleChange = (field, value) => {
  const updated = {
    ...filters,
    [field]: value,
  };

  setFilters(updated);

  loadItems(updated);
};
  const handleSubmit = (event) => { event.preventDefault(); loadItems(filters); };
  const handleReset = () => {
    const cleared = { type: "", status: "", q: "", priceMin: "", priceMax: "", areaMin: "", areaMax: "", sort: "newest" };
    setFilters(cleared);
    setBbox('');
    loadItems(cleared, '');
  };
  const handleDelete = async (property) => {
    if (!window.confirm(`Xóa tin "${property.title}"?`)) return;
    const result = await api.deleteProperty(property.id);
    if (result?.ok) setItems((prev) => prev.filter((item) => item.id !== property.id));
  };
  const toggleWishlist = async (property) => {
    const result = await api.toggleWishlist(property.id);
    if (result?.ids) setWishlistIds(result.ids);
  };
  const toggleCompare = async (property) => {
    const result = await api.toggleCompare(property.id);
    if (result?.ids) setCompareIds(result.ids);
  };
  const saveSearch = async () => {
    const result = await api.createSavedSearch({ name: filters.q ? `Tìm: ${filters.q}` : 'Bộ lọc hiện tại', filters: { ...filters, bbox } });
    if (result?.id) setSavedSearches((prev) => [result, ...prev]);
  };

  return (
    <div className="property-page">
      <PageHero
        eyebrow="Danh sách bất động sản"
        title="Khám phá bất động sản"
        desc="Danh sách, bản đồ và bộ lọc đang nối trực tiếp vào backend Node.js."
        actions={<><a href="/properties/create" className="btn-geo-secondary">Đăng tin mới</a><a href="/nearby" className="btn-geo-secondary">Tìm quanh đây</a><a href="/compare" className="btn-geo-primary">So sánh hiện tại</a><button type="button" className="btn-geo-secondary" onClick={saveSearch}>Lưu bộ lọc</button></>}
      />
      <div className="container list-layout">
        <FilterPanel filters={filters} onChange={handleChange} onSubmit={handleSubmit} onReset={handleReset} />
        <main className="results-stack">
          <section className="map-card">
            <div className="map-card-header">
              <div>
                <div className="map-card-title">Khám phá bản đồ</div>
                <p>{mapData.items.length} tin trên bản đồ · tâm {mapData.center.lat.toFixed(4)}, {mapData.center.lng.toFixed(4)}{bbox ? ` · bbox: ${bbox}` : ''}</p>
              </div>
              <div className="map-card-actions">
                <button type="button" onClick={() => loadItems(filters, bbox)}>Quét lại</button>
                <button type="button" onClick={() => setHeatMode((prev) => !prev)}>{heatMode ? 'Tắt nhiệt' : 'Bản đồ nhiệt'}</button>
                <button type="button" onClick={handleReset}>Reset bản đồ</button>
              </div>
            </div>
            <LeafletMap
              items={mapData.items}
              center={mapData.center}
              chip={`TP.HCM · ${mapData.items.length} tin`}
              heatMode={heatMode}
              onBoundsChange={(nextBbox) => {
                if (!nextBbox || nextBbox === bbox) return;
                setBbox(nextBbox);
                loadItems(filters, nextBbox);
              }}
            />
          </section>

          <div className="results-topbar">
            <div>
              <span className="results-num">{items.length}</span>
              <span className="results-label"> bất động sản phù hợp</span>
              {loading && <span className="results-label"> · đang tải</span>}
            </div>
            <select
  className="sort-select"
  value={filters.sort}
  onChange={(e) => {
    handleChange("sort", e.target.value);

    loadItems({
      ...filters,
      sort: e.target.value,
    });
  }}
>
              <option value="newest">Mới nhất</option>
              <option value="price_asc">Giá tăng dần</option>
              <option value="price_desc">Giá giảm dần</option>
              <option value="area_asc">Diện tích tăng dần</option>
            </select>
          </div>

          {savedSearches.length > 0 && <section className="map-card"><div className="map-card-header"><div><div className="map-card-title">Bộ lọc đã lưu</div><p>{savedSearches.length} bộ lọc</p></div></div><div className="amenity-grid">{savedSearches.map((item) => <article className="amenity-card" key={item.id}><h6>{item.name}</h6><p className="listing-desc">{Object.entries(item.filters || {}).filter(([, value]) => value).map(([key, value]) => `${key}: ${value}`).join(' · ') || 'Không có điều kiện'}</p><div className="listing-actions"><button type="button" className="btn-geo-secondary" onClick={async () => { await api.deleteSavedSearch(item.id); setSavedSearches((prev) => prev.filter((row) => row.id !== item.id)); }}>Xóa</button></div></article>)}</div></section>}

          <div className="property-card-list">
            {items.map((property) => <PropertyCard property={property} key={property.id} onDelete={handleDelete} onWishlist={toggleWishlist} wishlistActive={wishlistIds.includes(property.id)} onCompare={toggleCompare} compareActive={compareIds.includes(property.id)} />)}
          </div>
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

  const search = async (payload = { center, radiusKm }) => {
    setLoading(true);
    const data = await api.nearbyProperties({ lat: payload.center.lat, lng: payload.center.lng, radiusKm: payload.radiusKm, limit: 30 });
    if (data?.items?.length) setItems(data.items);
    setLoading(false);
  };

  useEffect(() => {
    search();
  }, []);

  return (
    <div className="property-page">
      <PageHero title="Tìm kiếm quanh đây" desc="Dựa trên lat/lng và bán kính thật từ backend Node.js." />
      <div className="container search-panel-wrap">
        <form className="search-panel" onSubmit={(e) => { e.preventDefault(); search(); }}>
          <div className="form-group">
            <label>Vĩ độ</label>
            <input value={center.lat} onChange={(e) => setCenter((prev) => ({ ...prev, lat: Number(e.target.value) }))} type="number" step="0.000001" />
          </div>
          <div className="form-group">
            <label>Kinh độ</label>
            <input value={center.lng} onChange={(e) => setCenter((prev) => ({ ...prev, lng: Number(e.target.value) }))} type="number" step="0.000001" />
          </div>
          <div className="form-group">
            <label>Bán kính: <span className="gold-text">{radiusKm}</span> km</label>
            <input type="range" min="1" max="20" value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} />
          </div>
          <button type="submit" className="btn-geo-primary search-submit">{loading ? 'Đang tìm...' : 'Tìm kiếm'}</button>
        </form>
      </div>
      <main className="container page-body">
        <LeafletMap items={items} center={center} height={500} chip={`BÁN KÍNH ${radiusKm} KM`} heatMode={false} />
        <div className="section-topline">
          <h2 className="section-heading">Kết quả tìm kiếm</h2>
          <span className="stat-pill">{items.length} bất động sản trong vùng đệm</span>
        </div>
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

  const search = async () => {
    setLoading(true);
    const data = await api.nearbyAmenities({ lat: center.lat, lng: center.lng, radiusKm, limit: 50 });
    if (data?.items?.length) setItems(data.items);
    setLoading(false);
  };

  useEffect(() => {
    search();
  }, []);

  return (
    <div className="property-page">
      <PageHero title="Tiện ích khu vực" desc="Đang gọi backend để lấy tiện ích quanh điểm tìm kiếm." />
      <div className="container search-panel-wrap">
        <form className="search-panel amenities-panel" onSubmit={(e) => { e.preventDefault(); search(); }}>
          <div className="form-group">
            <label>Vĩ độ</label>
            <input value={center.lat} onChange={(e) => setCenter((prev) => ({ ...prev, lat: Number(e.target.value) }))} type="number" step="0.000001" />
          </div>
          <div className="form-group">
            <label>Kinh độ</label>
            <input value={center.lng} onChange={(e) => setCenter((prev) => ({ ...prev, lng: Number(e.target.value) }))} type="number" step="0.000001" />
          </div>
          <div className="form-group">
            <label>Bán kính: <span className="gold-text">{radiusKm}</span> km</label>
            <input type="range" min="1" max="10" value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} />
          </div>
          <button type="submit" className="btn-geo-primary search-submit">{loading ? 'Đang tìm...' : 'Tìm'}</button>
        </form>
      </div>
      <main className="container page-body">
        <LeafletMap items={items} center={center} height={450} chip={`TIỆN ÍCH · ${radiusKm} KM`} heatMode={false} />
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
    if (Array.isArray(data) && data.length) setCompareItems(data.slice(0, 3));
  };

  useEffect(() => {
    refresh();
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
    onClick={() => {

      const confirmDelete = window.confirm(
        "Bạn có muốn bỏ bất động sản này khỏi danh sách so sánh không?"
      );

      if (!confirmDelete) return;

      setCompareItems((prev) =>
        prev.filter(
          (item) => item.id !== property.id
        )
      );

      api.removeCompare(property.id);

    }}
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
      </main>
    </div>
  );
}
