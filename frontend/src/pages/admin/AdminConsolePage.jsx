import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import "../../App.css";
import { api, formatPrice, typeLabel, statusLabel } from "../../api";

const SECTIONS = [
  { id: "overview", label: "Tổng quan", icon: "bi-speedometer2" },
  { id: "properties", label: "Bất động sản", icon: "bi-buildings" },
  { id: "images", label: "Hình ảnh", icon: "bi-images" },
  { id: "leads", label: "Khách hàng", icon: "bi-people" },
  { id: "agents", label: "Môi giới", icon: "bi-person-badge" },
  { id: "amenities", label: "Tiện ích", icon: "bi-pin-map" },
  { id: "reports", label: "Thống kê", icon: "bi-bar-chart" },
];

const LEAD_STAGES = [
  { value: "new", label: "Mới" },
  { value: "contacted", label: "Đã liên hệ" },
  { value: "qualified", label: "Tiềm năng" },
  { value: "won", label: "Chốt thành công" },
  { value: "lost", label: "Đã mất" },
];

const AMENITY_TYPES = [
  { value: "school", label: "Trường học" },
  { value: "hospital", label: "Bệnh viện" },
  { value: "park", label: "Công viên" },
  { value: "supermarket", label: "Siêu thị" },
  { value: "other", label: "Khác" },
];

function emptyPropertyForm() {
  return {
    title: "",
    description: "",
    property_type: "apartment",
    listing_status: "pending",
    price: "",
    area: "",
    address: "",
  };
}

function emptyAmenityForm() {
  return {
    name: "",
    amenity_type: "school",
    lat: "",
    lng: "",
  };
}

function emptyAgentForm() {
  return {
    name: "",
    email: "",
    phone: "",
  };
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("vi-VN");
}

function statusTone(status) {
  const key = String(status || "").toLowerCase();
  if (key === "active" || key === "won") return "success";
  if (key === "pending" || key === "new") return "warning";
  if (key === "sold" || key === "qualified") return "info";
  if (key === "hidden" || key === "lost") return "muted";
  if (key === "contacted") return "accent";
  return "default";
}

function AdminStatusBadge({ children, tone = "default" }) {
  return <span className={`admin-status-badge tone-${tone}`}>{children}</span>;
}

function propertyTypeTone(type) {
  const key = String(type || "").toLowerCase();
  if (key === "apartment") return "info";
  if (key === "house") return "warning";
  if (key === "land") return "success";
  if (key === "villa") return "accent";
  return "default";
}

function toneColor(tone) {
  return {
    gold: "#c59d4f",
    warning: "#d2a94d",
    blue: "#4e7fd0",
    info: "#4e7fd0",
    emerald: "#43b283",
    success: "#43b283",
    purple: "#8b6bc1",
    accent: "#8b6bc1",
    muted: "#9aa4b2",
    default: "#c59d4f",
  }[tone || "default"] || "#c59d4f";
}

function AdminMetricCard({ label, value, note }) {
  return (
    <article className="admin-metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <p>{note}</p>}
    </article>
  );
}

function MiniChartList({ items }) {
  const maxValue = Math.max(...items.map((item) => Number(item.value) || 0), 1);

  return (
    <div className="admin-chart-stack">
      {items.map((item) => (
        <div className="admin-chart-row" key={item.label}>
          <div className="admin-chart-row-head">
            <strong>{item.label}</strong>
            <span>{item.value}</span>
          </div>
          <div className="admin-chart-track">
            <div
              className={`admin-chart-fill tone-${item.tone || "gold"}`}
              style={{ width: `${Math.max(8, Math.round(((Number(item.value) || 0) / maxValue) * 100))}%` }}
            />
          </div>
          {item.note && <p className="muted-line">{item.note}</p>}
        </div>
      ))}
    </div>
  );
}

function paginateItems(items, page, pageSize) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    page: safePage,
    pageSize,
    totalItems,
    totalPages,
    items: items.slice(start, start + pageSize),
  };
}

function AdminPagination({ page, totalPages, totalItems, onChange }) {
  if (!totalItems) return null;

  return (
    <div className="admin-pagination">
      <span className="muted-line">Trang {page} / {totalPages} · {totalItems} bản ghi</span>
      <div className="admin-row-actions">
        <button type="button" className="btn-geo-secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <i className="bi bi-chevron-left"></i>
          Trước
        </button>
        <button type="button" className="btn-geo-secondary" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          Sau
          <i className="bi bi-chevron-right"></i>
        </button>
      </div>
    </div>
  );
}

