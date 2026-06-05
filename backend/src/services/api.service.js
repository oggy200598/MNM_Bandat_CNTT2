import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";

import { fileURLToPath } from "url";

import { pool } from "../../db.js";

import {
  propertySelect,
  mapProperty,
  mapAmenity,
  toMediaUrl
} from "../utils/property-mappers.js";

import authStore from "./auth-store.js";
import collectionsStore from "./collections-store.js";

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

const DEFAULT_LAT = 10.7769;
const DEFAULT_LNG = 106.7009;
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "super_secret_key";

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n)
    ? n
    : null;
}

function clampLimit(
  value,
  max = 100
) {
  const n = Number(value);

  if (
    !Number.isFinite(n) ||
    n <= 0
  ) {
    return Math.min(50, max);
  }

  return Math.min(
    Math.floor(n),
    max
  );
}

function clampPage(
  value
) {
  const n = Number(value);

  if (
    !Number.isFinite(n) ||
    n <= 0
  ) {
    return 1;
  }

  return Math.floor(n);
}

function parseBbox(
  value
) {
  if (!value) {
    return null;
  }

  const parts =
    String(value)
    .split(",")
    .map((item) =>
      Number(item.trim())
    );

  if (
    parts.length !== 4 ||
    parts.some(
      (item) =>
        !Number.isFinite(item)
    )
  ) {
    return null;
  }

  const [
    west,
    south,
    east,
    north
  ] = parts;

  return {
    west,
    south,
    east,
    north
  };
}

function haversineKm(
  lat1,
  lng1,
  lat2,
  lng2
) {
  if (
    [
      lat1,
      lng1,
      lat2,
      lng2
    ].some(
      (value) =>
        !Number.isFinite(
          Number(value)
        )
    )
  ) {
    return null;
  }

  const toRad =
    (deg) =>
      (Number(deg) * Math.PI) /
      180;

  const dLat =
    toRad(lat2 - lat1);
  const dLng =
    toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(
      toRad(lat1)
    ) *
      Math.cos(
        toRad(lat2)
      ) *
      Math.sin(dLng / 2) ** 2;

  return (
    6371 *
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );
}

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function getActingAgentId(authUser) {
  if (!authUser?.id) {
    return null;
  }

  const fullUser = authStore.findById(authUser.id);
  return fullUser?.linked_agent_id ?? null;
}

async function getPropertyOwnership(propertyId) {
  const result = await pool.query(
    `
    SELECT id, agent_id
    FROM properties_property
    WHERE id = $1
    `,
    [propertyId]
  );

  return result.rows[0] || null;
}

async function getImageOwnership(imageId) {
  const result = await pool.query(
    `
    SELECT img.id, img.property_id, prop.agent_id
    FROM properties_propertyimage img
    JOIN properties_property prop
      ON prop.id = img.property_id
    WHERE img.id = $1
    `,
    [imageId]
  );

  return result.rows[0] || null;
}

async function assertCanManageProperty(propertyId, authUser) {
  const property = await getPropertyOwnership(propertyId);

  if (!property) {
    throw createHttpError(404, "Property not found");
  }

  if (authUser?.role === "admin") {
    return property;
  }

  const actingAgentId = getActingAgentId(authUser);
  if (!actingAgentId) {
    throw createHttpError(403, "Forbidden");
  }

  if (String(property.agent_id) !== String(actingAgentId)) {
    throw createHttpError(403, "Forbidden");
  }

  return property;
}

async function assertCanManageImage(imageId, authUser) {
  const image = await getImageOwnership(imageId);

  if (!image) {
    throw createHttpError(404, "Image not found");
  }

  if (authUser?.role === "admin") {
    return image;
  }

  const actingAgentId = getActingAgentId(authUser);
  if (!actingAgentId) {
    throw createHttpError(403, "Forbidden");
  }

  if (String(image.agent_id) !== String(actingAgentId)) {
    throw createHttpError(403, "Forbidden");
  }

  return image;
}

function averageCenter(
  items
) {
  const coords =
    (items || []).filter(
      (item) =>
        Number.isFinite(item.lat) &&
        Number.isFinite(item.lng)
    );

  if (!coords.length) {
    return {
      lat: DEFAULT_LAT,
      lng: DEFAULT_LNG
    };
  }

  return {
    lat:
      coords.reduce(
        (sum, item) =>
          sum + Number(item.lat),
        0
      ) / coords.length,
    lng:
      coords.reduce(
        (sum, item) =>
          sum + Number(item.lng),
        0
      ) / coords.length
  };
}

function resolveCollectionKey(
  token
) {
  const user =
    resolveUserFromToken(
      token
    );

  return user
    ? `user:${user.id}`
    : "guest";
}

function resolveUserFromToken(
  token
) {
  let user =
    authStore.verifyToken(
      token
    );

  if (!user && token) {
    try {
      const decoded =
        jwt.verify(
          token,
          JWT_SECRET
        );

      user = {
        id: decoded.id,
        username:
          decoded.username,
        full_name:
          decoded.full_name,
        role:
          decoded.role
      };
    } catch {
      user = null;
    }
  }

  return user;
}

function formStorePath() {
  return path.join(
    __dirname,
    "..",
    "..",
    "data",
    "forms.json"
  );
}

