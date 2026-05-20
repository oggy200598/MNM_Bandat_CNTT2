import { useEffect, useState } from "react";
import "../../App.css";
import { api } from "../../api";

export default function AppointmentCreatePage() {
  const [properties, setProperties] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProperties() {
      try {
        const data = await api.properties();

        if (Array.isArray(data)) {
          setProperties(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadProperties();
  }, []);

  async function submit(event) {
    event.preventDefault();

    const form = new FormData(
      event.currentTarget
    );

    try {
      const result =
        await api.createAppointment({
          lead_id: form.get("lead_id"),
          property_id: form.get("property_id"),
          scheduled_at: form.get("scheduled_at"),
          notes: form.get("notes"),
        });

      if (result?.id) {
        setMessage(
          "Đã tạo lịch hẹn thành công."
        );

        event.currentTarget.reset();
      } else {
        setMessage(
          "Không thể tạo lịch hẹn."
        );
      }
    } catch (error) {
      console.error(error);

      setMessage(
        "Có lỗi xảy ra khi tạo lịch hẹn."
      );
    }
  }

  return (
    <div className="container py-5">
      {/* HEADER */}
      <div className="mb-4">
        <p className="section-mini-title">
          Lịch hẹn xem nhà
        </p>

        <h1 className="section-heading">
          Tạo lịch hẹn
        </h1>

        <p className="muted-line">
          Chọn khách hàng, bất động sản
          và thời gian hẹn.
        </p>
      </div>

      {/* FORM */}
      <form
        className="extra-card form-grid"
        onSubmit={submit}
      >
        <label className="extra-field">
          <span>
            Lead ID
          </span>

          <input
            name="lead_id"
            placeholder="Nhập lead id"
            required
          />
        </label>

        <label className="extra-field">
          <span>
            Bất động sản
          </span>

          <select
            name="property_id"
            required
          >
            <option value="">
              {loading
                ? "Đang tải..."
                : "Chọn bất động sản"}
            </option>

            {properties.map((p) => (
              <option
                value={p.id}
                key={p.id}
              >
                {p.title}
              </option>
            ))}
          </select>
        </label>

        <label className="extra-field">
          <span>
            Thời gian hẹn
          </span>

          <input
            name="scheduled_at"
            type="datetime-local"
            required
          />
        </label>

        <label className="extra-field form-wide">
          <span>
            Ghi chú
          </span>

          <textarea
            name="notes"
            rows="5"
            placeholder="Nhập ghi chú..."
          />
        </label>

        <button
          type="submit"
          className="btn-geo-primary form-wide"
        >
          Tạo lịch hẹn
        </button>

        {message && (
          <p className="muted-line form-wide">
            {message}
          </p>
        )}
      </form>
    </div>
  );
}