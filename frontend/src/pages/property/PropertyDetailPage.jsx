import {
  api,
  normalizeProperty,
  formatPrice
} from "../../api";
import { useEffect, useRef, useState } from "react";
import usePropertyDetail
  from "../../hooks/usePropertyDetail";

import PropertyMiniCard
  from "../../components/property/PropertyMiniCard";
import "../../App.css";

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

function loadStyle(href, id) {
  if (document.querySelector(`link[data-openclaw-id="${id}"]`)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
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
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.openclawId = id;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function ImageUploadForm({ propertyId, onUploaded }) {
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file) {
      setMessage("Vui lòng chọn file ảnh.");
      return;
    }
    setLoading(true);
    setMessage("");

    const result = await api.createPropertyImage(propertyId, {
      file: file,
      caption,
      sort_order: 0,
    });

    setLoading(false);

    if (result?.id) {
      setFile(null);
      setCaption("");
      setMessage("Đã tải ảnh lên.");
      onUploaded?.();
    } else {
      setMessage("Không tải được ảnh.");
    }
  }

  return (
    <form className="image-upload-form" onSubmit={handleSubmit}>
      <div className="image-upload-row">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <input
          type="text"
          placeholder="Chú thích (caption)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
        <button className="btn-geo-primary" type="submit" disabled={loading}>
          {loading ? "Đang tải..." : "Tải ảnh lên"}
        </button>
      </div>
      {message && <p className="muted-line">{message}</p>}
    </form>
  );
}

