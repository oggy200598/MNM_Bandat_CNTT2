import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api";
import "../App.css";

const FALLBACK_CONTENT = {
  hero: {
    eye: "Về GeoEstate",
    title: "Nền tảng bất động sản",
    emphasis: "thế hệ mới",
    subtitle:
      "Kết hợp dữ liệu không gian, WebGIS và trải nghiệm hiện đại để giúp bạn khám phá bất động sản trực quan hơn bao giờ hết.",
  },
  stats: [
    { number: "2,450+", label: "Bất động sản" },
    { number: "120+", label: "Môi giới" },
    { number: "15K+", label: "Khách tiềm năng" },
    { number: "98%", label: "Hài lòng" },
  ],
  sections: [
    {
      id: "intro",
      eye: "Lời mở đầu",
      title: "Câu chuyện của",
      accent: "GeoEstate",
      image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1200&auto=format&fit=crop",
      paragraphs: [
        "Trong thời đại số hóa, việc tìm kiếm bất động sản không còn dừng lại ở những dòng tin đăng đơn giản. Người dùng cần dữ liệu trực quan, minh bạch và có thể khám phá toàn bộ khu vực xung quanh chỉ với vài cú nhấp chuột.",
        "GeoEstate được xây dựng để giải quyết điều đó — kết hợp WebGIS, bản đồ không gian và dữ liệu bất động sản trong một nền tảng hiện đại.",
      ],
    },
    {
      id: "mission",
      eye: "Sứ mệnh",
      title: "Mang trải nghiệm",
      accent: "thông minh",
      reverse: true,
      image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200&auto=format&fit=crop",
      paragraphs: [
        "Chúng tôi giúp khách hàng tìm kiếm bất động sản bằng dữ liệu thực tế thay vì cảm tính. Từ khoảng cách đến trường học, bệnh viện, trung tâm thương mại cho tới tiềm năng khu vực đều được hiển thị trực tiếp trên bản đồ.",
        "GeoEstate hướng tới một thị trường minh bạch hơn, nơi mọi thông tin đều rõ ràng và dễ tiếp cận.",
      ],
    },
    {
      id: "values",
      eye: "Giá trị cốt lõi",
      title: "Điều làm nên",
      accent: "khác biệt",
      image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=1200&auto=format&fit=crop",
      values: [
        { icon: "🗺️", title: "WebGIS trực quan", desc: "Hiển thị bất động sản trực tiếp trên bản đồ tương tác." },
        { icon: "📍", title: "Dữ liệu không gian", desc: "Phân tích khoảng cách và tiện ích lân cận chính xác." },
        { icon: "⚡", title: "Hiệu năng hiện đại", desc: "Frontend React + Backend Django + PostGIS." },
        { icon: "🔒", title: "Minh bạch", desc: "Thông tin kiểm duyệt rõ ràng và đáng tin cậy." },
      ],
    },
  ],
  timeline: [
    { year: "2024", title: "Khởi tạo dự án", desc: "Xây dựng nền tảng bất động sản tích hợp GIS." },
    { year: "2025", title: "Ra mắt hệ thống WebGIS", desc: "Triển khai bản đồ tương tác và tìm kiếm bán kính." },
    { year: "2026", title: "Mở rộng CRM", desc: "Quản lý môi giới, leads và lịch hẹn." },
  ],
  tech: [
    { icon: "🗄️", name: "PostGIS", desc: "Cơ sở dữ liệu không gian" },
    { icon: "🐍", name: "Django", desc: "Backend framework" },
    { icon: "⚛️", name: "React", desc: "Frontend hiện đại" },
    { icon: "🗺️", name: "Leaflet", desc: "Bản đồ tương tác" },
  ],
  cta: {
    eye: "Sẵn sàng chưa?",
    title: "Khám phá bất động sản",
    emphasis: "ngay hôm nay",
    desc: "Hàng nghìn bất động sản đang chờ bạn khám phá trên hệ thống WebGIS.",
  },
};

