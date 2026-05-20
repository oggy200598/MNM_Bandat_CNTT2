import { useEffect, useState } from "react";
import { api, formatPrice } from "../api";
import "../App.css";

function statusLabel(status){
  const map={
    featured:"Nổi bật",
    hot:"Hot",
    new:"Mới",
    active:"Đang bán",
  };
  return map[status]||"Đang bán";
}

function typeLabel(type){
  const map={
    apartment:"Căn hộ",
    house:"Nhà ở",
    villa:"Biệt thự",
    land:"Đất nền",
    office:"Văn phòng",
  };
  return map[type]||type;
}

function initials(name){
  if(!name)return"??";

  return name
    .split(" ")
    .slice(-2)
    .map((w)=>w[0])
    .join("")
    .toUpperCase();
}

function PropertyCard({p,big=false}){

  const statusBadge=statusLabel(p.listing_status);
  const typeBadge=typeLabel(p.property_type);

  const isHot=[
    "featured",
    "hot",
    "new",
  ].includes(p.listing_status);

  return(
    <a
      className={`prop-card ${big?"prop-card-big":""} fade-up`}
      href={`/property-detail/${p.id}`}
    >

      <div className="prop-thumb">

        <img
          className="prop-thumb-img"
          src={
            p.image||
            p.image_url||
            "https://via.placeholder.com/600x400"
          }
          alt={p.title}
          loading="lazy"
        />

        <div className="prop-overlay"/>

        <div className="prop-badges">

          {isHot&&(
            <span className="badge badge-status">
              {statusBadge}
            </span>
          )}

          <span className="badge badge-type">
            {typeBadge}
          </span>

        </div>

        <button
          className="prop-fav"
          onClick={(e)=>e.preventDefault()}
        >
          ♡
        </button>

      </div>

      <div className="prop-body">

        <div className="prop-price">
          {formatPrice(p.price)}
        </div>

        <div className="prop-name">
          {p.title}
        </div>

        <div className="prop-loc">

          <span className="prop-loc-dot"/>

          {p.address}

        </div>

        <div className="prop-meta">

          <div className="meta-item">

            <div className="meta-val">
              {p.area}
            </div>

            <div className="meta-lbl">
              m²
            </div>

          </div>

          {p.bedrooms&&(
            <div className="meta-item">

              <div className="meta-val">
                {p.bedrooms}
              </div>

              <div className="meta-lbl">
                P.Ngủ
              </div>

            </div>
          )}

          {p.bathrooms&&(
            <div className="meta-item">

              <div className="meta-val">
                {p.bathrooms}
              </div>

              <div className="meta-lbl">
                WC
              </div>

            </div>
          )}

        </div>

        {p.agent&&big&&(

          <div className="prop-agent">

            <div className="agent-av">
              {initials(p.agent.name)}
            </div>

            <div className="agent-name">

              <strong>
                {p.agent.name}
              </strong>

              {p.agent.title}

            </div>

          </div>

        )}

      </div>

    </a>
  );
}

