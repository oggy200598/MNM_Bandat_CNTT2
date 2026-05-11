import { useEffect, useState } from "react";
import { api, normalizeProperty, formatPrice } from "../api";
import "./Home.css";

/* ─── Static fallback data ─── */
const FALLBACK_PROPERTIES = [
  {
    id: 1,
    title: "Biệt thự hạng sang Thảo Điền – View sông Sài Gòn",
    price: 38000000000,
    address: "Thảo Điền, Quận 2, TP.HCM",
    area: 420,
    bedrooms: 5,
    bathrooms: 4,
    property_type: "villa",
    listing_status: "featured",
    agent: { name: "Nguyễn Văn An", title: "Môi giới cao cấp" },
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=900&auto=format&fit=crop",
    floor: null,
  },
  {
    id: 2,
    title: "Penthouse cao cấp The River – Quận 1",
    price: 14000000000,
    address: "Bến Nghé, Quận 1, TP.HCM",
    area: 168,
    bedrooms: 3,
    bathrooms: 3,
    property_type: "apartment",
    listing_status: "hot",
    agent: { name: "Trần Thị Hoa", title: "Môi giới" },
    image:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=700&auto=format&fit=crop",
    floor: "T36",
  },
  {
    id: 3,
    title: "Nhà phố 4 tầng – Trung tâm Quận 3",
    price: 8500000000,
    address: "Phường 6, Quận 3, TP.HCM",
    area: 82,
    bedrooms: 4,
    bathrooms: 4,
    property_type: "house",
    listing_status: "active",
    agent: { name: "Lê Minh Tuấn", title: "Môi giới" },
    image:
      "https://images.unsplash.com/photo-1486325212027-8081e485255e?q=80&w=700&auto=format&fit=crop",
    floor: "4",
  },
  {
    id: 4,
    title: "Căn hộ 2PN Masteri Thảo Điền",
    price: 4200000000,
    address: "Thủ Đức, TP.HCM",
    area: 72,
    bedrooms: 2,
    bathrooms: 2,
    property_type: "apartment",
    listing_status: "active",
    agent: { name: "Phạm Lan Anh", title: "Môi giới" },
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=600&auto=format&fit=crop",
    floor: null,
  },
  {
    id: 5,
    title: "Biệt thự Vinhomes Grand Park Q9",
    price: 22000000000,
    address: "Quận 9, TP.HCM",
    area: 320,
    bedrooms: 4,
    bathrooms: 4,
    property_type: "villa",
    listing_status: "new",
    agent: { name: "Nguyễn Văn An", title: "Môi giới cao cấp" },
    image:
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=600&auto=format&fit=crop",
    floor: null,
  },
  {
    id: 6,
    title: "Đất nền dự án Bình Chánh – Sổ đỏ",
    price: 3800000000,
    address: "Bình Chánh, TP.HCM",
    area: 100,
    bedrooms: null,
    bathrooms: null,
    property_type: "land",
    listing_status: "new",
    agent: { name: "Trần Thị Hoa", title: "Môi giới" },
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=600&auto=format&fit=crop",
    floor: null,
  },
];

const AGENTS = [
  { initials: "NA", name: "Nguyễn Văn An", area: "Chuyên gia Quận 1 & Quận 2", deals: 48, rating: "4.9★", years: "6 năm", color: "var(--gold-pale)", textColor: "var(--gold)" },
  { initials: "TH", name: "Trần Thị Hoa", area: "Chuyên gia Phú Mỹ Hưng", deals: 62, rating: "5.0★", years: "8 năm", color: "#e8f4f8", textColor: "#5a8fa8" },
  { initials: "LM", name: "Lê Minh Tuấn", area: "Chuyên gia Bình Thạnh & Q3", deals: 35, rating: "4.8★", years: "4 năm", color: "#f5f0e8", textColor: "#8a6540" },
  { initials: "PL", name: "Phạm Lan Anh", area: "Chuyên gia Thủ Đức & Q9", deals: 29, rating: "4.7★", years: "3 năm", color: "#eef5ee", textColor: "#4a8a50" },
];

