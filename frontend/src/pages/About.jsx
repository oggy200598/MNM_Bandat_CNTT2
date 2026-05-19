import "./About.css";

const SECTIONS = [
  {
    id: "intro",
    eye: "Lời mở đầu",
    title: "Câu chuyện của",
    titleAccent: "GeoEstate",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=900&auto=format&fit=crop",
    alt: "GeoEstate giới thiệu",
    paragraphs: [
      "Trong thời đại số hóa, việc tìm kiếm bất động sản không chỉ dừng lại ở những dòng văn bản khô khan. Khách hàng cần một góc nhìn thực tế, trực quan về vị trí, tiện ích xung quanh và tiềm năng phát triển của khu vực.",
      "GeoEstate ra đời nhằm giải quyết bài toán đó. Bằng việc ứng dụng công nghệ WebGIS, chúng tôi mang bản đồ số lên trình duyệt, giúp bạn nhìn tận mắt, soi tận nơi ngôi nhà tương lai của mình."
    ],
  },
  {
    id: "team",
    eye: "Chúng tôi là ai",
    title: "Nền tảng kết nối",
    titleAccent: "minh bạch",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=900&auto=format&fit=crop",
    alt: "Đội ngũ GeoEstate",
    reverse: true,
    paragraphs: [
      "Chúng tôi là nền tảng kết nối trực tiếp giữa Người mua, Môi giới và Nhà đầu tư. GeoEstate cung cấp một môi trường minh bạch, nơi mọi thông tin bất động sản đều được gắn tọa độ không gian chính xác.",
      "Hệ thống được phát triển với cốt lõi là cơ sở dữ liệu không gian PostGIS và framework Django mạnh mẽ, hướng đến trải nghiệm tìm kiếm bất động sản hiện đại, trực quan và đáng tin cậy.",
    ],
  },
  {
    id: "values",
    eye: "Giá trị cốt lõi",
    title: "Ba trụ cột",
    titleAccent: "của chúng tôi",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=900&auto=format&fit=crop",
    alt: "Giá trị cốt lõi",
    intro: "GeoEstate hoạt động dựa trên 3 tiêu chí quan trọng nhất để mang lại trải nghiệm tìm nhà hoàn hảo:",
    list: [
      { icon: "📍", label: "Không gian (Spatial)", desc: "Mọi tin đăng đều được số hóa lên bản đồ, tính toán khoảng cách thực tế đến trường học, bệnh viện." },
      { icon: "⚖️", label: "Minh bạch (Transparent)", desc: "Thông tin giá cả, diện tích, môi giới được hiển thị rõ ràng, xác thực và kiểm duyệt kỹ lưỡng." },
      { icon: "⚡", label: "Tiện ích (Convenient)", desc: "Công cụ so sánh, tính điểm vị trí và tìm kiếm bán kính thông minh trong tầm tay." },
    ],
  },
];

const STATS = [
  { num: "2,450+", label: "Bất động sản" },
  { num: "120+",   label: "Môi giới" },
  { num: "15K+",   label: "Khách tiềm năng" },
  { num: "98%",    label: "Hài lòng" },
];

const TECH = [
  { icon: "🗄️", name: "PostGIS", desc: "Cơ sở dữ liệu không gian" },
  { icon: "🐍", name: "Django",  desc: "Backend framework" },
  { icon: "⚛️", name: "React",   desc: "Frontend hiện đại" },
  { icon: "🗺️", name: "Leaflet", desc: "Bản đồ tương tác" },
];

function About() {
  return (
    <div className="about-page">
      {/* BREADCRUMB */}
      <div className="breadcrumb-strip">
        <div className="ab-container">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="/">⌂ Trang chủ</a></li>
            <li className="breadcrumb-item active">Giới thiệu</li>
          </ol>
        </div>
      </div>

      {/* HERO */}
      <section className="ab-hero">
        <div className="ab-hero-bg" />
        <div className="ab-container ab-hero-inner">
          <p className="ab-eye">Về chúng tôi</p>
          <h1 className="ab-h1">
            Nền tảng bất động sản<br />
            <em>thế hệ mới</em>
          </h1>
          <p className="ab-hero-sub">
            Hệ thống Quản lý và Phân phối Bất động sản tích hợp bản đồ WebGIS — minh bạch, chính xác và trực quan.
          </p>
          <div className="ab-hero-stats">
            {STATS.map((s) => (
              <div className="ab-hstat" key={s.label}>
                <div className="ab-hstat-num">{s.num}</div>
                <div className="ab-hstat-lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTENT SECTIONS */}
      <main className="ab-main">
        {SECTIONS.map((sec, i) => (
          <section
            className={`ab-section ${i % 2 === 0 ? "" : "ab-section-alt"}`}
            key={sec.id}
          >
            <div className="ab-container">
              <div className={`ab-grid ${sec.reverse ? "ab-grid-reverse" : ""}`}>
                {/* TEXT */}
                <div className="ab-text">
                  <p className="ab-eye">{sec.eye}</p>
                  <h2 className="ab-h2">
                    {sec.title} <em>{sec.titleAccent}</em>
                  </h2>

                  {sec.paragraphs?.map((p, j) => (
                    <p className="ab-p" key={j}>{p}</p>
                  ))}

                  {sec.intro && <p className="ab-p ab-intro">{sec.intro}</p>}

                  {sec.list && (
                    <ul className="ab-value-list">
                      {sec.list.map((item) => (
                        <li className="ab-value-item" key={item.label}>
                          <div className="ab-value-icon">{item.icon}</div>
                          <div>
                            <div className="ab-value-label">{item.label}</div>
                            <div className="ab-value-desc">{item.desc}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* IMAGE */}
                <div className="ab-media">
                  <div className="ab-media-inner">
                    <img src={sec.image} alt={sec.alt} loading="lazy" />
                    <div className="ab-media-overlay" />
                  </div>
                  <div className="ab-media-deco" />
                </div>
              </div>
            </div>
          </section>
        ))}
      </main>

      {/* TECH STACK */}
      <section className="ab-tech">
        <div className="ab-container">
          <div className="ab-tech-header">
            <p className="ab-eye" style={{ color: "var(--ab-gold-light)" }}>Công nghệ</p>
            <h2 className="ab-h2" style={{ color: "#fff" }}>
              Xây dựng trên nền tảng <em>vững chắc</em>
            </h2>
          </div>
          <div className="ab-tech-grid">
            {TECH.map((t) => (
              <div className="ab-tech-card" key={t.name}>
                <div className="ab-tech-icon">{t.icon}</div>
                <div className="ab-tech-name">{t.name}</div>
                <div className="ab-tech-desc">{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="ab-cta">
        <div className="ab-container">
          <div className="ab-cta-inner">
            <div className="ab-cta-text">
              <p className="ab-eye">Sẵn sàng chưa?</p>
              <h2 className="ab-h2">
                Khám phá bất động sản<br /><em>ngay hôm nay</em>
              </h2>
              <p className="ab-p">Hàng nghìn tin đăng chất lượng đang chờ bạn trên bản đồ tương tác.</p>
            </div>
            <div className="ab-cta-actions">
              <a href="/properties" className="ab-btn-primary">Khám phá bất động sản →</a>
              <a href="/nearby"     className="ab-btn-secondary">Bản đồ lân cận</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;