function ensureFormStore() {
  const target =
    formStorePath();

  fs.mkdirSync(
    path.dirname(target),
    {
      recursive: true
    }
  );

  if (!fs.existsSync(target)) {
    fs.writeFileSync(
      target,
      JSON.stringify(
        {
          nextLeadId: 1,
          nextAppointmentId: 1,
          nextPasswordResetRequestId: 1,
          nextAgentReviewId: 1,
          leads: [],
          appointments: [],
          passwordResetRequests: [],
          agentReviews: []
        },
        null,
        2
      ),
      "utf8"
    );
  }

  const store = JSON.parse(
    fs.readFileSync(
      target,
      "utf8"
    )
  );

  if (
    store.nextLeadId ===
    undefined
  ) {
    store.nextLeadId = 1;
  }

  if (
    store.nextAppointmentId ===
    undefined
  ) {
    store.nextAppointmentId = 1;
  }

  if (
    store.nextPasswordResetRequestId ===
      undefined ||
    store.nextPasswordResetRequestId ===
      null ||
    Number.isNaN(
      Number(
        store.nextPasswordResetRequestId
      )
    )
  ) {
    store.nextPasswordResetRequestId = 1;
  }

  if (
    store.nextAgentReviewId ===
      undefined ||
    store.nextAgentReviewId ===
      null ||
    Number.isNaN(
      Number(
        store.nextAgentReviewId
      )
    )
  ) {
    store.nextAgentReviewId = 1;
  }

  store.leads ||= [];
  store.appointments ||= [];
  store.passwordResetRequests ||= [];
  store.agentReviews ||= [];

  saveFormStore(store);

  return store;
}

function saveFormStore(
  store
) {
  fs.writeFileSync(
    formStorePath(),
    JSON.stringify(
      store,
      null,
      2
    ),
    "utf8"
  );
}

function aboutContentPath() {
  return path.join(
    __dirname,
    "..",
    "..",
    "data",
    "about-content.json"
  );
}

const DEFAULT_ABOUT_CONTENT = {
  hero: {
    eye: "Về GeoEstate",
    title: "Nền tảng bất động sản",
    emphasis: "thế hệ mới",
    subtitle:
      "Kết hợp dữ liệu không gian, WebGIS và trải nghiệm hiện đại để giúp bạn khám phá bất động sản trực quan hơn bao giờ hết."
  },
  stats: [
    { number: "2,450+", label: "Bất động sản" },
    { number: "120+", label: "Môi giới" },
    { number: "15K+", label: "Khách tiềm năng" },
    { number: "98%", label: "Hài lòng" }
  ],
  sections: [
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
        { icon: "🗺️", title: "WebGIS trực quan", desc: "Hiển thị bất động sản trực tiếp trên bản đồ tương tác." },
        { icon: "📍", title: "Dữ liệu không gian", desc: "Phân tích khoảng cách và tiện ích lân cận chính xác." },
        { icon: "⚡", title: "Hiệu năng hiện đại", desc: "Frontend React + Backend Django + PostGIS." },
        { icon: "🔒", title: "Minh bạch", desc: "Thông tin kiểm duyệt rõ ràng và đáng tin cậy." }
      ]
    }
  ],
  timeline: [
    { year: "2024", title: "Khởi tạo dự án", desc: "Xây dựng nền tảng bất động sản tích hợp GIS." },
    { year: "2025", title: "Ra mắt hệ thống WebGIS", desc: "Triển khai bản đồ tương tác và tìm kiếm bán kính." },
    { year: "2026", title: "Mở rộng CRM", desc: "Quản lý môi giới, leads và lịch hẹn." }
  ],
  tech: [
    { icon: "🗄️", name: "PostGIS", desc: "Cơ sở dữ liệu không gian" },
    { icon: "🐍", name: "Django", desc: "Backend framework" },
    { icon: "⚛️", name: "React", desc: "Frontend hiện đại" },
    { icon: "🗺️", name: "Leaflet", desc: "Bản đồ tương tác" }
  ],
  cta: {
    eye: "Sẵn sàng chưa?",
    title: "Khám phá bất động sản",
    emphasis: "ngay hôm nay",
    desc: "Hàng nghìn bất động sản đang chờ bạn khám phá trên hệ thống WebGIS."
  }
};

function ensureAboutContentStore() {
  const target = aboutContentPath();

  fs.mkdirSync(path.dirname(target), {
    recursive: true
  });

  if (!fs.existsSync(target)) {
    fs.writeFileSync(
      target,
      JSON.stringify(
        DEFAULT_ABOUT_CONTENT,
        null,
        2
      ),
      "utf8"
    );
  }

  return JSON.parse(
    fs.readFileSync(
      target,
      "utf8"
    )
  );
}

function saveAboutContentStore(
  content
) {
  fs.writeFileSync(
    aboutContentPath(),
    JSON.stringify(
      content,
      null,
      2
    ),
    "utf8"
  );
}

function summarizeAgentReviews(
  agentId
) {
  const store =
    ensureFormStore();

  const reviews =
    (store.agentReviews || [])
    .filter(
      (item) =>
        String(item.agent_id) ===
        String(agentId)
    )
    .sort(
      (a, b) =>
        new Date(
          b.created_at
        ).getTime() -
        new Date(
          a.created_at
        ).getTime()
    );

  const count =
    reviews.length;
  const rating =
    count
      ? Number(
          (
            reviews.reduce(
              (sum, item) =>
                sum +
                Number(
                  item.rating || 0
                ),
              0
            ) / count
          ).toFixed(1)
        )
      : 5;

  return {
    rating,
    rating_count: count,
    reviews
  };
}

function ensureMediaDir() {
  const dir =
    path.join(
      __dirname,
      "..",
      "..",
      "..",
      "media",
      "properties"
    );

  fs.mkdirSync(
    dir,
    {
      recursive: true
    }
  );

  return dir;
}

function safeFilename(name) {
  return String(
    name || "upload"
  ).replace(
    /[^a-zA-Z0-9._-]+/g,
    "_"
  );
}

function saveBase64File(
  payload,
  fallbackName = "upload"
) {
  const file =
    payload.file ||
    payload.imageFile ||
    payload.upload;

  if (!file) {
    return null;
  }

  if (
    typeof file === "string" &&
    file.startsWith("data:")
  ) {
    const match =
      file.match(
        /^data:([^;]+);base64,(.+)$/
      );

    if (!match) {
      throw new Error(
        "invalid data url"
      );
    }

    const mime = match[1];
    const base64 = match[2];
    const ext =
      mime === "image/png"
        ? "png"
        : mime === "image/webp"
        ? "webp"
        : mime === "image/jpeg" ||
          mime === "image/jpg"
        ? "jpg"
        : "bin";

    const fileName =
      `${Date.now()}_${safeFilename(
        fallbackName
      )}.${ext}`;

    const target =
      path.join(
        ensureMediaDir(),
        fileName
      );

    fs.writeFileSync(
      target,
      Buffer.from(
        base64,
        "base64"
      )
    );

    return `properties/${fileName}`;
  }

  return String(file);
}

