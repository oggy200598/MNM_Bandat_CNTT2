const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const { propertySelect, mapProperty, mapAmenity, toMediaUrl } = require('../utils/property-mappers');
const authStore = require('./auth-store');
const collectionsStore = require('./collections-store');

const DEFAULT_LAT = 10.7769;
const DEFAULT_LNG = 106.7009;

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function clampLimit(value, max = 100) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return Math.min(50, max);
  return Math.min(Math.floor(n), max);
}

function resolveCollectionKey(token) {
  const user = authStore.verifyToken(token);
  return user ? `user:${user.id}` : 'guest';
}

async function listPropertiesByIds(ids) {
  const uniqueIds = [...new Set((ids || []).map((item) => Number(item)).filter((item) => Number.isFinite(item)))];
  if (!uniqueIds.length) return [];

  const result = await pool.query(
    `SELECT ${propertySelect()}
     FROM properties_property p
     LEFT JOIN accounts_agent a ON a.id = p.agent_id
     WHERE p.id = ANY($1::int[])`,
    [uniqueIds]
  );

  const ordered = result.rows.map(mapProperty);
  const order = new Map(uniqueIds.map((id, index) => [id, index]));
  return ordered.sort((left, right) => (order.get(left.id) ?? 0) - (order.get(right.id) ?? 0));
}

