import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000/api";

const client = axios.create({ baseURL: API_BASE_URL, timeout: 10000 });
const TOKEN_KEY = "mnm_bandat_token";

function getToken() {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  if (typeof localStorage === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const fallbackImages = [
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1448630360428-65456885c650?q=80&w=1200&auto=format&fit=crop",
];

export function formatPrice(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "Liên hệ";
  if (number >= 1_000_000_000) return `${(number / 1_000_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tỷ`;
  if (number >= 1_000_000) return `${(number / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 0 })} triệu`;
  return number.toLocaleString("vi-VN");
}

export function typeLabel(type) {
  return { apartment: "Căn hộ", house: "Nhà phố", land: "Đất nền", villa: "Biệt thự" }[type] || type || "Bất động sản";
}

export function statusLabel(status) {
  return { active: "Đang bán", pending: "Chờ duyệt", sold: "Đã bán", hidden: "Ẩn", featured: "Nổi bật" }[status] || status || "Đang bán";
}

export function normalizeProperty(property, index = 0) {
  return {
    ...property,
    priceText: formatPrice(property?.price),
    typeText: typeLabel(property?.property_type || property?.type),
    statusText: statusLabel(property?.listing_status || property?.status),
    imageUrl: property?.image || fallbackImages[index % fallbackImages.length],
    agentName: property?.agent?.name || property?.agentName || property?.agent || "Chưa có môi giới",
  };
}

async function unwrap(request, fallback) {
  try {
    const response = await request;
    return response.data?.data ?? response.data;
  } catch (error) {
    console.warn("API fallback:", error.message);
    return fallback;
  }
}

async function fileToDataUrl(file) {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export const api = {
  health: () => unwrap(client.get("/health"), { ok: false }),
  properties: (params) => unwrap(client.get("/properties", { params }), []),
  mapData: (params) => unwrap(client.get("/properties/map-data", { params }), { items: [], center: { lat: 10.7769, lng: 106.7009 } }),
  nearbyProperties: (params) => unwrap(client.get("/properties/nearby/search", { params }), { items: [], center: { lat: 10.7769, lng: 106.7009 }, radiusKm: 5 }),
  property: (id) => unwrap(client.get(`/properties/${id}`), null),
  createProperty: (payload) => unwrap(client.post("/properties", payload), null),
  updateProperty: (id, payload) => unwrap(client.put(`/properties/${id}`, payload), null),
  updatePropertyStage: (id, payload) => unwrap(client.patch(`/properties/${id}/stage`, payload), null),
  deleteProperty: (id) => unwrap(client.delete(`/properties/${id}`), { ok: false }),
  propertyImages: (id) => unwrap(client.get(`/properties/${id}/images`), []),
  createPropertyImage: async (id, payload) => {
    if (payload?.file instanceof File) {
      const file = payload.file;
      const dataUrl = await fileToDataUrl(file);
      return unwrap(client.post(`/properties/${id}/images`, { ...payload, file: dataUrl, fileName: file.name }), null);
    }
    return unwrap(client.post(`/properties/${id}/images`, payload), null);
  },
  setPrimaryImage: (imageId) => unwrap(client.post(`/properties/images/${imageId}/primary`), null),
  reorderPropertyImage: (imageId, payload) => unwrap(client.post(`/properties/images/${imageId}/reorder`, payload), null),
  deletePropertyImage: (imageId) => unwrap(client.delete(`/properties/images/${imageId}`), { ok: false }),
  amenities: (params) => unwrap(client.get("/amenities", { params }), []),
  nearbyAmenities: (params) => unwrap(client.get("/amenities/nearby", { params }), { items: [], center: { lat: 10.7769, lng: 106.7009 }, radiusKm: 3 }),
  agents: () => unwrap(client.get("/agents"), []),
  agent: (id) => unwrap(client.get(`/agents/${id}`), null),
  wishlist: () => unwrap(client.get("/wishlist"), []),
  toggleWishlist: (propertyId) => unwrap(client.post(`/wishlist/${propertyId}/toggle`), null),
  removeWishlist: (propertyId) => unwrap(client.delete(`/wishlist/${propertyId}`), null),
  compare: () => unwrap(client.get("/compare"), []),
  toggleCompare: (propertyId) => unwrap(client.post(`/compare/${propertyId}/toggle`), null),
  removeCompare: (propertyId) => unwrap(client.delete(`/compare/${propertyId}`), null),
  savedSearches: () => unwrap(client.get("/saved-searches"), []),
  createSavedSearch: (payload) => unwrap(client.post("/saved-searches", payload), null),
  deleteSavedSearch: (searchId) => unwrap(client.delete(`/saved-searches/${searchId}`), null),
  dashboard: () => unwrap(client.get("/dashboard"), null),
  createLead: (payload) => unwrap(client.post("/leads", payload), null),
  updateLeadStage: (id, payload) => unwrap(client.patch(`/leads/${id}/stage`, payload), null),
  createAppointment: (payload) => unwrap(client.post("/appointments", payload), null),
  login: async (payload) => {
    const result = await unwrap(client.post("/auth/login", payload), null);
    if (result?.token) setToken(result.token);
    return result;
  },
  register: async (payload) => {
    const result = await unwrap(client.post("/auth/register", payload), null);
    if (result?.token) setToken(result.token);
    return result;
  },
  me: () => unwrap(client.get("/auth/me"), null),
  updateProfile: (payload) => unwrap(client.put("/auth/profile", payload), null),
  logout: () => setToken(null),
  getToken: () => getToken(),
};
