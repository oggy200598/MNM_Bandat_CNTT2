import { useEffect } from "react";
import { Link } from "react-router-dom";

import "../App.css";

/* ─────────────────────────────
   DATA
───────────────────────────── */

const SECTIONS = [
  {
    id: "intro",
    eye: "Lời mở đầu",
    title: "Câu chuyện của",
    accent: "GeoEstate",
    image:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1200&auto=format&fit=crop",
    paragraphs: [
      "Trong thời đại số hóa, việc tìm kiếm bất động sản không còn dừng lại ở những dòng tin đăng đơn giản. Người dùng cần dữ liệu trực quan, minh bạch và có thể khám phá toàn bộ khu vực xung quanh chỉ với vài cú nhấp chuột.",
      "GeoEstate được xây dựng để giải quyết điều đó — kết hợp WebGIS, bản đồ không gian và dữ liệu bất động sản trong một nền tảng hiện đại."
    ]
  },

  {
    id: "mission",
    eye: "Sứ mệnh",
    title: "Mang trải nghiệm",
    accent: "thông minh",
    reverse: true,
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200&auto=format&fit=crop",
    paragraphs: [
      "Chúng tôi giúp khách hàng tìm kiếm bất động sản bằng dữ liệu thực tế thay vì cảm tính. Từ khoảng cách đến trường học, bệnh viện, trung tâm thương mại cho tới tiềm năng khu vực đều được hiển thị trực tiếp trên bản đồ.",
      "GeoEstate hướng tới một thị trường minh bạch hơn, nơi mọi thông tin đều rõ ràng và dễ tiếp cận."
    ]
  },

  {
    id: "values",
    eye: "Giá trị cốt lõi",
    title: "Điều làm nên",
    accent: "khác biệt",
    image:
      "https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=1200&auto=format&fit=crop",
    values: [
      {
        icon: "🗺️",
        title: "WebGIS trực quan",
        desc: "Hiển thị bất động sản trực tiếp trên bản đồ tương tác."
      },
      {
        icon: "📍",
        title: "Dữ liệu không gian",
        desc: "Phân tích khoảng cách và tiện ích lân cận chính xác."
      },
      {
        icon: "⚡",
        title: "Hiệu năng hiện đại",
        desc: "Frontend React + Backend Django + PostGIS."
      },
      {
        icon: "🔒",
        title: "Minh bạch",
        desc: "Thông tin kiểm duyệt rõ ràng và đáng tin cậy."
      }
    ]
  }
];

const STATS = [
  {
    number: "2,450+",
    label: "Bất động sản"
  },
  {
    number: "120+",
    label: "Môi giới"
  },
  {
    number: "15K+",
    label: "Khách tiềm năng"
  },
  {
    number: "98%",
    label: "Hài lòng"
  }
];

const TECH = [
  {
    icon: "🗄️",
    name: "PostGIS",
    desc: "Cơ sở dữ liệu không gian"
  },
  {
    icon: "🐍",
    name: "Django",
    desc: "Backend framework"
  },
  {
    icon: "⚛️",
    name: "React",
    desc: "Frontend hiện đại"
  },
  {
    icon: "🗺️",
    name: "Leaflet",
    desc: "Bản đồ tương tác"
  }
];

const TIMELINE = [
  {
    year: "2024",
    title: "Khởi tạo dự án",
    desc: "Xây dựng nền tảng bất động sản tích hợp GIS."
  },
  {
    year: "2025",
    title: "Ra mắt hệ thống WebGIS",
    desc: "Triển khai bản đồ tương tác và tìm kiếm bán kính."
  },
  {
    year: "2026",
    title: "Mở rộng CRM",
    desc: "Quản lý môi giới, leads và lịch hẹn."
  }
];

/* ─────────────────────────────
   COMPONENT
───────────────────────────── */