function ensureMediaDir() {
  const dir = path.join(__dirname, '..', '..', '..', 'media', 'properties');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function safeFilename(name) {
  return String(name || 'upload').replace(/[^a-zA-Z0-9._-]+/g, '_');
}

function saveBase64File(payload, fallbackName = 'upload') {
  const file = payload.file || payload.imageFile || payload.upload;
  if (!file) return null;
  if (typeof file === 'string' && file.startsWith('data:')) {
    const match = file.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error('invalid data url');
    const mime = match[1];
    const base64 = match[2];
    const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : mime === 'image/jpeg' || mime === 'image/jpg' ? 'jpg' : 'bin';
    const fileName = `${Date.now()}_${safeFilename(fallbackName)}.${ext}`;
    const dir = ensureMediaDir();
    const target = path.join(dir, fileName);
    fs.writeFileSync(target, Buffer.from(base64, 'base64'));
    return `properties/${fileName}`;
  }
  return String(file);
}

function normalizeOrder(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

function parseBbox(value) {
  if (!value) return null;
  const parts = String(value).split(',').map((item) => toNumber(item.trim()));
  if (parts.length !== 4 || parts.some((item) => item === null)) return null;
  return parts;
}

function pointSql(lngParam, latParam) {
  return `ST_SetSRID(ST_MakePoint(${lngParam}, ${latParam}), 4326)::geography`;
}

function buildPropertyFilters(query, values, alias = 'p') {
  const where = [];
  const q = query.q || query.keyword;
  const bbox = parseBbox(query.bbox);

  if (q) {
    values.push(`%${q}%`);
    where.push(`(${alias}.title ILIKE $${values.length} OR ${alias}.address ILIKE $${values.length} OR ${alias}.description ILIKE $${values.length})`);
  }
  if (query.type) {
    values.push(query.type);
    where.push(`${alias}.property_type = $${values.length}`);
  }
  if (query.status) {
    values.push(query.status);
    where.push(`${alias}.listing_status = $${values.length}`);
  }
  if (query.priceMin) {
    values.push(query.priceMin);
    where.push(`${alias}.price >= $${values.length}`);
  }
  if (query.priceMax) {
    values.push(query.priceMax);
    where.push(`${alias}.price <= $${values.length}`);
  }
  if (query.areaMin) {
    values.push(query.areaMin);
    where.push(`${alias}.area >= $${values.length}`);
  }
  if (query.areaMax) {
    values.push(query.areaMax);
    where.push(`${alias}.area <= $${values.length}`);
  }
  if (query.featured === 'true') {
    where.push(`${alias}.is_featured = true`);
  }
  // PostGIS is optional in this Node port. If the local extension is not installed,
  // ignore bbox filters instead of breaking the whole API.

  return where;
}

async function listProperties(query = {}) {
  const values = [];
  const where = buildPropertyFilters(query, values);
  const limit = clampLimit(query.limit, 200);
  values.push(limit);

  const sortMap = {
    newest: 'p.created_at DESC',
    price_asc: 'p.price ASC NULLS LAST, p.created_at DESC',
    price_desc: 'p.price DESC NULLS LAST, p.created_at DESC',
    area_asc: 'p.area ASC NULLS LAST, p.created_at DESC',
    area_desc: 'p.area DESC NULLS LAST, p.created_at DESC',
  };
  const sort = sortMap[query.sort] || 'p.is_featured DESC, p.created_at DESC';

  const result = await pool.query(
    `SELECT ${propertySelect()}
     FROM properties_property p
     LEFT JOIN accounts_agent a ON a.id = p.agent_id
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY ${sort}
     LIMIT $${values.length}`,
    values
  );

  return result.rows.map(mapProperty);
}

async function listMapData(query = {}) {
  const items = await listProperties({ ...query, limit: query.limit || 250 });
  return {
    center: {
      lat: toNumber(query.lat) || DEFAULT_LAT,
      lng: toNumber(query.lng) || DEFAULT_LNG,
    },
    items,
  };
}

async function getPropertyById(id) {
  const result = await pool.query(
    `SELECT ${propertySelect()}
     FROM properties_property p
     LEFT JOIN accounts_agent a ON a.id = p.agent_id
     WHERE p.id = $1`,
    [id]
  );
  if (!result.rows[0]) return null;

  const row = result.rows[0];
  const property = mapProperty(row);

  const images = await listPropertyImages(id);

  const amenities = await pool.query(
    `SELECT a.id,
            a.name,
            a.amenity_type,
            ST_Y(a.location::geometry) AS lat,
            ST_X(a.location::geometry) AS lng,
            ST_Distance(a.location, p.location) / 1000.0 AS distance_km,
            a.created_at
     FROM properties_property_amenities pa
     JOIN properties_amenity a ON a.id = pa.amenity_id
     JOIN properties_property p ON p.id = pa.property_id
     WHERE pa.property_id = $1
     ORDER BY a.name ASC`,
    [id]
  );

  let similarProperties = [];
  let nearbyAmenities = [];
  let locationScore = 50;

  if (property.lat !== null && property.lng !== null) {
    const similar = await pool.query(
      `SELECT ${propertySelect()},
              ROUND((ST_Distance(p.location, ${pointSql('$1', '$2')}) / 1000.0)::numeric, 2) AS distance_km
       FROM properties_property p
       LEFT JOIN accounts_agent a ON a.id = p.agent_id
       WHERE p.id <> $3 AND p.property_type = $4 AND p.listing_status <> 'hidden'
       ORDER BY ST_Distance(p.location, ${pointSql('$1', '$2')}) ASC, p.is_featured DESC, p.created_at DESC
       LIMIT 6`,
      [property.lng, property.lat, id, row.property_type]
    );
    similarProperties = similar.rows.map((item) => ({ ...mapProperty(item), distance_km: item.distance_km === null ? null : Number(item.distance_km) }));

    const nearbyAmenitiesResult = await pool.query(
      `SELECT a.id,
              a.name,
              a.amenity_type,
              ST_Y(a.location::geometry) AS lat,
              ST_X(a.location::geometry) AS lng,
              ROUND((ST_Distance(a.location, ${pointSql('$1', '$2')}) / 1000.0)::numeric, 2) AS distance_km,
              a.created_at
       FROM properties_amenity a
       WHERE a.location IS NOT NULL AND ST_DWithin(a.location, ${pointSql('$1', '$2')}, 2500)
       ORDER BY ST_Distance(a.location, ${pointSql('$1', '$2')}) ASC
       LIMIT 12`,
      [property.lng, property.lat]
    );
    nearbyAmenities = nearbyAmenitiesResult.rows.map(mapAmenity);

    const amenityCount = nearbyAmenities.length;
    locationScore = Math.min(100, Math.round(55 + amenityCount * 3 + (property.is_featured ? 8 : 0)));
  }

  return {
    ...property,
    images,
    amenities: amenities.rows.map(mapAmenity),
    similar_properties: similarProperties,
    nearby_amenities: nearbyAmenities,
    location_score: locationScore,
  };
}

async function listPropertyImages(propertyId) {
  const result = await pool.query(
    `SELECT id, property_id, image, caption, is_primary, sort_order, created_at
     FROM properties_propertyimage
     WHERE property_id = $1
     ORDER BY is_primary DESC, sort_order ASC, id ASC`,
    [propertyId]
  );
  return result.rows.map((row) => ({
    id: row.id,
    property_id: row.property_id,
    image: toMediaUrl(row.image),
    caption: row.caption,
    is_primary: row.is_primary,
    sort_order: row.sort_order,
    created_at: row.created_at,
  }));
}

async function createProperty(payload) {
  const {
    title,
    description = '',
    property_type = 'apartment',
    listing_status = 'pending',
    price = null,
    area = null,
    address = '',
    agent_id = null,
    is_featured = false,
    lat = null,
    lng = null,
  } = payload;

  if (!title) throw new Error('title is required');

  const result = await pool.query(
    `INSERT INTO properties_property(title, description, property_type, listing_status, price, area, address, location, agent_id, is_featured, created_at, updated_at)
     VALUES($1,$2,$3,$4,$5,$6,$7, ${pointSql('$9', '$8')}, $10, $11, NOW(), NOW())
     RETURNING *`,
    [title, description, property_type, listing_status, price, area, address, lat, lng, agent_id, is_featured]
  );
  return mapProperty(result.rows[0]);
}

async function updateProperty(id, payload) {
  const current = await pool.query(
    `SELECT *, ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
     FROM properties_property
     WHERE id = $1`,
    [id]
  );
  if (!current.rows[0]) return null;

  const row = current.rows[0];
  const next = {
    title: payload.title ?? row.title,
    description: payload.description ?? row.description,
    property_type: payload.property_type ?? row.property_type,
    listing_status: payload.listing_status ?? row.listing_status,
    price: payload.price ?? row.price,
    area: payload.area ?? row.area,
    address: payload.address ?? row.address,
    lat: payload.lat ?? row.lat,
    lng: payload.lng ?? row.lng,
    is_featured: payload.is_featured ?? row.is_featured,
  };

  const result = await pool.query(
    `UPDATE properties_property
     SET title = $1,
         description = $2,
         property_type = $3,
         listing_status = $4,
         price = $5,
         area = $6,
         address = $7,
         location = ${pointSql('$9', '$8')},
         is_featured = $10,
         updated_at = NOW()
     WHERE id = $11
     RETURNING *`,
    [next.title, next.description, next.property_type, next.listing_status, next.price, next.area, next.address, next.lat, next.lng, next.is_featured, id]
  );
  return mapProperty(result.rows[0]);
}

async function updatePropertyStage(id, listing_status) {
  const result = await pool.query(
    `UPDATE properties_property
     SET listing_status = $2,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, listing_status]
  );
  return result.rows[0] ? mapProperty(result.rows[0]) : null;
}

async function deleteProperty(id) {
  const result = await pool.query('DELETE FROM properties_property WHERE id = $1 RETURNING id', [id]);
  return result.rowCount > 0;
}

async function listAmenities(query = {}) {
  const values = [];
  const where = [];
  if (query.type) {
    values.push(query.type);
    where.push(`amenity_type = $${values.length}`);
  }
  const limit = clampLimit(query.limit, 500);
  values.push(limit);

  const result = await pool.query(
    `SELECT id,
            name,
            amenity_type,
            NULL::double precision AS lat,
            NULL::double precision AS lng,
            created_at
     FROM properties_amenity
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY created_at DESC
     LIMIT $${values.length}`,
    values
  );
  return result.rows.map(mapAmenity);
}

async function listNearbyProperties(query = {}) {
  const lat = toNumber(query.lat ?? query.latitude) ?? DEFAULT_LAT;
  const lng = toNumber(query.lng ?? query.lon ?? query.longitude) ?? DEFAULT_LNG;
  const radiusKm = Math.max(0.1, toNumber(query.radiusKm ?? query.radius) || 5);
  const items = await listProperties({ ...query, limit: query.limit || 50 });
  return {
    center: { lat, lng },
    radiusKm,
    items: items.map((item) => ({ ...item, distance_km: null })),
  };
}

async function listNearbyAmenities(query = {}) {
  const lat = toNumber(query.lat ?? query.latitude) ?? DEFAULT_LAT;
  const lng = toNumber(query.lng ?? query.lon ?? query.longitude) ?? DEFAULT_LNG;
  const radiusKm = Math.max(0.1, toNumber(query.radiusKm ?? query.radius) || 3);
  return {
    center: { lat, lng },
    radiusKm,
    items: await listAmenities({ ...query, limit: query.limit || 100 }),
  };
}

async function createPropertyImage(propertyId, payload) {
  const image = saveBase64File(payload, payload.caption || payload.name || 'property');
  const finalImage = image || payload.image || payload.image_url || payload.url;
  if (!finalImage) throw new Error('image is required');
  const result = await pool.query(
    `INSERT INTO properties_propertyimage(property_id, image, caption, is_primary, sort_order, created_at)
     VALUES($1, $2, $3, $4, $5, NOW())
     RETURNING id, property_id, image, caption, is_primary, sort_order, created_at`,
    [propertyId, finalImage, payload.caption || '', Boolean(payload.is_primary), normalizeOrder(payload.sort_order ?? 0)]
  );
  if (payload.is_primary) {
    await setPrimaryImage(result.rows[0].id);
  }
  return {
    ...result.rows[0],
    image: toMediaUrl(result.rows[0].image),
  };
}

async function setPrimaryImage(imageId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const current = await client.query('SELECT id, property_id FROM properties_propertyimage WHERE id = $1 LIMIT 1', [imageId]);
    if (!current.rows[0]) {
      await client.query('ROLLBACK');
      return null;
    }
    const propertyId = current.rows[0].property_id;
    await client.query('UPDATE properties_propertyimage SET is_primary = false WHERE property_id = $1', [propertyId]);
    await client.query('UPDATE properties_propertyimage SET is_primary = true WHERE id = $1', [imageId]);
    await client.query('COMMIT');
    return current.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function deletePropertyImage(imageId) {
  const result = await pool.query('DELETE FROM properties_propertyimage WHERE id = $1 RETURNING id', [imageId]);
  return result.rowCount > 0;
}

async function reorderPropertyImage(imageId, sortOrder) {
  const result = await pool.query(
    `UPDATE properties_propertyimage
     SET sort_order = $2
     WHERE id = $1
     RETURNING id, property_id, image, caption, is_primary, sort_order, created_at`,
    [imageId, normalizeOrder(sortOrder ?? 0)]
  );
  return result.rows[0] ? { ...result.rows[0], image: toMediaUrl(result.rows[0].image) } : null;
}

async function listAgents() {
  const result = await pool.query(
    `SELECT a.id,
            a.name,
            a.phone,
            a.email,
            NULL::double precision AS lat,
            NULL::double precision AS lng,
            COUNT(p.id)::int AS property_count
     FROM accounts_agent a
     LEFT JOIN properties_property p ON p.agent_id = a.id
     GROUP BY a.id
     ORDER BY a.name ASC
     LIMIT 100`
  );
  return result.rows;
}

async function getAgentById(id) {
  const agent = await pool.query(
    `SELECT id, name, phone, email, NULL::double precision AS lat, NULL::double precision AS lng
     FROM accounts_agent
     WHERE id = $1`,
    [id]
  );
  if (!agent.rows[0]) return null;
  const props = await pool.query(
    `SELECT ${propertySelect()}
     FROM properties_property p
     LEFT JOIN accounts_agent a ON a.id = p.agent_id
     WHERE p.agent_id = $1
     ORDER BY p.created_at DESC
     LIMIT 6`,
    [id]
  );
  return { ...agent.rows[0], properties: props.rows.map(mapProperty) };
}

async function assignNearestAgent(lat, lng) {
  const locationLat = toNumber(lat) ?? DEFAULT_LAT;
  const locationLng = toNumber(lng) ?? DEFAULT_LNG;
  const result = await pool.query(
    `SELECT id
     FROM accounts_agent
     WHERE location IS NOT NULL
     ORDER BY ST_Distance(location, ${pointSql('$1', '$2')}) ASC
     LIMIT 1`,
    [locationLng, locationLat]
  );
  if (result.rows[0]) return result.rows[0].id;
  const fallback = await pool.query('SELECT id FROM accounts_agent ORDER BY id ASC LIMIT 1');
  return fallback.rows[0]?.id || null;
}

async function createLead(payload) {
  const {
    name,
    phone = '',
    budget = null,
    notes = '',
    property_interest = '',
    pipeline_stage = 'new',
    alert_enabled = false,
    desired_lat = null,
    desired_lng = null,
    assigned_agent_id = null,
  } = payload;
  if (!name) throw new Error('name is required');

  const lat = toNumber(desired_lat ?? payload.lat ?? payload.latitude) ?? DEFAULT_LAT;
  const lng = toNumber(desired_lng ?? payload.lng ?? payload.longitude) ?? DEFAULT_LNG;
  const agentId = assigned_agent_id || payload.agent_id || await assignNearestAgent(lat, lng);

  const result = await pool.query(
    `INSERT INTO leads_lead(name, phone, budget, desired_location, property_interest, notes, pipeline_stage, assigned_agent_id, alert_enabled, created_at)
     VALUES($1,$2,$3, ${pointSql('$5', '$4')}, $6, $7, $8, $9, $10, NOW())
     RETURNING *`,
    [name, phone, budget, lat, lng, property_interest, notes, pipeline_stage, agentId, Boolean(alert_enabled)]
  );
  return result.rows[0];
}

async function updateLeadStage(id, pipeline_stage) {
  const result = await pool.query(
    `UPDATE leads_lead
     SET pipeline_stage = $2
     WHERE id = $1
     RETURNING *`,
    [id, pipeline_stage]
  );
  return result.rows[0] || null;
}

async function createAppointment(payload) {
  const { lead_id, property_id, agent_id = null, scheduled_at, notes = '' } = payload;
  if (!lead_id || !property_id || !scheduled_at) throw new Error('lead_id, property_id and scheduled_at are required');

  const resolvedLead = await pool.query('SELECT assigned_agent_id FROM leads_lead WHERE id = $1 LIMIT 1', [lead_id]);
  const resolvedProperty = await pool.query('SELECT agent_id FROM properties_property WHERE id = $1 LIMIT 1', [property_id]);
  const resolvedAgentId = agent_id || resolvedLead.rows[0]?.assigned_agent_id || resolvedProperty.rows[0]?.agent_id;
  if (!resolvedAgentId) throw new Error('agent could not be resolved');

  const result = await pool.query(
    `INSERT INTO leads_appointment(lead_id, property_id, agent_id, scheduled_at, notes)
     VALUES($1,$2,$3,$4,$5)
     RETURNING *`,
    [lead_id, property_id, resolvedAgentId, scheduled_at, notes]
  );
  return result.rows[0];
}

async function getDashboardStats() {
  const [propertyTotals, propertyTypeStats, leadStats, leadTotal, agents, featured, appointments] = await Promise.all([
    pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE listing_status = 'active')::int AS active_total,
         COUNT(*) FILTER (WHERE listing_status = 'pending')::int AS pending_total,
         COUNT(*) FILTER (WHERE listing_status = 'sold')::int AS sold_total,
         COUNT(*) FILTER (WHERE listing_status = 'hidden')::int AS hidden_total,
         COUNT(*) FILTER (WHERE is_featured = true)::int AS featured_total,
         ROUND(AVG(price)::numeric, 0) AS avg_price,
         ROUND(AVG(area)::numeric, 1) AS avg_area
       FROM properties_property`
    ),
    pool.query(
      `SELECT property_type,
              COUNT(*)::int AS count,
              ROUND(AVG(price)::numeric, 0) AS avg_price,
              ROUND(AVG(area)::numeric, 1) AS avg_area
       FROM properties_property
       GROUP BY property_type
       ORDER BY property_type ASC`
    ),
    pool.query(
      `SELECT pipeline_stage, COUNT(*)::int AS count
       FROM leads_lead
       GROUP BY pipeline_stage
       ORDER BY pipeline_stage ASC`
    ),
    pool.query('SELECT COUNT(*)::int AS count FROM leads_lead'),
    pool.query('SELECT COUNT(*)::int AS count FROM accounts_agent'),
    pool.query('SELECT COUNT(*)::int AS count FROM properties_property WHERE is_featured = true'),
    pool.query('SELECT COUNT(*)::int AS count FROM leads_appointment'),
  ]);

  return {
    property_total: propertyTotals.rows[0].total,
    property_active_total: propertyTotals.rows[0].active_total,
    property_pending_total: propertyTotals.rows[0].pending_total,
    property_sold_total: propertyTotals.rows[0].sold_total,
    property_hidden_total: propertyTotals.rows[0].hidden_total,
    featured_total: propertyTotals.rows[0].featured_total,
    avg_price: propertyTotals.rows[0].avg_price,
    avg_area: propertyTotals.rows[0].avg_area,
    property_type_stats: propertyTypeStats.rows,
    lead_stage_stats: leadStats.rows,
    lead_total: leadTotal.rows[0].count,
    agent_total: agents.rows[0].count,
    appointment_total: appointments.rows[0].count,
    featured_property_total: featured.rows[0].count,
  };
}

