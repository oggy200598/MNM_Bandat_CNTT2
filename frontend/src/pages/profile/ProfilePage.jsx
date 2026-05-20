import { useEffect, useState } from "react";
import { api } from "../../api";

export default function ProfilePage() {

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [profile, setProfile] =
    useState({

      username: "",
      full_name: "",
      email: "",
      role: "user",
      linked_agent_id: ""

    });

  useEffect(() => {

    async function loadProfile() {

      try {

        const data =
          await api.me();

        if (data) {

          setProfile({

            username:
              data.username || "",

            full_name:
              data.full_name || "",

            email:
              data.email || "",

            role:
              data.role || "user",

            linked_agent_id:
              data.linked_agent_id || ""

          });

        }

      } finally {

        setLoading(false);

      }

    }

    loadProfile();

  }, []);

  const updateField = (
    field,
    value
  ) => {

    setProfile((prev) => ({

      ...prev,

      [field]: value

    }));

  };

  const submit = async (
    event
  ) => {

    event.preventDefault();

    setMessage("");

    const result =
      await api.updateProfile(
        profile
      );

    setMessage(

      result?.id

        ? `Đã lưu hồ sơ cho ${result.full_name || result.username}.`

        : "Không thể cập nhật hồ sơ."

    );

  };

  return (

    <div className="profile-page">

      <div className="profile-bg" />

      <div className="container">

        <div className="profile-header">

          <div className="profile-avatar">

            {

              profile.full_name
                ?.charAt(0)
                ?.toUpperCase() || "U"

            }

          </div>

          <div>

            <p className="profile-eyebrow">

              HỒ SƠ NGƯỜI DÙNG

            </p>

            <h1>

              {

                profile.full_name
                || "Tài khoản"

              }

            </h1>

            <p>

              Vai trò:
              {" "}
              {

                profile.role === "admin"
                  ? "Quản trị viên"
                  : profile.role === "agent"
                  ? "Môi giới"
                  : "Khách hàng"

              }

            </p>

          </div>

        </div>

        <form
          className="extra-card profile-form"
          onSubmit={submit}
        >

          <div className="form-grid">

            <label className="extra-field">

              <span>
                Tài khoản
              </span>

              <input
                value={profile.username}
                onChange={(e) =>

                  updateField(
                    "username",
                    e.target.value
                  )

                }
                placeholder="ten-tai-khoan"
              />

            </label>

            <label className="extra-field">

              <span>
                Họ và tên
              </span>

              <input
                value={profile.full_name}
                onChange={(e) =>

                  updateField(
                    "full_name",
                    e.target.value
                  )

                }
                placeholder="Nguyễn Văn A"
              />

            </label>

            <label className="extra-field">

              <span>
                Email liên hệ
              </span>

              <input
                type="email"
                value={profile.email}
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
                Vai trò
              </span>

              <select
                value={profile.role}
                onChange={(e) =>

                  updateField(
                    "role",
                    e.target.value
                  )

                }
              >

                <option value="user">

                  Khách hàng

                </option>

                <option value="agent">

                  Môi giới

                </option>

                <option value="admin">

                  Admin

                </option>

              </select>

            </label>

            <label className="extra-field">

              <span>
                Môi giới liên kết
              </span>

              <input
                value={profile.linked_agent_id}
                onChange={(e) =>

                  updateField(
                    "linked_agent_id",
                    e.target.value
                  )

                }
                placeholder="ID môi giới"
              />

            </label>

          </div>

          <button
            className="btn-geo-primary profile-btn"
            disabled={loading}
          >

            {

              loading
                ? "Đang tải..."
                : "Lưu hồ sơ"

            }

          </button>

          {

            message && (

              <p className="muted-line">

                {message}

              </p>

            )

          }

        </form>

      </div>

    </div>

  );

}