export default function About() {

  useEffect(() => {
    document.title = "Giới thiệu | GeoEstate";
  }, []);

  return (

    <div className="about-page">

      {/* HERO */}

      <section className="about-hero">

        <div className="about-hero-overlay" />

        <div className="about-container">

          <div className="about-hero-content fade-up">

            <p className="about-eye">
              Về GeoEstate
            </p>

            <h1 className="about-title">

              Nền tảng bất động sản
              <br />

              <em>thế hệ mới</em>

            </h1>

            <p className="about-subtitle">

              Kết hợp dữ liệu không gian,
              WebGIS và trải nghiệm hiện đại
              để giúp bạn khám phá bất động sản
              trực quan hơn bao giờ hết.

            </p>

            <div className="about-hero-actions">

              <Link
                to="/properties"
                className="btn-primary"
              >
                Khám phá ngay →
              </Link>

              <Link
                to="/nearby"
                className="btn-secondary"
              >
                Bản đồ lân cận
              </Link>

            </div>

          </div>

        </div>

      </section>

      {/* STATS */}

      <section className="about-stats">

        <div className="about-container about-stats-grid">

          {STATS.map((item) => (

            <div
              className="stat-card fade-up"
              key={item.label}
            >

              <h3>
                {item.number}
              </h3>

              <p>
                {item.label}
              </p>

            </div>

          ))}

        </div>

      </section>

      {/* SECTIONS */}

      {SECTIONS.map((sec) => (

        <section
          className="about-section"
          id={sec.id}
          key={sec.id}
        >

          <div className="about-container">

            <div
              className={`about-grid ${
                sec.reverse
                  ? "reverse"
                  : ""
              }`}
            >

              {/* TEXT */}

              <div className="about-text fade-up">

                <p className="about-eye">
                  {sec.eye}
                </p>

                <h2 className="about-heading">

                  {sec.title}{" "}

                  <em>
                    {sec.accent}
                  </em>

                </h2>

                {sec.paragraphs?.map(
                  (p, i) => (

                    <p
                      className="about-paragraph"
                      key={i}
                    >
                      {p}
                    </p>

                  )
                )}

                {sec.values && (

                  <div className="value-grid">

                    {sec.values.map(
                      (v) => (

                        <div
                          className="value-card"
                          key={v.title}
                        >

                          <div className="value-icon">
                            {v.icon}
                          </div>

                          <h4>
                            {v.title}
                          </h4>

                          <p>
                            {v.desc}
                          </p>

                        </div>

                      )
                    )}

                  </div>

                )}

              </div>

              {/* IMAGE */}

              <div className="about-image fade-up">

                <img
                  src={sec.image}
                  alt={sec.title}
                  loading="lazy"
                  decoding="async"
                />

                <div className="image-glow" />

              </div>

            </div>

          </div>

        </section>

      ))}

      {/* TIMELINE */}

      <section className="timeline-section">

        <div className="about-container">

          <div className="timeline-header">

            <p className="about-eye">
              Hành trình phát triển
            </p>

            <h2 className="about-heading">

              Những cột mốc{" "}

              <em>quan trọng</em>

            </h2>

          </div>

          <div className="timeline">

            {TIMELINE.map((item) => (

              <div
                className="timeline-item fade-up"
                key={item.year}
              >

                <div className="timeline-year">
                  {item.year}
                </div>

                <div className="timeline-content">

                  <h4>
                    {item.title}
                  </h4>

                  <p>
                    {item.desc}
                  </p>

                </div>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* TECH */}

      <section className="tech-section">

        <div className="about-container">

          <div className="tech-header">

            <p className="about-eye">
              Công nghệ
            </p>

            <h2 className="about-heading">

              Được xây dựng trên
              <br />

              <em>nền tảng hiện đại</em>

            </h2>

          </div>

          <div className="tech-grid">

            {TECH.map((t) => (

              <div
                className="tech-card fade-up"
                key={t.name}
              >

                <div className="tech-icon">
                  {t.icon}
                </div>

                <h3>
                  {t.name}
                </h3>

                <p>
                  {t.desc}
                </p>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* CTA */}

      <section className="about-cta">

        <div className="about-container">

          <div className="about-cta-box fade-up">

            <p className="about-eye">
              Sẵn sàng chưa?
            </p>

            <h2>

              Khám phá bất động sản
              <br />

              <em>ngay hôm nay</em>

            </h2>

            <p>

              Hàng nghìn bất động sản
              đang chờ bạn khám phá
              trên hệ thống WebGIS.

            </p>

            <div className="about-cta-actions">

              <Link
                to="/properties"
                className="btn-primary"
              >
                Khám phá →
              </Link>

              <Link
                to="/register"
                className="btn-secondary"
              >
                Đăng ký
              </Link>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}