async function listWishlist(token) {
  const key = resolveCollectionKey(token);
  const ids = collectionsStore.list('wishlist', key);
  if (!ids.length && key === 'guest') {
    const result = await pool.query(
      `SELECT ${propertySelect()}
       FROM properties_property p
       LEFT JOIN accounts_agent a ON a.id = p.agent_id
       ORDER BY p.is_featured DESC, p.created_at DESC
       LIMIT 6`
    );
    return result.rows.map(mapProperty);
  }
  return listPropertiesByIds(ids);
}

async function toggleWishlist(token, propertyId) {
  const key = resolveCollectionKey(token);
  const id = Number(propertyId);
  if (!Number.isFinite(id)) throw new Error('propertyId is required');

  const current = collectionsStore.list('wishlist', key).map(Number).filter(Number.isFinite);
  const exists = current.includes(id);
  const next = exists ? current.filter((item) => item !== id) : [id, ...current];
  collectionsStore.setList('wishlist', key, next);

  return {
    added: !exists,
    ids: next,
    items: await listPropertiesByIds(next),
  };
}

async function removeWishlistItem(token, propertyId) {
  const key = resolveCollectionKey(token);
  const id = Number(propertyId);
  const current = collectionsStore.list('wishlist', key).map(Number).filter(Number.isFinite);
  const next = current.filter((item) => item !== id);
  collectionsStore.setList('wishlist', key, next);
  return {
    removed: current.length !== next.length,
    ids: next,
    items: await listPropertiesByIds(next),
  };
}