function normalizeOrder(
  value
) {
  const n = Number(value);

  if (
    !Number.isFinite(n)
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(n)
  );
}

function pointSql(
  lngParam,
  latParam
) {
  return `
    ST_SetSRID(
      ST_MakePoint(
        ${lngParam},
        ${latParam}
      ),
      4326
    )::geography
  `;
}

async function listProperties(
  query = {}
) {
  const limit =
    clampLimit(
      query.limit,
      200
    );
  const page =
    clampPage(query.page);
  const offset =
    (page - 1) * limit;

  const values = [];
  const where = [];
  const bbox =
    parseBbox(query.bbox);

  if (query.type) {
    values.push(
      String(query.type)
    );
    where.push(
      `p.property_type = $${values.length}`
    );
  }

  if (query.status) {
    values.push(
      String(query.status)
    );
    where.push(
      `p.listing_status = $${values.length}`
    );
  }

  if (
    query.featured === true ||
    query.featured === "true"
  ) {
    where.push(
      `p.is_featured = true`
    );
  }

  if (query.q) {
    values.push(
      `%${String(query.q).trim()}%`
    );
    where.push(
      `(p.title ILIKE $${values.length} OR p.address ILIKE $${values.length})`
    );
  }

  if (query.district) {
    values.push(
      `%${String(query.district).trim()}%`
    );
    where.push(
      `p.address ILIKE $${values.length}`
    );
  }

  if (
    query.priceMin !==
      undefined &&
    query.priceMin !== ""
  ) {
    values.push(
      Number(query.priceMin)
    );
    where.push(
      `p.price >= $${values.length}`
    );
  }

  if (
    query.priceMax !==
      undefined &&
    query.priceMax !== ""
  ) {
    values.push(
      Number(query.priceMax)
    );
    where.push(
      `p.price <= $${values.length}`
    );
  }

  if (
    query.areaMin !==
      undefined &&
    query.areaMin !== ""
  ) {
    values.push(
      Number(query.areaMin)
    );
    where.push(
      `p.area >= $${values.length}`
    );
  }

  if (
    query.areaMax !==
      undefined &&
    query.areaMax !== ""
  ) {
    values.push(
      Number(query.areaMax)
    );
    where.push(
      `p.area <= $${values.length}`
    );
  }

  if (bbox) {
    values.push(
      bbox.west,
      bbox.south,
      bbox.east,
      bbox.north
    );
    where.push(
      `
      ST_X(p.location::geometry) BETWEEN $${values.length - 3} AND $${values.length - 1}
      AND ST_Y(p.location::geometry) BETWEEN $${values.length - 2} AND $${values.length}
      `
    );
  }

  const orderBy =
    query.sort === "price_asc"
      ? "p.price ASC NULLS LAST"
      : query.sort ===
        "price_desc"
      ? "p.price DESC NULLS LAST"
      : query.sort ===
        "area_asc"
      ? "p.area ASC NULLS LAST"
      : query.sort ===
        "area_desc"
      ? "p.area DESC NULLS LAST"
      : "p.is_featured DESC, p.created_at DESC";

  values.push(limit, offset);

  const result =
    await pool.query(
      `
      SELECT ${propertySelect()}
      FROM properties_property p
      LEFT JOIN accounts_agent a
      ON a.id = p.agent_id
      ${
        where.length
          ? `WHERE ${where.join(" AND ")}`
          : ""
      }
      ORDER BY ${orderBy}
      LIMIT $${values.length - 1}
      OFFSET $${values.length}
      `,
      values
    );

  return result.rows.map(
    mapProperty
  );
}

async function listPropertiesPage(
  query = {}
) {
  const limit =
    clampLimit(
      query.limit,
      100
    );
  const page =
    clampPage(query.page);

  const values = [];
  const where = [];
  const bbox =
    parseBbox(query.bbox);

  if (query.type) {
    values.push(
      String(query.type)
    );
    where.push(
      `p.property_type = $${values.length}`
    );
  }

  if (query.status) {
    values.push(
      String(query.status)
    );
    where.push(
      `p.listing_status = $${values.length}`
    );
  }

  if (
    query.featured === true ||
    query.featured === "true"
  ) {
    where.push(
      `p.is_featured = true`
    );
  }

  if (query.q) {
    values.push(
      `%${String(query.q).trim()}%`
    );
    where.push(
      `(p.title ILIKE $${values.length} OR p.address ILIKE $${values.length})`
    );
  }

  if (query.district) {
    values.push(
      `%${String(query.district).trim()}%`
    );
    where.push(
      `p.address ILIKE $${values.length}`
    );
  }

  if (
    query.priceMin !==
      undefined &&
    query.priceMin !== ""
  ) {
    values.push(
      Number(query.priceMin)
    );
    where.push(
      `p.price >= $${values.length}`
    );
  }

  if (
    query.priceMax !==
      undefined &&
    query.priceMax !== ""
  ) {
    values.push(
      Number(query.priceMax)
    );
    where.push(
      `p.price <= $${values.length}`
    );
  }

  if (
    query.areaMin !==
      undefined &&
    query.areaMin !== ""
  ) {
    values.push(
      Number(query.areaMin)
    );
    where.push(
      `p.area >= $${values.length}`
    );
  }

  if (
    query.areaMax !==
      undefined &&
    query.areaMax !== ""
  ) {
    values.push(
      Number(query.areaMax)
    );
    where.push(
      `p.area <= $${values.length}`
    );
  }

  if (bbox) {
    values.push(
      bbox.west,
      bbox.south,
      bbox.east,
      bbox.north
    );
    where.push(
      `
      ST_X(p.location::geometry) BETWEEN $${values.length - 3} AND $${values.length - 1}
      AND ST_Y(p.location::geometry) BETWEEN $${values.length - 2} AND $${values.length}
      `
    );
  }

  const orderBy =
    query.sort === "price_asc"
      ? "p.price ASC NULLS LAST"
      : query.sort ===
        "price_desc"
      ? "p.price DESC NULLS LAST"
      : query.sort ===
        "area_asc"
      ? "p.area ASC NULLS LAST"
      : query.sort ===
        "area_desc"
      ? "p.area DESC NULLS LAST"
      : "p.is_featured DESC, p.created_at DESC";

  const whereClause =
    where.length
      ? `WHERE ${where.join(" AND ")}`
      : "";

  const countResult =
    await pool.query(
      `
      SELECT COUNT(*)::int AS total
      FROM properties_property p
      ${whereClause}
      `,
      values
    );

  const totalItems =
    countResult.rows[0]
      ?.total || 0;
  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalItems / limit
      )
    );
  const currentPage =
    Math.min(
      page,
      totalPages
    );
  const offset =
    (currentPage - 1) * limit;

  const dataValues = [
    ...values,
    limit,
    offset
  ];

  const result =
    await pool.query(
      `
      SELECT ${propertySelect()}
      FROM properties_property p
      LEFT JOIN accounts_agent a
      ON a.id = p.agent_id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${dataValues.length - 1}
      OFFSET $${dataValues.length}
      `,
      dataValues
    );

  return {
    items:
      result.rows.map(
        mapProperty
      ),
    pagination: {
      page:
        currentPage,
      limit,
      totalItems,
      totalPages,
      hasPrev:
        currentPage > 1,
      hasNext:
        currentPage <
        totalPages
    }
  };
}

