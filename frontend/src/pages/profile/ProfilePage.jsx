import { useEffect, useState } from "react";

import PageShell from "../../components/layout/PageShell";
import Field from "../../components/forms/Field";

import { api } from "../../api";

export default function ProfilePage() {
  const [message, setMessage] = useState("");

  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    role: "user",
    linked_agent_id: "",
  });

  useEffect(() => {
    api.me().then((data) => {
      if (data) {
        setProfile({
          full_name: data.full_name || "",
          email: data.email || "",
          role: data.role || "user",
          linked_agent_id: data.linked_agent_id || "",
        });
      }
    });
  }, []);

  const submit = async (event) => {
    event.preventDefault();

    const result = await api.updateProfile(profile);

    if (result?.id) {
      setMessage(
        `Đã lưu hồ sơ: ${
          result.full_name || result.username
        } (${result.role})`
      );
    } else {
      setMessage("Chưa lưu được hồ sơ.");
    }
  };

  return (
    <PageShell
      eyebrow="Hồ sơ người dùng"
      title={profile.full_name || profile.role || "Hồ sơ"}
      desc={`Vai trò: ${profile.role || "user"}`}
      maxWidth="760px"
    >
      <form
        className="extra-card form-grid"
        onSubmit={submit}
      >
        <Field
          label="Họ và tên"
          placeholder="Ken"
          value={profile.full_name}
          onChange={(e) =>
            setProfile((prev) => ({
              ...prev,
              full_name: e.target.value,
            }))
          }
        />

        <Field
          label="Email"
          type="email"
          value={profile.email}
          onChange={(e) =>
            setProfile((prev) => ({
              ...prev,
              email: e.target.value,
            }))
          }
        />

        <label className="extra-field">
          <span>Vai trò</span>

          <select
            value={profile.role}
            onChange={(e) =>
              setProfile((prev) => ({
                ...prev,
                role: e.target.value,
              }))
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
          <span>Môi giới liên kết</span>

          <input
            value={profile.linked_agent_id}
            onChange={(e) =>
              setProfile((prev) => ({
                ...prev,
                linked_agent_id: e.target.value,
              }))
            }
            placeholder="ID môi giới"
          />
        </label>

        <button className="btn-geo-primary form-wide">
          Lưu hồ sơ
        </button>

        {message && (
          <p className="muted-line form-wide">
            {message}
          </p>
        )}
      </form>
    </PageShell>
  );
}