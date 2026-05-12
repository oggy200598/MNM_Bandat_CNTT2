const MEDIA_BASE = process.env.MEDIA_BASE_URL || 'http://127.0.0.1:5000/media/';

function toMediaUrl(value) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (String(value).startsWith('/')) return `${MEDIA_BASE.replace(/\/$/, '')}${value}`;
  return `${MEDIA_BASE}${value}`;
}

function propertySelect() {
  return `
    p.id,
    p.title,
    p.description,
    p.property_type,
    p.listing_status,
    p.price,
    p.area,
    p.address,
    NULL::double precision AS lat,
    NULL::double precision AS lng,
    p.is_featured,
    p.created_at,
    p.updated_at,
    p.agent_id,
    a.name AS agent_name,
    a.phone AS agent_phone,
    a.email AS agent_email,
    (
      SELECT image
      FROM properties_propertyimage img
      WHERE img.property_id = p.id
      ORDER BY img.is_primary DESC, img.sort_order ASC, img.id ASC
      LIMIT 1
    ) AS image
  `;
}

function mapProperty(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.property_type,
    property_type: row.property_type,
    status: row.listing_status,
    listing_status: row.listing_status,
    price: row.price === null ? null : Number(row.price),
    area: row.area === null ? null : Number(row.area),
    address: row.address,
    is_featured: row.is_featured,
    created_at: row.created_at,
    updated_at: row.updated_at,
    lat: row.lat === null || row.lat === undefined ? null : Number(row.lat),
    lng: row.lng === null || row.lng === undefined ? null : Number(row.lng),
    image: toMediaUrl(row.image),
    agent: row.agent_id ? {
      id: row.agent_id,
      name: row.agent_name,
      phone: row.agent_phone,
      email: row.agent_email,
    } : null,
  };
}

function mapAmenity(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.amenity_type,
    amenity_type: row.amenity_type,
    lat: row.lat === null || row.lat === undefined ? null : Number(row.lat),
    lng: row.lng === null || row.lng === undefined ? null : Number(row.lng),
    distance_km: row.distance_km === null || row.distance_km === undefined ? null : Number(row.distance_km),
    created_at: row.created_at,
  };
}

module.exports = {
  MEDIA_BASE,
  toMediaUrl,
  propertySelect,
  mapProperty,
  mapAmenity,
};
