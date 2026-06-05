import {
  api,
  normalizeProperty,
  formatPrice
} from "../../api";
import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import usePropertyDetail
  from "../../hooks/usePropertyDetail";

import PropertyMiniCard
  from "../../components/property/PropertyMiniCard";
import { sanitizeRichHtml } from "../../utils/richText";
import "../../App.css";

function ImageUploadForm({ propertyId, onUploaded }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

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
      setPreviewUrl("");
      setCaption("");
      setMessage("Đã tải ảnh lên.");
      onUploaded?.();
    } else {
      setMessage("Không tải được ảnh.");
    }
  }

  return (
    <form className="image-upload-form" onSubmit={handleSubmit}>
      <div className="property-image-uploader">
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

        {previewUrl && (
          <div className="property-image-preview-grid mt-3">
            <article className="property-image-preview-card">
              <div
                className="property-image-preview-thumb"
                style={{ backgroundImage: `url(${previewUrl})` }}
              >
                <span>Xem trước</span>
              </div>
              <div className="property-image-preview-body">
                <strong>{file?.name || "Ảnh đã chọn"}</strong>
                <button
                  type="button"
                  className="btn-geo-secondary"
                  onClick={() => setFile(null)}
                >
                  Bỏ chọn
                </button>
              </div>
            </article>
          </div>
        )}
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
  const layersRef = useRef({ markers: [], route: null });

  useEffect(() => {
    let disposed = false;
    let localMap = null;

    function boot() {
      if (disposed || !containerRef.current || mapRef.current || !destination) {
        return;
      }

      localMap = L.map(containerRef.current, { scrollWheelZoom: true }).setView([destination.lat, destination.lng], 14);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(localMap);

      mapRef.current = localMap;
      localMap.whenReady(() => {
        setTimeout(() => {
          localMap?.invalidateSize();
        }, 0);
      });
    }

    boot();

    return () => {
      disposed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [destination?.lat, destination?.lng]);

  useEffect(() => {
    const mapInstance = mapRef.current;
    if (!mapInstance || !destination) return;

    layersRef.current.markers.forEach((layer) => layer.remove());
    if (layersRef.current.route) {
      layersRef.current.route.remove();
    }

    const markers = [];
    const destinationMarker = L.circleMarker([destination.lat, destination.lng], {
      radius: 9,
      color: "#b3872a",
      weight: 3,
      fillColor: "#f5e3b5",
      fillOpacity: 1,
    }).bindPopup("Bất động sản đích");
    destinationMarker.addTo(mapInstance);
    markers.push(destinationMarker);

    if (origin) {
      const originMarker = L.circleMarker([origin.lat, origin.lng], {
        radius: 8,
        color: "#2458a6",
        weight: 3,
        fillColor: "#dce8fb",
        fillOpacity: 1,
      }).bindPopup("Điểm xuất phát");
      originMarker.addTo(mapInstance);
      markers.push(originMarker);
    }

    let bounds = L.latLngBounds([[destination.lat, destination.lng]]);

    if (routeGeometry?.coordinates?.length) {
      const line = L.polyline(
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
      bounds = L.latLngBounds([
        [origin.lat, origin.lng],
        [destination.lat, destination.lng],
      ]);
    }

    if (bounds.isValid()) {
      mapInstance.fitBounds(bounds.pad(0.18));
    }

    layersRef.current.markers = markers;
  }, [
    destination?.lat,
    destination?.lng,
    origin?.lat,
    origin?.lng,
    routeGeometry,
  ]);

  return <div className="detail-route-map" ref={containerRef} />;
}

export default function PropertyDetailPage() {
  const [property, setProperty] = usePropertyDetail();
  const [authUser, setAuthUser] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(null);
  const [reviewRating, setReviewRating] = useState("5");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [routeMode, setRouteMode] = useState("driving");
  const [routeOrigin, setRouteOrigin] = useState(null);
  const [routeMessage, setRouteMessage] = useState("");
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeData, setRouteData] = useState(null);
  const [routeRequestKey, setRouteRequestKey] = useState(0);
  const p = normalizeProperty(property);
  const images = property?.images?.length ? property.images : [{ image: p.imageUrl, caption: p.title, is_primary: true }];
  const canUseWishlist = Boolean(authUser);
  const propertyAgentId = property?.agent?.id ?? property?.agent_id ?? null;
  const linkedAgentId = authUser?.linked_agent_id ?? authUser?.linkedAgentId ?? null;
  const canManageImages =
    authUser?.role === "admin" ||
    (authUser?.role === "agent" &&
      propertyAgentId !== null &&
      linkedAgentId !== null &&
      String(propertyAgentId) === String(linkedAgentId));
  const [imageMessage, setImageMessage] = useState("");
  const activeImage =
    activeImageIndex === null
      ? null
      : images[activeImageIndex] || null;

  useEffect(() => {
    let active = true;

    async function syncAuthUser() {
      if (!api.getToken()) {
        localStorage.removeItem("user");
        if (active) {
          setAuthUser(null);
        }
        return;
      }

      const me = await api.me();

      if (!active) return;

      if (me) {
        setAuthUser(me);
        localStorage.setItem("user", JSON.stringify(me));
        window.dispatchEvent(new Event("auth-changed"));
        return;
      }

      localStorage.removeItem("user");
      setAuthUser(null);
    }

    syncAuthUser();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (activeImageIndex === null) {
      return undefined;
    }

    const handleKeydown = (event) => {
      if (event.key === "Escape") {
        setActiveImageIndex(null);
      }
    };

    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [activeImageIndex]);

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
  const destination = useMemo(() => {
    if (!Number.isFinite(Number(property?.lat)) || !Number.isFinite(Number(property?.lng))) {
      return null;
    }

    return {
      lat: Number(property.lat),
      lng: Number(property.lng),
    };
  }, [property?.lat, property?.lng]);

  const directionsUrl = useMemo(
    () => (destination ? buildDirectionsUrl(destination, routeOrigin, routeMode) : null),
    [destination, routeOrigin, routeMode]
  );

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
  }, [destination, routeOrigin, routeMode, routeRequestKey]);

  async function submitReview() {
    if (!authUser) {
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
      author_name: authUser?.full_name || authUser?.username || "Khách vãng lai",
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
        setRouteRequestKey((prev) => prev + 1);
        setRouteLoading(false);
        setRouteMessage("Đã lấy vị trí hiện tại. Đang tìm tuyến đường trên web...");
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

  function findRouteOnWeb() {
    if (!destination) {
      setRouteMessage("Bất động sản này chưa có dữ liệu vị trí để tìm đường.");
      return;
    }

    if (routeOrigin) {
      setRouteMessage("Đang cập nhật tuyến đường trên web...");
      setRouteRequestKey((prev) => prev + 1);
      return;
    }

    useCurrentLocation();
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
              {canUseWishlist && (
                <button className="btn-geo-secondary" type="button" onClick={async () => await api.toggleWishlist(property.id)}>Lưu / Bỏ lưu</button>
              )}
              <button className="btn-geo-secondary" type="button" onClick={async () => await api.toggleCompare(property.id)}>So sánh</button>
            </div>
            <div className="detail-stat-grid">
              <div><strong>{p.priceText}</strong><span>Giá bán</span></div>
              <div><strong>{p.area} m²</strong><span>Diện tích</span></div>
              <div><strong>{p.agentName}</strong><span>Môi giới</span></div>
              <div><strong>{property?.location_score ?? "8.8"}</strong><span>Điểm vị trí</span></div>
            </div>
            <h3>Mô tả</h3>
            <div
              className="long-text rich-text-content"
              dangerouslySetInnerHTML={{
                __html: sanitizeRichHtml(
                  p.description ||
                  property?.description ||
                  "Thông tin đang được cập nhật từ backend Node.js."
                ),
              }}
            />
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
                  <button
                    type="button"
                    className="mini-media mini-media-button"
                    style={{ backgroundImage: `url(${img.image})` }}
                    onClick={() => setActiveImageIndex(index)}
                    aria-label={`Xem lớn ảnh ${img.caption || p.title}`}
                  />
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
                <button type="button" className="btn-geo-primary" onClick={findRouteOnWeb} disabled={!destination || routeLoading}>
                  Tìm tuyến trên web
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
              {!routeOrigin && (
                <div className="route-inline-hint">
                  Bấm <strong>Tìm tuyến trên web</strong> để lấy vị trí hiện tại và vẽ đường đi ngay trên bản đồ.
                </div>
              )}
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

    {canUseWishlist && (
      <a className="btn-geo-secondary full" href="/wishlist">
        Lưu tin
      </a>
    )}

    <button className="btn-geo-secondary full" type="button" onClick={findRouteOnWeb} disabled={!destination || routeLoading}>
      Tìm đường trên web
    </button>

    <button className="btn-geo-secondary full" type="button" onClick={openDirections} disabled={!destination}>
      Mở Google Maps
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
      {activeImage && (
        <div
          className="property-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Xem ảnh bất động sản"
          onClick={() => setActiveImageIndex(null)}
        >
          <div
            className="property-lightbox-dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="property-lightbox-close"
              onClick={() => setActiveImageIndex(null)}
              aria-label="Đóng ảnh lớn"
            >
              <i className="bi bi-x-lg"></i>
            </button>
            <img
              className="property-lightbox-image"
              src={activeImage.image}
              alt={activeImage.caption || p.title}
            />
            <div className="property-lightbox-caption">
              {activeImage.caption || p.title}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
