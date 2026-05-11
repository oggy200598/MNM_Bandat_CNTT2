import { useEffect, useState } from "react";
import { api, normalizeProperty, formatPrice } from "../api";
import "./ExtraPages.css";

const sampleProperties = [
  { id: 1, title: "Căn hộ cao cấp Quận 1", price: 12000000000, address: "Nguyễn Huệ, Quận 1, TP.HCM", area: 120, property_type: "apartment", listing_status: "active", agent: { name: "Nguyễn Văn A" }, image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200&auto=format&fit=crop" },
  { id: 2, title: "Nhà phố Thảo Điền", price: 25000000000, address: "Thảo Điền, TP.Thủ Đức", area: 250, property_type: "house", listing_status: "active", agent: { name: "Trần Thị B" }, image: "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200&auto=format&fit=crop" },
  { id: 3, title: "Đất nền Bình Chánh", price: 5000000000, address: "Bình Chánh, TP.HCM", area: 500, property_type: "land", listing_status: "pending", agent: { name: "Lê Văn C" }, image: "https://images.unsplash.com/photo-1448630360428-65456885c650?q=80&w=1200&auto=format&fit=crop" },
];

function queryId() {
  return new URLSearchParams(window.location.search).get("id");
}

function PageShell({ eyebrow, title, desc, children, maxWidth }) {
  return (
    <div className="extra-page">
      <section className="extra-hero">
        <div className="container">
          <p className="section-eyebrow">{eyebrow}</p>
          <h1 className="section-heading">{title}</h1>
          {desc && <p className="extra-desc">{desc}</p>}
        </div>
      </section>
      <main className="container extra-body" style={maxWidth ? { maxWidth } : undefined}>{children}</main>
    </div>
  );
}

function Field({ label, type = "text", placeholder, as = "input", name, ...props }) {
  const Tag = as;
  return (
    <label className="extra-field">
      <span>{label}</span>
      <Tag name={name} type={type} placeholder={placeholder} rows={as === "textarea" ? 5 : undefined} {...props} />
    </label>
  );
}

function PropertyMiniCard({ p }) {
  const item = normalizeProperty(p);
  return (
    <article className="mini-property-card">
      <div className="mini-media" style={{ backgroundImage: `url(${item.imageUrl})` }}><span>{item.typeText}</span></div>
      <div className="mini-content">
        <h3>{p.title}</h3>
        <p>{p.address}</p>
        <div className="mini-meta"><span>{p.area} m²</span><strong>{item.priceText}</strong></div>
        <div className="mini-actions"><a href={`/property-detail?id=${p.id}`} className="btn-geo-primary">Xem chi tiết</a><a href="/compare" className="btn-geo-secondary">So sánh</a></div>
      </div>
    </article>
  );
}

function usePropertyDetail() {
  const [property, setProperty] = useState(sampleProperties[0]);
  useEffect(() => {
    const id = queryId();
    if (!id) return;
    api.property(id).then((data) => {
      if (data) setProperty(data);
    });
  }, []);
  return property;
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState({ properties: 0, agents: 0, users: 0, imports: 0 });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    setStats({ properties: 0, agents: 0, users: 0, imports: 0 });
  }, []);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    const text = await file.text();
    const res = await api.importPropertiesCSV(text);
    setLoading(false);
    setResult(res);
  };

  return <PageShell eyebrow="Quản trị" title="Bảng điều khiển quản trị">
    <div className="container">
      <div className="dashboard-grid">
        <div className="mini-card"><strong>Thống kê</strong><p>Properties: {stats.properties} · Agents: {stats.agents} · Users: {stats.users} · Imports: {stats.imports}</p></div>
        <div className="mini-card"><strong>Nhập CSV</strong><p><input type="file" accept=".csv" onChange={handleFile} disabled={loading} /><br/><button className="btn-geo-primary" onClick={handleSubmit} disabled={!file || loading}>{loading ? 'Đang nhập...' : 'Nhập'}</button>{result && <p>Kết quả: {JSON.stringify(result)}</p>}</p></div>
      </div>
    </div>
  </PageShell>;
}

export function PropertyDetailPage() {
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
          <div className="extra-card sticky-card"><div className="price-big">{p.priceText}</div><a className="btn-geo-primary full" href="/lead-form">Liên hệ tư vấn</a><a className="btn-geo-secondary full" href="/wishlist">Lưu tin</a></div>
        </aside>
      </main>
    </div>
  );
}