async function listCompare(token) {
  const key = resolveCollectionKey(token);
  return listPropertiesByIds(collectionsStore.list('compare', key));
}

async function toggleCompare(token, propertyId) {
  const key = resolveCollectionKey(token);
  const id = Number(propertyId);
  if (!Number.isFinite(id)) throw new Error('propertyId is required');

  const current = collectionsStore.list('compare', key).map(Number).filter(Number.isFinite);
  const exists = current.includes(id);
  let next;
  if (exists) {
    next = current.filter((item) => item !== id);
  } else {
    if (current.length >= 3) throw new Error('compare limit reached');
    next = [id, ...current];
  }
  collectionsStore.setList('compare', key, next);
  return {
    added: !exists,
    ids: next,
    items: await listPropertiesByIds(next),
  };
}

async function removeCompareItem(token, propertyId) {
  const key = resolveCollectionKey(token);
  const id = Number(propertyId);
  const current = collectionsStore.list('compare', key).map(Number).filter(Number.isFinite);
  const next = current.filter((item) => item !== id);
  collectionsStore.setList('compare', key, next);
  return {
    removed: current.length !== next.length,
    ids: next,
    items: await listPropertiesByIds(next),
  };
}

async function listSavedSearches(token) {
  const key = resolveCollectionKey(token);
  const store = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '..', '..', 'data', 'collections.json'), 'utf8'));
  return store.savedSearches?.[key] || [];
}