async function listMapData(
  query = {}
) {
  const items =
    await listProperties({
      ...query,
      limit:
        query.limit || 250
    });

  return {
    center:
      Number.isFinite(
        toNumber(query.lat)
      ) &&
      Number.isFinite(
        toNumber(query.lng)
      )
        ? {
            lat:
              toNumber(
                query.lat
              ),
            lng:
              toNumber(
                query.lng
              )
          }
        : averageCenter(items),
    items
  };
}

async function listPropertyImages(
  propertyId
) {
  const result =
    await pool.query(
      `
      SELECT
        id,
        property_id,
        image,
        caption,
        is_primary,
        sort_order,
        created_at
      FROM properties_propertyimage
      WHERE property_id = $1
      ORDER BY
      is_primary DESC,
      sort_order ASC,
      id ASC
      `,
      [propertyId]
    );

  return result.rows.map(
    (row) => ({
      ...row,
      image:
        toMediaUrl(row.image)
    })
  );
}

async function getPropertyById(
  id
) {
  const result =
    await pool.query(
      `
      SELECT ${propertySelect()}
      FROM properties_property p
      LEFT JOIN accounts_agent a
      ON a.id = p.agent_id
      WHERE p.id=$1
      `,
      [id]
    );

  if (
    !result.rows[0]
  ) {
    return null;
  }

  const property =
    mapProperty(
      result.rows[0]
    );

  const [
    images,
    amenities,
    similar
  ] = await Promise.all([
    listPropertyImages(id),
    listNearbyAmenities({
      lat: property.lat,
      lng: property.lng,
      radiusKm: 3,
      limit: 4
    }),
    listProperties({
      type:
        property.property_type,
      limit: 4
    })
  ]);

  return {
    ...property,
    images,
    nearby_amenities:
      amenities.items,
    similar_properties:
      similar
      .filter(
        (item) =>
          String(item.id) !==
          String(id)
      )
      .slice(0, 3),
    location_score:
      property.lat !== null &&
      property.lng !== null
        ? 8.8
        : null,
    agent:
      property.agent
        ? {
            ...property.agent,
            ...summarizeAgentReviews(
              property.agent.id
            )
          }
        : null
  };
}

async function createProperty(
  payload,
  authUser = null
) {
  const actingAgentId =
    authUser?.role === "admin"
      ? payload.agent_id ?? null
      : getActingAgentId(authUser);

  if (
    authUser?.role === "agent" &&
    !actingAgentId
  ) {
    throw createHttpError(
      403,
      "Forbidden"
    );
  }

  const {
    title,
    description = "",
    property_type = "apartment",
    listing_status = "pending",
    price = null,
    area = null,
    address = "",
    agent_id = actingAgentId,
    is_featured = false,
    lat = DEFAULT_LAT,
    lng = DEFAULT_LNG
  } = payload;

  if (!title) {
    throw new Error(
      "title is required"
    );
  }

  const result =
    await pool.query(
      `
      INSERT INTO
      properties_property
      (
        title,
        description,
        property_type,
        listing_status,
        price,
        area,
        address,
        location,
        agent_id,
        is_featured,
        created_at,
        updated_at
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        ${pointSql("$9", "$8")},
        $10,
        $11,
        NOW(),
        NOW()
      )
      RETURNING id
      `,
      [
        title,
        description,
        property_type,
        listing_status,
        price,
        area,
        address,
        lat,
        lng,
        agent_id,
        is_featured
      ]
    );

  return getPropertyById(
    result.rows[0].id
  );
}