export function LoginPage() {
  const [message, setMessage] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await api.login({ username: form.get("username"), password: form.get("password") });
    setMessage(result?.username ? `Đăng nhập thành công: ${result.full_name || result.username} (${result.role || "user"})` : "Không tìm thấy tài khoản trong backend.");
  };

  return <PageShell eyebrow="Truy cập tài khoản" title="Đăng nhập" maxWidth="640px"><form className="extra-card form-stack" onSubmit={submit}><label className="extra-field"><span>Tên đăng nhập</span><input name="username" placeholder="admin" /></label><label className="extra-field"><span>Mật khẩu</span><input name="password" type="password" placeholder="••••••••" /></label><button className="btn-geo-primary">Đăng nhập</button>{message && <p className="muted-line">{message}</p>}<p className="muted-line">Dùng nhanh: admin/admin123 · agent/agent123 · user/user123</p><p className="muted-line">Chưa có tài khoản? <a href="/register">Đăng ký</a> · <a href="/password-reset">Quên mật khẩu</a></p></form></PageShell>;
}

export function RegisterPage() {
  const [message, setMessage] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = form.get("password");
    const confirm = form.get("confirm_password");
    if (password !== confirm) {
      setMessage("Mật khẩu nhập lại không khớp.");
      return;
    }
    const result = await api.register({ username: form.get("username"), password, full_name: form.get("full_name"), email: form.get("email"), role: form.get("role") });
    setMessage(result?.username ? `Đã tạo tài khoản: ${result.full_name || result.username} (${result.role || "user"})` : "Chưa tạo được tài khoản.");
  };

  return <PageShell eyebrow="Tạo tài khoản" title="Đăng ký" maxWidth="760px"><form className="extra-card form-grid" onSubmit={submit}><label className="extra-field"><span>Tên đăng nhập</span><input name="username" required /></label><label className="extra-field"><span>Họ tên</span><input name="full_name" /></label><label className="extra-field"><span>Email</span><input name="email" type="email" /></label><label className="extra-field"><span>Vai trò</span><select name="role"><option value="user">Khách hàng</option><option value="agent">Môi giới</option><option value="admin">Quản trị</option></select></label><Field label="Mật khẩu" name="password" type="password" required /><Field label="Nhập lại mật khẩu" name="confirm_password" type="password" required /><button className="btn-geo-primary form-wide">Tạo tài khoản</button>{message && <p className="muted-line form-wide">{message}</p>}</form></PageShell>;
}

export function WishlistPage() {
  const [items, setItems] = useState(sampleProperties);

  const refresh = async () => {
    const data = await api.wishlist();
    if (Array.isArray(data) && data.length) setItems(data);
  };

  useEffect(() => {
    refresh();
  }, []);

  return <PageShell eyebrow="Bất động sản đã lưu" title="Danh sách đã lưu"><div className="extra-top-actions"><a href="/properties" className="btn-geo-secondary">← Quay lại danh sách bất động sản</a></div><div className="mini-grid">{items.map((p) => <article key={p.id}><PropertyMiniCard p={p} /><div className="mini-actions"><button className="btn-geo-secondary danger-btn" type="button" onClick={async () => { await api.removeWishlist(p.id); refresh(); }}>Xóa khỏi lưu</button></div></article>)}</div></PageShell>;
}