function BarChart({ items, height = 220 }) {
  const maxValue = Math.max(...items.map((item) => Number(item.value) || 0), 1);

  return (
    <div className="admin-bar-chart">
      <svg viewBox={`0 0 ${items.length * 88} ${height}`} className="admin-bar-chart-svg" role="img" aria-label="Biểu đồ cột">
        {items.map((item, index) => {
          const value = Number(item.value) || 0;
          const barHeight = Math.max(10, (value / maxValue) * (height - 72));
          const x = 18 + index * 88;
          const y = height - 42 - barHeight;

          return (
            <g key={item.label}>
              <text x={x + 26} y={y - 8} textAnchor="middle" className="admin-bar-value">
                {value}
              </text>
              <rect x={x} y={y} rx="12" ry="12" width="52" height={barHeight} fill={toneColor(item.tone)} opacity="0.95" />
              <text x={x + 26} y={height - 18} textAnchor="middle" className="admin-bar-label">
                {item.shortLabel || item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function DonutChart({ items, size = 220 }) {
  const total = items.reduce((sum, item) => sum + (Number(item.value) || 0), 0) || 1;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="admin-donut-wrap">
      <svg viewBox="0 0 220 220" className="admin-donut-chart" role="img" aria-label="Biểu đồ tròn">
        <circle cx="110" cy="110" r={radius} fill="none" stroke="rgba(15,23,42,0.08)" strokeWidth="24" />
        {items.map((item) => {
          const value = Number(item.value) || 0;
          const segment = (value / total) * circumference;
          const currentOffset = offset;
          offset += segment;
          return (
            <circle
              key={item.label}
              cx="110"
              cy="110"
              r={radius}
              fill="none"
              stroke={toneColor(item.tone)}
              strokeWidth="24"
              strokeDasharray={`${segment} ${circumference - segment}`}
              strokeDashoffset={-currentOffset}
              transform="rotate(-90 110 110)"
              strokeLinecap="butt"
            />
          );
        })}
        <text x="110" y="102" textAnchor="middle" className="admin-donut-total-label">Tổng</text>
        <text x="110" y="126" textAnchor="middle" className="admin-donut-total-value">{total}</text>
      </svg>
      <div className="admin-donut-legend">
        {items.map((item) => (
          <div key={item.label} className="admin-donut-legend-item">
            <span className="admin-donut-dot" style={{ backgroundColor: toneColor(item.tone) }}></span>
            <strong>{item.label}</strong>
            <span>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminSectionHeader({ eyebrow, title, desc, actions }) {
  return (
    <div className="admin-section-header">
      <div>
        <p className="section-mini-title">{eyebrow}</p>
        <h2 className="section-heading">{title}</h2>
        {desc && <p className="muted-line">{desc}</p>}
      </div>
      {actions && <div className="admin-section-actions">{actions}</div>}
    </div>
  );
}

export default function AdminConsolePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [properties, setProperties] = useState([]);
  const [leads, setLeads] = useState([]);
  const [agents, setAgents] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [propertyEditingId, setPropertyEditingId] = useState(null);
  const [agentEditingId, setAgentEditingId] = useState(null);
  const [amenityEditingId, setAmenityEditingId] = useState(null);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState([]);
  const [tablePages, setTablePages] = useState({
    properties: 1,
    leads: 1,
    agents: 1,
    amenities: 1,
  });
  const [propertyForm, setPropertyForm] = useState(emptyPropertyForm());
  const [agentForm, setAgentForm] = useState(emptyAgentForm());
  const [amenityForm, setAmenityForm] = useState(emptyAmenityForm());

  // Image management state
  const [imageTargetPropertyId, setImageTargetPropertyId] = useState("");
  const [imageTargetProperty, setImageTargetProperty] = useState(null);
  const [images, setImages] = useState([]);
  const [imageForm, setImageForm] = useState({ file: null, caption: "", sort_order: 0 });
  const [imageMessage, setImageMessage] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const [draggingImageId, setDraggingImageId] = useState(null);

  const pathParts = location.pathname.split("/").filter(Boolean);
  const requestedSection = pathParts[1] || "overview";
  const activeSection = SECTIONS.some((item) => item.id === requestedSection)
    ? requestedSection
    : "overview";

  async function loadAll() {
    try {
      setLoading(true);
      setMessage("");
      const [dashboardData, propertyRows, leadRows, agentRows, amenityRows] =
        await Promise.all([
          api.dashboard(),
          api.properties({ limit: 200 }),
          api.leads(),
          api.agents(),
          api.amenities(),
        ]);

      setDashboard(dashboardData || null);
      setProperties(Array.isArray(propertyRows) ? propertyRows : []);
      setLeads(Array.isArray(leadRows) ? leadRows : []);
      setAgents(Array.isArray(agentRows) ? agentRows : []);
      setAmenities(Array.isArray(amenityRows) ? amenityRows : []);
    } catch (error) {
      console.error(error);
      setMessage("Không tải được dữ liệu quản trị.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        loadAll();
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (location.pathname === "/admin-console") {
      navigate("/admin-console/overview", { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    const propertyId = searchParams.get("propertyId");

    if (activeSection === "images" && propertyId) {
      setImageTargetPropertyId(propertyId);
      loadImagesForProperty(propertyId);
    }
  }, [activeSection, location.search]);

  const propertyTypeStats = useMemo(() => {
    if (dashboard?.property_type_stats?.length) {
      return dashboard.property_type_stats;
    }

    const grouped = properties.reduce((acc, item) => {
      const key = item.property_type || "other";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped).map(([property_type, count]) => ({
      property_type,
      count,
    }));
  }, [dashboard, properties]);

  const propertyStatusStats = useMemo(() => {
    return properties.reduce((acc, item) => {
      const key = item.listing_status || "pending";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [properties]);

  const leadStageStats = useMemo(() => {
    return leads.reduce((acc, item) => {
      const key = item.pipeline_stage || "new";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [leads]);

  const topAgents = useMemo(() => {
    const grouped = properties.reduce((acc, item) => {
      const name = item.agent?.name || "Chưa gán";
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [properties]);

  const propertyPage = useMemo(
    () => paginateItems(properties, tablePages.properties, 8),
    [properties, tablePages.properties]
  );

  const leadPage = useMemo(
    () => paginateItems(leads, tablePages.leads, 8),
    [leads, tablePages.leads]
  );

  const agentPage = useMemo(
    () => paginateItems(agents, tablePages.agents, 8),
    [agents, tablePages.agents]
  );

  const amenityPage = useMemo(
    () => paginateItems(amenities, tablePages.amenities, 8),
    [amenities, tablePages.amenities]
  );

  const reportSummary = useMemo(() => {
    const inventoryValue = properties.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    const averagePrice = properties.length ? inventoryValue / properties.length : 0;
    const activeTotal = propertyStatusStats.active || 0;
    const soldTotal = propertyStatusStats.sold || 0;
    const leadTotal = leads.length;
    const wonTotal = leadStageStats.won || 0;
    const conversionRate = leadTotal ? Math.round((wonTotal / leadTotal) * 100) : 0;

    return {
      inventoryValue,
      averagePrice,
      activeTotal,
      soldTotal,
      leadTotal,
      conversionRate,
    };
  }, [leadStageStats, leads.length, properties, propertyStatusStats]);

  function downloadBlob(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function exportReportsCsv() {
    const lines = [
      ["Nhóm", "Tên", "Giá trị"],
      ...propertyTypeStats.map((item) => ["Loại bất động sản", typeLabel(item.property_type), item.count]),
      ...LEAD_STAGES.map((item) => ["Pipeline lead", item.label, leadStageStats[item.value] || 0]),
      ["Trạng thái tin", "Đang bán", propertyStatusStats.active || 0],
      ["Trạng thái tin", "Chờ duyệt", propertyStatusStats.pending || 0],
      ["Trạng thái tin", "Đã bán", propertyStatusStats.sold || 0],
      ["Trạng thái tin", "Ẩn", propertyStatusStats.hidden || 0],
      ...topAgents.map((item) => ["Top môi giới", item.name, item.total]),
    ];

    const csv = lines
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    downloadBlob("admin-report.csv", "\uFEFF" + csv, "text/csv;charset=utf-8;");
  }

  function exportReportsPdf() {
    const html = `
      <html>
        <head>
          <title>Admin Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #1f2937; }
            h1, h2 { margin: 0 0 12px; }
            .meta { margin-bottom: 24px; color: #6b7280; }
            .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 24px; }
            .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
            .card strong { display: block; font-size: 24px; margin-top: 8px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            th, td { border-bottom: 1px solid #e5e7eb; padding: 10px; text-align: left; }
            th { background: #f8fafc; }
          </style>
        </head>
        <body>
          <h1>Báo cáo quản trị</h1>
          <div class="meta">Xuất lúc: ${formatDate(new Date().toISOString())}</div>
          <div class="grid">
            <div class="card">Tổng nguồn hàng<strong>${properties.length}</strong></div>
            <div class="card">Tổng giá trị niêm yết<strong>${formatPrice(reportSummary.inventoryValue)}</strong></div>
            <div class="card">Lead hiện có<strong>${reportSummary.leadTotal}</strong></div>
            <div class="card">Tỉ lệ chuyển đổi<strong>${reportSummary.conversionRate}%</strong></div>
          </div>
          <h2>Loại bất động sản</h2>
          <table>
            <thead><tr><th>Loại</th><th>Số lượng</th></tr></thead>
            <tbody>${propertyTypeStats.map((item) => `<tr><td>${typeLabel(item.property_type)}</td><td>${item.count}</td></tr>`).join("")}</tbody>
          </table>
          <h2>Pipeline lead</h2>
          <table>
            <thead><tr><th>Giai đoạn</th><th>Số lượng</th></tr></thead>
            <tbody>${LEAD_STAGES.map((item) => `<tr><td>${item.label}</td><td>${leadStageStats[item.value] || 0}</td></tr>`).join("")}</tbody>
          </table>
        </body>
      </html>
    `;

    const reportWindow = window.open("", "_blank", "width=960,height=720");
    if (!reportWindow) {
      setMessage("Trình duyệt đang chặn popup xuất PDF.");
      return;
    }

    reportWindow.document.open();
    reportWindow.document.write(html);
    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.print();
  }

  function selectSection(sectionId) {
    navigate(`/admin-console/${sectionId}`);
    setMessage("");
  }

  function setTablePage(key, page) {
    setTablePages((prev) => ({
      ...prev,
      [key]: page,
    }));
  }

  function openImagesForProperty(propertyId) {
    navigate(`/admin-console/images?propertyId=${propertyId}`);
    setImageTargetPropertyId(String(propertyId));
    setImageTargetProperty(null);
    setImages([]);
    setImageMessage("");
  }

  function resetPropertyForm() {
    setPropertyEditingId(null);
    setPropertyForm(emptyPropertyForm());
  }

  function resetAmenityForm() {
    setAmenityEditingId(null);
    setAmenityForm(emptyAmenityForm());
  }

  function resetAgentForm() {
    setAgentEditingId(null);
    setAgentForm(emptyAgentForm());
  }

  function handlePropertyField(event) {
    setPropertyForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  }

  function handleAmenityField(event) {
    setAmenityForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  }

  function handleAgentField(event) {
    setAgentForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  }

  async function submitProperty(event) {
    event.preventDefault();

    try {
      const payload = {
        ...propertyForm,
        price: propertyForm.price || null,
        area: propertyForm.area || null,
      };

      const saved = propertyEditingId
        ? await api.updateProperty(propertyEditingId, payload)
        : await api.createProperty(payload);

      if (saved?.id) {
        resetPropertyForm();
        await loadAll();
        setMessage(
          propertyEditingId
            ? `Đã cập nhật tin #${saved.id}.`
            : `Đã tạo tin #${saved.id}.`
        );
      }
    } catch (error) {
      console.error(error);
      setMessage("Không lưu được bất động sản.");
    }
  }

  function editProperty(row) {
    setPropertyEditingId(row.id);
    setPropertyForm({
      title: row.title || "",
      description: row.description || "",
      property_type: row.property_type || "apartment",
      listing_status: row.listing_status || "pending",
      price: row.price ?? "",
      area: row.area ?? "",
      address: row.address || "",
    });
    setMessage(`Đang sửa tin #${row.id}.`);
  }

  async function removeProperty(row) {
    if (!window.confirm(`Xóa tin "${row.title}"?`)) return;
    const result = await api.deleteProperty(row.id);
    if (result?.ok) {
      if (String(propertyEditingId) === String(row.id)) {
        resetPropertyForm();
      }
      await loadAll();
      setMessage(`Đã xóa tin #${row.id}.`);
    } else {
      setMessage("Không xóa được bất động sản.");
    }
  }

  function togglePropertySelection(propertyId) {
    setSelectedPropertyIds((prev) =>
      prev.includes(String(propertyId))
        ? prev.filter((item) => item !== String(propertyId))
        : [...prev, String(propertyId)]
    );
  }

  function toggleAllProperties() {
    const currentPageIds = propertyPage.items.map((item) => String(item.id));
    const allCurrentSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedPropertyIds.includes(id));

    if (allCurrentSelected) {
      setSelectedPropertyIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
      return;
    }

    setSelectedPropertyIds((prev) => [...new Set([...prev, ...currentPageIds])]);
  }

  async function runBulkPropertyAction(action) {
    if (!selectedPropertyIds.length) {
      setMessage("Hãy chọn ít nhất một bất động sản.");
      return;
    }

    const selectedRows = properties.filter((item) => selectedPropertyIds.includes(String(item.id)));

    if (action === "delete") {
      if (!window.confirm(`Xóa ${selectedRows.length} bất động sản đã chọn?`)) return;
      await Promise.all(selectedRows.map((item) => api.deleteProperty(item.id)));
      setSelectedPropertyIds([]);
      await loadAll();
      setMessage(`Đã xóa ${selectedRows.length} bất động sản.`);
      return;
    }

    const nextStatus =
      action === "activate"
        ? "active"
        : "hidden";

    await Promise.all(
      selectedRows.map((item) =>
        api.updatePropertyStage(item.id, { listing_status: nextStatus })
      )
    );

    setSelectedPropertyIds([]);
    await loadAll();
    setMessage(
      action === "activate"
        ? `Đã duyệt ${selectedRows.length} bất động sản.`
        : `Đã ẩn ${selectedRows.length} bất động sản.`
    );
  }

  async function updateLeadStage(row, stage) {
    const saved = await api.updateLeadStage(row.id, { pipeline_stage: stage });
    if (saved?.id) {
      setLeads((prev) =>
        prev.map((item) => (String(item.id) === String(row.id) ? saved : item))
      );
      setMessage(`Đã cập nhật lead #${row.id}.`);
      return;
    }
    setMessage("Không cập nhật được lead.");
  }

  async function submitAgent(event) {
    event.preventDefault();

    try {
      const payload = {
        name: agentForm.name?.trim(),
        email: agentForm.email?.trim() || null,
        phone: agentForm.phone?.trim() || null,
      };

      const saved = agentEditingId
        ? await api.updateAgent(agentEditingId, payload)
        : await api.createAgent(payload);

      if (saved?.id) {
        resetAgentForm();
        await loadAll();
        setMessage(
          agentEditingId
            ? `Đã cập nhật môi giới #${saved.id}.`
            : `Đã tạo môi giới #${saved.id}.`
        );
      }
    } catch (error) {
      console.error(error);
      setMessage("Không lưu được môi giới.");
    }
  }

  function editAgent(row) {
    setAgentEditingId(row.id);
    setAgentForm({
      name: row.name || "",
      email: row.email || "",
      phone: row.phone || "",
    });
    setMessage(`Đang sửa môi giới #${row.id}.`);
  }

  async function removeAgent(row) {
    if (!window.confirm(`Xóa môi giới "${row.name}"? Các tin đang gán sẽ bị bỏ gán.`)) return;
    const result = await api.deleteAgent(row.id);
    if (result?.ok) {
      if (String(agentEditingId) === String(row.id)) {
        resetAgentForm();
      }
      await loadAll();
      setMessage(`Đã xóa môi giới #${row.id}.`);
    } else {
      setMessage("Không xóa được môi giới.");
    }
  }

  async function removeLead(row) {
    if (!window.confirm(`Xóa lead của "${row.name || row.email || row.id}"?`)) return;
    const result = await api.deleteLead(row.id);
    if (result?.ok) {
      setLeads((prev) => prev.filter((item) => String(item.id) !== String(row.id)));
      setMessage(`Đã xóa lead #${row.id}.`);
    } else {
      setMessage("Không xóa được lead.");
    }
  }

  async function submitAmenity(event) {
    event.preventDefault();

    try {
      const payload = {
        ...amenityForm,
        lat: amenityForm.lat || null,
        lng: amenityForm.lng || null,
      };

      const saved = amenityEditingId
        ? await api.updateAmenity(amenityEditingId, payload)
        : await api.createAmenity(payload);

      if (saved?.id) {
        resetAmenityForm();
        await loadAll();
        setMessage(
          amenityEditingId
            ? `Đã cập nhật tiện ích #${saved.id}.`
            : `Đã tạo tiện ích #${saved.id}.`
        );
      }
    } catch (error) {
      console.error(error);
      setMessage("Không lưu được tiện ích.");
    }
  }

  function editAmenity(row) {
    setAmenityEditingId(row.id);
    setAmenityForm({
      name: row.name || "",
      amenity_type: row.amenity_type || row.type || "school",
      lat: row.lat ?? "",
      lng: row.lng ?? "",
    });
    setMessage(`Đang sửa tiện ích #${row.id}.`);
  }

  async function removeAmenity(row) {
    if (!window.confirm(`Xóa tiện ích "${row.name}"?`)) return;
    const result = await api.deleteAmenity(row.id);
    if (result?.ok) {
      if (String(amenityEditingId) === String(row.id)) {
        resetAmenityForm();
      }
      await loadAll();
      setMessage(`Đã xóa tiện ích #${row.id}.`);
    } else {
      setMessage("Không xóa được tiện ích.");
    }
  }

  function renderOverview() {
    return (
      <div className="admin-content-stack">
        <AdminSectionHeader
          eyebrow="Admin Console"
          title="Trung tâm vận hành"
          desc="Khu quản trị riêng cho admin để theo dõi hệ thống, xử lý dữ liệu và đi vào từng mảng vận hành."
          actions={
            <button type="button" className="btn-geo-secondary" onClick={loadAll}>
              Làm mới dữ liệu
            </button>
          }
        />

        <section className="admin-metric-grid">
          <AdminMetricCard label="Bất động sản" value={dashboard?.property_total || properties.length} note={`${dashboard?.property_active_total || propertyStatusStats.active || 0} tin đang bán`} />
          <AdminMetricCard label="Môi giới" value={dashboard?.agent_total || agents.length} note={`${topAgents.length} môi giới nổi bật`} />
          <AdminMetricCard label="Leads" value={dashboard?.lead_total || leads.length} note={`${leadStageStats.new || 0} lead mới`} />
          <AdminMetricCard label="Lịch hẹn" value={dashboard?.appointment_total || 0} note={`${dashboard?.featured_total || 0} tin nổi bật`} />
        </section>

        <section className="admin-grid-panels">
          <article className="extra-card">
            <h3 className="admin-panel-title">Lối tắt quản trị</h3>
            <div className="admin-link-grid">
              {SECTIONS.filter((item) => item.id !== "overview").map((item) => (
                <button key={item.id} type="button" className="admin-link-tile" onClick={() => selectSection(item.id)}>
                  <strong>{item.label}</strong>
                  <span>Mở trang {item.label.toLowerCase()}</span>
                </button>
              ))}
            </div>
          </article>

          <article className="extra-card">
            <h3 className="admin-panel-title">Trạng thái hệ thống</h3>
            <div className="admin-stat-list">
              <div><span>Tin đang bán</span><strong>{propertyStatusStats.active || 0}</strong></div>
              <div><span>Tin chờ duyệt</span><strong>{propertyStatusStats.pending || 0}</strong></div>
              <div><span>Tin đã bán</span><strong>{propertyStatusStats.sold || 0}</strong></div>
              <div><span>Tiện ích đã đồng bộ</span><strong>{amenities.length}</strong></div>
            </div>
          </article>
        </section>
      </div>
    );
  }

  function renderProperties() {
    return (
      <div className="admin-content-stack">
        <AdminSectionHeader
          eyebrow="CRUD"
          title="Quản lý bất động sản"
          desc="Tạo mới, cập nhật và xóa tin đăng ngay trong bảng điều hành admin."
        />

        <div className="admin-shell-split">
          <section className="extra-card">
            <div className="admin-topbar">
              <div className="admin-inline-copy">
                <h3>Bảng bất động sản</h3>
                <span className="muted-line">{properties.length} bản ghi</span>
              </div>
              <div className="admin-row-actions">
                <span className="muted-line">{selectedPropertyIds.length} đang chọn</span>
                <button type="button" className="btn-geo-secondary" onClick={() => runBulkPropertyAction("activate")}>
                  <i className="bi bi-check2-circle"></i>
                  Duyệt hàng loạt
                </button>
                <button type="button" className="btn-geo-secondary" onClick={() => runBulkPropertyAction("hide")}>
                  <i className="bi bi-eye-slash"></i>
                  Ẩn hàng loạt
                </button>
                <button type="button" className="btn-geo-secondary danger-btn" onClick={() => runBulkPropertyAction("delete")}>
                  <i className="bi bi-trash3"></i>
                  Xóa hàng loạt
                </button>
              </div>
            </div>
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={
                          propertyPage.items.length > 0
                          && propertyPage.items.every((item) => selectedPropertyIds.includes(String(item.id)))
                        }
                        onChange={toggleAllProperties}
                      />
                    </th>
                    <th>ID</th>
                    <th className="admin-title-col">Tên</th>
                    <th>Loại</th>
                    <th>Trạng thái</th>
                    <th>Giá</th>
                    <th>Cập nhật</th>
                    <th className="table-actions-col">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {propertyPage.items.length ? propertyPage.items.map((row) => (
                    <tr key={`property-${row.id}`}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedPropertyIds.includes(String(row.id))}
                          onChange={() => togglePropertySelection(row.id)}
                        />
                      </td>
                      <td>{row.id}</td>
                      <td className="admin-title-cell">{row.title}</td>
                      <td>
                        <AdminStatusBadge tone={propertyTypeTone(row.property_type)}>
                          {typeLabel(row.property_type)}
                        </AdminStatusBadge>
                      </td>
                      <td>
                        <AdminStatusBadge tone={statusTone(row.listing_status)}>
                          {statusLabel(row.listing_status)}
                        </AdminStatusBadge>
                      </td>
                      <td>{formatPrice(row.price)}</td>
                      <td>{formatDate(row.updated_at)}</td>
                      <td>
                        <div className="admin-row-actions">
                          <button type="button" className="btn-geo-secondary" onClick={() => editProperty(row)}><i className="bi bi-pencil-square"></i>Sửa</button>
                          <button type="button" className="btn-geo-secondary" onClick={() => openImagesForProperty(row.id)}><i className="bi bi-images"></i>Ảnh</button>
                          <button type="button" className="btn-geo-secondary danger-btn" onClick={() => removeProperty(row)}><i className="bi bi-trash3"></i>Xóa</button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="8" className="admin-empty-cell">Chưa có bất động sản nào.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <AdminPagination
              page={propertyPage.page}
              totalPages={propertyPage.totalPages}
              totalItems={propertyPage.totalItems}
              onChange={(page) => setTablePage("properties", page)}
            />
          </section>

          <form className="extra-card form-stack" onSubmit={submitProperty}>
            <h3>{propertyEditingId ? `Sửa tin #${propertyEditingId}` : "Tạo tin mới"}</h3>
            <div className="field"><label>Tiêu đề</label><input name="title" value={propertyForm.title} onChange={handlePropertyField} /></div>
            <div className="field"><label>Loại bất động sản</label><select name="property_type" value={propertyForm.property_type} onChange={handlePropertyField}><option value="apartment">Căn hộ</option><option value="house">Nhà</option><option value="land">Đất</option><option value="villa">Biệt thự</option></select></div>
            <div className="field"><label>Trạng thái</label><select name="listing_status" value={propertyForm.listing_status} onChange={handlePropertyField}><option value="pending">Chờ duyệt</option><option value="active">Đang bán</option><option value="sold">Đã bán</option><option value="hidden">Ẩn</option></select></div>
            <div className="field"><label>Giá</label><input type="number" name="price" value={propertyForm.price} onChange={handlePropertyField} /></div>
            <div className="field"><label>Diện tích</label><input type="number" name="area" value={propertyForm.area} onChange={handlePropertyField} /></div>
            <div className="field"><label>Địa chỉ</label><input name="address" value={propertyForm.address} onChange={handlePropertyField} /></div>
            <div className="field"><label>Mô tả</label><textarea rows="5" name="description" value={propertyForm.description} onChange={handlePropertyField} /></div>
            <div className="admin-form-actions">
              <button type="submit" className="btn-geo-primary">{propertyEditingId ? "Lưu cập nhật" : "Tạo bất động sản"}</button>
              {propertyEditingId && <button type="button" className="btn-geo-secondary" onClick={resetPropertyForm}>Hủy sửa</button>}
            </div>
          </form>
        </div>
      </div>
    );
  }

  function renderLeads() {
    return (
      <div className="admin-content-stack">
        <AdminSectionHeader eyebrow="CRM" title="Quản lý leads" desc="Theo dõi pipeline và làm sạch danh sách khách hàng ngay trong khu admin." />
        <section className="extra-card">
          <div className="admin-topbar">
            <h3>Danh sách leads</h3>
            <span className="muted-line">{leads.length} bản ghi</span>
          </div>
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Khách hàng</th>
                  <th>Liên hệ</th>
                  <th className="admin-title-col">Nhu cầu</th>
                  <th>Giai đoạn</th>
                  <th>Tạo lúc</th>
                  <th className="table-actions-col">Thao tác</th>
                </tr>
              </thead>
                <tbody>
                {leadPage.items.length ? leadPage.items.map((row) => (
                  <tr key={`lead-${row.id}`}>
                    <td>{row.id}</td>
                    <td>{row.name || "—"}</td>
                    <td>
                      <div className="admin-inline-copy">
                        <span>{row.email || "—"}</span>
                        <span>{row.phone || "—"}</span>
                      </div>
                    </td>
                    <td className="admin-title-cell">{row.property_interest || row.message || "—"}</td>
                    <td>
                      <div className="admin-stage-cell">
                        <AdminStatusBadge tone={statusTone(row.pipeline_stage)}>
                          {LEAD_STAGES.find((item) => item.value === (row.pipeline_stage || "new"))?.label || "Mới"}
                        </AdminStatusBadge>
                        <select className="admin-inline-select" value={row.pipeline_stage || "new"} onChange={(event) => updateLeadStage(row, event.target.value)}>
                          {LEAD_STAGES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                        </select>
                      </div>
                    </td>
                    <td>{formatDate(row.created_at)}</td>
                    <td>
                      <button type="button" className="btn-geo-secondary danger-btn" onClick={() => removeLead(row)}>
                        <i className="bi bi-trash3"></i>
                        Xóa
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="7" className="admin-empty-cell">Chưa có lead nào trong hệ thống.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <AdminPagination
            page={leadPage.page}
            totalPages={leadPage.totalPages}
            totalItems={leadPage.totalItems}
            onChange={(page) => setTablePage("leads", page)}
          />
        </section>
      </div>
    );
  }

  function renderAgents() {
    return (
      <div className="admin-content-stack">
        <AdminSectionHeader eyebrow="Directory" title="Danh mục môi giới" desc="Trang quản trị chi tiết để kiểm tra liên hệ, số lượng tin đang phụ trách và hiệu suất phân bổ." />
        <section className="admin-metric-grid">
          <AdminMetricCard label="Tổng môi giới" value={agents.length} />
          <AdminMetricCard label="Top phụ trách" value={topAgents[0]?.name || "—"} note={topAgents[0] ? `${topAgents[0].total} tin` : "Chưa có dữ liệu"} />
          <AdminMetricCard label="Tin trung bình" value={agents.length ? (properties.length / agents.length).toFixed(1) : "0"} note="tin / môi giới" />
        </section>
        <div className="admin-shell-split">
          <section className="extra-card">
            <div className="admin-topbar">
              <h3>Danh sách môi giới</h3>
              <span className="muted-line">{agents.length} bản ghi</span>
            </div>
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th className="admin-title-col">Tên</th>
                    <th>Email</th>
                    <th>Điện thoại</th>
                    <th>Số tin</th>
                    <th>Đánh giá</th>
                    <th className="table-actions-col">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {agentPage.items.length ? agentPage.items.map((row) => (
                    <tr key={`agent-${row.id}`}>
                      <td>{row.id}</td>
                      <td className="admin-title-cell">{row.name}</td>
                      <td>{row.email || "—"}</td>
                      <td>{row.phone || "—"}</td>
                      <td>{row.properties?.length || 0}</td>
                      <td>
                        <AdminStatusBadge tone="gold">{row.rating || 5} / 5</AdminStatusBadge>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <button type="button" className="btn-geo-secondary" onClick={() => editAgent(row)}><i className="bi bi-pencil-square"></i>Sửa</button>
                          <button type="button" className="btn-geo-secondary danger-btn" onClick={() => removeAgent(row)}><i className="bi bi-trash3"></i>Xóa</button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="7" className="admin-empty-cell">Chưa có môi giới nào.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <AdminPagination
              page={agentPage.page}
              totalPages={agentPage.totalPages}
              totalItems={agentPage.totalItems}
              onChange={(page) => setTablePage("agents", page)}
            />
          </section>

          <form className="extra-card form-stack" onSubmit={submitAgent}>
            <h3>{agentEditingId ? `Sửa môi giới #${agentEditingId}` : "Tạo môi giới mới"}</h3>
            <div className="field"><label>Họ tên</label><input name="name" value={agentForm.name} onChange={handleAgentField} /></div>
            <div className="field"><label>Email</label><input name="email" type="email" value={agentForm.email} onChange={handleAgentField} /></div>
            <div className="field"><label>Số điện thoại</label><input name="phone" value={agentForm.phone} onChange={handleAgentField} /></div>
            <div className="admin-form-actions">
              <button type="submit" className="btn-geo-primary">{agentEditingId ? "Lưu cập nhật" : "Tạo môi giới"}</button>
              {agentEditingId && <button type="button" className="btn-geo-secondary" onClick={resetAgentForm}>Hủy sửa</button>}
            </div>
          </form>
        </div>
      </div>
    );
  }

  function renderAmenities() {
    return (
      <div className="admin-content-stack">
        <AdminSectionHeader eyebrow="CRUD" title="Quản lý tiện ích" desc="Thêm, sửa và xóa các điểm tiện ích phục vụ bản đồ và gợi ý khu vực." />

        <div className="admin-shell-split">
          <section className="extra-card">
            <div className="admin-topbar">
              <h3>Bảng tiện ích</h3>
              <span className="muted-line">{amenities.length} bản ghi</span>
            </div>
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th className="admin-title-col">Tên</th>
                    <th>Loại</th>
                    <th>Vĩ độ</th>
                    <th>Kinh độ</th>
                    <th className="table-actions-col">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {amenityPage.items.length ? amenityPage.items.map((row) => (
                    <tr key={`amenity-${row.id}`}>
                      <td>{row.id}</td>
                      <td className="admin-title-cell">{row.name}</td>
                      <td>{row.type || row.amenity_type}</td>
                      <td>{row.lat ?? "—"}</td>
                      <td>{row.lng ?? "—"}</td>
                      <td>
                        <div className="admin-row-actions">
                          <button type="button" className="btn-geo-secondary" onClick={() => editAmenity(row)}><i className="bi bi-pencil-square"></i>Sửa</button>
                          <button type="button" className="btn-geo-secondary danger-btn" onClick={() => removeAmenity(row)}><i className="bi bi-trash3"></i>Xóa</button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="6" className="admin-empty-cell">Chưa có tiện ích nào.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <AdminPagination
              page={amenityPage.page}
              totalPages={amenityPage.totalPages}
              totalItems={amenityPage.totalItems}
              onChange={(page) => setTablePage("amenities", page)}
            />
          </section>

          <form className="extra-card form-stack" onSubmit={submitAmenity}>
            <h3>{amenityEditingId ? `Sửa tiện ích #${amenityEditingId}` : "Tạo tiện ích mới"}</h3>
            <div className="field"><label>Tên tiện ích</label><input name="name" value={amenityForm.name} onChange={handleAmenityField} /></div>
            <div className="field"><label>Loại tiện ích</label><select name="amenity_type" value={amenityForm.amenity_type} onChange={handleAmenityField}>{AMENITY_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
            <div className="field"><label>Vĩ độ</label><input type="number" step="0.000001" name="lat" value={amenityForm.lat} onChange={handleAmenityField} /></div>
            <div className="field"><label>Kinh độ</label><input type="number" step="0.000001" name="lng" value={amenityForm.lng} onChange={handleAmenityField} /></div>
            <div className="admin-form-actions">
              <button type="submit" className="btn-geo-primary">{amenityEditingId ? "Lưu cập nhật" : "Tạo tiện ích"}</button>
              {amenityEditingId && <button type="button" className="btn-geo-secondary" onClick={resetAmenityForm}>Hủy sửa</button>}
            </div>
          </form>
        </div>
      </div>
    );
  }

  function renderReports() {
    const propertyTypeChart = propertyTypeStats.map((item) => ({
      label: typeLabel(item.property_type),
      value: item.count,
      tone:
        item.property_type === "apartment"
          ? "info"
          : item.property_type === "house"
          ? "warning"
          : item.property_type === "land"
          ? "success"
          : "accent",
      note: `${properties.length ? Math.round((item.count / properties.length) * 100) : 0}% tổng nguồn hàng`,
    }));

    const leadPipelineChart = LEAD_STAGES.map((item) => ({
      label: item.label,
      value: leadStageStats[item.value] || 0,
      tone: statusTone(item.value),
      note: `${leads.length ? Math.round(((leadStageStats[item.value] || 0) / leads.length) * 100) : 0}% tổng lead`,
    }));

    const propertyStatusChart = [
      { label: "Đang bán", value: propertyStatusStats.active || 0, tone: "gold" },
      { label: "Chờ duyệt", value: propertyStatusStats.pending || 0, tone: "warning" },
      { label: "Đã bán", value: propertyStatusStats.sold || 0, tone: "info" },
      { label: "Ẩn", value: propertyStatusStats.hidden || 0, tone: "muted" },
    ];

    const topAgentsChart = topAgents.map((item) => ({
      label: item.name,
      value: item.total,
      tone: "accent",
      note: `${properties.length ? Math.round((item.total / properties.length) * 100) : 0}% tổng số tin`,
    }));

    return (
      <div className="admin-content-stack">
        <AdminSectionHeader
          eyebrow="Thống kê"
          title="Báo cáo chi tiết"
          desc="Tổng hợp theo loại bất động sản, trạng thái, lead pipeline và hiệu suất môi giới."
          actions={
            <>
              <button type="button" className="btn-geo-secondary" onClick={exportReportsCsv}>
                <i className="bi bi-filetype-csv"></i>
                Xuất CSV
              </button>
              <button type="button" className="btn-geo-secondary" onClick={exportReportsPdf}>
                <i className="bi bi-filetype-pdf"></i>
                Xuất PDF
              </button>
            </>
          }
        />

        <section className="admin-metric-grid">
          <AdminMetricCard label="Tổng giá trị niêm yết" value={formatPrice(reportSummary.inventoryValue)} note={`Giá trung bình ${formatPrice(reportSummary.averagePrice)}`} />
          <AdminMetricCard label="Nguồn hàng đang bán" value={reportSummary.activeTotal} note={`${reportSummary.soldTotal} tin đã bán`} />
          <AdminMetricCard label="Tổng lead" value={reportSummary.leadTotal} note={`${reportSummary.conversionRate}% tỉ lệ chuyển đổi`} />
          <AdminMetricCard label="Top môi giới" value={topAgents[0]?.name || "—"} note={topAgents[0] ? `${topAgents[0].total} tin đang phụ trách` : "Chưa có dữ liệu"} />
        </section>

        <section className="admin-grid-panels">
          <article className="extra-card">
            <h3 className="admin-panel-title">Theo loại bất động sản</h3>
            <BarChart
              items={propertyTypeChart.map((item) => ({
                ...item,
                shortLabel: item.label.split(" ")[0],
              }))}
            />
            <MiniChartList items={propertyTypeChart} />
          </article>

          <article className="extra-card">
            <h3 className="admin-panel-title">Theo pipeline lead</h3>
            <DonutChart items={leadPipelineChart} />
            <MiniChartList items={leadPipelineChart} />
          </article>
        </section>

        <section className="admin-grid-panels">
          <article className="extra-card">
            <h3 className="admin-panel-title">Theo trạng thái tin</h3>
            <DonutChart items={propertyStatusChart} />
            <MiniChartList items={propertyStatusChart} />
          </article>

          <article className="extra-card">
            <h3 className="admin-panel-title">Top môi giới theo số tin</h3>
            <BarChart
              items={topAgentsChart.map((item) => ({
                ...item,
                shortLabel: item.label.split(" ").slice(-1)[0],
              }))}
            />
            <MiniChartList items={topAgentsChart} />
          </article>
        </section>
      </div>
    );
  }

  async function loadImagesForProperty(propertyId) {
    if (!propertyId) {
      setImageTargetProperty(null);
      setImages([]);
      return;
    }
    setImageLoading(true);
    setImageMessage("");
    try {
      const data = await api.property(propertyId);
      if (data) {
        setImageTargetProperty(data);
        setImages(data.images || []);
      } else {
        setImageTargetProperty(null);
        setImages([]);
        setImageMessage("Không tìm thấy bất động sản.");
      }
    } catch (err) {
      console.error(err);
      setImageMessage("Lỗi khi tải dữ liệu ảnh.");
      setImageTargetProperty(null);
      setImages([]);
    } finally {
      setImageLoading(false);
    }
  }

  async function submitImage(event) {
    event.preventDefault();
    if (!imageTargetPropertyId) {
      setImageMessage("Vui lòng nhập ID bất động sản trước.");
      return;
    }
    if (!imageForm.file) {
      setImageMessage("Vui lòng chọn file ảnh.");
      return;
    }
    setImageLoading(true);
    setImageMessage("");
    try {
      const result = await api.createPropertyImage(imageTargetPropertyId, imageForm);
      if (result?.id) {
        setImageForm({ file: null, caption: "", sort_order: 0 });
        setImageMessage("Đã tải ảnh lên thành công.");
        loadImagesForProperty(imageTargetPropertyId);
      } else {
        setImageMessage("Không tải được ảnh lên.");
      }
    } catch (err) {
      console.error(err);
      setImageMessage("Lỗi khi tải ảnh lên.");
    } finally {
      setImageLoading(false);
    }
  }

  async function setImageAsPrimary(imageId) {
    setImageLoading(true);
    try {
      await api.setPrimaryImage(imageId);
      setImageMessage("Đã đặt ảnh chính.");
      loadImagesForProperty(imageTargetPropertyId);
    } catch (err) {
      console.error(err);
      setImageMessage("Lỗi khi đặt ảnh chính.");
    } finally {
      setImageLoading(false);
    }
  }

  async function deleteImage(imageId) {
    if (!window.confirm("Xóa ảnh này?")) return;
    setImageLoading(true);
    try {
      const result = await api.deletePropertyImage(imageId);
      if (result?.ok) {
        setImageMessage("Đã xóa ảnh.");
        loadImagesForProperty(imageTargetPropertyId);
      } else {
        setImageMessage("Không xóa được ảnh.");
      }
    } catch (err) {
      console.error(err);
      setImageMessage("Lỗi khi xóa ảnh.");
    } finally {
      setImageLoading(false);
    }
  }

  async function reorderImage(imageId, sortOrder) {
    setImageLoading(true);
    try {
      await api.reorderPropertyImage(imageId, { sort_order: sortOrder });
      setImageMessage("Đã cập nhật thứ tự.");
      loadImagesForProperty(imageTargetPropertyId);
    } catch (err) {
      console.error(err);
      setImageMessage("Lỗi khi cập nhật thứ tự.");
    } finally {
      setImageLoading(false);
    }
  }

  async function reorderImagesByDrag(sourceImageId, targetImageId) {
    if (!sourceImageId || !targetImageId || String(sourceImageId) === String(targetImageId)) {
      return;
    }

    const sourceIndex = images.findIndex((item) => String(item.id) === String(sourceImageId));
    const targetIndex = images.findIndex((item) => String(item.id) === String(targetImageId));

    if (sourceIndex === -1 || targetIndex === -1) {
      return;
    }

    const nextImages = [...images];
    const [movedImage] = nextImages.splice(sourceIndex, 1);
    nextImages.splice(targetIndex, 0, movedImage);

    const orderedImages = nextImages.map((item, index) => ({
      ...item,
      sort_order: index,
    }));

    setImages(orderedImages);
    setImageLoading(true);
    setImageMessage("Đang cập nhật thứ tự ảnh...");

    try {
      await Promise.all(
        orderedImages.map((item, index) =>
          api.reorderPropertyImage(item.id, { sort_order: index })
        )
      );
      setImageMessage("Đã sắp xếp lại ảnh.");
      await loadImagesForProperty(imageTargetPropertyId);
    } catch (err) {
      console.error(err);
      setImageMessage("Không cập nhật được thứ tự kéo-thả.");
      await loadImagesForProperty(imageTargetPropertyId);
    } finally {
      setImageLoading(false);
      setDraggingImageId(null);
    }
  }

  function handleImagePropertyIdChange(value) {
    setImageTargetPropertyId(value);
    if (value) {
      loadImagesForProperty(value);
    } else {
      setImageTargetProperty(null);
      setImages([]);
    }
  }

  function renderImages() {
    return (
      <div className="admin-content-stack">
        <AdminSectionHeader
          eyebrow="CRUD"
          title="Quản lý hình ảnh bất động sản"
          desc="Thêm, sửa, xóa và sắp xếp ảnh cho từng bất động sản trực tiếp trong admin console."
        />

        <div className="extra-card">
          <div className="admin-topbar">
            <h3>Chọn bất động sản</h3>
          </div>
          <div className="field">
            <label>Chọn bất động sản hoặc nhập ID</label>
            <select
              value={imageTargetPropertyId}
              onChange={(e) => handleImagePropertyIdChange(e.target.value)}
              style={{ marginBottom: 10 }}
            >
              <option value="">-- Chọn bất động sản --</option>
              {properties.map((item) => (
                <option key={item.id} value={item.id}>
                  #{item.id} - {item.title}
                </option>
              ))}
            </select>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="number"
                value={imageTargetPropertyId}
                onChange={(e) => handleImagePropertyIdChange(e.target.value)}
                placeholder="VD: 1, 2, 3..."
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn-geo-secondary"
                onClick={() => loadImagesForProperty(imageTargetPropertyId)}
                disabled={!imageTargetPropertyId || imageLoading}
              >
                {imageLoading ? "Đang tải..." : "Tải ảnh"}
              </button>
            </div>
            {imageTargetProperty && (
              <p className="muted-line" style={{ marginTop: 8 }}>
                Đã chọn: <strong>{imageTargetProperty.title}</strong> (ID: {imageTargetProperty.id}) — {images.length} ảnh
              </p>
            )}
          </div>
        </div>

        {imageTargetProperty && (
          <form className="extra-card form-stack" onSubmit={submitImage}>
            <h3>Thêm ảnh mới</h3>
            <label className="extra-field">
              <span>Chọn file ảnh</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageForm((prev) => ({ ...prev, file: e.target.files?.[0] || null }))}
              />
            </label>
            <label className="extra-field">
              <span>Caption (chú thích)</span>
              <input
                value={imageForm.caption}
                onChange={(e) => setImageForm((prev) => ({ ...prev, caption: e.target.value }))}
              />
            </label>
            <label className="extra-field">
              <span>Thứ tự (sort order)</span>
              <input
                type="number"
                value={imageForm.sort_order}
                onChange={(e) => setImageForm((prev) => ({ ...prev, sort_order: Number(e.target.value) }))}
              />
            </label>
            <button className="btn-geo-primary" type="submit" disabled={imageLoading}>
              {imageLoading ? "Đang tải..." : "Thêm ảnh"}
            </button>
            {imageMessage && <p className="muted-line">{imageMessage}</p>}
          </form>
        )}

        {images.length > 0 && (
          <div className="extra-card">
            <div className="admin-topbar">
              <h3>Danh sách ảnh</h3>
              <span className="muted-line">{images.length} ảnh · kéo-thả để đổi vị trí</span>
            </div>
            <div className="media-grid">
              {images.map((img, i) => (
                <article
                  className={`mini-property-card admin-image-card ${draggingImageId === img.id ? "dragging" : ""}`}
                  key={img.id}
                  draggable={!imageLoading}
                  onDragStart={() => setDraggingImageId(img.id)}
                  onDragEnd={() => setDraggingImageId(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => reorderImagesByDrag(draggingImageId, img.id)}
                >
                  <div
                    className="mini-media"
                    style={{ backgroundImage: `url(${img.image})` }}
                  >
                    <span>{img.is_primary ? "Ảnh chính" : `Ảnh ${i + 1}`}</span>
                  </div>
                  <div className="mini-content">
                    <strong>Thứ tự: {img.sort_order ?? i}</strong>
                    <p className="muted-line">{img.caption || imageTargetProperty?.title}</p>
                    <p className="muted-line admin-drag-hint">Kéo ảnh này để đổi vị trí</p>
                    <div className="pill-row mt-3">
                      {!img.is_primary && (
                        <button
                          className="btn-geo-secondary"
                          type="button"
                          onClick={() => setImageAsPrimary(img.id)}
                          disabled={imageLoading}
                        >
                          <i className="bi bi-star"></i>
                          Đặt ảnh chính
                        </button>
                      )}
                      <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
                        Thứ tự:
                        <input
                          type="number"
                          style={{ width: 60 }}
                          defaultValue={img.sort_order ?? i}
                          onBlur={(e) => {
                            const val = Number(e.target.value);
                            if (Number.isFinite(val) && val !== (img.sort_order ?? i)) {
                              reorderImage(img.id, val);
                            }
                          }}
                        />
                      </label>
                      <button
                        className="btn-geo-secondary danger-btn"
                        type="button"
                        onClick={() => deleteImage(img.id)}
                        disabled={imageLoading}
                      >
                        <i className="bi bi-trash3"></i>
                        Xóa
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {!imageTargetProperty && !imageLoading && (
          <div className="extra-card muted-line">
            Nhập ID bất động sản ở trên để quản lý hình ảnh.
          </div>
        )}
      </div>
    );
  }

  function renderContent() {
    if (loading) {
      return <div className="extra-card">Đang tải dữ liệu quản trị...</div>;
    }

    if (activeSection === "properties") return renderProperties();
    if (activeSection === "images") return renderImages();
    if (activeSection === "leads") return renderLeads();
    if (activeSection === "agents") return renderAgents();
    if (activeSection === "amenities") return renderAmenities();
    if (activeSection === "reports") return renderReports();
    return renderOverview();
  }

  return (
    <div className="container py-5 admin-console-page">
      <div className="mb-4">
        <p className="section-mini-title">Quản trị hệ thống</p>
        <h1 className="section-heading">Admin Console Suite</h1>
        <p className="muted-line">
          Một khu admin riêng để CRUD dữ liệu, kiểm tra vận hành và xem thống kê chi tiết theo từng mảng.
        </p>
      </div>

      <div className="admin-suite-layout">
        <aside className="admin-console-sidebar extra-card">
          <div className="admin-console-sidebar-head">
            <strong>Điều hướng admin</strong>
            <span>{SECTIONS.length - 1} khu dữ liệu</span>
          </div>

          <nav className="admin-console-nav">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                className={activeSection === section.id ? "active" : ""}
                onClick={() => selectSection(section.id)}
              >
                <i className={`bi ${section.icon}`}></i>
                {section.label}
              </button>
            ))}
          </nav>

          <div className="admin-console-sidebar-foot">
            <button type="button" className="btn-geo-secondary full" onClick={loadAll}>
              Đồng bộ lại toàn bộ
            </button>
          </div>
        </aside>

        <main className="admin-console-main">
          {message && <div className="extra-card admin-notice">{message}</div>}
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
