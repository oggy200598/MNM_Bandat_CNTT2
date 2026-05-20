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

  const images =
    property?.images?.length
      ? property.images
      : [
          {
            image: p.imageUrl,
            caption: p.title,
            is_primary: true
          }
        ];

  const nearbyAmenities =
    property?.nearby_amenities || [];

  const similar =
    property?.similar_properties || [];

  return (
    <div className="extra-page">

      {/* HERO */}
      <section
        className="detail-hero-copy"
        style={{
          backgroundImage: `url(${images[0]?.image || p.imageUrl})`
        }}
      >
        <div className="container detail-hero-inner">

          <span className="badge-gold">
            {p.statusText}
          </span>

          <span className="badge-gold">
            {p.typeText}
          </span>

        </div>
      </section>

      <main className="container detail-layout-copy">

        {/* LEFT */}
        <section>

          {/* INFO */}
          <div className="extra-card">

            <h1 className="section-heading">
              {p.title}
            </h1>

            <p className="extra-desc">
              📍 {p.address}
            </p>

            <div
              className="mini-actions"
              style={{ marginBottom: 16 }}
            >

              <button
                className="btn-geo-secondary"
                type="button"
                onClick={async () => {

                  await api.toggleWishlist(
                    property.id
                  );

                  alert("Đã lưu tin");

                }}
              >
                Lưu tin
              </button>

              <button
                className="btn-geo-secondary"
                type="button"
                onClick={async () => {
                  await api.toggleCompare(
                    property.id
                  );
                }}
              >
                So sánh
              </button>

            </div>

            <div className="detail-stat-grid">

              <div>
                <strong>
                  {p.priceText}
                </strong>

                <span>Giá bán</span>
              </div>

              <div>
                <strong>
                  {p.area} m²
                </strong>

                <span>Diện tích</span>
              </div>

              <div>
                <strong>
                  {p.agentName}
                </strong>

                <span>Môi giới</span>
              </div>

            </div>

            <h3>Mô tả</h3>

            <p className="long-text">
              {p.description ||
                "Thông tin đang cập nhật"}
            </p>

          </div>

          {/* IMAGES */}
          <div className="extra-card">

            <h3>Ảnh bất động sản</h3>

            <div className="mini-grid media-grid">

              {images.map((img, index) => (

                <article
                  className="mini-property-card"
                  key={index}
                >

                  <div
                    className="mini-media"
                    style={{
                      backgroundImage: `url(${img.image})`
                    }}
                  >
                    <span>
                      {img.is_primary
                        ? "Ảnh chính"
                        : `Ảnh ${index + 1}`}
                    </span>
                  </div>

                  <div className="mini-content">
                    <p>
                      {img.caption || p.title}
                    </p>
                  </div>

                </article>

              ))}

            </div>

          </div>

          {/* AMENITIES */}
          <div className="extra-card">

            <h3>Tiện ích lân cận</h3>

            <div className="pill-row">

              {(nearbyAmenities.length
                ? nearbyAmenities
                : [
                    { name: "Trường học" },
                    { name: "Bệnh viện" },
                    { name: "Siêu thị" }
                  ]
              ).map((item) => (

                <span
                  key={item.id || item.name}
                >
                  • {item.name}
                </span>

              ))}

            </div>

          </div>

          {/* SIMILAR */}
          {similar.length > 0 && (

            <div className="extra-card">

              <h3>Tin tương tự</h3>

              <div className="mini-grid">

                {similar.map((item) => (

                  <PropertyMiniCard
                    p={item}
                    key={item.id}
                  />

                ))}

              </div>

            </div>

          )}

        </section>

        {/* RIGHT */}
        <aside className="detail-sidebar-copy">

          <div className="extra-card sticky-card">

            <div className="price-big">
              {p.priceText}
            </div>

            <div className="sidebar-mini-info">

              <span>
                📍 {p.address}
              </span>

              <span>
                📐 {p.area} m²
              </span>

              <span>
                🏠 {p.typeText}
              </span>

            </div>

            <a
              className="btn-geo-primary full"
              href="/lead-form"
            >
              Liên hệ tư vấn
            </a>

            <a
              className="btn-geo-secondary full"
              href="/wishlist"
            >
              Xem tin đã lưu
            </a>

          </div>

          {/* AGENT */}
          <div className="extra-card">

            <h3>Môi giới</h3>

            <p>
              {p.agentName}
            </p>

          </div>

          {/* SMALL SIMILAR */}
          <div className="extra-card">

            <p className="section-mini-title">
              TIN ĐĂNG TƯƠNG TỰ
            </p>

            {similar.length > 0 ? (

              similar
                .slice(0, 2)
                .map((item) => (

                  <div
                    className="similar-mini-item"
                    key={item.id}
                  >

                    <img
                      src={
                        item.image ||
                        p.imageUrl
                      }
                      alt=""
                    />

                    <div>

                      <strong>
                        {item.title}
                      </strong>

                      <p>
                        {formatPrice(
                          item.price
                        )}
                      </p>

                    </div>

                  </div>

                ))

            ) : (

              <p className="muted-line">
                Chưa có tin tương tự.
              </p>

            )}

          </div>

        </aside>

      </main>

    </div>
  );
}