import { useState } from "react";
import "../ExtraPages.css";

export default function PasswordResetPage() {
  const [message, setMessage] =
    useState("");

  const submit = (event) => {
    event.preventDefault();

    const form = new FormData(
      event.currentTarget
    );

    const email = form.get("email");

    console.log({
      email,
    });

    setMessage(
      "Đã gửi mã xác nhận 6 số tới email của bạn."
    );
  };

  return (
    <div className="extra-page">
      <div
        className="container py-5"
        style={{ maxWidth: "640px" }}
      >
        <div className="extra-card p-4 p-md-5">
          <p className="section-eyebrow">
            Khôi phục quyền truy cập
          </p>

          <h1 className="section-heading mb-4">
            Quên mật khẩu?
          </h1>

          <p className="extra-desc mb-4">
            Nhập email của bạn.
            Chúng tôi sẽ gửi một mã
            xác nhận 6 số để bạn
            thiết lập lại mật khẩu.
          </p>

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
                placeholder="name@example.com"
                required
              />
            </label>

            <button
              type="submit"
              className="btn-geo-primary"
            >
              Gửi mã xác nhận
            </button>
          </form>

          {message && (
            <div
              className="alert-box"
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