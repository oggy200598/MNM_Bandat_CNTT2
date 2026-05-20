import {
  useEffect,
  useState,
  useCallback
} from "react";
import { useParams } from "react-router-dom";

import { api } from "../../api";

export default function ImagesManagePage() {
  const { id: routeId } =
    useParams();

  function queryId() {

    const params =
      new URLSearchParams(
        window.location.search
      );

    return params.get("id");

  }

  const id =
    routeId ||
    queryId() ||
    "1";

  const [property, setProperty] =
    useState(null);

  const [images, setImages] =
    useState([]);

  const [form, setForm] =
    useState({

      file: null,

      caption: "",

      sort_order: 0

    });

  const [message, setMessage] =
    useState("");

  const refresh = useCallback(
    async () => {

      const data =
        await api.property(id);

      if (data) {

        setProperty(data);

        setImages(
          data.images || []
        );

      } else {

        setProperty(null);

        setImages([]);

      }

    },
    [id]
  );

useEffect(() => {

  async function loadData() {

    const data =
      await api.property(id);

    if (data) {

      setProperty(data);

      setImages(
        data.images || []
      );

    } else {

      setProperty(null);

      setImages([]);

    }

  }

  loadData();

}, [id]);

  const submit = async (
    event
  ) => {

    event.preventDefault();

    const result =
      await api.createPropertyImage(
        id,
        form
      );

    if (result?.id) {

      setForm({

        file: null,

        caption: "",

        sort_order: 0

      });

      setMessage(
        "Đã tải ảnh lên backend."
      );

      refresh();

    } else {

      setMessage(
        "Chưa tải được ảnh."
      );

    }

  };

  return (

    <div className="container py-5">

      <div className="mb-4">

        <p className="section-mini-title">
          Quản lý ảnh
        </p>

        <h1 className="section-heading">
          Ảnh bất động sản
        </h1>

        <p className="muted-line">

          {
            property?.title ||
            "Chưa có dữ liệu."
          }

        </p>

      </div>

      <form
        className="extra-card form-stack"
        onSubmit={submit}
      >

        <label className="extra-field">

          <span>
            Chọn file ảnh
          </span>

          <input
            type="file"
            accept="image/*"
            onChange={(e) =>

              setForm((prev) => ({

                ...prev,

                file:
                  e.target.files?.[0]
                  || null

              }))

            }
          />

        </label>

        <label className="extra-field">

          <span>
            Caption
          </span>

          <input
            value={form.caption}
            onChange={(e) =>

              setForm((prev) => ({

                ...prev,

                caption:
                  e.target.value

              }))

            }
          />

        </label>

        <label className="extra-field">

          <span>
            Thứ tự
          </span>

          <input
            type="number"
            value={form.sort_order}
            onChange={(e) =>

              setForm((prev) => ({

                ...prev,

                sort_order:
                  Number(
                    e.target.value
                  )

              }))

            }
          />

        </label>

        <button
          className="btn-geo-primary"
          type="submit"
        >

          Thêm ảnh

        </button>

        {

          message && (

            <p className="muted-line">

              {message}

            </p>

          )

        }

      </form>

      <div className="media-grid mt-4">

        {

          images.map((img, i) => (

            <article
              className="mini-property-card"
              key={img.id}
            >

              <div
                className="mini-media"
                style={{
                  backgroundImage:
                    `url(${img.image})`
                }}
              >

                <span>

                  {

                    img.is_primary
                      ? "Ảnh chính"
                      : "Ảnh phụ"

                  }

                </span>

              </div>

              <div className="mini-content">

                <strong>

                  Thứ tự
                  {" "}

                  {

                    img.sort_order
                    ?? i

                  }

                </strong>

                <p className="muted-line">

                  {

                    img.caption
                    || property?.title

                  }

                </p>

                <div className="pill-row mt-3">

                  <button
                    className="btn-geo-secondary"
                    type="button"
                    onClick={async () => {

                      await api.setPrimaryImage(
                        img.id
                      );

                      refresh();

                    }}
                  >

                    Đặt ảnh chính

                  </button>

                  <button
                    className="btn-geo-secondary"
                    type="button"
                    onClick={async () => {

                      await api.deletePropertyImage(
                        img.id
                      );

                      refresh();

                    }}
                  >

                    Xóa

                  </button>

                </div>

              </div>

            </article>

          ))

        }

      </div>

    </div>

  );

}
