import {
  normalizeProperty
} from "../../api";

import usePropertyDetail
  from "../../hooks/usePropertyDetail";

export default function PropertyDetailPage() {
  const property =
    usePropertyDetail();

  const p =
    normalizeProperty(property);

  return (
    <div className="extra-page">
      <h1>{p.title}</h1>
    </div>
  );
}