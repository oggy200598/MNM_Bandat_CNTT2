import { useState } from "react";
import { api } from "../../api";
import "../../App.css";
import usePageMeta from "../../hooks/usePageMeta";
export default function PasswordResetPage() {
  usePageMeta({
    title: "Quên mật khẩu | GeoEstate",
    description: "Gửi yêu cầu đặt lại mật khẩu để tiếp tục truy cập tài khoản và dữ liệu bất động sản trên GeoEstate.",
  });
  const [message, setMessage] =
    useState("");
  const [loading, setLoading] =
    useState(false);

  const submit = async (event) => {
    event.preventDefault();

    const form = new FormData(
      event.currentTarget
    );

    const email = form.get("email");

    setLoading(true);

    const result =
      await api.passwordResetRequest({
        email
      });

    setLoading(false);

    setMessage(
      result?.ok
        ? "Đã ghi nhận yêu cầu đặt lại mật khẩu."
        : "Không thể gửi yêu cầu lúc này."
    );
  };

  return (
    <div className="extra-page">
      <div
        className="container py-5"
        style={{ maxWidth: "640px" }}
      >
        <div className="extra-card card border-0 shadow-sm p-4 p-md-5">
          <h1 className="section-heading mb-4">
            Quên mật khẩu?
          </h1>

          <form
            onSubmit={submit}
            className="form-stack"
          >
            <label className="extra-field">
              <span>
                Email đăng ký
              </span>

              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="name@example.com"
                required
              />
            </label>

            <button
              type="submit"
              className="btn-geo-primary btn btn-primary"
              disabled={loading}
            >
              {loading
                ? "Đang gửi..."
                : "Gửi mã xác nhận"}
            </button>
          </form>

          {message && (
            <div
              className="alert alert-warning"
              style={{
                marginTop: "20px",
              }}
            >
              {message}
            </div>
          )}

          <div className="mt-4">
            <a
              href="/login"
              className="back-link"
            >
              ← Quay lại đăng nhập
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
