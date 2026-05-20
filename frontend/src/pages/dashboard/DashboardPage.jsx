import { useEffect, useState } from "react";
import { api } from "../../api";
export function DashboardPage() {

  const [stats, setStats] = useState({
    property_total: 0,
    lead_total: 0,
    agent_total: 0,
    appointment_total: 0,
    property_active_total: 0,
    property_sold_total: 0,
    featured_total: 0
  });

  useEffect(() => {

    api.dashboard().then((data) => {

      if (data) {

        setStats((prev) => ({
          ...prev,
          ...data
        }));

      }

    });

  }, []);

  return (

    <PageShell
      eyebrow="Bảng điều khiển"
      title="Dashboard"
    >

      <div className="dashboard-stats">

        <div>
          <strong>
            {stats.property_total}
          </strong>

          <span>
            Bất động sản
          </span>
        </div>

        <div>
          <strong>
            {stats.lead_total || 0}
          </strong>

          <span>
            Lead
          </span>
        </div>

        <div>
          <strong>
            {stats.agent_total}
          </strong>

          <span>
            Môi giới
          </span>
        </div>

        <div>
          <strong>
            {stats.appointment_total}
          </strong>

          <span>
            Lịch hẹn
          </span>
        </div>

      </div>

      <div className="dashboard-grid-copy">

        <section className="extra-card">

          <h3>
            Tình trạng tin
          </h3>

          <div className="data-row">
            <span>Đang bán</span>

            <strong>
              {stats.property_active_total || 0}
            </strong>
          </div>

          <div className="data-row">
            <span>Đã bán</span>

            <strong>
              {stats.property_sold_total || 0}
            </strong>
          </div>

          <div className="data-row">
            <span>Nổi bật</span>

            <strong>
              {stats.featured_total || 0}
            </strong>
          </div>

        </section>

        <section className="extra-card">

          <h3>
            Loại hình
          </h3>

          {(stats.property_type_stats || []).map(
            (row) => (

              <div
                className="data-row"
                key={row.property_type}
              >

                <span>
                  {row.property_type}
                </span>

                <strong>
                  {row.count}
                </strong>

              </div>

            )
          )}

        </section>

        <section className="extra-card">

          <h3>
            Gợi ý hành động
          </h3>

          <p className="long-text">
            Ưu tiên xử lý lead mới,
            cập nhật tin chờ duyệt
            và kiểm tra các lịch hẹn
            trong 24h tới.
          </p>

        </section>

      </div>

    </PageShell>

  );
}

export default DashboardPage;