function buildDirectionsUrl(destination, origin, mode) {
  const params = new URLSearchParams({
    api: "1",
    destination: `${destination.lat},${destination.lng}`,
    travelmode: mode || "driving",
  });

  if (origin?.lat && origin?.lng) {
    params.set("origin", `${origin.lat},${origin.lng}`);
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function modeLabel(mode) {
  return (
    {
      driving: "Ô tô",
      walking: "Đi bộ",
      cycling: "Xe đạp",
    }[mode] || "Ô tô"
  );
}

function RouteMap({ destination, origin, routeGeometry }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const layersRef = useRef({ markers: [], route: null });

  useEffect(() => {
    let disposed = false;
    let localMap = null;

    async function boot() {
      await loadStyle(LEAFLET_CSS, "leaflet-css");
      await loadScript(LEAFLET_JS, "leaflet-js");

      if (disposed || !containerRef.current || !window.L || mapRef.current || !destination) {
        return;
      }

      localMap = window.L.map(containerRef.current, { scrollWheelZoom: true }).setView([destination.lat, destination.lng], 14);
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(localMap);
      
      mapRef.current = localMap;
      setMapInstance(localMap);
    }

    boot();

    return () => {
      disposed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setMapInstance(null);
    };
  }, [destination]);

  useEffect(() => {
    if (!mapInstance || !window.L || !destination) return;

    layersRef.current.markers.forEach((layer) => layer.remove());
    if (layersRef.current.route) {
      layersRef.current.route.remove();
    }

    const markers = [];
    const destinationMarker = window.L.marker([destination.lat, destination.lng]).bindPopup("Bất động sản đích");
    destinationMarker.addTo(mapInstance);
    markers.push(destinationMarker);

    if (origin) {
      const originMarker = window.L.marker([origin.lat, origin.lng]).bindPopup("Điểm xuất phát");
      originMarker.addTo(mapInstance);
      markers.push(originMarker);
    }

    let bounds = window.L.latLngBounds([[destination.lat, destination.lng]]);

    if (routeGeometry?.coordinates?.length) {
      const line = window.L.polyline(
        routeGeometry.coordinates.map(([lng, lat]) => [lat, lng]),
        {
          color: "#d4af37",
          weight: 5,
          opacity: 0.9,
        }
      );
      line.addTo(mapInstance);
      layersRef.current.route = line;
      bounds = line.getBounds();
    } else if (origin) {
      bounds = window.L.latLngBounds([
        [origin.lat, origin.lng],
        [destination.lat, destination.lng],
      ]);
    }

    if (bounds.isValid()) {
      mapInstance.fitBounds(bounds.pad(0.18));
    }

    layersRef.current.markers = markers;
  }, [mapInstance, destination, origin, routeGeometry]);

  return <div className="detail-route-map" ref={containerRef} />;
}

export default function PropertyDetailPage() {
  const [property, setProperty] = usePropertyDetail();
  const [reviewRating, setReviewRating] = useState("5");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [routeMode, setRouteMode] = useState("driving");
  const [routeOrigin, setRouteOrigin] = useState(null);
  const [routeMessage, setRouteMessage] = useState("");
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeData, setRouteData] = useState(null);
  const p = normalizeProperty(property);
  const images = property?.images?.length ? property.images : [{ image: p.imageUrl, caption: p.title, is_primary: true }];
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const canManageImages = currentUser && ["agent", "admin"].includes(currentUser.role);
  const [imageMessage, setImageMessage] = useState("");

  async function refreshImages() {
    const data = await api.property(property.id);
    if (data) {
      setProperty((prev) => ({ ...prev, images: data.images }));
    }
  }

  async function handleDeleteImage(imageId) {
    const ok = await api.deletePropertyImage(imageId);
    if (ok) {
      setImageMessage("Đã xóa ảnh.");
      refreshImages();
    } else {
      setImageMessage("Không xóa được ảnh.");
    }
  }

  async function handleSetPrimary(imageId) {
    const result = await api.setPrimaryImage(imageId);
    if (result) {
      setImageMessage("Đã đặt làm ảnh chính.");
      refreshImages();
    } else {
      setImageMessage("Không đặt được ảnh chính.");
    }
  }
  const nearbyAmenities = property?.nearby_amenities || [];
  const similar = property?.similar_properties || [];
  const agentRating = property?.agent?.rating || 5;
  const ratingCount = property?.agent?.rating_count || 0;
  const recentReviews = property?.agent?.reviews || [];
  const destination = Number.isFinite(Number(property?.lat)) && Number.isFinite(Number(property?.lng))
    ? { lat: Number(property.lat), lng: Number(property.lng) }
    : null;
  const directionsUrl = destination
    ? buildDirectionsUrl(destination, routeOrigin, routeMode)
    : null;

  useEffect(() => {
    let cancelled = false;

    async function fetchRoute() {
      if (!destination || !routeOrigin) {
        setRouteData(null);
        return;
      }

      // Validate coordinates
      if (
        !Number.isFinite(destination.lat) || !Number.isFinite(destination.lng) ||
        !Number.isFinite(routeOrigin.lat) || !Number.isFinite(routeOrigin.lng)
      ) {
        setRouteData(null);
        setRouteMessage("Tọa độ không hợp lệ.");
        return;
      }

      // Check if coordinates are at default/null location (0,0)
      if (
        (destination.lat === 0 && destination.lng === 0) ||
        (routeOrigin.lat === 0 && routeOrigin.lng === 0)
      ) {
        setRouteData(null);
        setRouteMessage("Không có dữ liệu vị trí cho bất động sản này.");
        return;
      }

      setRouteLoading(true);
      setRouteMessage("");

      try {
        const profile =
          routeMode === "walking"
            ? "foot"
            : routeMode === "cycling"
            ? "bike"
            : "driving";

        const routeResult = await api.route({
          profile,
          originLng: routeOrigin.lng,
          originLat: routeOrigin.lat,
          destLng: destination.lng,
          destLat: destination.lat
        });

        if (!cancelled && routeResult) {
          setRouteData(routeResult);
          setRouteMessage(`Đã tìm thấy tuyến ${modeLabel(routeMode).toLowerCase()}.`);
        } else if (!cancelled) {
          setRouteData(null);
          setRouteMessage("Chưa tìm được tuyến đường phù hợp. Vui lòng mở Google Maps để chỉ đường.");
        }
      } catch (err) {
        if (!cancelled) {
          setRouteData(null);
          console.error("Route fetch error:", err);
          setRouteMessage("Không tải được tuyến đường. Vui lòng mở Google Maps để chỉ đường.");
        }
      } finally {
        if (!cancelled) {
          setRouteLoading(false);
        }
      }
    }

    fetchRoute();

    return () => {
      cancelled = true;
    };
  }, [destination, routeOrigin, routeMode]);

  async function submitReview() {
    const currentUser = JSON.parse(localStorage.getItem("user") || "null");

    if (!currentUser) {
      setReviewMessage("Bạn cần đăng nhập để gửi đánh giá môi giới.");
      return;
    }

    if (!property?.agent?.id) {
      setReviewMessage("Môi giới này chưa sẵn sàng để đánh giá.");
      return;
    }

    setReviewLoading(true);
    setReviewMessage("");

    const result = await api.createAgentReview(property.agent.id, {
      rating: reviewRating,
      comment: reviewComment,
      author_name: currentUser?.full_name || currentUser?.username || "Khách vãng lai",
    });

    setReviewLoading(false);

    if (result?.reviews) {
      setProperty((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          agent: {
            ...prev.agent,
            rating: result.rating,
            rating_count: result.rating_count,
            reviews: result.reviews,
          },
        };
      });
      setReviewComment("");
      setReviewRating("5");
      setReviewMessage("Đã gửi đánh giá môi giới.");
      return;
    }

    setReviewMessage("Không gửi được đánh giá lúc này.");
  }

  function openDirections() {
    if (!directionsUrl) {
      setRouteMessage("Bất động sản này chưa có dữ liệu vị trí để tìm đường.");
      return;
    }

    setRouteMessage(
      routeOrigin
        ? "Đã mở chỉ đường từ vị trí hiện tại của bạn."
        : "Đã mở chỉ đường, Google Maps sẽ tự chọn điểm xuất phát."
    );
    window.open(directionsUrl, "_blank", "noopener,noreferrer");
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setRouteMessage("Trình duyệt này chưa hỗ trợ lấy vị trí hiện tại.");
      return;
    }

    setRouteLoading(true);
    setRouteMessage("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setRouteOrigin({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setRouteLoading(false);
        setRouteMessage("Đã lấy vị trí hiện tại. Bạn có thể mở chỉ đường ngay.");
      },
      () => {
        setRouteLoading(false);
        setRouteMessage("Không lấy được vị trí hiện tại. Hãy cho phép quyền truy cập vị trí.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }

  return (
    <div className="extra-page">
      <section className="detail-hero-copy" style={{ backgroundImage: `url(${images[0]?.image || p.imageUrl})` }}>
        <div className="container detail-hero-inner">
          <span className="badge-gold">{p.statusText}</span>
          <span className="badge-gold">{p.typeText}</span>
          {property?.location_score !== undefined && <span className="badge-gold">Điểm vị trí {property.location_score}</span>}
        </div>
      </section>
      <main className="container detail-layout-copy">
        <section>
          <div className="extra-card">
            <h1 className="section-heading">{p.title}</h1>
            <p className="extra-desc">📍 {p.address}</p>
            <div className="mini-actions" style={{ marginBottom: 16 }}>
              <button className="btn-geo-secondary" type="button" onClick={async () => await api.toggleWishlist(property.id)}>Lưu / Bỏ lưu</button>
              <button className="btn-geo-secondary" type="button" onClick={async () => await api.toggleCompare(property.id)}>So sánh</button>
            </div>
            <div className="detail-stat-grid">
              <div><strong>{p.priceText}</strong><span>Giá bán</span></div>
              <div><strong>{p.area} m²</strong><span>Diện tích</span></div>
              <div><strong>{p.agentName}</strong><span>Môi giới</span></div>
              <div><strong>{property?.location_score ?? "8.8"}</strong><span>Điểm vị trí</span></div>
            </div>
            <h3>Mô tả</h3>
            <p className="long-text">{p.description || property?.description || "Thông tin đang được cập nhật từ backend Node.js."}</p>
          </div>
          <div className="extra-card">
            <h3>Ảnh bất động sản</h3>
            {canManageImages && property?.id && (
              <>
                <ImageUploadForm propertyId={property.id} onUploaded={refreshImages} />
                {imageMessage && <p className="muted-line">{imageMessage}</p>}
              </>
            )}
            <div className="mini-grid media-grid">
              {images.map((img, index) => (
                <article className="mini-property-card" key={`${img.id || index}-${index}`}>
                  <div className="mini-media" style={{ backgroundImage: `url(${img.image})` }}><span>{img.is_primary ? "Ảnh chính" : `Ảnh ${index + 1}`}</span></div>
                  <div className="mini-content">
                    <p>{img.caption || p.title}</p>
                    {canManageImages && (
                      <div className="pill-row mt-3">
                        {!img.is_primary && (
                          <button className="btn-geo-secondary" type="button" onClick={() => handleSetPrimary(img.id)}>
                            Đặt ảnh chính
                          </button>
                        )}
                        <button className="btn-geo-secondary danger-btn" type="button" onClick={() => handleDeleteImage(img.id)}>
                          Xóa
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div className="extra-card">
            <h3>Tiện ích lân cận</h3>
            <div className="pill-row">
              {(nearbyAmenities.length ? nearbyAmenities : [{ name: "Trường học" }, { name: "Bệnh viện" }, { name: "Công viên" }, { name: "Siêu thị" }]).map((item) => <span key={item.id || item.name}>• {item.name}</span>)}
            </div>
          </div>
          <div className="extra-card">
            <h3>Tìm đường</h3>
            <div className="route-planner">
              <div className="route-mode-group">
                <button type="button" className={`route-mode-chip ${routeMode === "driving" ? "active" : ""}`} onClick={() => setRouteMode("driving")}>
                  Ô tô
                </button>
                <button type="button" className={`route-mode-chip ${routeMode === "walking" ? "active" : ""}`} onClick={() => setRouteMode("walking")}>
                  Đi bộ
                </button>
                <button type="button" className={`route-mode-chip ${routeMode === "cycling" ? "active" : ""}`} onClick={() => setRouteMode("cycling")}>
                  Xe đạp
                </button>
              </div>
              <div className="route-actions">
                <button type="button" className="btn-geo-secondary" onClick={useCurrentLocation} disabled={routeLoading}>
                  {routeLoading ? "Đang lấy vị trí..." : "Dùng vị trí hiện tại"}
                </button>
                <button type="button" className="btn-geo-primary" onClick={openDirections} disabled={!destination}>
                  Mở Google Maps
                </button>
              </div>
              <p className="muted-line">
                {routeOrigin
                  ? `Xuất phát: ${routeOrigin.lat.toFixed(5)}, ${routeOrigin.lng.toFixed(5)}`
                  : "Hãy dùng vị trí hiện tại để hiển thị tuyến đường ngay trên web."}
              </p>
              {routeData && (
                <div className="route-summary-grid">
                  <div>
                    <strong>{(routeData.distance / 1000).toFixed(1)} km</strong>
                    <span>Quãng đường</span>
                  </div>
                  <div>
                    <strong>{Math.round(routeData.duration / 60)} phút</strong>
                    <span>Ước tính</span>
                  </div>
                  <div>
                    <strong>{modeLabel(routeMode)}</strong>
                    <span>Phương tiện</span>
                  </div>
                </div>
              )}
              {routeMessage && <p className="muted-line">{routeMessage}</p>}
              <RouteMap destination={destination} origin={routeOrigin} routeGeometry={routeData?.geometry || null} />
            </div>
          </div>
          {similar.length > 0 && <div className="extra-card"><h3>Tin tương tự</h3><div className="mini-grid">{similar.map((item) => <PropertyMiniCard p={item} key={item.id} />)}</div></div>}
        </section>
        <aside className="detail-sidebar-copy">


  <div className="extra-card sticky-card">
    <div className="price-big">{p.priceText}</div>

    <div className="sidebar-mini-info">
      <span>📍 {p.address}</span>
      <span>📐 {p.area} m²</span>
      <span>🏠 {p.typeText}</span>
    </div>

    <a className="btn-geo-primary full" href="/lead-form">
      Liên hệ tư vấn
    </a>

    <a className="btn-geo-secondary full" href="/wishlist">
      Lưu tin
    </a>

    <button className="btn-geo-secondary full" type="button" onClick={openDirections} disabled={!destination}>
      Tìm đường
    </button>
  </div>

<div className="extra-card property-agent-card">

  <div className="property-agent-title-row">

    <div className="property-agent-title-icon">
      👨‍💼
    </div>

    <div>
      <p className="section-mini-title">
        MÔI GIỚI PHỤ TRÁCH
      </p>

      <span className="property-agent-subtitle">
        Chuyên viên tư vấn bất động sản
      </span>
    </div>

  </div>

  <div className="property-agent-box">

    <div className="property-agent-avatar-wrap">

      <img
        src={
          property?.agent?.avatar ||
          `https://ui-avatars.com/api/?background=d4af37&color=111&name=${encodeURIComponent(
            p.agentName || "Agent"
          )}`
        }
        alt={p.agentName}
        className="property-agent-avatar"
      />

      <div className="property-agent-online-dot"></div>

    </div>

    <div className="property-agent-info">

      <h4>
        {p.agentName || "Chưa cập nhật"}
      </h4>

      <span className="property-agent-position">
        {property?.agent?.position ||
          "Tư vấn bất động sản"}
      </span>

      <div className="property-agent-contact">

        {property?.agent?.phone && (
          <a
            href={`tel:${property.agent.phone}`}
            className="property-agent-contact-item"
          >
            <span>📞</span>
            {property.agent.phone}
          </a>
        )}

        {property?.agent?.email && (
          <a
            href={`mailto:${property.agent.email}`}
            className="property-agent-contact-item"
          >
            <span>✉️</span>
            {property.agent.email}
          </a>
        )}

      </div>

    </div>

  </div>


  <div className="property-agent-side-panel">

    <div className="property-agent-rating">
      <div className="property-agent-rating-head">
        <div className="property-agent-stars">
          {"★".repeat(
            Math.round(
              property?.agent?.rating || 5
            )
          )}
        </div>

        <span className="property-agent-rating-value">
          {agentRating} · {ratingCount} đánh giá
        </span>
      </div>
    </div>

    <div className="property-agent-review-box">

      <label className="property-agent-review-label" htmlFor="agent-rating">
        Đánh giá môi giới
      </label>

      <select className="property-agent-select" id="agent-rating" value={reviewRating} onChange={(event) => setReviewRating(event.target.value)}>
        <option value="1">1 sao</option>
        <option value="2">2 sao</option>
        <option value="3">3 sao</option>
        <option value="4">4 sao</option>
        <option value="5">5 sao</option>
      </select>

      <textarea
        placeholder="Chia sẻ cảm nhận của bạn về môi giới..."
        className="property-agent-review-input"
        rows="4"
        value={reviewComment}
        onChange={(event) => setReviewComment(event.target.value)}
      />

      <button className="btn-geo-primary full" type="button" onClick={submitReview} disabled={reviewLoading}>
        {reviewLoading ? "Đang gửi..." : "Gửi đánh giá"}
      </button>

      {reviewMessage && (
        <p className="muted-line">{reviewMessage}</p>
      )}

      {recentReviews.length > 0 && (
        <div className="property-agent-review-list">
          {recentReviews.slice(0, 3).map((item) => (
            <article className="property-agent-review-item" key={item.id}>
              <div className="property-agent-review-item-head">
                <strong>{item.author_name || "Khách hàng"}</strong>
                <span>{"★".repeat(Math.round(item.rating || 5))}</span>
              </div>
              <p>{item.comment || "Đánh giá không kèm nhận xét."}</p>
            </article>
          ))}
        </div>
      )}

    </div>
  </div>

</div>

 
  <div className="extra-card">
    <p className="section-mini-title">
      TIN ĐĂNG TƯƠNG TỰ
    </p>

    {similar.length > 0 ? (
      similar.slice(0, 2).map((item) => (
        <div className="similar-mini-item" key={item.id}>
          <img
            src={item.image || p.imageUrl}
            alt=""
          />

          <div>
            <strong>{item.title}</strong>
            <p>{formatPrice(item.price)}</p>
          </div>
        </div>
      ))
    ) : (
      <p className="muted-line">
        Chưa có tin đăng tương tự.
      </p>
    )}
  </div>

</aside>
      </main>
    </div>
  );
}
