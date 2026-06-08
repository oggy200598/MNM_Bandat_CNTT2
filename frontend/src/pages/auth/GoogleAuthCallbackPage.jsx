import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

function decodeUser(raw) {
  try {
    const normalized =
      String(raw)
        .replace(/-/g, "+")
        .replace(/_/g, "/");
    const padding =
      normalized.length % 4 === 0
        ? ""
        : "=".repeat(4 - (normalized.length % 4));

    return JSON.parse(
      window.atob(
        `${normalized}${padding}`
      )
    );
  } catch {
    return null;
  }
}

export default function GoogleAuthCallbackPage() {
  const [redirect, setRedirect] =
    useState(null);
  const [message, setMessage] =
    useState("Đang xác thực với Google...");

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const error =
      params.get("error");
    const token =
      params.get("token");
    const rawUser =
      params.get("user");
    const returnTo =
      params.get("returnTo");

    if (error) {
      setMessage(
        "Đăng nhập Google chưa hoàn tất. Vui lòng kiểm tra cấu hình OAuth."
      );
      return;
    }

    const user =
      decodeUser(rawUser);

    if (!token || !user) {
      setMessage(
        "Không nhận được dữ liệu đăng nhập từ Google."
      );
      return;
    }

    localStorage.setItem(
      "mnm_bandat_token",
      token
    );
    localStorage.setItem(
      "user",
      JSON.stringify(user)
    );
    window.dispatchEvent(
      new Event("auth-changed")
    );

    if (returnTo) {
      setRedirect(returnTo);
      return;
    }

    if (user.role === "admin") {
      setRedirect("/admin-dashboard");
    } else if (
      user.role === "agent"
    ) {
      setRedirect("/dashboard");
    } else {
      setRedirect(
        "/"
      );
    }
  }, []);

  if (redirect) {
    return <Navigate to={redirect} />;
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <p className="section-mini-title">
            GeoEstate
          </p>
          <h1 className="section-heading">
            Đăng nhập Google
          </h1>
          <p className="muted-line">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
