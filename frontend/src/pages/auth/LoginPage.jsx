import { useState } from "react";
import { Navigate } from "react-router-dom";

import { api } from "../../api";

export default function LoginPage() {

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [redirect, setRedirect] =
    useState(null);
  const googleLoginUrl =
    `${import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000/api"}`.replace(/\/api$/, "/api/auth/google/start");

  const submit = async (event) => {

    event.preventDefault();

    setLoading(true);

    const form =
      new FormData(
        event.currentTarget
      );

    const result =
      await api.login({

        username:
          form.get("username"),

        password:
          form.get("password")

      });

    setLoading(false);

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

      setMessage(
        `Đăng nhập thành công (${result.user.role})`
      );

      /* ======================
         ROLE REDIRECT
      ====================== */

      if (
        result.user.role === "admin"
      ) {

        setRedirect(
          "/admin-dashboard"
        );

      } else if (
        result.user.role === "agent"
      ) {

        setRedirect(
          "/dashboard"
        );

      } else {

        setRedirect(
          "/customer-dashboard"
        );

      }

    } else {

      setMessage(
        "Sai tài khoản hoặc mật khẩu."
      );

    }

  };

  if (redirect) {

    return (
      <Navigate to={redirect} />
    );

  }

  return (

    <div className="auth-page">

      <form
        className="auth-card"
        onSubmit={submit}
      >

        <div className="auth-header">

          <p className="section-mini-title">
            GeoEstate
          </p>

          <h1 className="section-heading">
            Đăng nhập hệ thống
          </h1>

          <p className="muted-line">
            Truy cập dashboard,
            quản lý bất động sản
            và dữ liệu khách hàng.
          </p>

        </div>

        <label className="extra-field">

          <span>
            Tài khoản
          </span>

          <input
            type="text"
            name="username"
            placeholder="Nhập tài khoản"
            required
          />

        </label>

        <label className="extra-field">

          <span>
            Mật khẩu
          </span>

          <input
            type="password"
            name="password"
            placeholder="••••••••"
            required
          />

        </label>

        <button
          className="btn-geo-primary full"
          disabled={loading}
        >

          {

            loading
              ? "Đang đăng nhập..."
              : "Đăng nhập"

          }

        </button>

        <button
          type="button"
          className="btn-geo-secondary full"
          onClick={() => {
            window.location.href =
              googleLoginUrl;
          }}
        >
          Đăng nhập với Google
        </button>

        {

          message && (

            <p className="muted-line">

              {message}

            </p>

          )

        }

        <div className="auth-links">

          <a href="/register">

            Tạo tài khoản

          </a>

          <a href="/password-reset">

            Quên mật khẩu

          </a>

        </div>

      </form>

    </div>

  );

}
