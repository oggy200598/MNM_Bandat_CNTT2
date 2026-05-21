import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../api";
import SkyEditor from "../../components/forms/SkyEditor";

const EMPTY_FORM = {
  title: "",
  property_type: "apartment",
  listing_status: "pending",
  price: "",
  area: "",
  address: "",
  lat: "",
  lng: "",
  description: "",
};

function queryId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function buildMapSrc(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return "https://www.openstreetmap.org/export/embed.html?bbox=106.5,10.65,106.85,10.9&layer=mapnik";
  }

  const delta = 0.015;
  const bbox = [
    (lng - delta).toFixed(6),
    (lat - delta).toFixed(6),
    (lng + delta).toFixed(6),
    (lat + delta).toFixed(6),
  ].join(",");

  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

async function geocodeAddress(address) {
  const keyword = String(address || "").trim();
  if (keyword.length < 6) return null;

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(keyword)}`
  );
  const results = await response.json();
  const first = Array.isArray(results) ? results[0] : null;

  if (!first) return null;

  return {
    lat: Number(first.lat),
    lng: Number(first.lon),
    label: first.display_name || keyword,
  };
}

function normalizeImagePreview(image, index) {
  return {
    id: image.id || `existing-${index}`,
    url: image.image,
    label: image.caption || image.alt_text || `Ảnh ${index + 1}`,
    existing: true,
    isPrimary: Boolean(image.is_primary),
  };
}

export function PropertyFormPage({ edit = false }) {
  const { id: routeId } = useParams();
  const [message, setMessage] = useState("");
  const [geoMessage, setGeoMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [imageFiles, setImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  const propertyId = routeId || queryId();
  const numericLat = Number(formData.lat);
  const numericLng = Number(formData.lng);
  const hasMapPoint = Number.isFinite(numericLat) && Number.isFinite(numericLng);

  const mapSrc = useMemo(
    () => buildMapSrc(numericLat, numericLng),
    [numericLat, numericLng]
  );

  useEffect(() => {
    if (!edit) return undefined;

    let active = true;

    async function loadProperty() {
      const id = propertyId || "1";
      const [data, images] = await Promise.all([
        api.property(id),
        api.propertyImages(id),
      ]);

      if (!active || !data) return;

      setFormData({
        title: data.title || "",
        property_type: data.property_type || "apartment",
        listing_status: data.listing_status || "pending",
        price: data.price ?? "",
        area: data.area ?? "",
        address: data.address || "",
        lat: data.lat ?? "",
        lng: data.lng ?? "",
        description: data.description || "",
      });
      setExistingImages(
        Array.isArray(images) ? images.map(normalizeImagePreview) : []
      );
    }

    loadProperty();

    return () => {
      active = false;
    };
  }, [edit, propertyId]);

  useEffect(() => {
    const keyword = formData.address.trim();
    if (keyword.length < 6) {
      setGeoMessage("");
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      setIsGeocoding(true);
      try {
        const result = await geocodeAddress(keyword);
        if (!result) {
          setGeoMessage("Chưa xác định được vị trí từ địa chỉ này.");
          return;
        }

        setFormData((prev) => ({
          ...prev,
          lat: result.lat,
          lng: result.lng,
        }));
        setGeoMessage(`Đã ghim vị trí theo địa chỉ: ${result.label}`);
      } catch {
        setGeoMessage("Không tra cứu được vị trí lúc này.");
      } finally {
        setIsGeocoding(false);
      }
    }, 700);

    return () => window.clearTimeout(timer);
  }, [formData.address]);

  function updateField(field, value) {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleFileSelection(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const nextFiles = files.map((file, index) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${index}`,
      file,
      url: URL.createObjectURL(file),
      label: file.name,
      existing: false,
      isPrimary: imageFiles.length === 0 && existingImages.length === 0 && index === 0,
    }));

    setImageFiles((prev) => [...prev, ...nextFiles]);
    event.target.value = "";
  }

  function removePendingImage(imageId) {
    setImageFiles((prev) => {
      const target = prev.find((item) => item.id === imageId);
      if (target?.url) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((item) => item.id !== imageId);
    });
  }

  async function uploadPendingImages(targetPropertyId) {
    if (!imageFiles.length) return;

    for (let index = 0; index < imageFiles.length; index += 1) {
      const image = imageFiles[index];
      await api.createPropertyImage(targetPropertyId, {
        file: image.file,
        alt_text: formData.title || image.label,
        caption: formData.title || image.label,
        sort_order: existingImages.length + index,
        is_primary: existingImages.length === 0 && index === 0,
      });
    }

    imageFiles.forEach((image) => {
      if (image.url) {
        URL.revokeObjectURL(image.url);
      }
    });
    setImageFiles([]);
  }

  async function submit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const payload = {
      ...formData,
      price: formData.price || null,
      area: formData.area || null,
      lat: formData.lat || null,
      lng: formData.lng || null,
    };

    try {
      const result = edit
        ? await api.updateProperty(propertyId || "1", payload)
        : await api.createProperty(payload);

      if (!result?.id) {
        setMessage("Chưa lưu được tin.");
        return;
      }

      await uploadPendingImages(result.id);

      if (edit) {
        const refreshedImages = await api.propertyImages(result.id);
        setExistingImages(
          Array.isArray(refreshedImages)
            ? refreshedImages.map(normalizeImagePreview)
            : []
        );
      }

      setMessage(
        `Đã ${edit ? "cập nhật" : "tạo"} tin #${result.id}${
          imageFiles.length ? " và tải ảnh lên." : "."
        }`
      );

      if (!edit) {
        setFormData(EMPTY_FORM);
        setGeoMessage("");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const previewImages = [...existingImages, ...imageFiles];

  return (
    <div className="container py-5">
      <div className="mb-4">
        <p className="section-mini-title">Dành cho môi giới</p>
        <h1 className="section-heading">
          {edit ? "Sửa tin bất động sản" : "Đăng tin bất động sản"}
        </h1>
        <p className="muted-line">
          {edit
            ? "Cập nhật nội dung, vị trí và thư viện ảnh ngay trên web."
            : "Tạo tin mới, thêm ảnh trước khi lưu và xem vị trí trực tiếp trên bản đồ."}
        </p>
      </div>

      <div className="lead-layout-copy property-form-layout">
        <form className="extra-card form-grid property-form-shell" onSubmit={submit}>
          <label className="extra-field form-wide">
            <span>Tiêu đề</span>
            <input
              value={formData.title}
              onChange={(event) => updateField("title", event.target.value)}
            />
          </label>

          <label className="extra-field">
            <span>Loại bất động sản</span>
            <select
              value={formData.property_type}
              onChange={(event) => updateField("property_type", event.target.value)}
            >
              <option value="apartment">Căn hộ</option>
              <option value="house">Nhà phố</option>
              <option value="land">Đất nền</option>
              <option value="villa">Biệt thự</option>
            </select>
          </label>

          <label className="extra-field">
            <span>Trạng thái</span>
            <select
              value={formData.listing_status}
              onChange={(event) => updateField("listing_status", event.target.value)}
            >
              <option value="pending">Chờ duyệt</option>
              <option value="active">Đang bán</option>
              <option value="sold">Đã bán</option>
            </select>
          </label>

          <label className="extra-field">
            <span>Giá bán</span>
            <input
              inputMode="numeric"
              value={formData.price}
              onChange={(event) => updateField("price", event.target.value)}
            />
          </label>

          <label className="extra-field">
            <span>Diện tích</span>
            <input
              inputMode="decimal"
              value={formData.area}
              onChange={(event) => updateField("area", event.target.value)}
            />
          </label>

          <label className="extra-field form-wide">
            <span>Địa chỉ</span>
            <div className="property-form-address-row">
              <input
                value={formData.address}
                onChange={(event) => updateField("address", event.target.value)}
                placeholder="Ví dụ: 67 Tôn Đức Thắng, Quận 1, TP.HCM"
              />
              <button
                type="button"
                className="btn-geo-secondary"
                onClick={async () => {
                  setIsGeocoding(true);
                  try {
                    const result = await geocodeAddress(formData.address);
                    if (!result) {
                      setGeoMessage("Không tìm thấy vị trí phù hợp.");
                      return;
                    }
                    setFormData((prev) => ({
                      ...prev,
                      lat: result.lat,
                      lng: result.lng,
                    }));
                    setGeoMessage(`Đã ghim vị trí: ${result.label}`);
                  } catch {
                    setGeoMessage("Không tra cứu được địa chỉ lúc này.");
                  } finally {
                    setIsGeocoding(false);
                  }
                }}
              >
                {isGeocoding ? "Đang định vị..." : "Định vị"}
              </button>
            </div>
          </label>

          <div className="form-wide property-form-statusline">
            <span>
              {hasMapPoint
                ? "Vị trí đã được ghim từ địa chỉ."
                : "Nhập địa chỉ để hệ thống tự xác định vị trí trên bản đồ."}
            </span>
            {geoMessage && <strong>{geoMessage}</strong>}
          </div>

          <label className="extra-field form-wide">
            <span>Hình ảnh</span>
            <div className="property-image-uploader">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelection}
              />
              <p className="muted-line">
                Chọn một hoặc nhiều ảnh. Ảnh đầu tiên sẽ được dùng làm ảnh chính nếu tin chưa có ảnh.
              </p>
            </div>
          </label>

          {previewImages.length > 0 && (
            <div className="form-wide property-image-preview-grid">
              {previewImages.map((image, index) => (
                <article className="property-image-preview-card" key={image.id}>
                  <div
                    className="property-image-preview-thumb"
                    style={{ backgroundImage: `url(${image.url})` }}
                  >
                    <span>{image.isPrimary || index === 0 ? "Ảnh chính" : `Ảnh ${index + 1}`}</span>
                  </div>
                  <div className="property-image-preview-body">
                    <strong>{image.label}</strong>
                    {!image.existing && (
                      <button
                        type="button"
                        className="btn-geo-secondary danger-btn"
                        onClick={() => removePendingImage(image.id)}
                      >
                        Bỏ ảnh
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          <label className="extra-field form-wide">
            <span>Mô tả dài</span>
            <SkyEditor
              value={formData.description}
              onChange={(nextValue) => updateField("description", nextValue)}
              placeholder="Mô tả điểm mạnh của bất động sản, pháp lý, nội thất, tiềm năng khai thác..."
            />
          </label>

          <button className="btn-geo-primary form-wide" disabled={isSubmitting}>
            {isSubmitting
              ? "Đang lưu..."
              : edit
                ? "Lưu thay đổi"
                : "Đăng tin"}
          </button>

          {message && (
            <p className="muted-line form-wide">{message}</p>
          )}
        </form>

        <aside className="extra-card property-form-map-card">
          <div className="property-form-map-head">
            <h3>Xem vị trí trên bản đồ</h3>
            <p className="long-text">
              {hasMapPoint
                ? "Địa chỉ đã được ánh xạ lên bản đồ. Tọa độ được lưu ngầm trong backend và không hiển thị trên form."
                : "Map sẽ cập nhật ngay khi hệ thống nhận diện được địa chỉ."}
            </p>
          </div>

          <iframe className="embed-map mt-card" src={mapSrc} title="Map preview" />

          <div className="property-form-map-note">
            <strong>{formData.address || "Chưa có địa chỉ"}</strong>
            <span>
              {hasMapPoint
                ? "Vị trí sẵn sàng cho nearby search và bản đồ chi tiết."
                : "Chưa có điểm ghim để hiển thị chính xác."}
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default PropertyFormPage;
