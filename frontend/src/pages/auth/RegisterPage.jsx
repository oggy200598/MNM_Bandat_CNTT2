import { useState } from "react";
import { Navigate } from "react-router-dom";

import { api } from "../../api";
import "../../App.css";

export default function RegisterPage() {
  const [message, setMessage] = useState("");
  const [redirect, setRedirect] = useState(false);

  const submit = async (event) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    const password = form.get("password");
    const confirm = form.get("confirm_password");

    if (password !== confirm) {
      setMessage("Mật khẩu nhập lại không khớp.");
      return;
    }

    const payload = {
      username: form.get("username"),
      full_name: form.get("full_name"),
      email: form.get("email"),
      role: form.get("role"),
      password,
    };

    const result =
      await api.register(payload);

    if (
      result?.token &&
      result?.user
    ) {
      localStorage.setItem(
        "user",
        JSON.stringify(
          result.user
        )
      );
      window.dispatchEvent(
        new Event("auth-changed")
      );
      setMessage("Đăng ký thành công!");
      setRedirect(true);
      return;
    }

    setMessage(
      "Không thể tạo tài khoản."
    );
  };

  if (redirect) {
    return (
      <Navigate to="/customer-dashboard" />
    );
  }

  return (
    <div className="extra-page">
      <div
        className="container py-5"
        style={{ maxWidth: "760px" }}
      >
        <div className="extra-card p-4 p-md-5">
          <p className="section-eyebrow">
            Tạo tài khoản
          </p>

          <h1 className="section-heading mb-4">
            Đăng ký
          </h1>

          <form
            onSubmit={submit}
            className="form-grid"
          >
            <label className="extra-field">
              <span>Tài khoản</span>

              <input
                type="text"
                name="username"
                placeholder="Nhập tài khoản"
                required
              />
            </label>

            <label className="extra-field">
              <span>Họ tên</span>

              <input
                type="text"
                name="full_name"
              />
            </label>

            <label className="extra-field">
              <span>Email liên hệ</span>

              <input
                type="email"
                name="email"
                placeholder="name@example.com"
              />
            </label>

            <label className="extra-field">
              <span>Vai trò</span>

              <select name="role">
                <option value="user">
                  Khách hàng
                </option>

                <option value="agent">
                  Môi giới
                </option>
              </select>
            </label>

            <label className="extra-field">
              <span>Mật khẩu</span>

              <input
                type="password"
                name="password"
                required
              />
            </label>

            <label className="extra-field">
              <span>Nhập lại mật khẩu</span>

              <input
                type="password"
                name="confirm_password"
                required
              />
            </label>

            {message && (
              <div className="form-wide">
                <div className="alert-box">
                  {message}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn-geo-primary form-wide"
            >
              Tạo tài khoản
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
