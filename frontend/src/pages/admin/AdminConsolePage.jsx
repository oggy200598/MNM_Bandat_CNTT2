import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import "../../App.css";
import { api, formatPrice, typeLabel, statusLabel } from "../../api";

const SECTIONS = [
  { id: "overview", label: "Tổng quan" },
  { id: "properties", label: "Bất động sản" },
  { id: "images", label: "Hình ảnh" },
  { id: "leads", label: "Khách hàng" },
  { id: "agents", label: "Môi giới" },
  { id: "amenities", label: "Tiện ích" },
  { id: "reports", label: "Thống kê" },
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

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("vi-VN");
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

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [properties, setProperties] = useState([]);
  const [leads, setLeads] = useState([]);
  const [agents, setAgents] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [propertyEditingId, setPropertyEditingId] = useState(null);
  const [amenityEditingId, setAmenityEditingId] = useState(null);
  const [propertyForm, setPropertyForm] = useState(emptyPropertyForm());
  const [amenityForm, setAmenityForm] = useState(emptyAmenityForm());

  // Image management state
  const [imageTargetPropertyId, setImageTargetPropertyId] = useState("");
  const [imageTargetProperty, setImageTargetProperty] = useState(null);
  const [images, setImages] = useState([]);
  const [imageForm, setImageForm] = useState({ file: null, caption: "", sort_order: 0 });
  const [imageMessage, setImageMessage] = useState("");
  const [imageLoading, setImageLoading] = useState(false);

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

  function selectSection(sectionId) {
    navigate(`/admin-console/${sectionId}`);
    setMessage("");
  }

  function resetPropertyForm() {
    setPropertyEditingId(null);
    setPropertyForm(emptyPropertyForm());
  }

  function resetAmenityForm() {
    setAmenityEditingId(null);
    setAmenityForm(emptyAmenityForm());
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
              <h3>Bảng bất động sản</h3>
              <span className="muted-line">{properties.length} bản ghi</span>
            </div>
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên</th>
                    <th>Loại</th>
                    <th>Trạng thái</th>
                    <th>Giá</th>
                    <th>Cập nhật</th>
                    <th className="table-actions-col">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((row) => (
                    <tr key={`property-${row.id}`}>
                      <td>{row.id}</td>
                      <td>{row.title}</td>
                      <td>{typeLabel(row.property_type)}</td>
                      <td>{statusLabel(row.listing_status)}</td>
                      <td>{formatPrice(row.price)}</td>
                      <td>{formatDate(row.updated_at)}</td>
                      <td>
                        <div className="admin-row-actions">
                          <button type="button" className="btn-geo-secondary" onClick={() => editProperty(row)}>Sửa</button>
                          <a className="btn-geo-secondary" href={`/properties/images/${row.id}`}>Ảnh</a>
                          <button type="button" className="btn-geo-secondary danger-btn" onClick={() => removeProperty(row)}>Xóa</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                  <th>Nhu cầu</th>
                  <th>Giai đoạn</th>
                  <th>Tạo lúc</th>
                  <th className="table-actions-col">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((row) => (
                  <tr key={`lead-${row.id}`}>
                    <td>{row.id}</td>
                    <td>{row.name || "—"}</td>
                    <td>
                      <div className="admin-inline-copy">
                        <span>{row.email || "—"}</span>
                        <span>{row.phone || "—"}</span>
                      </div>
                    </td>
                    <td>{row.property_interest || row.message || "—"}</td>
                    <td>
                      <select className="admin-inline-select" value={row.pipeline_stage || "new"} onChange={(event) => updateLeadStage(row, event.target.value)}>
                        {LEAD_STAGES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                      </select>
                    </td>
                    <td>{formatDate(row.created_at)}</td>
                    <td>
                      <button type="button" className="btn-geo-secondary danger-btn" onClick={() => removeLead(row)}>
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
        <section className="extra-card">
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên</th>
                  <th>Email</th>
                  <th>Điện thoại</th>
                  <th>Số tin</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((row) => (
                  <tr key={`agent-${row.id}`}>
                    <td>{row.id}</td>
                    <td>{row.name}</td>
                    <td>{row.email || "—"}</td>
                    <td>{row.phone || "—"}</td>
                    <td>{row.properties?.length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
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
                    <th>Tên</th>
                    <th>Loại</th>
                    <th>Vĩ độ</th>
                    <th>Kinh độ</th>
                    <th className="table-actions-col">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {amenities.map((row) => (
                    <tr key={`amenity-${row.id}`}>
                      <td>{row.id}</td>
                      <td>{row.name}</td>
                      <td>{row.type || row.amenity_type}</td>
                      <td>{row.lat ?? "—"}</td>
                      <td>{row.lng ?? "—"}</td>
                      <td>
                        <div className="admin-row-actions">
                          <button type="button" className="btn-geo-secondary" onClick={() => editAmenity(row)}>Sửa</button>
                          <button type="button" className="btn-geo-secondary danger-btn" onClick={() => removeAmenity(row)}>Xóa</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
    return (
      <div className="admin-content-stack">
        <AdminSectionHeader eyebrow="Thống kê" title="Báo cáo chi tiết" desc="Tổng hợp theo loại bất động sản, trạng thái, lead pipeline và hiệu suất môi giới." />

        <section className="admin-grid-panels">
          <article className="extra-card">
            <h3 className="admin-panel-title">Theo loại bất động sản</h3>
            <div className="admin-stat-list">
              {propertyTypeStats.map((item) => (
                <div key={item.property_type}>
                  <span>{typeLabel(item.property_type)}</span>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="extra-card">
            <h3 className="admin-panel-title">Theo pipeline lead</h3>
            <div className="admin-stat-list">
              {LEAD_STAGES.map((item) => (
                <div key={item.value}>
                  <span>{item.label}</span>
                  <strong>{leadStageStats[item.value] || 0}</strong>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="admin-grid-panels">
          <article className="extra-card">
            <h3 className="admin-panel-title">Theo trạng thái tin</h3>
            <div className="admin-stat-list">
              <div><span>Đang bán</span><strong>{propertyStatusStats.active || 0}</strong></div>
              <div><span>Chờ duyệt</span><strong>{propertyStatusStats.pending || 0}</strong></div>
              <div><span>Đã bán</span><strong>{propertyStatusStats.sold || 0}</strong></div>
              <div><span>Ẩn</span><strong>{propertyStatusStats.hidden || 0}</strong></div>
            </div>
          </article>

          <article className="extra-card">
            <h3 className="admin-panel-title">Top môi giới theo số tin</h3>
            <div className="admin-stat-list">
              {topAgents.map((item) => (
                <div key={item.name}>
                  <span>{item.name}</span>
                  <strong>{item.total}</strong>
                </div>
              ))}
            </div>
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
            <label>Nhập ID bất động sản</label>
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
              <span className="muted-line">{images.length} ảnh</span>
            </div>
            <div className="media-grid">
              {images.map((img, i) => (
                <article className="mini-property-card" key={img.id}>
                  <div
                    className="mini-media"
                    style={{ backgroundImage: `url(${img.image})` }}
                  >
                    <span>{img.is_primary ? "Ảnh chính" : `Ảnh ${i + 1}`}</span>
                  </div>
                  <div className="mini-content">
                    <strong>Thứ tự: {img.sort_order ?? i}</strong>
                    <p className="muted-line">{img.caption || imageTargetProperty?.title}</p>
                    <div className="pill-row mt-3">
                      {!img.is_primary && (
                        <button
                          className="btn-geo-secondary"
                          type="button"
                          onClick={() => setImageAsPrimary(img.id)}
                          disabled={imageLoading}
                        >
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
    <div className="container py-5">
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