const TESTIMONIALS = [
  { stars: 5, text: "Tìm được căn hộ ưng ý chỉ trong 3 ngày nhờ bộ lọc bản đồ. Giao diện rất trực quan, thông tin minh bạch, không lo bị dắt mũi.", name: "Minh Hoàng", role: "Mua căn hộ tại Quận 2", initials: "MH", color: "var(--gold-pale)", textColor: "var(--gold)" },
  { stars: 5, text: "Tính năng tìm kiếm lân cận quá xuất sắc. Tôi có thể xem ngay khoảng cách từ nhà đến trường con học, rất tiện khi chọn mua.", name: "Lan Anh", role: "Mua nhà tại Bình Thạnh", initials: "LA", color: "#eef5ee", textColor: "#4a8a50" },
  { stars: 4, text: "Hệ thống CRM giúp tôi quản lý khách hàng tiềm năng rất hiệu quả. Doanh số tăng 40% so với khi chưa dùng nền tảng này.", name: "Quang Trung", role: "Môi giới tại Phú Nhuận", initials: "QT", color: "#e8f4f8", textColor: "#3a6f8a" },
];

const MARQUEE_ITEMS = [
  "Quận 1", "Quận 2 – Thủ Đức", "Bình Thạnh", "Phú Nhuận",
  "Quận 7 – Phú Mỹ Hưng", "Bình Chánh", "Nhà Bè", "Quận 9", "Tân Bình", "Gò Vấp",
];

/* ─── Helpers ─── */
function statusLabel(status) {
  const map = { featured: "Nổi bật", hot: "Hot", new: "Mới", active: "Đang bán" };
  return map[status] || "Đang bán";
}

function typeLabel(type) {
  const map = { apartment: "Căn hộ", house: "Nhà ở", villa: "Biệt thự", land: "Đất nền", office: "Văn phòng" };
  return map[type] || type;
}

function initials(name) {
  return name ? name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase() : "??";
}

/* ─── Sub-components ─── */
function PropertyCard({ p, big = false }) {
  const statusBadge = statusLabel(p.listing_status);
  const typeBadge = typeLabel(p.property_type);
  const isHot = ["featured", "hot", "new"].includes(p.listing_status);

  return (
    <a className={`prop-card${big ? " prop-card-big" : ""} fade-up`} href={`/property-detail?id=${p.id}`}>
      <div className="prop-thumb">
        <img className="prop-thumb-img" src={p.image} alt={p.title} loading="lazy" />
        <div className="prop-overlay" />
        <div className="prop-badges">
          {isHot && <span className="badge badge-status">{statusBadge}</span>}
          <span className="badge badge-type">{typeBadge}</span>
        </div>
        <button className="prop-fav" onClick={(e) => e.preventDefault()} aria-label="Yêu thích">♡</button>
      </div>
      <div className="prop-body">
        <div className="prop-price">
          {formatPrice(p.price)} <sub>VNĐ</sub>
        </div>
        <div className="prop-name">{p.title}</div>
        <div className="prop-loc">
          <span className="prop-loc-dot" />
          {p.address}
        </div>
        <div className="prop-meta">
          <div className="meta-item">
            <div className="meta-val">{p.area}</div>
            <div className="meta-lbl">m²</div>
          </div>
          {p.bedrooms != null && (
            <div className="meta-item">
              <div className="meta-val">{p.bedrooms}</div>
              <div className="meta-lbl">P.Ngủ</div>
            </div>
          )}
          {p.floor != null && (
            <div className="meta-item">
              <div className="meta-val">{p.floor}</div>
              <div className="meta-lbl">Tầng</div>
            </div>
          )}
          {p.bathrooms != null && !p.floor && (
            <div className="meta-item">
              <div className="meta-val">{p.bathrooms}</div>
              <div className="meta-lbl">WC</div>
            </div>
          )}
        </div>
        {p.agent && big && (
          <div className="prop-agent">
            <div className="agent-av">{initials(p.agent.name)}</div>
            <div className="agent-name">
              <strong>{p.agent.name}</strong>
              {p.agent.title}
            </div>
          </div>
        )}
      </div>
    </a>
  );
}