export function LeadFormPage() {
  const [message, setMessage] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await api.createLead({
      name: form.get("name"),
      phone: form.get("phone"),
      budget: form.get("budget") || null,
      property_interest: form.get("interest"),
      notes: form.get("notes"),
      desired_lat: form.get("desired_lat") || null,
      desired_lng: form.get("desired_lng") || null,
    });
    setMessage(result?.id ? "Đã gửi lead vào backend." : "Chưa gửi được lead.");
  };

  return <PageShell eyebrow="Biểu mẫu khách hàng" title="Gửi nhu cầu tư vấn" desc="Điền thông tin để hệ thống tự gán môi giới gần nhất."><div className="lead-layout-copy"><form className="extra-card form-grid" onSubmit={submit}><label className="extra-field"><span>Họ tên</span><input name="name" /></label><label className="extra-field"><span>Số điện thoại</span><input name="phone" /></label><Field label="Email" type="email" /><label className="extra-field"><span>Nhu cầu</span><select name="interest"><option>Mua nhà</option><option>Thuê nhà</option><option>Đầu tư</option></select></label><label className="extra-field"><span>Ngân sách</span><input name="budget" placeholder="VD: 5000000000" /></label><Field label="Khu vực quan tâm" name="desired_lng" placeholder="Kinh độ" /><Field label="Tọa độ vĩ độ" name="desired_lat" placeholder="Vĩ độ" /><label className="extra-field form-wide"><span>Ghi chú</span><textarea name="notes" rows="5" placeholder="Mô tả thêm nhu cầu của bạn" /></label><button className="btn-geo-primary form-wide">Gửi thông tin</button>{message && <p className="muted-line form-wide">{message}</p>}</form><aside className="extra-card"><h3>Quy trình</h3><ol className="timeline"><li>Tiếp nhận nhu cầu</li><li>Gợi ý bất động sản phù hợp</li><li>Đặt lịch xem nhà</li><li>Theo dõi sau tư vấn</li></ol></aside></div></PageShell>;
}

export function DashboardPage() {
  const [stats, setStats] = useState({ property_total: 0, lead_total: 0, agent_total: 0, appointment_total: 0, property_active_total: 0, property_sold_total: 0, featured_total: 0 });

  useEffect(() => {
    api.dashboard().then((data) => {
      if (data) setStats((prev) => ({ ...prev, ...data }));
    });
  }, []);

  return <PageShell eyebrow="Bảng điều khiển" title="Dashboard"><div className="dashboard-stats"><div><strong>{stats.property_total}</strong><span>Bất động sản</span></div><div><strong>{stats.lead_total || 0}</strong><span>Lead</span></div><div><strong>{stats.agent_total}</strong><span>Môi giới</span></div><div><strong>{stats.appointment_total}</strong><span>Lịch hẹn</span></div></div><div className="dashboard-grid-copy"><section className="extra-card"><h3>Tình trạng tin</h3><div className="data-row"><span>Đang bán</span><strong>{stats.property_active_total || 0}</strong></div><div className="data-row"><span>Đã bán</span><strong>{stats.property_sold_total || 0}</strong></div><div className="data-row"><span>Nổi bật</span><strong>{stats.featured_total || 0}</strong></div></section><section className="extra-card"><h3>Loại hình</h3>{(stats.property_type_stats || []).map((row) => <div className="data-row" key={row.property_type}><span>{row.property_type}</span><strong>{row.count}</strong></div>)}</section><section className="extra-card"><h3>Gợi ý hành động</h3><p className="long-text">Ưu tiên xử lý lead mới, cập nhật tin chờ duyệt và kiểm tra các lịch hẹn trong 24h tới.</p></section></div></PageShell>;
}

export function CustomerDashboardPage() {
  const [items, setItems] = useState(sampleProperties.slice(0, 2));
  const [savedSearches, setSavedSearches] = useState([]);

  useEffect(() => {
    api.wishlist().then((data) => {
      if (Array.isArray(data) && data.length) setItems(data.slice(0, 2));
    });
    api.savedSearches().then((data) => {
      if (Array.isArray(data)) setSavedSearches(data);
    });
  }, []);

  return <PageShell eyebrow="Khu vực cá nhân" title="Bảng điều khiển của bạn"><div className="dashboard-stats"><div><strong>{items.length}</strong><span>Đã lưu</span></div><div><strong>3</strong><span>Đang so sánh</span></div><div><strong>{savedSearches.length}</strong><span>Tìm kiếm đã lưu</span></div><div><strong>6</strong><span>Tin mới khớp</span></div></div><div className="dashboard-grid-copy"><section className="extra-card"><h3>Bộ lọc đã lưu</h3>{savedSearches.length ? savedSearches.map((item) => <div className="data-row" key={item.id}><span>{item.name}</span><button className="btn-geo-secondary" type="button" onClick={async () => { await api.deleteSavedSearch(item.id); setSavedSearches((prev) => prev.filter((row) => row.id !== item.id)); }}>Xóa</button></div>) : <p className="muted-line">Chưa có bộ lọc nào được lưu.</p>}</section></div><div className="mini-grid">{items.map((p) => <PropertyMiniCard p={p} key={p.id} />)}</div></PageShell>;
}

