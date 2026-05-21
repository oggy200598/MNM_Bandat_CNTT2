import { useEffect, useMemo, useState } from "react";

import "../../App.css";

import { api, formatPrice, statusLabel, typeLabel } from "../../api";

const LEAD_STAGE_LABELS = {
  new: "Mới",
  contacted: "Đã liên hệ",
  qualified: "Tiềm năng",
  won: "Chốt thành công",
  lost: "Đã mất",
};

const TIME_RANGES = [
  { value: "7d", label: "7 ngày" },
  { value: "30d", label: "30 ngày" },
  { value: "quarter", label: "Quý này" },
  { value: "all", label: "Tất cả" },
];

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("vi-VN");
}

function ratio(value, total) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}

function isWithinRange(value, range) {
  if (!value || range === "all") return true;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return true;

  const now = new Date();
  if (range === "7d") {
    return now.getTime() - date.getTime() <= 7 * 24 * 60 * 60 * 1000;
  }

  if (range === "30d") {
    return now.getTime() - date.getTime() <= 30 * 24 * 60 * 60 * 1000;
  }

  const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
  const quarterStart = new Date(now.getFullYear(), quarterStartMonth, 1);
  return date >= quarterStart;
}

function DashboardMetric({ label, value, note, tone = "default" }) {
  return (
    <article className={`admin-dashboard-metric tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <p>{note}</p>}
    </article>
  );
}

function ProgressList({ items, emptyText = "Chưa có dữ liệu." }) {
  if (!items.length) {
    return <p className="muted-line">{emptyText}</p>;
  }

  return (
    <div className="admin-progress-list">
      {items.map((item) => (
        <div className="admin-progress-row" key={item.label}>
          <div className="admin-progress-head">
            <strong>{item.label}</strong>
            <span>{item.value}</span>
          </div>
          <div className="admin-progress-track">
            <div className="admin-progress-fill" style={{ width: `${item.percent}%` }} />
          </div>
          {item.note && <p>{item.note}</p>}
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [properties, setProperties] = useState([]);
  const [leads, setLeads] = useState([]);
  const [agents, setAgents] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [timeRange, setTimeRange] = useState("30d");

  async function loadDashboard() {
    try {
      setLoading(true);
      const [dashboardData, propertyRows, leadRows, agentRows] = await Promise.all([
        api.dashboard(),
        api.properties({ limit: 200 }),
        api.leads(),
        api.agents(),
      ]);

      setDashboard(dashboardData || null);
      setProperties(Array.isArray(propertyRows) ? propertyRows : []);
      setLeads(Array.isArray(leadRows) ? leadRows : []);
      setAgents(Array.isArray(agentRows) ? agentRows : []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const computed = useMemo(() => {
    const scopedProperties = properties.filter((item) => isWithinRange(item.created_at, timeRange));
    const scopedLeads = leads.filter((item) => isWithinRange(item.created_at, timeRange));
    const propertyTotal = timeRange === "all" ? (dashboard?.property_total || properties.length) : scopedProperties.length;
    const activeTotal = timeRange === "all"
      ? (dashboard?.property_active_total || scopedProperties.filter((item) => item.listing_status === "active").length)
      : scopedProperties.filter((item) => item.listing_status === "active").length;
    const soldTotal = timeRange === "all"
      ? (dashboard?.property_sold_total || scopedProperties.filter((item) => item.listing_status === "sold").length)
      : scopedProperties.filter((item) => item.listing_status === "sold").length;
    const featuredTotal = timeRange === "all"
      ? (dashboard?.featured_total || scopedProperties.filter((item) => item.is_featured).length)
      : scopedProperties.filter((item) => item.is_featured).length;
    const leadTotal = timeRange === "all" ? (dashboard?.lead_total || scopedLeads.length) : scopedLeads.length;
    const appointmentTotal = dashboard?.appointment_total || 0;
    const satisfaction = dashboard?.satisfaction || 0;

    const pendingTotal = scopedProperties.filter((item) => item.listing_status === "pending").length;
    const hiddenTotal = scopedProperties.filter((item) => item.listing_status === "hidden").length;
    const unassignedTotal = scopedProperties.filter((item) => !item.agent?.id).length;
    const inventoryValue = scopedProperties.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    const averagePrice = propertyTotal ? inventoryValue / Math.max(scopedProperties.length, 1) : 0;

    const leadStages = scopedLeads.reduce((accumulator, lead) => {
      const key = lead.pipeline_stage || "new";
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});

    const openLeads = leadTotal - (leadStages.won || 0) - (leadStages.lost || 0);
    const wonLeads = leadStages.won || 0;
    const newLeads = leadStages.new || 0;
    const conversionRate = leadTotal ? Math.round((wonLeads / leadTotal) * 100) : 0;
    const sellThroughRate = propertyTotal ? Math.round((soldTotal / propertyTotal) * 100) : 0;

    const propertyTypeSource = scopedProperties.reduce((accumulator, property) => {
      const key = property.property_type || "other";
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});
    const propertyTypeStats = Object.entries(propertyTypeSource)
      .map(([propertyType, count]) => ({
        label: typeLabel(propertyType),
        value: count,
        percent: ratio(count, propertyTotal),
        note: `${ratio(count, propertyTotal)}% nguồn cung trong giai đoạn chọn`,
      }))
      .sort((a, b) => b.value - a.value);

    const pipelineStats = Object.entries(LEAD_STAGE_LABELS).map(([key, label]) => ({
      label,
      value: leadStages[key] || 0,
      percent: ratio(leadStages[key] || 0, leadTotal),
      note: leadTotal ? `${ratio(leadStages[key] || 0, leadTotal)}% tổng số lead` : "Chưa có lead",
    }));

    const topAgents = [...agents]
      .map((agent) => ({
        ...agent,
        scopedProperties: (agent.properties || []).filter((item) => isWithinRange(item.created_at, timeRange)),
      }))
      .sort((a, b) => {
        const propertyDiff = (b.scopedProperties?.length || 0) - (a.scopedProperties?.length || 0);
        if (propertyDiff !== 0) return propertyDiff;
        return (b.rating || 0) - (a.rating || 0);
      })
      .slice(0, 5);

    const recentLeads = [...scopedLeads]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 5);

    const recentProperties = [...scopedProperties]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 5);

    const statusChart = [
      { label: "Đang bán", value: activeTotal, tone: "gold" },
      { label: "Chờ duyệt", value: pendingTotal, tone: "blue" },
      { label: "Đã bán", value: soldTotal, tone: "emerald" },
      { label: "Đang ẩn", value: hiddenTotal, tone: "purple" },
    ];

    const trendChart = [
      { label: "Lead mới", value: newLeads, tone: "blue" },
      { label: "Lead chốt", value: wonLeads, tone: "emerald" },
      { label: "Tin nổi bật", value: featuredTotal, tone: "gold" },
      { label: "Tin chưa gán", value: unassignedTotal, tone: "purple" },
    ];

    const alerts = [
      pendingTotal > 0
        ? {
            label: `${pendingTotal} bất động sản đang chờ duyệt`,
            note: "Nên xử lý sớm để tránh tồn hàng trên luồng agent.",
            tone: "warning",
          }
        : null,
      newLeads > 0
        ? {
            label: `${newLeads} lead mới chưa chăm sóc`,
            note: "Đội sale nên gọi lại trong ngày để giữ tỉ lệ chuyển đổi.",
            tone: "warning",
          }
        : null,
      unassignedTotal > 0
        ? {
            label: `${unassignedTotal} tin chưa gán môi giới`,
            note: "Những tin này đang thiếu người phụ trách trực tiếp.",
            tone: "default",
          }
        : null,
      hiddenTotal > 0
        ? {
            label: `${hiddenTotal} tin đang ẩn khỏi thị trường`,
            note: "Kiểm tra lại lý do ẩn để tránh thất thoát nguồn cung.",
            tone: "default",
          }
        : null,
    ].filter(Boolean);

    return {
      propertyTotal,
      activeTotal,
      soldTotal,
      featuredTotal,
      leadTotal,
      appointmentTotal,
      satisfaction,
      pendingTotal,
      hiddenTotal,
      unassignedTotal,
      inventoryValue,
      averagePrice,
      openLeads,
      conversionRate,
      sellThroughRate,
      propertyTypeStats,
      pipelineStats,
      topAgents,
      recentLeads,
      recentProperties,
      alerts,
      statusChart,
      trendChart,
      scopedProperties,
      scopedLeads,
    };
  }, [agents, dashboard, leads, properties, timeRange]);

  return (
    <div className="container py-5 admin-dashboard-page">
      <div className="admin-section-header">
        <div>
          <p className="section-mini-title">Quản trị</p>
          <h1 className="section-heading">Bảng điều khiển vận hành</h1>
          <p className="muted-line">
            Nhìn nhanh tình trạng nguồn hàng, pipeline khách hàng và hiệu suất đội môi giới trong một màn hình.
          </p>
        </div>
        <div className="admin-section-actions">
          <div className="admin-filter-tabs">
            {TIME_RANGES.map((item) => (
              <button
                key={item.value}
                type="button"
                className={timeRange === item.value ? "active" : ""}
                onClick={() => setTimeRange(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <span className="stat-pill">
            {loading ? "Đang tải..." : `Cập nhật ${lastUpdated ? formatDate(lastUpdated) : "vừa xong"}`}
          </span>
          <button type="button" className="btn-admin" onClick={loadDashboard}>
            Làm mới số liệu
          </button>
        </div>
      </div>

      <section className="admin-dashboard-hero extra-card">
        <div className="admin-dashboard-hero-copy">
          <strong>Trạng thái hôm nay</strong>
          <h2>
            {loading ? "Đang tổng hợp..." : `${computed.propertyTotal} tin, ${computed.leadTotal} lead, ${computed.topAgents.length} môi giới nổi bật`}
          </h2>
          <p className="muted-line">
            {loading
              ? "Hệ thống đang đồng bộ dữ liệu."
              : `Khung thời gian ${TIME_RANGES.find((item) => item.value === timeRange)?.label.toLowerCase()}, tỉ lệ bán ra ${computed.sellThroughRate}%, tỉ lệ chuyển đổi lead ${computed.conversionRate}%, mức hài lòng ${computed.satisfaction}%.`}
          </p>
        </div>
        <div className="admin-dashboard-hero-badges">
          <span className="admin-badge-tone good">Đang bán {computed.activeTotal}</span>
          <span className="admin-badge-tone warm">Chờ duyệt {computed.pendingTotal}</span>
          <span className="admin-badge-tone neutral">Lịch hẹn {computed.appointmentTotal}</span>
          <span className="admin-badge-tone dark">Nổi bật {computed.featuredTotal}</span>
        </div>
      </section>

      <div className="admin-dashboard-grid">
        <DashboardMetric
          label="Tổng nguồn hàng"
          value={loading ? "..." : computed.propertyTotal}
          note={`${computed.activeTotal} đang bán, ${computed.soldTotal} đã bán`}
          tone="gold"
        />
        <DashboardMetric
          label="Tổng giá trị niêm yết"
          value={loading ? "..." : formatPrice(computed.inventoryValue)}
          note={`Giá trung bình ${formatPrice(computed.averagePrice)}`}
          tone="emerald"
        />
        <DashboardMetric
          label="Pipeline mở"
          value={loading ? "..." : computed.openLeads}
          note={`${computed.leadTotal} lead, ${computed.conversionRate}% chuyển đổi`}
          tone="blue"
        />
        <DashboardMetric
          label="Môi giới hoạt động"
          value={loading ? "..." : agents.length}
          note={`${computed.unassignedTotal} tin chưa có người phụ trách`}
          tone="purple"
        />
      </div>

      <div className="admin-grid-panels">
        <section className="extra-card">
          <h3 className="admin-panel-title">Phân bổ loại bất động sản</h3>
          <ProgressList items={computed.propertyTypeStats} emptyText="Chưa có thống kê loại bất động sản." />
        </section>

        <section className="extra-card">
          <h3 className="admin-panel-title">Pipeline khách hàng</h3>
          <ProgressList items={computed.pipelineStats} emptyText="Chưa có lead trong hệ thống." />
        </section>

        <section className="extra-card">
          <h3 className="admin-panel-title">Biểu đồ trạng thái nguồn hàng</h3>
          <div className="admin-chart-stack">
            {computed.statusChart.map((item) => (
              <div className="admin-chart-row" key={item.label}>
                <div className="admin-chart-row-head">
                  <strong>{item.label}</strong>
                  <span>{item.value}</span>
                </div>
                <div className="admin-chart-track">
                  <div
                    className={`admin-chart-fill tone-${item.tone}`}
                    style={{ width: `${ratio(item.value, computed.propertyTotal || 1)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="extra-card">
          <h3 className="admin-panel-title">Biểu đồ vận hành</h3>
          <div className="admin-chart-stack">
            {computed.trendChart.map((item) => (
              <div className="admin-chart-row" key={item.label}>
                <div className="admin-chart-row-head">
                  <strong>{item.label}</strong>
                  <span>{item.value}</span>
                </div>
                <div className="admin-chart-track">
                  <div
                    className={`admin-chart-fill tone-${item.tone}`}
                    style={{ width: `${ratio(item.value, Math.max(computed.leadTotal, computed.propertyTotal, 1))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="extra-card">
          <h3 className="admin-panel-title">Mục cần chú ý</h3>
          {computed.alerts.length ? (
            <div className="admin-alert-stack">
              {computed.alerts.map((alert) => (
                <article className={`admin-alert-card tone-${alert.tone}`} key={alert.label}>
                  <strong>{alert.label}</strong>
                  <p>{alert.note}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="muted-line">Hiện chưa có cảnh báo vận hành nào nổi bật.</p>
          )}
        </section>

        <section className="extra-card">
          <h3 className="admin-panel-title">Tác vụ nhanh</h3>
          <div className="admin-link-grid">
            <a className="admin-link-tile" href="/admin-console/properties">
              <strong>Quản lý bất động sản</strong>
              <span>Tạo, sửa, xóa và kiểm tra trạng thái đăng tin.</span>
            </a>
            <a className="admin-link-tile" href="/admin-console/leads">
              <strong>Xử lý lead</strong>
              <span>Cập nhật giai đoạn và làm sạch danh sách khách hàng.</span>
            </a>
            <a className="admin-link-tile" href="/admin-console/images">
              <strong>Quản lý hình ảnh</strong>
              <span>Sắp xếp ảnh, đặt ảnh chính và kiểm tra media.</span>
            </a>
            <a className="admin-link-tile" href="/admin-console/reports">
              <strong>Xem báo cáo</strong>
              <span>Đi sâu vào số liệu nguồn hàng và hiệu suất bán hàng.</span>
            </a>
          </div>
        </section>
      </div>

      <div className="admin-shell-split">
        <section className="extra-card">
          <h3 className="admin-panel-title">Tin đăng mới cập nhật</h3>
          <div className="admin-dashboard-list">
            {computed.recentProperties.length ? (
              computed.recentProperties.map((property) => (
                <article className="admin-dashboard-list-item" key={property.id}>
                  <div>
                    <strong>{property.title}</strong>
                    <p>{property.address || "Chưa có địa chỉ"}</p>
                  </div>
                  <div className="admin-dashboard-list-meta">
                    <span>{formatPrice(property.price)}</span>
                    <span>{typeLabel(property.property_type)}</span>
                    <span>{statusLabel(property.listing_status)}</span>
                  </div>
                </article>
              ))
            ) : (
              <p className="muted-line">Chưa có tin đăng nào để hiển thị.</p>
            )}
          </div>
        </section>

        <div className="admin-content-stack">
          <section className="extra-card">
            <h3 className="admin-panel-title">Lead mới nhất</h3>
            <div className="admin-dashboard-list compact">
              {computed.recentLeads.length ? (
                computed.recentLeads.map((lead) => (
                  <article className="admin-dashboard-list-item" key={lead.id}>
                    <div>
                      <strong>{lead.full_name || lead.name || "Khách hàng"}</strong>
                      <p>{lead.email || lead.phone || "Chưa có liên hệ"}</p>
                    </div>
                    <div className="admin-dashboard-list-meta">
                      <span>{LEAD_STAGE_LABELS[lead.pipeline_stage] || "Mới"}</span>
                      <span>{formatDate(lead.created_at)}</span>
                    </div>
                  </article>
                ))
              ) : (
                <p className="muted-line">Chưa có lead mới trong hệ thống.</p>
              )}
            </div>
          </section>

          <section className="extra-card">
            <h3 className="admin-panel-title">Top môi giới</h3>
            <div className="admin-dashboard-list compact">
              {computed.topAgents.length ? (
                computed.topAgents.map((agent) => (
                  <article className="admin-dashboard-list-item" key={agent.id}>
                    <div>
                      <strong>{agent.name}</strong>
                      <p>{agent.email || agent.phone || "Chưa có liên hệ"}</p>
                    </div>
                    <div className="admin-dashboard-list-meta">
                      <span>{agent.scopedProperties?.length || 0} tin</span>
                      <span>{agent.rating || 5} sao</span>
                      <span>{agent.rating_count || 0} đánh giá</span>
                    </div>
                  </article>
                ))
              ) : (
                <p className="muted-line">Chưa có dữ liệu môi giới để xếp hạng.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
