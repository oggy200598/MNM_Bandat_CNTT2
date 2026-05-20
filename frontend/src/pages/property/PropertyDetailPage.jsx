import {
  api,
  normalizeProperty,
  formatPrice
} from "../../api";

import usePropertyDetail
  from "../../hooks/usePropertyDetail";

import PropertyMiniCard
  from "../../components/property/PropertyMiniCard";

export default function PropertyDetailPage() {
  const property = usePropertyDetail();
  const p = normalizeProperty(property);
  const images = property?.images?.length ? property.images : [{ image: p.imageUrl, caption: p.title, is_primary: true }];
  const nearbyAmenities = property?.nearby_amenities || [];
  const similar = property?.similar_properties || [];

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
              <div><strong>{property?.lat ?? "-"}, {property?.lng ?? "-"}</strong><span>Tọa độ</span></div>
            </div>
            <h3>Mô tả</h3>
            <p className="long-text">{p.description || property?.description || "Thông tin đang được cập nhật từ backend Node.js."}</p>
          </div>
          <div className="extra-card">
            <h3>Ảnh bất động sản</h3>
            <div className="mini-grid media-grid">
              {images.map((img, index) => (
                <article className="mini-property-card" key={`${img.id || index}-${index}`}>
                  <div className="mini-media" style={{ backgroundImage: `url(${img.image})` }}><span>{img.is_primary ? "Ảnh chính" : `Ảnh ${index + 1}`}</span></div>
                  <div className="mini-content"><p>{img.caption || p.title}</p></div>
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
          <div className="extra-card"><h3>Bản đồ vị trí</h3><iframe className="embed-map" src="https://www.openstreetmap.org/export/embed.html?bbox=106.5,10.65,106.85,10.9&layer=mapnik" title="Map" /></div>
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
  </div>

<div className="extra-card agent-card">

  <div className="agent-title-row">

    <div className="agent-title-icon">
      👨‍💼
    </div>

    <div>
      <p className="section-mini-title">
        MÔI GIỚI PHỤ TRÁCH
      </p>

      <span className="agent-subtitle">
        Chuyên viên tư vấn bất động sản
      </span>
    </div>

  </div>

  <div className="agent-box">

    <div className="agent-avatar-wrap">

      <img
        src={
          property?.agent?.avatar ||
          `https://ui-avatars.com/api/?background=d4af37&color=111&name=${encodeURIComponent(
            p.agentName || "Agent"
          )}`
        }
        alt={p.agentName}
        className="agent-avatar"
      />

      <div className="agent-online-dot"></div>

    </div>

    <div className="agent-info">

      <h4>
        {p.agentName || "Chưa cập nhật"}
      </h4>

      <span className="agent-position">
        {property?.agent?.position ||
          "Tư vấn bất động sản"}
      </span>

      <div className="agent-contact">

        {property?.agent?.phone && (
          <a
            href={`tel:${property.agent.phone}`}
            className="agent-contact-item"
          >
            <span>📞</span>
            {property.agent.phone}
          </a>
        )}

        {property?.agent?.email && (
          <a
            href={`mailto:${property.agent.email}`}
            className="agent-contact-item"
          >
            <span>✉️</span>
            {property.agent.email}
          </a>
        )}

      </div>

    </div>

  </div>


  <div className="agent-rating">

    <div className="agent-stars">
      {"⭐".repeat(
        Math.round(
          property?.agent?.rating || 5
        )
      )}
    </div>

    <span>
      {property?.agent?.rating || 5}.0 đánh giá
    </span>

  </div>

  
  <div className="agent-review-box">

    <select className="agent-select">

      <option>⭐ 1 sao</option>
      <option>⭐⭐ 2 sao</option>
      <option>⭐⭐⭐ 3 sao</option>
      <option>⭐⭐⭐⭐ 4 sao</option>
      <option>⭐⭐⭐⭐⭐ 5 sao</option>

    </select>

    <textarea
      placeholder="Chia sẻ cảm nhận của bạn về môi giới..."
      className="agent-review-input"
    />

    <button className="btn-geo-primary full">
      Gửi đánh giá
    </button>

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
