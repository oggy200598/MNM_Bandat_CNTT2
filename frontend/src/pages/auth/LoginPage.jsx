import {
  useState
} from "react";

import {
  api
} from "../../api";

import PageShell
  from "../../components/layout/PageShell";

export default function LoginPage() {
  const [message, setMessage] =
    useState("");

  const submit = async (event) => {
    event.preventDefault();

    const form = new FormData(
      event.currentTarget
    );

    const result = await api.login({
      username:
        form.get("username"),

      password:
        form.get("password")
    });

    if (result) {
      localStorage.setItem(
        "user",
        JSON.stringify(result)
      );

      setMessage(
        `Đăng nhập thành công`
      );
    } else {
      setMessage(
        "Sai tài khoản hoặc mật khẩu."
      );
    }
  };

  return (
    <PageShell
      eyebrow="Truy cập tài khoản"
      title="Đăng nhập"
      maxWidth="640px"
    >
      <form
        className="extra-card form-stack"
        onSubmit={submit}
      >
        <label className="extra-field">
          <span>
            Tên đăng nhập
          </span>

          <input
            name="username"
          />
        </label>

        <label className="extra-field">
          <span>Mật khẩu</span>

          <input
            type="password"
            name="password"
          />
        </label>

        <button className="btn-geo-primary">
          Đăng nhập
        </button>

        {message && (
          <p className="muted-line">
            {message}
          </p>
        )}
      </form>
    </PageShell>
  );
}