async function updateProperty(
  id,
  payload,
  authUser = null
) {
  await assertCanManageProperty(
    id,
    authUser
  );

  const current =
    await pool.query(
      `
      SELECT *
      FROM properties_property
      WHERE id=$1
      `,
      [id]
    );

  if (
    !current.rows[0]
  ) {
    return null;
  }

  const row =
    current.rows[0];

  const currentLocation =
    await pool.query(
      `
      SELECT
        ST_Y(location::geometry) AS lat,
        ST_X(location::geometry) AS lng
      FROM properties_property
      WHERE id = $1
      `,
      [id]
    );

  const location =
    currentLocation.rows[0] || {
      lat: DEFAULT_LAT,
      lng: DEFAULT_LNG
    };

  await pool.query(
    `
    UPDATE properties_property
    SET
      title = $1,
      description = $2,
      property_type = $3,
      listing_status = $4,
      price = $5,
      area = $6,
      address = $7,
      location = ${pointSql("$9", "$8")},
      updated_at = NOW()
    WHERE id = $10
    `,
    [
      payload.title ??
        row.title,
      payload.description ??
        row.description,
      payload.property_type ??
        row.property_type,
      payload.listing_status ??
        row.listing_status,
      payload.price ??
        row.price,
      payload.area ??
        row.area,
      payload.address ??
        row.address,
      payload.lat ??
        location.lat ??
        DEFAULT_LAT,
      payload.lng ??
        location.lng ??
        DEFAULT_LNG,
      id
    ]
  );

  return getPropertyById(id);
}

async function updatePropertyStage(
  id,
  listing_status,
  authUser = null
) {
  await assertCanManageProperty(
    id,
    authUser
  );

  const result =
    await pool.query(
      `
      UPDATE properties_property
      SET
        listing_status = $2,
        updated_at = NOW()
      WHERE id = $1
      RETURNING id
      `,
      [
        id,
        listing_status
      ]
    );

  return result.rows[0]
    ? getPropertyById(id)
    : null;
}

