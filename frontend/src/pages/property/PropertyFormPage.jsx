import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../api";

export function PropertyFormPage({ edit = false }) {
  const { id: routeId } =
    useParams();

  const [message, setMessage] =
    useState("");

  const [formData, setFormData] =
    useState({

      title: "",

      property_type:
        "apartment",

      listing_status:
        "pending",

      price: "",

      area: "",

      address: "",

      lat: "",

      lng: "",

      description: ""

    });

  function queryId() {

    const params =
      new URLSearchParams(
        window.location.search
      );

    return params.get("id");

  }

  useEffect(() => {

    if (!edit) return;

    async function loadProperty() {

      const id =
        routeId ||
        queryId() ||
        "1";

      const data =
        await api.property(id);

      if (!data) return;

      setFormData({

        title:
          data.title || "",

        property_type:
          data.property_type
          || "apartment",

        listing_status:
          data.listing_status
          || "pending",

        price:
          data.price ?? "",

        area:
          data.area ?? "",

        address:
          data.address || "",

        lat:
          data.lat ?? "",

        lng:
          data.lng ?? "",

        description:
          data.description || ""

      });

    }

    loadProperty();

  }, [edit, routeId]);

  const updateField = (
    field,
    value
  ) =>

    setFormData((prev) => ({

      ...prev,

      [field]: value

    }));

  const submit = async (
    event
  ) => {

    event.preventDefault();

    const payload = {

      ...formData,

      price:
        formData.price || null,

      area:
        formData.area || null,

      lat:
        formData.lat || null,

      lng:
        formData.lng || null

    };

    const id =
      routeId ||
      queryId() ||
      "1";

    const result =
      edit

        ? await api.updateProperty(
            id,
            payload
          )

        : await api.createProperty(
            payload
          );

    setMessage(

      result?.id

        ? `Đã ${
            edit
              ? "cập nhật"
              : "tạo"
          } tin #${result.id}.`

        : "Chưa lưu được tin."

    );

  };

  return (

    <div className="container py-5">

      <div className="mb-4">

        <p className="section-mini-title">

          Dành cho môi giới

        </p>

        <h1 className="section-heading">

          {

            edit
              ? "Sửa tin bất động sản"
              : "Đăng tin bất động sản"

          }

        </h1>

        <p className="muted-line">

          {

            edit

              ? "Cập nhật thông tin, vị trí và mô tả."

              : "Tạo tin mới và lưu dữ liệu vào backend."

          }

        </p>

      </div>

      <div className="lead-layout-copy">

        <form
          className="extra-card form-grid"
          onSubmit={submit}
        >

          <label className="extra-field form-wide">

            <span>
              Tiêu đề
            </span>

            <input
              value={formData.title}
              onChange={(e) =>

                updateField(
                  "title",
                  e.target.value
                )

              }
            />

          </label>

          <label className="extra-field">

            <span>
              Loại bất động sản
            </span>

            <select
              value={formData.property_type}
              onChange={(e) =>

                updateField(
                  "property_type",
                  e.target.value
                )

              }
            >

              <option value="apartment">
                Căn hộ
              </option>

              <option value="house">
                Nhà phố
              </option>

              <option value="land">
                Đất nền
              </option>

            </select>

          </label>

          <label className="extra-field">

            <span>
              Trạng thái
            </span>

            <select
              value={formData.listing_status}
              onChange={(e) =>

                updateField(
                  "listing_status",
                  e.target.value
                )

              }
            >

              <option value="pending">
                Chờ duyệt
              </option>

              <option value="active">
                Đang bán
              </option>

              <option value="sold">
                Đã bán
              </option>

            </select>

          </label>

          <label className="extra-field">

            <span>
              Giá bán
            </span>

            <input
              value={formData.price}
              onChange={(e) =>

                updateField(
                  "price",
                  e.target.value
                )

              }
            />

          </label>

          <label className="extra-field">

            <span>
              Diện tích
            </span>

            <input
              value={formData.area}
              onChange={(e) =>

                updateField(
                  "area",
                  e.target.value
                )

              }
            />

          </label>

          <label className="extra-field form-wide">

            <span>
              Địa chỉ
            </span>

            <input
              value={formData.address}
              onChange={(e) =>

                updateField(
                  "address",
                  e.target.value
                )

              }
            />

          </label>

          <label className="extra-field">

            <span>
              Vĩ độ
            </span>

            <input
              value={formData.lat}
              onChange={(e) =>

                updateField(
                  "lat",
                  e.target.value
                )

              }
            />

          </label>

          <label className="extra-field">

            <span>
              Kinh độ
            </span>

            <input
              value={formData.lng}
              onChange={(e) =>

                updateField(
                  "lng",
                  e.target.value
                )

              }
            />

          </label>

          <label className="extra-field form-wide">

            <span>
              Mô tả
            </span>

            <textarea
              rows="5"
              value={formData.description}
              onChange={(e) =>

                updateField(
                  "description",
                  e.target.value
                )

              }
            />

          </label>

          <button className="btn-geo-primary form-wide">

            {

              edit
                ? "Lưu thay đổi"
                : "Đăng tin"

            }

          </button>

          {

            message && (

              <p className="muted-line form-wide">

                {message}

              </p>

            )

          }

        </form>

        <aside className="extra-card">

          <h3>
            Chọn vị trí
          </h3>

          <p className="long-text">

            Nhập tọa độ để backend lưu geo point thật.
            Nearby search và bản đồ sẽ dùng dữ liệu này.

          </p>

          <iframe
            className="embed-map mt-card"
            src="https://www.openstreetmap.org/export/embed.html?bbox=106.5,10.65,106.85,10.9&layer=mapnik"
            title="Map"
          />

        </aside>

      </div>

    </div>

  );

}

export default PropertyFormPage;