export function AdminConsolePage() {
  return <PageShell eyebrow="Quản trị hệ thống" title="Admin Console"><div className="admin-shell-copy"><aside className="admin-tabs"><button className="active">Properties</button><button>Leads</button><button>Agents</button><button>Amenities</button></aside><section className="extra-card"><h3>Bảng dữ liệu</h3><table className="admin-table"><thead><tr><th>ID</th><th>Tên</th><th>Trạng thái</th><th>Cập nhật</th></tr></thead><tbody>{sampleProperties.map((p) => <tr key={p.id}><td>{p.id}</td><td>{p.title}</td><td>{p.listing_status}</td><td>Hôm nay</td></tr>)}</tbody></table></section><form className="extra-card form-stack"><h3>Tạo / cập nhật</h3><Field label="Tên bản ghi" /><Field label="Mô tả" as="textarea" /><button className="btn-geo-primary">Lưu</button></form></div></PageShell>;
}

export function PropertyFormPage({ edit = false }) {
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({ title: "", property_type: "apartment", listing_status: "pending", price: "", area: "", address: "", lat: "", lng: "", description: "" });

  useEffect(() => {
    if (!edit) return;
    const id = queryId() || "1";
    api.property(id).then((data) => {
      if (!data) return;
      setFormData({
        title: data.title || "",
        property_type: data.property_type || "apartment",
        listing_status: data.listing_status || "pending",
        price: data.price ?? "",
        area: data.area ?? "",
        address: data.address || "",
        lat: data.lat ?? "",
        lng: data.lng ?? "",
        description: data.description || "",
      });
    });
  }, [edit]);

  const updateField = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));
  const submit = async (event) => {
    event.preventDefault();
    const payload = { ...formData, price: formData.price || null, area: formData.area || null, lat: formData.lat || null, lng: formData.lng || null };
    const id = queryId() || "1";
    const result = edit ? await api.updateProperty(id, payload) : await api.createProperty(payload);
    setMessage(result?.id ? `Đã ${edit ? "cập nhật" : "tạo"} tin #${result.id}.` : "Chưa lưu được tin.");
  };

  return <PageShell eyebrow="Dành cho môi giới" title={edit ? "Sửa tin bất động sản" : "Đăng tin bất động sản"} desc={edit ? "Cập nhật thông tin, vị trí và mô tả." : "Tạo tin mới, nhập vị trí để lưu vào backend Node.js."}><div className="lead-layout-copy"><form className="extra-card form-grid" onSubmit={submit}><label className="extra-field form-wide"><span>Tiêu đề</span><input name="title" value={formData.title} onChange={(e) => updateField("title", e.target.value)} /></label><label className="extra-field"><span>Loại bất động sản</span><select name="property_type" value={formData.property_type} onChange={(e) => updateField("property_type", e.target.value)}><option value="apartment">Căn hộ</option><option value="house">Nhà phố</option><option value="land">Đất nền</option></select></label><label className="extra-field"><span>Trạng thái</span><select name="listing_status" value={formData.listing_status} onChange={(e) => updateField("listing_status", e.target.value)}><option value="pending">Chờ duyệt</option><option value="active">Đang bán</option><option value="sold">Đã bán</option></select></label><label className="extra-field"><span>Giá bán</span><input name="price" value={formData.price} onChange={(e) => updateField("price", e.target.value)} /></label><label className="extra-field"><span>Diện tích (m²)</span><input name="area" value={formData.area} onChange={(e) => updateField("area", e.target.value)} /></label><label className="extra-field form-wide"><span>Địa chỉ</span><input name="address" value={formData.address} onChange={(e) => updateField("address", e.target.value)} /></label><label className="extra-field"><span>Vĩ độ</span><input name="lat" value={formData.lat} onChange={(e) => updateField("lat", e.target.value)} /></label><label className="extra-field"><span>Kinh độ</span><input name="lng" value={formData.lng} onChange={(e) => updateField("lng", e.target.value)} /></label><label className="extra-field form-wide"><span>Mô tả</span><textarea name="description" rows="5" value={formData.description} onChange={(e) => updateField("description", e.target.value)} /></label><button className="btn-admin form-wide">{edit ? "Lưu thay đổi" : "Đăng tin"}</button>{message && <p className="muted-line form-wide">{message}</p>}</form><aside className="extra-card"><h3>Chọn vị trí</h3><p className="long-text">Nhập tọa độ để backend lưu geo point thật. Ảnh và nearby search sẽ dùng dữ liệu này.</p><iframe className="embed-map mt-card" src="https://www.openstreetmap.org/export/embed.html?bbox=106.5,10.65,106.85,10.9&layer=mapnik" title="Create map" /></aside></div></PageShell>;
}