async function deleteProperty(
  id,
  authUser = null
) {
  await assertCanManageProperty(
    id,
    authUser
  );

  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    const dependentTables = [
      "accounts_agentreview",
      "leads_appointment",
      "properties_compare",
      "properties_property_amenities",
      "properties_property_image",
      "properties_propertychangelog",
      "properties_propertyimage",
      "properties_review",
      "properties_wishlist",
    ];

    for (const tableName of dependentTables) {
      await client.query(
        `
        DELETE
        FROM ${tableName}
        WHERE property_id = $1
        `,
        [id]
      );
    }

    const result =
      await client.query(
        `
        DELETE
        FROM properties_property
        WHERE id = $1
        RETURNING id
        `,
        [id]
      );

    await client.query("COMMIT");
    return result.rowCount > 0;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function createPropertyImage(
  propertyId,
  payload,
  authUser = null
) {
  await assertCanManageProperty(
    propertyId,
    authUser
  );

  const imagePath =
    saveBase64File(
      payload,
      payload.fileName ||
        payload.caption ||
        "property"
    );

  if (!imagePath) {
    throw new Error(
      "image file is required"
    );
  }

  const result =
    await pool.query(
      `
      INSERT INTO properties_propertyimage
      (
        property_id,
        image,
        caption,
        is_primary,
        sort_order,
        created_at
      )
      VALUES
      (
        $1,
        $2,
        $3,
        COALESCE($4, false),
        $5,
        NOW()
      )
      RETURNING
        id,
        property_id,
        image,
        caption,
        is_primary,
        sort_order,
        created_at
      `,
      [
        propertyId,
        imagePath,
        payload.caption || "",
        payload.is_primary ??
          false,
        normalizeOrder(
          payload.sort_order
        )
      ]
    );

  return {
    ...result.rows[0],
    image:
      toMediaUrl(
        result.rows[0].image
      )
  };
}

async function setPrimaryImage(
  imageId,
  authUser = null
) {
  await assertCanManageImage(
    imageId,
    authUser
  );

  const current =
    await pool.query(
      `
      SELECT id, property_id
      FROM properties_propertyimage
      WHERE id = $1
      `,
      [imageId]
    );

  if (
    !current.rows[0]
  ) {
    return null;
  }

  await pool.query(
    `
    UPDATE properties_propertyimage
    SET is_primary = false
    WHERE property_id = $1
    `,
    [current.rows[0].property_id]
  );

  const result =
    await pool.query(
      `
      UPDATE properties_propertyimage
      SET is_primary = true
      WHERE id = $1
      RETURNING
        id,
        property_id,
        image,
        caption,
        is_primary,
        sort_order,
        created_at
      `,
      [imageId]
    );

  return {
    ...result.rows[0],
    image:
      toMediaUrl(
        result.rows[0].image
      )
  };
}

async function deletePropertyImage(
  imageId,
  authUser = null
) {
  await assertCanManageImage(
    imageId,
    authUser
  );

  const result =
    await pool.query(
      `
      DELETE
      FROM properties_propertyimage
      WHERE id = $1
      RETURNING id
      `,
      [imageId]
    );

  return result.rowCount > 0;
}

async function reorderPropertyImage(
  imageId,
  sortOrder,
  authUser = null
) {
  await assertCanManageImage(
    imageId,
    authUser
  );

  const result =
    await pool.query(
      `
      UPDATE properties_propertyimage
      SET sort_order = $2
      WHERE id = $1
      RETURNING
        id,
        property_id,
        image,
        caption,
        is_primary,
        sort_order,
        created_at
      `,
      [
        imageId,
        normalizeOrder(
          sortOrder
        )
      ]
    );

  return result.rows[0]
    ? {
        ...result.rows[0],
        image:
          toMediaUrl(
            result.rows[0].image
          )
      }
    : null;
}

async function listNearbyProperties(
  query = {}
) {
  const center = {
    lat:
      toNumber(query.lat) ||
      DEFAULT_LAT,
    lng:
      toNumber(query.lng) ||
      DEFAULT_LNG
  };

  const radiusKm =
    toNumber(
      query.radiusKm
    ) || 5;

  const items =
    await listProperties({
      ...query,
      limit:
        query.limit || 100
    });

  return {
    center,
    radiusKm,
    items:
      items
      .map((item) => {
        const distance =
          haversineKm(
            center.lat,
            center.lng,
            item.lat,
            item.lng
          );

        return {
          ...item,
          distance_km:
            distance === null
              ? null
              : Number(
                  distance.toFixed(2)
                )
        };
      })
      .filter(
        (item) =>
          item.distance_km ===
            null ||
          item.distance_km <=
            radiusKm
      )
      .sort(
        (a, b) =>
          (a.distance_km ?? 9999) -
          (b.distance_km ?? 9999)
      )
      .slice(
        0,
        clampLimit(
          query.limit,
          100
        )
      )
  };
}

async function listAmenities() {
  const result =
    await pool.query(
      `
      SELECT
        id,
        name,
        amenity_type,
        ST_Y(location::geometry) AS lat,
        ST_X(location::geometry) AS lng,
        created_at
      FROM properties_amenity
      ORDER BY id DESC
      `
    );

  return result.rows.map(
    mapAmenity
  );
}

async function createAmenity(
  payload
) {
  if (!payload.name) {
    throw new Error(
      "name is required"
    );
  }

  const result =
    await pool.query(
      `
      INSERT INTO properties_amenity
      (
        name,
        amenity_type,
        location,
        created_at
      )
      VALUES
      (
        $1,
        $2,
        ${pointSql("$4", "$3")},
        NOW()
      )
      RETURNING
        id,
        name,
        amenity_type,
        ST_Y(location::geometry) AS lat,
        ST_X(location::geometry) AS lng,
        created_at
      `,
      [
        payload.name,
        payload.amenity_type ||
          payload.type ||
          "other",
        payload.lat ??
          DEFAULT_LAT,
        payload.lng ??
          DEFAULT_LNG
      ]
    );

  return mapAmenity(
    result.rows[0]
  );
}

async function updateAmenity(
  id,
  payload
) {
  const current =
    await pool.query(
      `
      SELECT
        id,
        name,
        amenity_type,
        ST_Y(location::geometry) AS lat,
        ST_X(location::geometry) AS lng,
        created_at
      FROM properties_amenity
      WHERE id = $1
      `,
      [id]
    );

  if (
    !current.rows[0]
  ) {
    return null;
  }

  const row =
    current.rows[0];

  const result =
    await pool.query(
      `
      UPDATE properties_amenity
      SET
        name = $1,
        amenity_type = $2,
        location = ${pointSql("$4", "$3")}
      WHERE id = $5
      RETURNING
        id,
        name,
        amenity_type,
        ST_Y(location::geometry) AS lat,
        ST_X(location::geometry) AS lng,
        created_at
      `,
      [
        payload.name ??
          row.name,
        payload.amenity_type ??
          payload.type ??
          row.amenity_type,
        payload.lat ??
          row.lat ??
          DEFAULT_LAT,
        payload.lng ??
          row.lng ??
          DEFAULT_LNG,
        id
      ]
    );

  return mapAmenity(
    result.rows[0]
  );
}

async function deleteAmenity(
  id
) {
  const result =
    await pool.query(
      `
      DELETE
      FROM properties_amenity
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

  return result.rowCount > 0;
}

async function listNearbyAmenities(
  query = {}
) {
  const center = {
    lat:
      toNumber(query.lat) ||
      DEFAULT_LAT,
    lng:
      toNumber(query.lng) ||
      DEFAULT_LNG
  };

  const radiusKm =
    toNumber(
      query.radiusKm
    ) || 3;

  const items =
    await listAmenities();

  return {
    center,
    radiusKm,
    items:
      items
      .map((item) => {
        const distance =
          haversineKm(
            center.lat,
            center.lng,
            item.lat,
            item.lng
          );

        return {
          ...item,
          distance_km:
            distance === null
              ? null
              : Number(
                  distance.toFixed(2)
                )
        };
      })
      .filter(
        (item) =>
          item.distance_km ===
            null ||
          item.distance_km <=
            radiusKm
      )
      .sort(
        (a, b) =>
          (a.distance_km ?? 9999) -
          (b.distance_km ?? 9999)
      )
      .slice(
        0,
        clampLimit(
          query.limit,
          100
        )
      )
  };
}

async function listAgents() {
  const result =
    await pool.query(
      `
      SELECT
        id,
        name,
        phone,
        email,
        ST_Y(location::geometry) AS lat,
        ST_X(location::geometry) AS lng
      FROM accounts_agent
      ORDER BY id DESC
      `
    );

  return Promise.all(
    result.rows.map((row) =>
      getAgentById(row.id)
    )
  );
}

async function getAgentById(
  id
) {
  const result =
    await pool.query(
      `
      SELECT
        id,
        name,
        phone,
        email,
        ST_Y(location::geometry) AS lat,
        ST_X(location::geometry) AS lng
      FROM accounts_agent
      WHERE id = $1
      `,
      [id]
    );

  const agent =
    result.rows[0] || null;

  if (!agent) {
    return null;
  }

  const properties =
    await listProperties({
      limit: 200
    });

  const assigned =
    properties.filter(
      (item) =>
        String(item.agent?.id) ===
        String(id)
    );

  const center =
    averageCenter(assigned);

  return {
    ...agent,
    lat: center.lat,
    lng: center.lng,
    ...summarizeAgentReviews(id),
    properties: assigned
  };
}

async function createAgent(
  payload
) {
  if (!payload.name) {
    throw new Error(
      "name is required"
    );
  }

  const result =
    await pool.query(
      `
      INSERT INTO accounts_agent
      (
        name,
        phone,
        email,
        location,
        created_at,
        updated_at
      )
      VALUES
      (
        $1,
        $2,
        $3,
        ${pointSql("$5", "$4")},
        NOW(),
        NOW()
      )
      RETURNING id
      `,
      [
        String(payload.name).trim(),
        payload.phone || null,
        payload.email || null,
        payload.lat ?? DEFAULT_LAT,
        payload.lng ?? DEFAULT_LNG
      ]
    );

  return getAgentById(
    result.rows[0].id
  );
}

async function updateAgent(
  id,
  payload
) {
  const current =
    await pool.query(
      `
      SELECT
        id,
        name,
        phone,
        email,
        ST_Y(location::geometry) AS lat,
        ST_X(location::geometry) AS lng
      FROM accounts_agent
      WHERE id = $1
      `,
      [id]
    );

  if (
    !current.rows[0]
  ) {
    return null;
  }

  const row =
    current.rows[0];

  await pool.query(
    `
    UPDATE accounts_agent
    SET
      name = $1,
      phone = $2,
      email = $3,
      location = ${pointSql("$5", "$4")},
      updated_at = NOW()
    WHERE id = $6
    `,
    [
      String(
        payload.name ??
          row.name
      ).trim(),
      payload.phone ??
        row.phone ??
        null,
      payload.email ??
        row.email ??
        null,
      payload.lat ??
        row.lat ??
        DEFAULT_LAT,
      payload.lng ??
        row.lng ??
        DEFAULT_LNG,
      id
    ]
  );

  return getAgentById(id);
}

async function deleteAgent(
  id
) {
  await pool.query(
    `
    UPDATE properties_property
    SET agent_id = NULL
    WHERE agent_id = $1
    `,
    [id]
  );

  const result =
    await pool.query(
      `
      DELETE
      FROM accounts_agent
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

  return result.rowCount > 0;
}

async function getDashboardStats() {
  const [
    propertyCount,
    agentCount
  ] = await Promise.all([
    pool.query(
      `
      SELECT COUNT(*)::int AS total
      FROM properties_property
      `
    ),
    pool.query(
      `
      SELECT COUNT(*)::int AS total
      FROM accounts_agent
      `
    )
  ]);

  const forms =
    ensureFormStore();
  const activeResult =
    await pool.query(
      `
      SELECT
        COUNT(*) FILTER (WHERE listing_status = 'active')::int AS active_total,
        COUNT(*) FILTER (WHERE listing_status = 'sold')::int AS sold_total,
        COUNT(*) FILTER (WHERE is_featured = true)::int AS featured_total
      FROM properties_property
      `
    );
  const typeResult =
    await pool.query(
      `
      SELECT
        property_type,
        COUNT(*)::int AS count
      FROM properties_property
      GROUP BY property_type
      ORDER BY count DESC, property_type ASC
      `
    );

  return {
    property_total:
      propertyCount.rows[0]
      ?.total || 0,
    agent_total:
      agentCount.rows[0]
      ?.total || 0,
    lead_total:
      forms.leads.length,
    appointment_total:
      forms.appointments.length,
    property_active_total:
      activeResult.rows[0]
      ?.active_total || 0,
    property_sold_total:
      activeResult.rows[0]
      ?.sold_total || 0,
    featured_total:
      activeResult.rows[0]
      ?.featured_total || 0,
    property_type_stats:
      typeResult.rows,
    satisfaction: 96
  };
}

async function createLead(
  payload
) {
  const store =
    ensureFormStore();

  const lead = {
    id: String(
      store.nextLeadId++
    ),
    ...payload,
    created_at:
      new Date()
      .toISOString(),
    pipeline_stage:
      payload.pipeline_stage ||
      "new"
  };

  store.leads.unshift(lead);
  saveFormStore(store);

  return lead;
}

async function createAppointment(
  payload
) {
  const store =
    ensureFormStore();

  const appointment = {
    id: String(
      store.nextAppointmentId++
    ),
    ...payload,
    created_at:
      new Date()
      .toISOString()
  };

  store.appointments.unshift(
    appointment
  );
  saveFormStore(store);

  return appointment;
}

async function listLeads() {
  const store =
    ensureFormStore();

  return store.leads || [];
}

async function updateLeadStage(
  id,
  pipelineStage
) {
  const store =
    ensureFormStore();

  const lead =
    store.leads.find(
      (item) =>
        String(item.id) ===
        String(id)
    );

  if (!lead) {
    return null;
  }

  lead.pipeline_stage =
    pipelineStage || "new";

  saveFormStore(store);

  return lead;
}

async function deleteLead(
  id
) {
  const store =
    ensureFormStore();

  const next =
    store.leads.filter(
      (item) =>
        String(item.id) !==
        String(id)
    );

  if (
    next.length ===
    store.leads.length
  ) {
    return false;
  }

  store.leads = next;
  saveFormStore(store);

  return true;
}

async function createPasswordResetRequest(
  payload
) {
  const store =
    ensureFormStore();

  store.passwordResetRequests ||=
    [];

  const request = {
    id: String(
      store.nextPasswordResetRequestId++
    ),
    email:
      String(
        payload.email || ""
      ).trim(),
    created_at:
      new Date()
      .toISOString(),
    status: "pending"
  };

  store.passwordResetRequests.unshift(
    request
  );
  saveFormStore(store);

  return request;
}

async function listAgentReviews(
  agentId
) {
  return summarizeAgentReviews(
    agentId
  );
}

async function createAgentReview(
  token,
  agentId,
  payload
) {
  const store =
    ensureFormStore();
  const currentUser =
    resolveUserFromToken(
      token
    );

  const rating =
    Math.min(
      5,
      Math.max(
        1,
        Number(
          payload.rating || 1
        )
      )
    );

  const authorName =
    String(
      payload.author_name ||
        currentUser?.full_name ||
        currentUser?.username ||
        "Khách vãng lai"
    ).trim();
  const reviewerKey =
    currentUser
      ? `user:${currentUser.id}`
      : `guest:${authorName.toLowerCase()}`;

  const existingReview =
    (store.agentReviews || [])
    .find(
      (item) =>
        String(item.agent_id) ===
          String(agentId) &&
        item.reviewer_key ===
          reviewerKey
    );

  if (existingReview) {
    existingReview.rating =
      rating;
    existingReview.comment =
      String(
        payload.comment || ""
      ).trim();
    existingReview.author_name =
      authorName;
    existingReview.updated_at =
      new Date()
      .toISOString();

    saveFormStore(store);

    return summarizeAgentReviews(
      agentId
    );
  }

  const review = {
    id: String(
      store.nextAgentReviewId++
    ),
    agent_id:
      String(agentId),
    reviewer_key:
      reviewerKey,
    reviewer_user_id:
      currentUser?.id || null,
    rating,
    comment:
      String(
        payload.comment || ""
      ).trim(),
    author_name:
      authorName,
    created_at:
      new Date()
      .toISOString()
  };

  store.agentReviews.unshift(
    review
  );
  saveFormStore(store);

  return summarizeAgentReviews(
    agentId
  );
}

async function listCollectionProperties(
  storeName,
  token
) {
  const ids =
    collectionsStore.list(
      storeName,
      resolveCollectionKey(
        token
      )
    );

  if (!ids.length) {
    return [];
  }

  const items =
    await Promise.all(
      ids.map((id) =>
        getPropertyById(id)
      )
    );

  return items.filter(Boolean);
}

async function listWishlist(
  token
) {
  return listCollectionProperties(
    "wishlist",
    token
  );
}

async function toggleWishlist(
  token,
  propertyId
) {
  const key =
    resolveCollectionKey(
      token
    );

  const current =
    collectionsStore.list(
      "wishlist",
      key
    );

  const next =
    current.includes(
      String(propertyId)
    )
      ? current.filter(
          (id) =>
            String(id) !==
            String(propertyId)
        )
      : [
          ...current,
          String(propertyId)
        ];

  collectionsStore.setList(
    "wishlist",
    key,
    next
  );

  return {
    ids: next
  };
}

async function removeWishlistItem(
  token,
  propertyId
) {
  const key =
    resolveCollectionKey(
      token
    );

  const next =
    collectionsStore
    .list(
      "wishlist",
      key
    )
    .filter(
      (id) =>
        String(id) !==
        String(propertyId)
    );

  collectionsStore.setList(
    "wishlist",
    key,
    next
  );

  return {
    ids: next
  };
}

async function listCompare(
  token
) {
  return listCollectionProperties(
    "compare",
    token
  );
}

async function toggleCompare(
  token,
  propertyId
) {
  const key =
    resolveCollectionKey(
      token
    );

  const current =
    collectionsStore.list(
      "compare",
      key
    );

  const next =
    current.includes(
      String(propertyId)
    )
      ? current.filter(
          (id) =>
            String(id) !==
            String(propertyId)
        )
      : [
          ...current,
          String(propertyId)
        ].slice(-3);

  collectionsStore.setList(
    "compare",
    key,
    next
  );

  return {
    ids: next
  };
}

async function removeCompareItem(
  token,
  propertyId
) {
  const key =
    resolveCollectionKey(
      token
    );

  const next =
    collectionsStore
    .list(
      "compare",
      key
    )
    .filter(
      (id) =>
        String(id) !==
        String(propertyId)
    );

  collectionsStore.setList(
    "compare",
    key,
    next
  );

  return {
    ids: next
  };
}

async function listSavedSearches(
  token
) {
  return collectionsStore.list(
    "savedSearches",
    resolveCollectionKey(token)
  );
}

async function saveSearch(
  token,
  payload
) {
  return collectionsStore.upsertSavedSearch(
    resolveCollectionKey(
      token
    ),
    payload
  );
}

async function deleteSavedSearch(
  token,
  searchId
) {
  return {
    ok:
      collectionsStore.deleteSavedSearch(
        resolveCollectionKey(
          token
        ),
        searchId
      )
  };
}

async function login(
  payload
) {
  return authStore.authenticate(
    payload.username,
    payload.password
  );
}

async function register(
  payload
) {
  return authStore.createUser(
    {
      ...payload,
      role: "user",
      linked_agent_id: null
    }
  );
}

async function getCurrentUser(
  token
) {
  return authStore.verifyToken(
    token
  );
}

async function updateProfile(
  token,
  payload
) {
  const current =
    authStore.verifyToken(
      token
    );

  if (!current) {
    return null;
  }

  return authStore.updateUser(
    current.id,
    payload
  );
}

async function getAboutContent() {
  return ensureAboutContentStore();
}

async function updateAboutContent(
  payload = {}
) {
  const current =
    ensureAboutContentStore();

  const next = {
    hero: {
      ...current.hero,
      ...(payload.hero || {})
    },
    stats:
      Array.isArray(payload.stats)
        ? payload.stats
        : current.stats,
    sections:
      Array.isArray(payload.sections)
        ? payload.sections
        : current.sections,
    timeline:
      Array.isArray(payload.timeline)
        ? payload.timeline
        : current.timeline,
    tech:
      Array.isArray(payload.tech)
        ? payload.tech
        : current.tech,
    cta: {
      ...current.cta,
      ...(payload.cta || {})
    }
  };

  saveAboutContentStore(next);

  return next;
}

async function listTasks() {
  const result =
    await pool.query(
      `
      SELECT *
      FROM tasks
      ORDER BY id ASC
      `
    );

  return result.rows;
}

async function createTask(
  title
) {
  const result =
    await pool.query(
      `
      INSERT INTO tasks
      (title)
      VALUES($1)
      RETURNING *
      `,
      [title]
    );

  return result.rows[0];
}

async function deleteTask(
  id
) {
  await pool.query(
    `
    DELETE
    FROM tasks
    WHERE id=$1
    `,
    [id]
  );
}

export default {
  listProperties,
  listPropertiesPage,
  listMapData,
  listNearbyProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  updatePropertyStage,
  deleteProperty,
  listPropertyImages,
  createPropertyImage,
  setPrimaryImage,
  deletePropertyImage,
  reorderPropertyImage,
  listAmenities,
  createAmenity,
  updateAmenity,
  deleteAmenity,
  listNearbyAmenities,
  listAgents,
  getAgentById,
  createAgent,
  updateAgent,
  deleteAgent,
  getDashboardStats,
  createLead,
  createAppointment,
  listLeads,
  updateLeadStage,
  deleteLead,
  createPasswordResetRequest,
  listAgentReviews,
  createAgentReview,
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
  getAboutContent,
  updateAboutContent,
  listTasks,
  createTask,
  deleteTask
};
