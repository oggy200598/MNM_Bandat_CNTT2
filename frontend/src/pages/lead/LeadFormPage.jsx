import { useState } from "react";
import { api } from "../../api";

export default function LeadFormPage() {

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [formData, setFormData] =
    useState({

      name: "",
      phone: "",
      email: "",
      interest: "Mua nhà",
      budget: "",
      desired_lat: "",
      desired_lng: "",
      notes: ""

    });

  const updateField = (
    field,
    value
  ) => {

    setFormData((prev) => ({

      ...prev,

      [field]: value

    }));

  };

  const submit = async (
    event
  ) => {

    event.preventDefault();

    setLoading(true);

    const result =
      await api.createLead({

        name:
          formData.name,

        phone:
          formData.phone,

        email:
          formData.email,

        budget:
          formData.budget || null,

        property_interest:
          formData.interest,

        notes:
          formData.notes,

        desired_lat:
          formData.desired_lat || null,

        desired_lng:
          formData.desired_lng || null,

      });

    setLoading(false);

    setMessage(

      result?.id

        ? "Đã gửi thông tin thành công."

        : "Không thể gửi thông tin."

    );

  };

  return (

    <div className="lead-page">

      <div className="lead-bg" />

      <div className="container">

        <div className="lead-header">

          <p className="lead-eyebrow">

            BIỂU MẪU KHÁCH HÀNG

          </p>

          <h1>

            Gửi nhu cầu tư vấn

          </h1>

          <p>

            Hệ thống sẽ tự động gợi ý
            môi giới và bất động sản phù hợp.

          </p>

        </div>

        <div className="lead-layout-copy">

          <form
            className="extra-card form-grid"
            onSubmit={submit}
          >

            <label className="extra-field">

              <span>
                Họ tên
              </span>

              <input
                value={formData.name}
                onChange={(e) =>

                  updateField(
                    "name",
                    e.target.value
                  )

                }
                placeholder="Nguyễn Văn A"
              />

            </label>

            <label className="extra-field">

              <span>
                Số điện thoại
              </span>

              <input
                value={formData.phone}
                onChange={(e) =>

                  updateField(
                    "phone",
                    e.target.value
                  )

                }
                placeholder="0901234567"
              />

            </label>

            <label className="extra-field">

              <span>
                Email
              </span>

              <input
                type="email"
                value={formData.email}
                onChange={(e) =>

                  updateField(
                    "email",
                    e.target.value
                  )

                }
                placeholder="example@email.com"
              />

            </label>

            <label className="extra-field">

              <span>
                Nhu cầu
              </span>

              <select
                value={formData.interest}
                onChange={(e) =>

                  updateField(
                    "interest",
                    e.target.value
                  )

                }
              >

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
                value={formData.budget}
                onChange={(e) =>

                  updateField(
                    "budget",
                    e.target.value
                  )

                }
                placeholder="5000000000"
              />

            </label>

            <label className="extra-field">

              <span>
                Kinh độ
              </span>

              <input
                value={formData.desired_lng}
                onChange={(e) =>

                  updateField(
                    "desired_lng",
                    e.target.value
                  )

                }
                placeholder="106.700"
              />

            </label>

            <label className="extra-field">

              <span>
                Vĩ độ
              </span>

              <input
                value={formData.desired_lat}
                onChange={(e) =>

                  updateField(
                    "desired_lat",
                    e.target.value
                  )

                }
                placeholder="10.776"
              />

            </label>

            <label className="extra-field form-wide">

              <span>
                Ghi chú
              </span>

              <textarea
                rows="5"
                value={formData.notes}
                onChange={(e) =>

                  updateField(
                    "notes",
                    e.target.value
                  )

                }
                placeholder="Mô tả nhu cầu của bạn..."
              />

            </label>

            <button
              className="btn-geo-primary form-wide"
              disabled={loading}
            >

              {

                loading
                  ? "Đang gửi..."
                  : "Gửi thông tin"

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

          <aside className="extra-card lead-side">

            <h3>

              Quy trình tư vấn

            </h3>

            <ol className="timeline">

              <li>
                Tiếp nhận yêu cầu
              </li>

              <li>
                Phân tích vị trí phù hợp
              </li>

              <li>
                Kết nối môi giới
              </li>

              <li>
                Đặt lịch xem nhà
              </li>

              <li>
                Hỗ trợ giao dịch
              </li>

            </ol>

          </aside>

        </div>

      </div>

    </div>

  );

}