/* ─── Main component ─── */
function Home() {
  const [properties, setProperties] = useState(FALLBACK_PROPERTIES);
  const [stats, setStats] = useState({
    property_total: 2450,
    agent_total: 120,
    lead_total: 15000,
    satisfaction: 98,
  });

  useEffect(() => {
    api.properties({ limit: 6, featured: true }).then((items) => {
      if (Array.isArray(items) && items.length >= 3) setProperties(items);
    });
    api.dashboard().then((data) => {
      if (data) setStats((prev) => ({ ...prev, ...data }));
    });
  }, []);

  const [bigCard, ...restCards] = properties;
  const topRight = restCards.slice(0, 2);
  const bottomRow = restCards.slice(2, 5);

  return (
    <div className="home-page">
      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-img" />
          <div className="hero-vignette" />
        </div>
        <div className="hero-content">
          <div className="hero-tag">✦ Nền tảng bất động sản GIS hàng đầu</div>
          <h1 className="hero-h1">
            Khám phá bất động sản<br />
            <em>đẳng cấp</em> tại TP.HCM
          </h1>
          <p className="hero-sub">
            Hơn {stats.property_total.toLocaleString("vi-VN")} bất động sản trên bản đồ tương tác PostGIS.
            Phân tích vị trí, tiện ích lân cận và giá thị trường theo thời gian thực.
          </p>
          <div className="hero-search-wrap">
            <form className="hero-search" onSubmit={(e) => e.preventDefault()}>
              <svg width="16" height="16" fill="none" stroke="#9a9a9a" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input type="text" placeholder="Tìm theo địa chỉ, quận, khu vực…" autoComplete="off" />
              <div className="search-divider" />
              <select defaultValue="">
                <option value="">Loại hình</option>
                <option value="apartment">Căn hộ</option>
                <option value="house">Nhà ở</option>
                <option value="land">Đất nền</option>
                <option value="villa">Biệt thự</option>
              </select>
              <div className="search-divider" />
              <select defaultValue="">
                <option value="">Mức giá</option>
                <option value="lt2">Dưới 2 tỷ</option>
                <option value="2to5">2 – 5 tỷ</option>
                <option value="5to10">5 – 10 tỷ</option>
                <option value="gt10">Trên 10 tỷ</option>
              </select>
              <button className="btn-search" type="submit">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                Tìm kiếm
              </button>
            </form>
          </div>
          <div className="hero-stats">
            <div className="hstat">
              <div className="hstat-num">{stats.property_total.toLocaleString("vi-VN")}<span>+</span></div>
              <div className="hstat-lbl">Bất động sản</div>
            </div>
            <div className="hstat">
              <div className="hstat-num">{stats.agent_total.toLocaleString("vi-VN")}<span>+</span></div>
              <div className="hstat-lbl">Môi giới</div>
            </div>
            <div className="hstat">
              <div className="hstat-num">{(stats.lead_total / 1000).toFixed(0)}K<span>+</span></div>
              <div className="hstat-lbl">Khách tiềm năng</div>
            </div>
            <div className="hstat">
              <div className="hstat-num">{stats.satisfaction}<span>%</span></div>
              <div className="hstat-lbl">Hài lòng</div>
            </div>
          </div>
        </div>
        <div className="hero-scroll">
          <div className="scroll-line" />
          <div className="scroll-txt">Cuộn</div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="marquee-strip">
        <div className="marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <div className="marquee-item" key={i}>
              <span className="marquee-dot" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURED LISTINGS ── */}
      <section className="section listings-section">
        <div className="container">
          <div className="section-row">
            <div>
              <p className="section-eye">Nổi bật</p>
              <h2 className="section-h">Tin đăng <em>chọn lọc</em></h2>
            </div>
            <div className="section-row-right">
              <p className="section-p">Những bất động sản cao cấp được kiểm duyệt kỹ lưỡng, sẵn sàng giao dịch.</p>
              <a href="/properties" className="btn-outline">Xem tất cả →</a>
            </div>
          </div>

          <div className="prop-grid-featured">
            {bigCard && <PropertyCard p={bigCard} big />}
            <div className="prop-grid-side">
              {topRight.map((p) => <PropertyCard key={p.id} p={p} />)}
            </div>
          </div>

          <div className="prop-grid">
            {bottomRow.map((p) => <PropertyCard key={p.id} p={p} />)}
          </div>
        </div>
      </section>

      {/* ── VALUE / STATS ── */}
      <section className="value-section">
        <div className="container">
          <div className="value-grid">
            <div className="value-left">
              <p className="section-eye">Tại sao chọn chúng tôi</p>
              <h2 className="section-h">Nền tảng GIS<br /><em>thế hệ mới</em></h2>
              <p>Kết hợp dữ liệu địa lý PostGIS chính xác với AI phân tích thị trường, giúp bạn đưa ra quyết định đầu tư thông minh hơn và nhanh hơn bao giờ hết.</p>
              <div className="value-cta">
                <a href="/properties" className="btn-gold">Bắt đầu ngay →</a>
                <a href="/about" className="btn-ghost">Tìm hiểu thêm</a>
              </div>
            </div>
            <div className="value-right">
              <div className="vstat-card accent">
                <div className="vstat-num">{stats.property_total.toLocaleString("vi-VN")}<span>+</span></div>
                <div className="vstat-lbl">Bất động sản đang niêm yết trên hệ thống</div>
              </div>
              <div className="vstat-card">
                <div className="vstat-num">{stats.agent_total}<span>+</span></div>
                <div className="vstat-lbl">Môi giới được xác thực và chứng nhận</div>
              </div>
              <div className="vstat-card">
                <div className="vstat-num">{(stats.lead_total / 1000).toFixed(0)}K<span>+</span></div>
                <div className="vstat-lbl">Khách hàng tiềm năng trong hệ thống CRM</div>
              </div>
              <div className="vstat-card">
                <div className="vstat-num">{stats.satisfaction}<span>%</span></div>
                <div className="vstat-lbl">Khách hàng hài lòng sau giao dịch</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="section feat-section">
        <div className="container">
          <div className="section-row">
            <div>
              <p className="section-eye">Tính năng</p>
              <h2 className="section-h">Công nghệ <em>vượt trội</em></h2>
            </div>
            <p className="section-p">Hệ sinh thái công cụ toàn diện từ bản đồ GIS đến CRM tích hợp, đáp ứng mọi nhu cầu giao dịch bất động sản hiện đại.</p>
          </div>
          <div className="feat-grid">
            {[
              { icon: "🗺️", title: "Bản đồ PostGIS tương tác", desc: "Hàng nghìn điểm bất động sản hiển thị real-time với clustering và tìm kiếm theo vùng đa giác." },
              { icon: "📍", title: "Tìm kiếm lân cận thông minh", desc: "Tìm bất động sản theo bán kính, tính khoảng cách đến trường học, bệnh viện, siêu thị." },
              { icon: "📊", title: "Phân tích giá thị trường", desc: "Biểu đồ xu hướng giá theo quận, so sánh từng tin đăng với mặt bằng khu vực." },
              { icon: "🤝", title: "CRM khách hàng & môi giới", desc: "Theo dõi leads, phân công môi giới, lịch hẹn và chăm sóc khách hàng toàn diện." },
              { icon: "🔒", title: "Phân quyền theo vai trò", desc: "Admin, Môi giới, Chủ sở hữu, Khách — mỗi vai trò có dashboard và quyền truy cập riêng." },
              { icon: "⚡", title: "REST API mở rộng", desc: "Tích hợp dễ dàng với CRM, ERP bên ngoài hoặc ứng dụng di động của bạn." },
            ].map((f, i) => (
              <div className={`feat-cell fade-up delay-${(i % 3) + 1}`} key={i}>
                <div className="feat-icon-wrap">{f.icon}</div>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MAP CTA ── */}
      <section className="map-section">
        <div className="container">
          <div className="map-wrap">
            <div className="map-left">
              <p className="section-eye">Khám phá</p>
              <h2 className="section-h">Bất động sản trên<br /><em>bản đồ tương tác</em></h2>
              <p>Xem toàn bộ bất động sản TP.HCM trực tiếp trên bản đồ PostGIS. Lọc theo khu vực, loại hình, giá — rồi vẽ vùng tìm kiếm theo ý muốn.</p>
              <div className="map-actions">
                <a href="/map" className="btn-gold">Mở bản đồ →</a>
                <a href="/nearby" className="btn-ghost">Tìm kiếm lân cận</a>
              </div>
            </div>
            <div className="map-frame-wrap">
              <iframe
                src="https://www.openstreetmap.org/export/embed.html?bbox=106.5,10.65,106.85,10.9&layer=mapnik"
                title="Bản đồ TP.HCM"
                loading="lazy"
              />
              <div className="map-frame-overlay" />
              <div className="map-pill">
                <div className="map-pill-dot" />
                <div className="map-pill-txt">LIVE · TP.HỒ CHÍ MINH</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── AGENTS ── */}
      <section className="section agents-section">
        <div className="container">
          <div className="section-row">
            <div>
              <p className="section-eye">Đội ngũ</p>
              <h2 className="section-h">Môi giới <em>hàng đầu</em></h2>
            </div>
            <a href="/agents" className="btn-outline">Xem tất cả môi giới →</a>
          </div>
          <div className="agents-grid">
            {AGENTS.map((a, i) => (
              <a href="/agents" className="agent-card" key={i}>
                <div className="agent-photo">
                  <div className="agent-photo-placeholder" style={{ background: a.color, color: a.textColor }}>
                    {a.initials}
                  </div>
                </div>
                <div className="agent-info">
                  <h4>{a.name}</h4>
                  <p>{a.area}</p>
                  <div className="agent-stats">
                    <div className="astat"><div className="astat-n">{a.deals}</div><div className="astat-l">Giao dịch</div></div>
                    <div className="astat"><div className="astat-n">{a.rating}</div><div className="astat-l">Đánh giá</div></div>
                    <div className="astat"><div className="astat-n">{a.years}</div><div className="astat-l">Kinh nghiệm</div></div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="section testi-section">
        <div className="container">
          <div className="section-row">
            <div>
              <p className="section-eye">Khách hàng nói gì</p>
              <h2 className="section-h">Đánh giá <em>thực tế</em></h2>
            </div>
          </div>
          <div className="testi-grid">
            {TESTIMONIALS.map((t, i) => (
              <div className="testi-card" key={i}>
                <div className="testi-stars">{"★".repeat(t.stars)}{"☆".repeat(5 - t.stars)}</div>
                <div className="testi-text">"{t.text}"</div>
                <div className="testi-user">
                  <div className="testi-av" style={{ background: t.color, color: t.textColor }}>{t.initials}</div>
                  <div>
                    <div className="testi-uname">{t.name}</div>
                    <div className="testi-urole">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="final-cta">
        <div className="container">
          <div className="final-cta-inner">
            <p className="section-eye">Bắt đầu ngay hôm nay</p>
            <h2>Sẵn sàng tìm<br /><em>bất động sản lý tưởng?</em></h2>
            <p>Tham gia cùng hàng nghìn khách hàng đã tin tưởng GeoEstate. Đăng ký miễn phí, không cần thẻ tín dụng.</p>
            <div className="final-actions">
              <a href="/properties" className="btn-gold">Mở khu vực khám phá →</a>
              <a href="/register" className="btn-ghost">Đăng ký tài khoản</a>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

export default Home;