export function ImagesManagePage() {
  const id = queryId() || "1";
  const [property, setProperty] = useState(null);
  const [images, setImages] = useState([]);
  const [form, setForm] = useState({ file: null, caption: "", sort_order: 0 });
  const [message, setMessage] = useState("");

  const refresh = async () => {
    const data = await api.property(id);
    if (data) {
      setProperty(data);
      setImages(data.images || []);
    } else {
      setProperty(null);
      setImages([]);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [id]);

  const submit = async (event) => {
    event.preventDefault();
    const result = await api.createPropertyImage(id, form);
    if (result?.id) {
      setForm({ file: null, caption: "", sort_order: 0 });
      setMessage("Đã tải ảnh lên backend.");
      refresh();
    } else {
      setMessage("Chưa tải được ảnh.");
    }
  };

  return <PageShell eyebrow="Quản lý media" title="Ảnh cho tin đăng" desc={property?.title || "Chưa có dữ liệu tin."}><form className="extra-card form-stack" onSubmit={submit}><label className="extra-field"><span>Chọn file ảnh</span><input type="file" accept="image/*" onChange={(e) => setForm((prev) => ({ ...prev, file: e.target.files?.[0] || null }))} /></label><label className="extra-field"><span>Caption</span><input value={form.caption} onChange={(e) => setForm((prev) => ({ ...prev, caption: e.target.value }))} /></label><label className="extra-field"><span>Thứ tự</span><input type="number" value={form.sort_order} onChange={(e) => setForm((prev) => ({ ...prev, sort_order: Number(e.target.value) }))} /></label><button className="btn-admin" type="submit">Thêm ảnh</button>{message && <p className="muted-line">{message}</p>}</form><div className="mini-grid media-grid">{images.map((img, i) => <article className="mini-property-card" key={img.id}><div className="mini-media" style={{ backgroundImage: `url(${img.image})` }}><span>{img.is_primary ? "Ảnh chính" : "Ảnh phụ"}</span></div><div className="mini-content"><div className="mini-meta"><strong>Thứ tự {img.sort_order ?? i}</strong><span>{img.caption || property?.title}</span></div><div className="mini-actions"><button className="btn-geo-secondary" type="button" onClick={async () => { await api.setPrimaryImage(img.id); refresh(); }}>Đặt ảnh chính</button><button className="btn-geo-secondary" type="button" onClick={async () => { await api.deletePropertyImage(img.id); refresh(); }}>Xóa</button></div></div></article>)}</div></PageShell>;
}

export function ProfilePage() {
  const [message, setMessage] = useState("");
  const [profile, setProfile] = useState({ full_name: "", email: "", role: "user", linked_agent_id: "" });

  useEffect(() => {
    api.me().then((data) => {
      if (data) {
        setProfile({
          full_name: data.full_name || "",
          email: data.email || "",
          role: data.role || "user",
          linked_agent_id: data.linked_agent_id || "",
        });
      }
    });
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    const result = await api.updateProfile(profile);
    if (result?.id) setMessage(`Đã lưu hồ sơ: ${result.full_name || result.username} (${result.role})`);
    else setMessage("Chưa lưu được hồ sơ.");
  };

  return <PageShell eyebrow="Hồ sơ người dùng" title={profile.full_name || profile.role || "Hồ sơ"} desc={`Vai trò: ${profile.role || "user"}`} maxWidth="760px"><form className="extra-card form-grid" onSubmit={submit}><Field label="Họ và tên" placeholder="Ken" value={profile.full_name} onChange={(e) => setProfile((prev) => ({ ...prev, full_name: e.target.value }))} /><Field label="Email" type="email" value={profile.email} onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))} /><label className="extra-field"><span>Vai trò</span><select value={profile.role} onChange={(e) => setProfile((prev) => ({ ...prev, role: e.target.value }))}><option value="user">Khách hàng</option><option value="agent">Môi giới</option><option value="admin">Admin</option></select></label><label className="extra-field"><span>Môi giới liên kết</span><input value={profile.linked_agent_id} onChange={(e) => setProfile((prev) => ({ ...prev, linked_agent_id: e.target.value }))} placeholder="ID môi giới" /></label><button className="btn-geo-primary form-wide">Lưu hồ sơ</button>{message && <p className="muted-line form-wide">{message}</p>}</form></PageShell>;
}

