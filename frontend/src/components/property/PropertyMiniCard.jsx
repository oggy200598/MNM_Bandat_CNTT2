import {
  normalizeProperty
} from "../../api";

export default function PropertyMiniCard({
  p
}) {
  const item = normalizeProperty(p);

  return (
    <article className="mini-property-card">
      <div
        className="mini-media"
        style={{
          backgroundImage: `url(${item.imageUrl})`
        }}
      >
        <span>{item.typeText}</span>
      </div>

      <div className="mini-content">
        <h3>{p.title}</h3>

        <p>{p.address}</p>

        <div className="mini-meta">
          <span>{p.area} m²</span>

          <strong>
            {item.priceText}
          </strong>
        </div>

        <div className="mini-actions">
          <a
            href={`/property-detail?id=${p.id}`}
            className="btn-geo-primary"
          >
            Xem chi tiết
          </a>

          <a
            href="/compare"
            className="btn-geo-secondary"
          >
            So sánh
          </a>
        </div>
      </div>
    </article>
  );
}