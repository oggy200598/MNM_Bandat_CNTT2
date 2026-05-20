import { useEffect, useState } from "react";

import {
  api,
  normalizeProperty
} from "../../api";

export default function WishlistPage() {
  const [wishlist, setWishlist] =
    useState([]);
  const [compare, setCompare] =
    useState([]);
  const [loading, setLoading] =
    useState(true);

  async function loadData() {
    try {
      setLoading(true);

      const [
        wishlistData,
        compareData
      ] = await Promise.all([
        api.wishlist(),
        api.compare()
      ]);

      setWishlist(
        Array.isArray(wishlistData)
          ? wishlistData
          : []
      );
      setCompare(
        Array.isArray(compareData)
          ? compareData
          : []
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="container py-5">
      <div className="mb-4">
        <p className="section-mini-title">
          Bộ sưu tập cá nhân
        </p>
        <h1 className="section-heading">
          Tin đã lưu và so sánh
        </h1>
        <p className="muted-line">
          Theo dõi bất động sản bạn quan tâm và chuyển nhanh sang bước liên hệ.
        </p>
      </div>

      <div className="dashboard-stats">
        <div className="extra-card">
          <strong>
            {wishlist.length}
          </strong>
          <span>Đã lưu</span>
        </div>
        <div className="extra-card">
          <strong>
            {compare.length}
          </strong>
          <span>Đang so sánh</span>
        </div>
      </div>

      <div className="extra-card mt-4">
        <h2 className="section-heading">
          Bất động sản đã lưu
        </h2>

        {loading ? (
          <p className="muted-line">
            Đang tải...
          </p>
        ) : wishlist.length ? (
          <div className="mini-grid">
            {wishlist.map((item) => {
              const p =
                normalizeProperty(item);

              return (
                <article
                  className="mini-property-card"
                  key={item.id}
                >
                  <div
                    className="mini-media"
                    style={{
                      backgroundImage:
                        `url(${p.imageUrl})`
                    }}
                  >
                    <span>
                      {p.statusText}
                    </span>
                  </div>

                  <div className="mini-content">
                    <h3>
                      {p.title}
                    </h3>
                    <p>
                      {p.address}
                    </p>
                    <strong>
                      {p.priceText}
                    </strong>

                    <div className="mini-actions">
                      <a
                        href={`/property-detail/${item.id}`}
                        className="btn-geo-primary"
                      >
                        Xem chi tiết
                      </a>
                      <button
                        type="button"
                        className="btn-geo-secondary"
                        onClick={async () => {
                          await api.toggleCompare(
                            item.id
                          );
                          await loadData();
                        }}
                      >
                        So sánh
                      </button>
                      <button
                        type="button"
                        className="btn-geo-secondary"
                        onClick={async () => {
                          await api.removeWishlist(
                            item.id
                          );
                          await loadData();
                        }}
                      >
                        Bỏ lưu
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="muted-line">
            Bạn chưa lưu bất động sản nào.
          </p>
        )}
      </div>

      <div className="extra-card mt-4">
        <h2 className="section-heading">
          Danh sách so sánh
        </h2>

        {compare.length ? (
          <div className="mini-grid">
            {compare.map((item) => {
              const p =
                normalizeProperty(item);

              return (
                <article
                  className="mini-property-card"
                  key={item.id}
                >
                  <div
                    className="mini-media"
                    style={{
                      backgroundImage:
                        `url(${p.imageUrl})`
                    }}
                  >
                    <span>
                      {p.typeText}
                    </span>
                  </div>

                  <div className="mini-content">
                    <h3>
                      {p.title}
                    </h3>
                    <p>
                      {p.address}
                    </p>
                    <strong>
                      {p.priceText}
                    </strong>

                    <div className="mini-actions">
                      <a
                        href="/compare"
                        className="btn-geo-primary"
                      >
                        Mở so sánh
                      </a>
                      <button
                        type="button"
                        className="btn-geo-secondary"
                        onClick={async () => {
                          await api.removeCompare(
                            item.id
                          );
                          await loadData();
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
        ) : (
          <p className="muted-line">
            Chưa có bất động sản nào trong danh sách so sánh.
          </p>
        )}
      </div>
    </div>
  );
}