export function AgentProfilePage() {
  const [agent, setAgent] = useState({ name: "Nguyễn Văn A", email: "agent@example.com", phone: "0901 234 567", properties: sampleProperties });
  useEffect(() => {
    const id = queryId();
    if (!id) return;
    api.agent(id).then((data) => data && setAgent(data));
  }, []);
  return <PageShell eyebrow="Hồ sơ môi giới" title={agent.name} desc={`${agent.email} · ${agent.phone}`}><div className="dashboard-stats"><div><strong>{agent.properties?.length || 0}</strong><span>Tin đang phụ trách</span></div><div><strong>{agent.lat ?? "-"}</strong><span>Vĩ độ</span></div><div><strong>{agent.lng ?? "-"}</strong><span>Kinh độ</span></div></div><div className="extra-top-actions"><a className="btn-geo-secondary" href={`tel:${agent.phone || '0901234567'}`}>Gọi ngay</a><a className="btn-admin" href={`mailto:${agent.email || 'agent@example.com'}`}>Gửi email</a></div><div className="mini-grid">{(agent.properties || sampleProperties).map((p) => <PropertyMiniCard p={p} key={p.id} />)}</div></PageShell>;
}

export function AppointmentCreatePage() {
  const [message, setMessage] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await api.createAppointment({ lead_id: form.get("lead_id"), property_id: form.get("property_id"), scheduled_at: form.get("scheduled_at"), notes: form.get("notes") });
    setMessage(result?.id ? "Đã tạo lịch hẹn trong backend." : "Chưa tạo được lịch hẹn. Cần lead/property ID thật.");
  };

  return <PageShell eyebrow="Lịch hẹn xem nhà" title="Tạo lịch hẹn" desc="Chọn khách hàng, bất động sản và thời gian hẹn."><form className="extra-card form-grid" onSubmit={submit}><label className="extra-field"><span>Lead ID</span><input name="lead_id" placeholder="1" /></label><label className="extra-field"><span>Bất động sản</span><select name="property_id">{sampleProperties.map((p) => <option value={p.id} key={p.id}>{p.title}</option>)}</select></label><label className="extra-field"><span>Thời gian hẹn</span><input name="scheduled_at" type="datetime-local" /></label><label className="extra-field form-wide"><span>Ghi chú</span><textarea name="notes" rows="5" /></label><button className="btn-admin form-wide">Tạo lịch hẹn</button>{message && <p className="muted-line form-wide">{message}</p>}</form></PageShell>;
}

export function ErrorPage({ code = "404" }) {
  const forbidden = code === "403";
  return <PageShell eyebrow="Bản đồ hệ thống" title={forbidden ? "Khu vực hạn chế!" : "Mất dấu tọa độ!"} desc={forbidden ? "Tài khoản của bạn không có đủ quyền hạn để truy cập vào phân khu này." : "Tọa độ bạn đang tìm kiếm không tồn tại trên bản đồ hoặc đã bị di dời."} maxWidth="760px"><div className="extra-card error-card"><div className={forbidden ? "error-code danger" : "error-code"}>{code}</div><div className="mini-actions center"><a href="/" className="btn-geo-primary">Về trang chủ</a>{forbidden && <a href="/login" className="btn-geo-secondary">Đăng nhập ngay</a>}</div></div></PageShell>;
}

export function PasswordResetPage() {
  return <PageShell eyebrow="Khôi phục tài khoản" title="Quên mật khẩu" maxWidth="640px"><form className="extra-card form-stack"><Field label="Email tài khoản" type="email" placeholder="you@example.com" /><button className="btn-geo-primary">Gửi hướng dẫn đặt lại</button></form></PageShell>;
}