export default function Home(){

  const[properties,setProperties]=useState([]);
  const[loading,setLoading]=useState(true);

  const[stats,setStats]=useState({
    property_total:0,
    agent_total:0,
    lead_total:0,
    satisfaction:0,
  });

  useEffect(()=>{

    api.properties({
      limit:6,
      featured:true,
    })

    .then((items)=>{
      if(Array.isArray(items)){
        setProperties(items);
      }
    })

    .catch(console.error)

    .finally(()=>{
      setLoading(false);
    });

    api.dashboard()

    .then((data)=>{
      if(data){
        setStats((prev)=>({
          ...prev,
          ...data,
        }));
      }
    })

    .catch(console.error);

  },[]);

  if(loading){
    return(
      <div className="loading-page">
        Đang tải dữ liệu...
      </div>
    );
  }

  const bigCard=properties[0];
  const restCards=properties.slice(1);
  const topRight=restCards.slice(0,2);
  const bottomRow=restCards.slice(2,5);

  return(
    <div className="home-page">

      <section className="hero">

        <div className="hero-bg">

          <div className="hero-img"/>

          <div className="hero-vignette"/>

        </div>

        <div className="hero-content">

          <div className="hero-tag">
            ✦ Nền tảng bất động sản hàng đầu
          </div>

          <h1 className="hero-h1">

            Khám phá bất động sản
            <br/>

            <em>đẳng cấp</em>

            {" "}tại TP.HCM

          </h1>

          <p className="hero-sub">

            Khám phá hơn{" "}

            {stats.property_total.toLocaleString("vi-VN")}

            {" "}bất động sản đa dạng.

          </p>

          <div className="hero-search-wrap">

            <form
              className="hero-search"
              onSubmit={(e)=>e.preventDefault()}
            >

              <input
                type="text"
                placeholder="Tìm kiếm..."
              />

              <button
                className="btn-search"
                type="submit"
              >
                Tìm kiếm
              </button>

            </form>

          </div>

          <div className="hero-stats">

            <div className="hstat">

              <div className="hstat-num">

                {stats.property_total}

                <span>+</span>

              </div>

              <div className="hstat-lbl">
                Bất động sản
              </div>

            </div>

            <div className="hstat">

              <div className="hstat-num">

                {stats.agent_total}

                <span>+</span>

              </div>

              <div className="hstat-lbl">
                Môi giới
              </div>

            </div>

            <div className="hstat">

              <div className="hstat-num">

                {stats.satisfaction}

                <span>%</span>

              </div>

              <div className="hstat-lbl">
                Hài lòng
              </div>

            </div>

          </div>

        </div>

      </section>

      <section className="section listings-section">

        <div className="container">

          <div className="section-row">

            <div>

              <p className="section-eye">
                Nổi bật
              </p>

              <h2 className="section-h">

                Tin đăng{" "}

                <em>chọn lọc</em>

              </h2>

            </div>

          </div>

          {properties.length===0&&(
            <div className="empty-state">
              Chưa có bất động sản nào.
            </div>
          )}

          <div className="prop-grid-featured">

            {bigCard&&(
              <PropertyCard
                p={bigCard}
                big
              />
            )}

            <div className="prop-grid-side">

              {topRight.map((p)=>(
                <PropertyCard
                  key={p.id}
                  p={p}
                />
              ))}

            </div>

          </div>

          <div className="prop-grid">

            {bottomRow.map((p)=>(
              <PropertyCard
                key={p.id}
                p={p}
              />
            ))}

          </div>

        </div>

      </section>

      <section className="section feat-section">

        <div className="container">

          <div className="section-row">

            <div>

              <p className="section-eye">
                Lợi thế
              </p>

              <h2 className="section-h">

                Trải nghiệm bất động sản
                <br/>

                <em>hiện đại</em>

              </h2>

            </div>

          </div>

          <div className="feat-grid">

            <div className="feat-cell">

              <div className="feat-icon-wrap">
                🗺️
              </div>

              <h4>
                Bản đồ thông minh
              </h4>

              <p>
                Khám phá bất động sản trực tiếp trên GIS.
              </p>

            </div>

            <div className="feat-cell">

              <div className="feat-icon-wrap">
                ⚡
              </div>

              <h4>
                Gợi ý nhanh
              </h4>

              <p>
                Đề xuất bất động sản phù hợp nhu cầu.
              </p>

            </div>

            <div className="feat-cell">

              <div className="feat-icon-wrap">
                🏆
              </div>

              <h4>
                Môi giới uy tín
              </h4>

              <p>
                Đội ngũ verified chuyên nghiệp.
              </p>

            </div>

          </div>

        </div>

      </section>

      <section className="value-section">

        <div className="container">

          <div className="value-grid">

            <div className="value-left">

              <p className="section-eye">
                Thống kê
              </p>

              <h2 className="section-h">

                Dữ liệu bất động sản
                <br/>

                <em>thời gian thực</em>

              </h2>

            </div>

            <div className="value-right">

              <div className="vstat-card accent">

                <div className="vstat-num">
                  {stats.property_total}+
                </div>

                <div className="vstat-lbl">
                  Bất động sản
                </div>

              </div>

              <div className="vstat-card">

                <div className="vstat-num">
                  {stats.agent_total}+
                </div>

                <div className="vstat-lbl">
                  Môi giới
                </div>

              </div>

              <div className="vstat-card">

                <div className="vstat-num">
                  {stats.satisfaction}%
                </div>

                <div className="vstat-lbl">
                  Hài lòng
                </div>

              </div>

              <div className="vstat-card accent">

                <div className="vstat-num">
                  24/7
                </div>

                <div className="vstat-lbl">
                  Hỗ trợ
                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      <section className="map-section">

        <div className="container">

          <div className="map-wrap">

            <div className="map-left">

              <p className="section-eye">
                GIS MAP
              </p>

              <h2 className="section-h">

                Khám phá vị trí
                <br/>

                <em>trực quan</em>

              </h2>

            </div>

            <div className="map-frame-wrap">

              <iframe
                src="https://maps.google.com/maps?q=ho%20chi%20minh&t=&z=11&ie=UTF8&iwloc=&output=embed"
                loading="lazy"
                title="map"
              />

              <div className="map-frame-overlay"/>

            </div>

          </div>

        </div>

      </section>

      <section className="section testi-section">

        <div className="container">

          <div className="section-row">

            <div>

              <p className="section-eye">
                Đánh giá
              </p>

              <h2 className="section-h">

                Khách hàng nói gì
                <br/>

                về <em>GeoEstate</em>

              </h2>

            </div>

          </div>

          <div className="testi-grid">

            <div className="testi-card">

              <div className="testi-stars">
                ★★★★★
              </div>

              <p className="testi-text">
                “Giao diện cực kỳ hiện đại.”
              </p>

            </div>

            <div className="testi-card">

              <div className="testi-stars">
                ★★★★★
              </div>

              <p className="testi-text">
                “GIS map rất hữu ích.”
              </p>

            </div>

            <div className="testi-card">

              <div className="testi-stars">
                ★★★★★
              </div>

              <p className="testi-text">
                “Premium hơn hẳn web khác.”
              </p>

            </div>

          </div>

        </div>

      </section>

      <section className="final-cta">

        <div className="container">

          <div className="final-cta-inner">

            <p className="section-eye">
              Bắt đầu ngay
            </p>

            <h2>

              Sẵn sàng tìm
              <br/>

              <em>căn nhà mơ ước?</em>

            </h2>

            <div className="final-actions">

              <a
                href="/properties"
                className="btn-primary"
              >
                Khám phá ngay
              </a>

              <a
                href="/lead-form"
                className="btn-secondary"
              >
                Liên hệ tư vấn
              </a>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}
