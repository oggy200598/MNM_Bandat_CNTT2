import { useEffect, useState } from "react";
import { api } from "../../api";

export function CustomerDashboardPage() {

  const [items, setItems] = useState(
    sampleProperties.slice(0, 2)
  );

  const [savedSearches, setSavedSearches] =
    useState([]);

  useEffect(() => {

    api.wishlist().then((data) => {

      if (
        Array.isArray(data) &&
        data.length
      ) {

        setItems(
          data.slice(0, 2)
        );

      }

    });

    api.savedSearches().then((data) => {

      if (Array.isArray(data)) {

        setSavedSearches(data);

      }

    });

  }, []);

  return (

    <PageShell
      eyebrow="Khu vực cá nhân"
      title="Bảng điều khiển của bạn"
    >

      <div className="dashboard-stats">

        <div>

          <strong>
            {items.length}
          </strong>

          <span>
            Đã lưu
          </span>

        </div>

        <div>

          <strong>
            3
          </strong>

          <span>
            Đang so sánh
          </span>

        </div>

        <div>

          <strong>
            {savedSearches.length}
          </strong>

          <span>
            Tìm kiếm đã lưu
          </span>

        </div>

        <div>

          <strong>
            6
          </strong>

          <span>
            Tin mới khớp
          </span>

        </div>

      </div>

      <div className="dashboard-grid-copy">

        <section className="extra-card">

          <h3>
            Bộ lọc đã lưu
          </h3>

          {

            savedSearches.length

            ? savedSearches.map((item) => (

                <div
                  className="data-row"
                  key={item.id}
                >

                  <span>
                    {item.name}
                  </span>

                  <button
                    className="btn-geo-secondary"
                    type="button"
                    onClick={async () => {

                      await api.deleteSavedSearch(
                        item.id
                      );

                      setSavedSearches((prev) =>
                        prev.filter(
                          (row) =>
                            row.id !== item.id
                        )
                      );

                    }}
                  >
                    Xóa
                  </button>

                </div>

              ))

            : (

              <p className="muted-line">
                Chưa có bộ lọc nào được lưu.
              </p>

            )

          }

        </section>

      </div>

      <div className="mini-grid">

        {

          items.map((p) => (

            <PropertyMiniCard
              p={p}
              key={p.id}
            />

          ))

        }

      </div>

    </PageShell>

  );

}

export default CustomerDashboardPage;