async function saveSearch(token, payload) {
  const key = resolveCollectionKey(token);
  if (!payload || typeof payload !== 'object') throw new Error('payload is required');
  return collectionsStore.upsertSavedSearch(key, payload);
}

async function deleteSavedSearch(token, id) {
  const key = resolveCollectionKey(token);
  return collectionsStore.deleteSavedSearch(key, id);
}

async function login(payload) {
  const { username, password = '' } = payload;
  const session = authStore.authenticate(username, password);
  if (!session) return null;
  return session;
}

async function register(payload) {
  return authStore.createUser(payload);
}

async function getCurrentUser(token) {
  return authStore.verifyToken(token);
}

async function updateProfile(token, payload) {
  const current = authStore.verifyToken(token);
  if (!current) return null;
  return authStore.updateUser(current.id, payload);
}

async function listTasks() {
  const result = await pool.query('SELECT * FROM tasks ORDER BY id ASC');
  return result.rows;
}

async function createTask(title) {
  const result = await pool.query('INSERT INTO tasks(title) VALUES($1) RETURNING *', [title]);
  return result.rows[0];
}

async function deleteTask(id) {
  await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
}

function parseCSV(text) {
  const lines = String(text || '').split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const splitLine = (line) => line.split(',').map((value) => value.trim().replace(/^"|"$/g, ''));
  const headers = splitLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = splitLine(line);
    return headers.reduce((row, header, index) => {
      row[header] = values[index] ?? '';
      return row;
    }, {});
  });
}

