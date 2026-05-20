import useState from "react";

import PageShell from "../../components/layout/PageShell";
import Field from "../../components/forms/Field";

import { api } from "../../api";

export default function LeadFormPage() {

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
      await api.createLead({

        name:
          form.get("name"),

        phone:
          form.get("phone"),

        budget:
          form.get("budget")
          || null,

        property_interest:
          form.get("interest"),

        notes:
          form.get("notes"),

        desired_lat:
          form.get("desired_lat")
          || null,

        desired_lng:
          form.get("desired_lng")
          || null,

      });

    setMessage(

      result?.id

        ? "Đã gửi lead vào backend."

        : "Chưa gửi được lead."

    );

  };

  return (

    <PageShell
      eyebrow="Biểu mẫu khách hàng"
      title="Gửi nhu cầu tư vấn"
      desc="Điền thông tin để hệ thống tự gán môi giới gần nhất."
    >

      <div className="lead-layout-copy">

        <form
          className="extra-card form-grid"
          onSubmit={submit}
        >

          <label className="extra-field">

            <span>
              Họ tên
            </span>

            <input name="name" />

          </label>

          <label className="extra-field">

            <span>
              Số điện thoại
            </span>

            <input name="phone" />

          </label>

          <Field
            label="Email"
            type="email"
          />

          <label className="extra-field">

            <span>
              Nhu cầu
            </span>

            <select name="interest">

              <option>
                Mua nhà
              </option>

              <option>
                Thuê nhà
              </option>

              <option>
                Đầu tư
              </option>

            </select>

          </label>

          <label className="extra-field">

            <span>
              Ngân sách
            </span>

            <input
              name="budget"
              placeholder="VD: 5000000000"
            />

          </label>

          <Field
            label="Khu vực quan tâm"
            name="desired_lng"
            placeholder="Kinh độ"
          />

          <Field
            label="Tọa độ vĩ độ"
            name="desired_lat"
            placeholder="Vĩ độ"
          />

          <label className="extra-field form-wide">

            <span>
              Ghi chú
            </span>

            <textarea
              name="notes"
              rows="5"
              placeholder="Mô tả thêm nhu cầu của bạn"
            />

          </label>

          <button className="btn-geo-primary form-wide">

            Gửi thông tin

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
            Quy trình
          </h3>

          <ol className="timeline">

            <li>
              Tiếp nhận nhu cầu
            </li>

            <li>
              Gợi ý bất động sản phù hợp
            </li>

            <li>
              Đặt lịch xem nhà
            </li>

            <li>
              Theo dõi sau tư vấn
            </li>

          </ol>

        </aside>

      </div>

    </PageShell>

  );

}