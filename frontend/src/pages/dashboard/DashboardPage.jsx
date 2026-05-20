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
    featured_total: 0,
    property_type_stats: [],
  });

  const [loading, setLoading] =
    useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const data =
        await api.dashboard();

      if (data) {
        setStats({
          property_total:
            data.property_total || 0,

          lead_total:
            data.lead_total || 0,

          agent_total:
            data.agent_total || 0,

          appointment_total:
            data.appointment_total || 0,

          property_active_total:
            data.property_active_total || 0,

          property_sold_total:
            data.property_sold_total || 0,

          featured_total:
            data.featured_total || 0,

          property_type_stats:
            data.property_type_stats || [],
        });
      }
    } catch (error) {
      console.error(
        "Dashboard load failed:",
        error
      );
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
          Bảng điều khiển
        </p>

        <h1 className="section-heading">
          Dashboard
        </h1>

        <p className="muted-line">
          Theo dõi tổng quan hệ thống
          bất động sản, môi giới và
          khách hàng.
        </p>
      </div>

      {/* STATS */}
      <div className="dashboard-stats">
        <div className="extra-card">
          <strong>
            {loading
              ? "..."
              : stats.property_total}
          </strong>

          <span>Bất động sản</span>
        </div>

        <div className="extra-card">
          <strong>
            {loading
              ? "..."
              : stats.lead_total}
          </strong>

          <span>Lead</span>
        </div>

        <div className="extra-card">
          <strong>
            {loading
              ? "..."
              : stats.agent_total}
          </strong>

          <span>Môi giới</span>
        </div>

        <div className="extra-card">
          <strong>
            {loading
              ? "..."
              : stats.appointment_total}
          </strong>

          <span>Lịch hẹn</span>
        </div>
      </div>

      {/* CONTENT */}
      <div className="dashboard-grid-copy">
        {/* STATUS */}
        <section className="extra-card">
          <h3>
            Tình trạng tin đăng
          </h3>

          <div className="data-row">
            <span>Đang bán</span>

            <strong>
              {
                stats.property_active_total
              }
            </strong>
          </div>

          <div className="data-row">
            <span>Đã bán</span>

            <strong>
              {
                stats.property_sold_total
              }
            </strong>
          </div>

          <div className="data-row">
            <span>Nổi bật</span>

            <strong>
              {stats.featured_total}
            </strong>
          </div>
        </section>

        {/* PROPERTY TYPES */}
        <section className="extra-card">
          <h3>
            Loại hình bất động sản
          </h3>

          {stats.property_type_stats
            .length ? (
            stats.property_type_stats.map(
              (row, index) => (
                <div
                  className="data-row"
                  key={
                    row.property_type ||
                    index
                  }
                >
                  <span>
                    {row.property_type ||
                      "Khác"}
                  </span>

                  <strong>
                    {row.count || 0}
                  </strong>
                </div>
              )
            )
          ) : (
            <p className="muted-line">
              Chưa có dữ liệu.
            </p>
          )}
        </section>

        {/* ACTIONS */}
        <section className="extra-card">
          <h3>
            Gợi ý hành động
          </h3>

          <div className="pill-row">
            <span>
              Kiểm tra lead mới
            </span>

            <span>
              Duyệt tin đăng
            </span>

            <span>
              Theo dõi lịch hẹn
            </span>

            <span>
              Kiểm tra môi giới
            </span>
          </div>

          <p className="long-text mt-4">
            Hệ thống đang hoạt động
            bình thường. Ưu tiên xử lý
            các khách hàng tiềm năng và
            cập nhật những tin đăng mới
            trong ngày để tăng tỷ lệ
            chuyển đổi.
          </p>
        </section>
      </div>
    </div>
  );
}

export default DashboardPage;