function sanitizePropertyCSV(row) {
  const obj = {};
  Object.keys(row).forEach((k) => {
    const key = k.trim().toLowerCase();
    let val = row[k];
    if (typeof val === 'string') val = val.trim();
    if (val === '' || val === 'null' || val === 'undefined') val = null;
    if (['price', 'area', 'bedrooms', 'bathrooms', 'floors', 'year_built', 'lat', 'lng', 'agent_id'].includes(key)) {
      val = val !== null ? Number(val) : null;
    }
    obj[key] = val;
  });
  return obj;
}

async function importPropertiesCSV(text) {
  const rows = parseCSV(text);
  if (!rows.length) throw new Error('CSV rỗng');
  const list = [];

  for (const row of rows) {
    const obj = sanitizePropertyCSV(row);
    if (!obj.title || !obj.address || !obj.price) throw new Error('Missing required fields: title, address, price');

    const result = await pool.query(
      `INSERT INTO properties_property
       (title, slug, description, address, price, area, type, status, lat, lng, bedrooms, bathrooms, floors, year_built, is_featured, agent_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
       RETURNING id`,
      [
        obj.title,
        (obj.slug || obj.title).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
        obj.description || '',
        obj.address,
        obj.price,
        obj.area,
        obj.type || 'house',
        obj.status || 'sale',
        obj.lat || DEFAULT_LAT,
        obj.lng || DEFAULT_LNG,
        obj.bedrooms || 0,
        obj.bathrooms || 0,
        obj.floors || 0,
        obj.year_built || 2020,
        obj.is_featured ? true : false,
        obj.agent_id || null,
      ]
    );
    list.push(result.rows[0]);
  }

  return list;
}

