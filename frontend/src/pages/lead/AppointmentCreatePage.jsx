import useState from "react";

import PageShell from "../../components/layout/PageShell";

import { api } from "../../api";

import sampleProperties from "../../data/sampleProperties";

export default function AppointmentCreatePage() {

  const [message, setMessage] =
    useState("");

  const submit = async (
    event
  ) => {

    event.preventDefault();

    const form =
      new FormData(
        event.currentTarget
      );

    const result =
      await api.createAppointment({

        lead_id:
          form.get("lead_id"),

        property_id:
          form.get("property_id"),

        scheduled_at:
          form.get("scheduled_at"),

        notes:
          form.get("notes")

      });

    setMessage(

      result?.id

        ? "Đã tạo lịch hẹn trong backend."

        : "Chưa tạo được lịch hẹn. Cần lead/property ID thật."

    );

  };

  return (

    <PageShell
      eyebrow="Lịch hẹn xem nhà"
      title="Tạo lịch hẹn"
      desc="Chọn khách hàng, bất động sản và thời gian hẹn."
    >

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
            placeholder="1"
          />

        </label>

        <label className="extra-field">

          <span>
            Bất động sản
          </span>

          <select name="property_id">

            {

              sampleProperties.map((p) => (

                <option
                  value={p.id}
                  key={p.id}
                >

                  {p.title}

                </option>

              ))

            }

          </select>

        </label>

        <label className="extra-field">

          <span>
            Thời gian hẹn
          </span>

          <input
            name="scheduled_at"
            type="datetime-local"
          />

        </label>

        <label className="extra-field form-wide">

          <span>
            Ghi chú
          </span>

          <textarea
            name="notes"
            rows="5"
          />

        </label>

        <button className="btn-admin form-wide">

          Tạo lịch hẹn

        </button>

        {

          message && (

            <p className="muted-line form-wide">

              {message}

            </p>

          )

        }

      </form>

    </PageShell>

  );

}