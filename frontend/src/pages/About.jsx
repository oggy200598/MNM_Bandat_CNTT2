import "./About.css";

function About() {
  const sections = [
    {
      title: "🌍 Lời mở đầu",
      image:
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      alt: "Lời mở đầu",
      paragraphs: [
        <>
          Trong thời đại số hóa, việc tìm kiếm bất động sản không chỉ dừng lại ở những dòng văn bản khô khan.
          Khách hàng cần một góc nhìn thực tế, trực quan về vị trí, tiện ích xung quanh và tiềm năng phát triển của khu vực.
        </>,
        <>
          <strong>GeoEstate</strong> ra đời nhằm giải quyết bài toán đó. Bằng việc ứng dụng công nghệ <strong>WebGIS</strong>,
          chúng tôi mang bản đồ số lên trình duyệt, giúp bạn “nhìn tận mắt, soi tận nơi” ngôi nhà tương lai của mình.
        </>,
      ],
    },
    {
      title: "🤝 Chúng tôi là ai?",
      image:
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      alt: "Chúng tôi là ai",
      reverse: true,
      paragraphs: [
        <>
          Chúng tôi là nền tảng kết nối trực tiếp giữa <strong>Người mua, Môi giới và Nhà đầu tư</strong>. GeoEstate cung cấp
          một môi trường minh bạch, nơi mọi thông tin bất động sản đều được gắn tọa độ không gian chính xác.
        </>,
        <>
          Hệ thống được phát triển với cốt lõi là cơ sở dữ liệu không gian PostGIS và framework Django mạnh mẽ,
          hướng đến trải nghiệm tìm kiếm bất động sản hiện đại, trực quan và đáng tin cậy.
        </>,
      ],
    },
    {
      title: "💎 Giá trị cốt lõi",
      image:
        "https://images.unsplash.com/photo-1582407947304-fd86f028f716?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      alt: "Giá trị cốt lõi",
      intro:
        "GeoEstate hoạt động dựa trên 3 tiêu chí quan trọng nhất để mang lại trải nghiệm tìm nhà hoàn hảo:",
      list: [
        <>
          <strong>📍 Không gian (Spatial):</strong> Mọi tin đăng đều được số hóa lên bản đồ, tính toán khoảng cách thực tế đến trường học, bệnh viện.
        </>,
        <>
          <strong>⚖️ Minh bạch (Transparent):</strong> Thông tin giá cả, diện tích, môi giới được hiển thị rõ ràng, xác thực.
        </>,
        <>
          <strong>⚡ Tiện ích (Convenient):</strong> Công cụ so sánh, tính điểm vị trí và tìm kiếm bán kính thông minh.
        </>,
      ],
    },
  ];

  return (
    <div className="about-page">
      <div className="breadcrumb-strip">
        <div className="container">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/">⌂ Trang chủ</a>
              </li>
              <li className="breadcrumb-item active">Giới thiệu</li>
            </ol>
          </nav>
        </div>
      </div>

      <section className="page-hero">
        <div className="container text-center">
          <p className="section-eyebrow">Về chúng tôi</p>
          <h1 className="section-heading">Nền tảng GeoEstate</h1>
          <p className="page-subtitle">
            Hệ thống Quản lý và Phân phối Bất động sản tích hợp bản đồ WebGIS.
          </p>
        </div>
      </section>

      <main className="container about-container">
        {sections.map((section) => (
          <article className="about-section" key={section.title}>
            <div className={`about-grid ${section.reverse ? "reverse" : ""}`}>
              <div className="about-text">
                <h2 className="section-heading about-title">{section.title}</h2>

                {section.paragraphs?.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}

                {section.intro && <p>{section.intro}</p>}

                {section.list && (
                  <ul className="about-list">
                    {section.list.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="about-media">
                <img src={section.image} alt={section.alt} />
              </div>
            </div>
          </article>
        ))}
      </main>

      <section className="about-actions container text-center">
        <a href="/properties" className="btn-geo-primary">
          Khám phá bất động sản
        </a>
        <a href="/nearby" className="btn-geo-secondary">
          Bản đồ lân cận
        </a>
      </section>
    </div>
  );
}

export default About;