async function logPropertyChange(propertyId, field, oldValue, newValue, actorId, actorName) {
  if (!field || !actorId) return null;
  const result = await pool.query(
    `INSERT INTO properties_property_changelog
     (property_id, field, old_value, new_value, actor_id, actor_name, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     RETURNING *`,
    [propertyId, field, oldValue, newValue, actorId, actorName]
  );
  return result.rows[0];
}

async function getPropertyChangelog(propertyId) {
  const result = await pool.query(
    `SELECT c.*, u.full_name as actor_full_name, u.email as actor_email
     FROM properties_property_changelog c
     LEFT JOIN accounts_user u ON u.id = c.actor_id
     WHERE c.property_id = $1
     ORDER BY c.created_at DESC
     LIMIT 50`,
    [propertyId]
  );
  return result.rows;
}

async function clearPropertyChangelog(propertyId) {
  const result = await pool.query(
    `DELETE FROM properties_property_changelog WHERE property_id = $1`,
    [propertyId]
  );
  return { deleted: result.rowCount || 0 };
}

module.exports = {
  listProperties,
  listMapData,
  getPropertyById,
  createProperty,
  updateProperty,
  updatePropertyStage,
  deleteProperty,
  listAmenities,
  listNearbyProperties,
  listNearbyAmenities,
  listPropertyImages,
  createPropertyImage,
  setPrimaryImage,
  deletePropertyImage,
  reorderPropertyImage,
  listAgents,
  getAgentById,
  createLead,
  updateLeadStage,
  createAppointment,
  getDashboardStats,
  listWishlist,
  toggleWishlist,
  removeWishlistItem,
  listCompare,
  toggleCompare,
  removeCompareItem,
  listSavedSearches,
  saveSearch,
  deleteSavedSearch,
  login,
  register,
  getCurrentUser,
  updateProfile,
  listTasks,
  createTask,
  deleteTask,
  importPropertiesCSV,
  logPropertyChange,
  getPropertyChangelog,
  clearPropertyChangelog,
};