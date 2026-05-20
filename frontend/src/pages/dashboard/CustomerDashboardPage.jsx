import { useEffect, useState } from "react";
import { api } from "../../api";

export function CustomerDashboardPage() {
  const [items, setItems] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const [wishlistData, searchData] = await Promise.all([
        api.wishlist(),
        api.savedSearches(),
      ]);

      setItems(Array.isArray(wishlistData) ? wishlistData : []);

      setSavedSearches(
        Array.isArray(searchData) ? searchData : []
      );
    } catch (error) {
      console.error("Load dashboard failed:", error);

      setItems([]);
      setSavedSearches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadDashboard();
    };

    init();
  }, []);

  return (
    <div className="container py-5">
      {/* HEADER */}
      <div className="mb-5">
        <p className="section-mini-title">
          Khu vực cá nhân
        </p>

        <h1 className="section-heading">
          Bảng điều khiển của bạn
        </h1>

        <p className="muted-line">
          Theo dõi bất động sản yêu thích và
          bộ lọc tìm kiếm đã lưu.
        </p>
      </div>

      {/* STATS */}
      <div className="dashboard-stats">
        <div className="extra-card">
          <strong>{items.length}</strong>
          <span>Đã lưu</span>
        </div>

        <div className="extra-card">
          <strong>{savedSearches.length}</strong>
          <span>Tìm kiếm đã lưu</span>
        </div>

        <div className="extra-card">
          <strong>
            {items.filter((i) => i.is_new).length}
          </strong>
          <span>Tin mới</span>
        </div>

        <div className="extra-card">
          <strong>
            {items.filter((i) => i.is_featured).length}
          </strong>
          <span>Nổi bật</span>
        </div>
      </div>

      {/* SAVED SEARCHES */}
      <div className="dashboard-grid-copy">
        <section className="extra-card">
          <h3 className="mb-4">
            Bộ lọc đã lưu
          </h3>

          {loading ? (
            <p className="muted-line">
              Đang tải...
            </p>
          ) : savedSearches.length ? (
            savedSearches.map((item) => (
              <div
                className="data-row"
                key={item.id}
              >
                <div>
                  <strong>
                    {item.name || "Không tên"}
                  </strong>

                  {item.query && (
                    <p className="muted-line">
                      {item.query}
                    </p>
                  )}
                </div>

                <button
                  className="btn-geo-secondary"
                  type="button"
                  onClick={async () => {
                    try {
                      await api.deleteSavedSearch(
                        item.id
                      );

                      setSavedSearches((prev) =>
                        prev.filter(
                          (row) =>
                            row.id !== item.id
                        )
                      );
                    } catch (error) {
                      console.error(
                        "Delete failed:",
                        error
                      );
                    }
                  }}
                >
                  Xóa
                </button>
              </div>
            ))
          ) : (
            <p className="muted-line">
              Chưa có bộ lọc nào được lưu.
            </p>
          )}
        </section>
      </div>

      {/* SAVED PROPERTIES */}
      <div className="mt-5">
        <h2 className="section-heading">
          Bất động sản đã lưu
        </h2>

        {loading ? (
          <p className="muted-line">
            Đang tải dữ liệu...
          </p>
        ) : items.length ? (
          <div className="mini-grid">
            {items.map((p) => (
              <article
                className="mini-property-card"
                key={p.id}
              >
                <div
                  className="mini-media"
                  style={{
                    backgroundImage: `url(${
                      p.image ||
                      "https://placehold.co/600x400?text=No+Image"
                    })`,
                  }}
                />

                <div className="mini-content">
                  <h3>
                    {p.title ||
                      "Bất động sản"}
                  </h3>

                  <p className="muted-line">
                    {p.address ||
                      "Chưa có địa chỉ"}
                  </p>

                  <strong className="price-big">
                    {p.price
                      ? Number(
                          p.price
                        ).toLocaleString(
                          "vi-VN"
                        ) + " ₫"
                      : "Liên hệ"}
                  </strong>

                  <div className="pill-row">
                    {p.area && (
                      <span>
                        {p.area} m²
                      </span>
                    )}

                    {p.bedrooms && (
                      <span>
                        {p.bedrooms} PN
                      </span>
                    )}

                    {p.bathrooms && (
                      <span>
                        {p.bathrooms} WC
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="extra-card">
            <p className="muted-line">
              Bạn chưa lưu bất động sản nào.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerDashboardPage;