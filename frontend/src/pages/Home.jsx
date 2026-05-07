import "./Home.css";

function Home() {
  const featuredProperties = [
    {
      id: 1,
      title: 'Căn hộ cao cấp Quận 1',
      price: '12 tỷ',
      address: 'Quận 1, TP.HCM',
      area: 120,
      type: 'Căn hộ',
      agent: 'Nguyễn Văn A',
      image:
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200&auto=format&fit=crop',
      status: 'Đang bán',
    },
    {
      id: 2,
      title: 'Nhà phố Thảo Điền',
      price: '25 tỷ',
      address: 'Thảo Điền, TP.Thủ Đức',
      area: 250,
      type: 'Nhà ở',
      agent: 'Trần Thị B',
      image:
        'https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200&auto=format&fit=crop',
      status: 'Nổi bật',
    },
    {
      id: 3,
      title: 'Đất nền Bình Chánh',
      price: '5 tỷ',
      address: 'Bình Chánh, TP.HCM',
      area: 500,
      type: 'Đất nền',
      agent: 'Lê Văn C',
      image:
        'https://images.unsplash.com/photo-1448630360428-65456885c650?q=80&w=1200&auto=format&fit=crop',
      status: 'Mới',
    },
  ];

  return (
    <>
      {/* HERO */}
      <div className="hero">
        <div className="hero-bg"></div>

        <div className="container">
          <div className="hero-wrapper">
            <div className="hero-content">
              <div className="hero-eyebrow">
                Nền tảng bất động sản GIS hàng đầu
              </div>

              <h1 className="hero-title">
                Cách thông minh hơn để <br />
                tìm <span className="accent">bất động sản</span>
              </h1>

              <p className="hero-subtitle">
                Khám phá hàng nghìn bất động sản trên bản đồ tương tác được
                vận hành bởi PostGIS. Phân tích vị trí, tiện ích lân cận và giá
                thị trường theo thời gian thực.
              </p>

              <div className="hero-search">
                <input
                  type="text"
                  placeholder="Tìm theo địa chỉ, quận, khu vực..."
                />

                <select>
                  <option>Tất cả loại hình</option>
                  <option>Căn hộ</option>
                  <option>Nhà ở</option>
                  <option>Đất nền</option>
                </select>

                <button className="btn-hero-search">Tìm kiếm</button>
              </div>

              <div className="hero-actions">
                <button className="btn-primary">
                  Xem bất động sản
                </button>

                <button className="btn-secondary">
                  Tìm kiếm lân cận
                </button>
              </div>

              <div className="stats-strip">
                <div className="stat-cell">
                  <div className="stat-num">2,450+</div>
                  <div className="stat-lbl">Bất động sản</div>
                </div>

                <div className="stat-cell">
                  <div className="stat-num">120+</div>
                  <div className="stat-lbl">Môi giới</div>
                </div>

                <div className="stat-cell">
                  <div className="stat-num">15K+</div>
                  <div className="stat-lbl">Khách hàng</div>
                </div>

                <div className="stat-cell">
                  <div className="stat-num">5,000+</div>
                  <div className="stat-lbl">Tiện ích</div>
                </div>
              </div>
            </div>

            <div className="map-frame">
              <iframe
                src="https://www.openstreetmap.org/export/embed.html?bbox=106.5,10.65,106.85,10.9&layer=mapnik"
                title="Bản đồ bất động sản"
                loading="lazy"
              ></iframe>

              <div className="map-frame-overlay"></div>

              <div className="map-chip">
                KHÁM PHÁ NHANH · TP.HCM
              </div>
            </div>
          </div>
        </div>
      </div>

      <hr className="h-rule" />

      {/* FEATURES */}
      <section className="home-section">
        <div className="container">
          <div className="section-header">
            <div>
              <p className="section-eyebrow">Vì sao chọn chúng tôi</p>
              <h2 className="section-heading">
                Nền tảng GIS <br /> thế hệ mới
              </h2>
            </div>

            <p className="section-text">
              Kết hợp dữ liệu địa lý thực tế với công cụ thông minh để giúp bạn
              đưa ra quyết định đầu tư sắc bén hơn.
            </p>
          </div>

          <div className="feat-grid">
            <div className="feat-card">
              <div className="feat-icon">🗺️</div>
              <h5>Bản đồ PostGIS tương tác</h5>
              <p>
                Hiển thị hàng nghìn điểm bất động sản theo thời gian thực với hỗ
                trợ tìm kiếm theo khu vực.
              </p>
            </div>

            <div className="feat-card">
              <div className="feat-icon">📍</div>
              <h5>Tìm kiếm lân cận thông minh</h5>
              <p>
                Tìm bất động sản trong bán kính tùy chỉnh và tính khoảng cách.
              </p>
            </div>

            <div className="feat-card">
              <div className="feat-icon">📊</div>
              <h5>Phân tích giá thị trường</h5>
              <p>
                Biểu đồ xu hướng giá theo quận và so sánh khu vực theo thời gian
                thực.
              </p>
            </div>

            <div className="feat-card">
              <div className="feat-icon">🤝</div>
              <h5>Quản lý khách hàng</h5>
              <p>
                Theo dõi khách hàng tiềm năng và quản lý môi giới trong một hệ
                thống duy nhất.
              </p>
            </div>

            <div className="feat-card">
              <div className="feat-icon">🔒</div>
              <h5>Phân quyền người dùng</h5>
              <p>
                Hệ thống role-based access cho admin, môi giới và khách hàng.
              </p>
            </div>

            <div className="feat-card">
              <div className="feat-icon">⚡</div>
              <h5>REST API tích hợp</h5>
              <p>
                Dễ dàng kết nối với CRM, ERP hoặc ứng dụng mobile riêng.
              </p>
            </div>
          </div>
        </div>
      </section>

      <hr className="h-rule" />

      {/* PROPERTIES */}
      <section className="home-section">
        <div className="container">
          <div className="property-header">
            <div>
              <p className="section-eyebrow">Nổi bật</p>
              <h2 className="section-heading">Tin đăng nổi bật</h2>
            </div>

            <button className="btn-secondary">Xem tất cả</button>
          </div>

          <div className="prop-grid">
            {featuredProperties.map((p) => (
              <div className="prop-card" key={p.id}>
                <div
                  className="prop-thumb has-image"
                  style={{
                    backgroundImage: `url(${p.image})`,
                  }}
                >
                  <span className="badge-gold">{p.status}</span>
                </div>

                <div className="prop-body">
                  <div className="prop-price">{p.price}</div>

                  <div className="prop-name">{p.title}</div>

                  <div className="prop-loc">{p.address}</div>

                  <div className="prop-meta">
                    <span>
                      <strong>{p.area}</strong> m²
                    </span>

                    <span>
                      <strong>{p.type}</strong>
                    </span>

                    <span>
                      <strong>{p.agent}</strong>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="container cta-container">
        <div className="cta-banner">
          <h2>Sẵn sàng bắt đầu?</h2>

          <p>
            Đi thẳng vào khu vực khám phá, lọc nhanh theo nhu cầu và lưu lại
            những tin phù hợp nhất.
          </p>

          <div className="cta-actions">
            <button className="btn-primary">
              Mở khu vực khám phá
            </button>

            <button className="btn-secondary">
              Mở bảng điều khiển
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;