function splitLines(value) {
  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function statsToText(stats = []) {
  return stats.map((item) => `${item.number}|${item.label}`).join("\n");
}

function textToStats(value) {
  return splitLines(value).map((line) => {
    const [number = "", label = ""] = line.split("|");
    return { number: number.trim(), label: label.trim() };
  });
}

function itemsToText(items = [], fields = []) {
  return items
    .map((item) => fields.map((field) => item?.[field] || "").join("|"))
    .join("\n");
}

function textToItems(value, fields = []) {
  return splitLines(value).map((line) => {
    const parts = line.split("|");
    return fields.reduce((acc, field, index) => {
      acc[field] = (parts[index] || "").trim();
      return acc;
    }, {});
  });
}

function normalizeSections(sections = []) {
  return sections.map((section, index) => ({
    ...section,
    id: section.id || `section-${index + 1}`,
    paragraphs: Array.isArray(section.paragraphs) ? section.paragraphs : [],
    values: Array.isArray(section.values) ? section.values : [],
    reverse: Boolean(section.reverse),
  }));
}

export default function About() {
  const [content, setContent] = useState(FALLBACK_CONTENT);
  const [draft, setDraft] = useState(FALLBACK_CONTENT);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    document.title = "Giới thiệu | GeoEstate";
  }, []);

  useEffect(() => {
    let active = true;

    async function loadContent() {
      const result = await api.aboutContent();
      if (!active) return;
      const nextContent = result || FALLBACK_CONTENT;
      setContent(nextContent);
      setDraft(nextContent);
      setLoading(false);
    }

    loadContent();

    return () => {
      active = false;
    };
  }, []);

  const sections = useMemo(
    () => normalizeSections(content.sections || []),
    [content.sections]
  );

  function updateDraft(path, value) {
    setDraft((prev) => {
      const next = structuredClone(prev);
      let current = next;
      for (let index = 0; index < path.length - 1; index += 1) {
        current = current[path[index]];
      }
      current[path[path.length - 1]] = value;
      return next;
    });
  }

  function updateSection(index, field, value) {
    const nextSections = normalizeSections(draft.sections || []);
    nextSections[index] = {
      ...nextSections[index],
      [field]: value,
    };
    setDraft((prev) => ({
      ...prev,
      sections: nextSections,
    }));
  }

  async function saveAbout(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const payload = {
      ...draft,
      stats: textToStats(statsToText(draft.stats || [])),
      timeline: textToItems(itemsToText(draft.timeline || [], ["year", "title", "desc"]), ["year", "title", "desc"]),
      tech: textToItems(itemsToText(draft.tech || [], ["icon", "name", "desc"]), ["icon", "name", "desc"]),
      sections: normalizeSections(draft.sections || []).map((section) => ({
        ...section,
        paragraphs: splitLines((section.paragraphs || []).join("\n")),
        values: textToItems(itemsToText(section.values || [], ["icon", "title", "desc"]), ["icon", "title", "desc"]),
      })),
    };

    const result = await api.updateAboutContent(payload);
    setSaving(false);

    if (result?.hero) {
      setContent(result);
      setDraft(result);
      setEditing(false);
      setMessage("Đã cập nhật trang giới thiệu.");
      return;
    }

    setMessage("Không lưu được nội dung lúc này.");
  }

  return (
    <div className="about-page">
      {isAdmin && (
        <section className="about-admin-bar">
          <div className="about-container about-admin-bar-inner">
            <div>
              <strong>Chỉnh sửa trang Giới thiệu</strong>
              <p className="muted-line">Admin có thể cập nhật trực tiếp nội dung hiển thị trên web.</p>
            </div>
            <div className="about-admin-actions">
              <button type="button" className="btn-geo-secondary" onClick={() => { setEditing((prev) => !prev); setDraft(content); }}>
                {editing ? "Đóng chỉnh sửa" : "Chỉnh sửa nội dung"}
              </button>
            </div>
          </div>
        </section>
      )}

      {isAdmin && editing && (
        <section className="about-admin-editor">
          <div className="about-container">
            <form className="extra-card about-admin-form" onSubmit={saveAbout}>
              <div className="about-admin-grid">
                <label className="extra-field">
                  <span>Hero eyebrow</span>
                  <input value={draft.hero?.eye || ""} onChange={(e) => updateDraft(["hero", "eye"], e.target.value)} />
                </label>
                <label className="extra-field">
                  <span>Hero title</span>
                  <input value={draft.hero?.title || ""} onChange={(e) => updateDraft(["hero", "title"], e.target.value)} />
                </label>
                <label className="extra-field">
                  <span>Hero emphasis</span>
                  <input value={draft.hero?.emphasis || ""} onChange={(e) => updateDraft(["hero", "emphasis"], e.target.value)} />
                </label>
                <label className="extra-field full-span">
                  <span>Hero subtitle</span>
                  <textarea rows="3" value={draft.hero?.subtitle || ""} onChange={(e) => updateDraft(["hero", "subtitle"], e.target.value)} />
                </label>
                <label className="extra-field full-span">
                  <span>Stats (`number|label`, mỗi dòng 1 mục)</span>
                  <textarea
                    rows="4"
                    value={statsToText(draft.stats || [])}
                    onChange={(e) => updateDraft(["stats"], textToStats(e.target.value))}
                  />
                </label>
                <label className="extra-field full-span">
                  <span>Timeline (`year|title|desc`)</span>
                  <textarea
                    rows="4"
                    value={itemsToText(draft.timeline || [], ["year", "title", "desc"])}
                    onChange={(e) => updateDraft(["timeline"], textToItems(e.target.value, ["year", "title", "desc"]))}
                  />
                </label>
                <label className="extra-field full-span">
                  <span>Tech (`icon|name|desc`)</span>
                  <textarea
                    rows="4"
                    value={itemsToText(draft.tech || [], ["icon", "name", "desc"])}
                    onChange={(e) => updateDraft(["tech"], textToItems(e.target.value, ["icon", "name", "desc"]))}
                  />
                </label>
                <label className="extra-field">
                  <span>CTA eyebrow</span>
                  <input value={draft.cta?.eye || ""} onChange={(e) => updateDraft(["cta", "eye"], e.target.value)} />
                </label>
                <label className="extra-field">
                  <span>CTA title</span>
                  <input value={draft.cta?.title || ""} onChange={(e) => updateDraft(["cta", "title"], e.target.value)} />
                </label>
                <label className="extra-field">
                  <span>CTA emphasis</span>
                  <input value={draft.cta?.emphasis || ""} onChange={(e) => updateDraft(["cta", "emphasis"], e.target.value)} />
                </label>
                <label className="extra-field full-span">
                  <span>CTA description</span>
                  <textarea rows="3" value={draft.cta?.desc || ""} onChange={(e) => updateDraft(["cta", "desc"], e.target.value)} />
                </label>
              </div>

              <div className="about-admin-sections">
                {normalizeSections(draft.sections || []).map((section, index) => (
                  <div className="about-admin-section-card" key={section.id}>
                    <div className="about-admin-section-head">
                      <strong>Khối nội dung {index + 1}</strong>
                      <label className="filter-check-row">
                        <input
                          type="checkbox"
                          checked={Boolean(section.reverse)}
                          onChange={(e) => updateSection(index, "reverse", e.target.checked)}
                        />
                        <span>Đảo layout</span>
                      </label>
                    </div>
                    <div className="about-admin-grid">
                      <label className="extra-field">
                        <span>Eyebrow</span>
                        <input value={section.eye || ""} onChange={(e) => updateSection(index, "eye", e.target.value)} />
                      </label>
                      <label className="extra-field">
                        <span>Title</span>
                        <input value={section.title || ""} onChange={(e) => updateSection(index, "title", e.target.value)} />
                      </label>
                      <label className="extra-field">
                        <span>Accent</span>
                        <input value={section.accent || ""} onChange={(e) => updateSection(index, "accent", e.target.value)} />
                      </label>
                      <label className="extra-field full-span">
                        <span>Image URL</span>
                        <input value={section.image || ""} onChange={(e) => updateSection(index, "image", e.target.value)} />
                      </label>
                      <label className="extra-field full-span">
                        <span>Paragraphs (mỗi dòng 1 đoạn)</span>
                        <textarea
                          rows="4"
                          value={(section.paragraphs || []).join("\n")}
                          onChange={(e) => updateSection(index, "paragraphs", splitLines(e.target.value))}
                        />
                      </label>
                      <label className="extra-field full-span">
                        <span>Values (`icon|title|desc`)</span>
                        <textarea
                          rows="4"
                          value={itemsToText(section.values || [], ["icon", "title", "desc"])}
                          onChange={(e) => updateSection(index, "values", textToItems(e.target.value, ["icon", "title", "desc"]))}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="about-admin-submit">
                <button type="submit" className="btn-geo-primary" disabled={saving}>
                  {saving ? "Đang lưu..." : "Lưu trang giới thiệu"}
                </button>
                {message && <p className="muted-line">{message}</p>}
              </div>
            </form>
          </div>
        </section>
      )}

      {loading && <div className="about-container"><div className="extra-card">Đang tải nội dung giới thiệu...</div></div>}

      {!loading && (
        <>
          <section className="about-hero">
            <div className="about-hero-overlay" />
            <div className="about-container">
              <div className="about-hero-content fade-up">
                <p className="about-eye">{content.hero?.eye}</p>
                <h1 className="about-title">
                  {content.hero?.title}
                  <br />
                  <em>{content.hero?.emphasis}</em>
                </h1>
                <p className="about-subtitle">{content.hero?.subtitle}</p>
                <div className="about-hero-actions">
                  <Link to="/properties" className="btn-primary">Khám phá ngay →</Link>
                  <Link to="/nearby" className="btn-secondary">Bản đồ lân cận</Link>
                </div>
              </div>
            </div>
          </section>

          <section className="about-stats">
            <div className="about-container about-stats-grid">
              {(content.stats || []).map((item) => (
                <div className="stat-card fade-up" key={`${item.label}-${item.number}`}>
                  <h3>{item.number}</h3>
                  <p>{item.label}</p>
                </div>
              ))}
            </div>
          </section>

          {sections.map((section) => (
            <section className="about-section" id={section.id} key={section.id}>
              <div className="about-container">
                <div className={`about-grid ${section.reverse ? "reverse" : ""}`}>
                  <div className="about-text fade-up">
                    <p className="about-eye">{section.eye}</p>
                    <h2 className="about-heading">
                      {section.title} <em>{section.accent}</em>
                    </h2>

                    {(section.paragraphs || []).map((paragraph, index) => (
                      <p className="about-paragraph" key={`${section.id}-paragraph-${index}`}>
                        {paragraph}
                      </p>
                    ))}

                    {!!section.values?.length && (
                      <div className="value-grid">
                        {section.values.map((item) => (
                          <div className="value-card" key={`${section.id}-${item.title}`}>
                            <div className="value-icon">{item.icon}</div>
                            <h4>{item.title}</h4>
                            <p>{item.desc}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="about-image fade-up">
                    <img src={section.image} alt={section.title} loading="lazy" decoding="async" />
                    <div className="image-glow" />
                  </div>
                </div>
              </div>
            </section>
          ))}

          <section className="timeline-section">
            <div className="about-container">
              <div className="timeline-header">
                <p className="about-eye">Hành trình phát triển</p>
                <h2 className="about-heading">Những cột mốc <em>quan trọng</em></h2>
              </div>

              <div className="timeline">
                {(content.timeline || []).map((item) => (
                  <div className="timeline-item fade-up" key={`${item.year}-${item.title}`}>
                    <div className="timeline-year">{item.year}</div>
                    <div className="timeline-content">
                      <h4>{item.title}</h4>
                      <p>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="tech-section">
            <div className="about-container">
              <div className="tech-header">
                <p className="about-eye">Công nghệ</p>
                <h2 className="about-heading">Được xây dựng trên<br /><em>nền tảng hiện đại</em></h2>
              </div>

              <div className="tech-grid">
                {(content.tech || []).map((item) => (
                  <div className="tech-card fade-up" key={item.name}>
                    <div className="tech-icon">{item.icon}</div>
                    <h3>{item.name}</h3>
                    <p>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="about-cta">
            <div className="about-container">
              <div className="about-cta-box fade-up">
                <p className="about-eye">{content.cta?.eye}</p>
                <h2>
                  {content.cta?.title}
                  <br />
                  <em>{content.cta?.emphasis}</em>
                </h2>
                <p>{content.cta?.desc}</p>
                <div className="about-cta-actions">
                  <Link to="/properties" className="btn-primary">Khám phá →</Link>
                  <Link to="/register" className="btn-secondary">Đăng ký</Link>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
