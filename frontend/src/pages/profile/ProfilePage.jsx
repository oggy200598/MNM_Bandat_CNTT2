import { useEffect, useMemo, useState } from "react";
import { api } from "../../api";

function roleLabel(role) {
  return role === "admin"
    ? "Quản trị viên"
    : role === "agent"
    ? "Môi giới"
    : "Khách hàng";
}

function accountTone(role) {
  return role === "admin"
    ? "accent"
    : role === "agent"
    ? "gold"
    : "info";
}

export default function ProfilePage() {
  const [message, setMessage] =
    useState("");
  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);
  const [savedSearches, setSavedSearches] =
    useState([]);
  const [wishlist, setWishlist] =
    useState([]);
  const [profile, setProfile] =
    useState({
      username: "",
      full_name: "",
      email: "",
      role: "user",
      password: "",
      confirmPassword: ""
    });

  useEffect(() => {
    async function loadProfile() {
      try {
        const [
          profileData,
          wishlistData,
          savedSearchData
        ] = await Promise.all([
          api.me(),
          api.wishlist(),
          api.savedSearches()
        ]);

        if (profileData) {
          setProfile((prev) => ({
            ...prev,
            username:
              profileData.username ||
              "",
            full_name:
              profileData.full_name ||
              "",
            email:
              profileData.email ||
              "",
            role:
              profileData.role ||
              "user"
          }));
        }

        setWishlist(
          Array.isArray(wishlistData)
            ? wishlistData
            : []
        );
        setSavedSearches(
          Array.isArray(savedSearchData)
            ? savedSearchData
            : []
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const profileStats = useMemo(
    () => [
      {
        label: "Tin đã lưu",
        value: wishlist.length,
        note:
          wishlist[0]?.title ||
          "Chưa có bất động sản nào được lưu"
      },
      {
        label: "Bộ lọc đã lưu",
        value: savedSearches.length,
        note:
          savedSearches[0]?.name ||
          "Chưa có bộ lọc nào"
      },
      {
        label: "Loại tài khoản",
        value: roleLabel(profile.role),
        note:
          profile.role === "admin"
            ? "Toàn quyền quản trị hệ thống"
            : profile.role ===
              "agent"
            ? "Theo dõi khách hàng và nguồn hàng"
            : "Lưu tin và quản lý hành trình tìm kiếm"
      }
    ],
    [profile.role, savedSearches, wishlist]
  );

  const recentWishlist =
    wishlist.slice(0, 3);
  const recentSearches =
    savedSearches.slice(0, 3);

  function updateField(
    field,
    value
  ) {
    setProfile((prev) => ({
      ...prev,
      [field]: value
    }));
  }

  async function submit(
    event
  ) {
    event.preventDefault();
    setMessage("");

    if (
      profile.password &&
      profile.password !==
        profile.confirmPassword
    ) {
      setMessage(
        "Mật khẩu xác nhận chưa khớp."
      );
      return;
    }

    setSaving(true);

    const payload = {
      username:
        profile.username,
      full_name:
        profile.full_name,
      email:
        profile.email
    };

    if (profile.password) {
      payload.password =
        profile.password;
    }

    const result =
      await api.updateProfile(
        payload
      );

    setSaving(false);

    if (result?.id) {
      const nextUser = {
        ...JSON.parse(
          localStorage.getItem(
            "user"
          ) || "null"
        ),
        ...result
      };

      localStorage.setItem(
        "user",
        JSON.stringify(nextUser)
      );
      window.dispatchEvent(
        new Event("auth-changed")
      );

      setProfile((prev) => ({
        ...prev,
        password: "",
        confirmPassword: ""
      }));
      setMessage(
        `Đã lưu hồ sơ cho ${
          result.full_name ||
          result.username
        }.`
      );
      return;
    }

    setMessage(
      "Không thể cập nhật hồ sơ."
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-bg" />

      <div className="container">
        <div className="profile-header">
          <div className="profile-avatar">
            {profile.full_name
              ?.charAt(0)
              ?.toUpperCase() ||
              "U"}
          </div>

          <div className="profile-header-copy">
            <p className="profile-eyebrow">
              HỒ SƠ KHÁCH HÀNG
            </p>

            <h1>
              {profile.full_name ||
                "Tài khoản"}
            </h1>

            <div className="profile-chip-row">
              <span
                className={`profile-role-chip tone-${accountTone(
                  profile.role
                )}`}
              >
                {roleLabel(profile.role)}
              </span>
              <span className="profile-role-chip tone-default">
                @{profile.username ||
                  "username"}
              </span>
            </div>

            <p>
              Quản lý thông tin cá nhân,
              tài khoản đăng nhập và các
              nội dung bạn đã lưu ngay
              trong một nơi.
            </p>
          </div>
        </div>

        <section className="profile-metric-grid">
          {profileStats.map((item) => (
            <article
              className="extra-card profile-metric-card"
              key={item.label}
            >
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p className="muted-line">
                {item.note}
              </p>
            </article>
          ))}
        </section>

        <div className="profile-shell">
          <form
            className="extra-card profile-form"
            onSubmit={submit}
          >
            <div className="profile-section-head">
              <div>
                <h3>
                  Thông tin tài khoản
                </h3>
                <p className="muted-line">
                  Cập nhật thông tin hiển
                  thị và email liên hệ.
                </p>
              </div>
            </div>

            <div className="form-grid">
              <label className="extra-field">
                <span>
                  Tài khoản
                </span>
                <input
                  value={
                    profile.username
                  }
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
                  value={
                    profile.full_name
                  }
                  onChange={(e) =>
                    updateField(
                      "full_name",
                      e.target.value
                    )
                  }
                  placeholder="Nguyễn Văn A"
                />
              </label>

              <label className="extra-field full-span">
                <span>
                  Email liên hệ
                </span>
                <input
                  type="email"
                  value={
                    profile.email
                  }
                  onChange={(e) =>
                    updateField(
                      "email",
                      e.target.value
                    )
                  }
                  placeholder="example@email.com"
                />
              </label>
            </div>

            <div className="profile-section-head">
              <div>
                <h3>
                  Bảo mật đăng nhập
                </h3>
                <p className="muted-line">
                  Để trống nếu bạn chưa
                  muốn đổi mật khẩu.
                </p>
              </div>
            </div>

            <div className="form-grid">
              <label className="extra-field">
                <span>
                  Mật khẩu mới
                </span>
                <input
                  type="password"
                  value={
                    profile.password
                  }
                  onChange={(e) =>
                    updateField(
                      "password",
                      e.target.value
                    )
                  }
                  placeholder="••••••••"
                />
              </label>

              <label className="extra-field">
                <span>
                  Xác nhận mật khẩu
                </span>
                <input
                  type="password"
                  value={
                    profile.confirmPassword
                  }
                  onChange={(e) =>
                    updateField(
                      "confirmPassword",
                      e.target.value
                    )
                  }
                  placeholder="Nhập lại mật khẩu mới"
                />
              </label>
            </div>

            <div className="profile-form-actions">
              <button
                className="btn-geo-primary profile-btn"
                disabled={
                  loading || saving
                }
              >
                {loading || saving
                  ? "Đang lưu..."
                  : "Lưu hồ sơ"}
              </button>

              {message && (
                <p className="muted-line">
                  {message}
                </p>
              )}
            </div>
          </form>

          <aside className="profile-side-stack">
            <section className="extra-card profile-side-card">
              <div className="profile-section-head compact">
                <div>
                  <h3>
                    Tin đã lưu gần đây
                  </h3>
                  <p className="muted-line">
                    {wishlist.length} bất
                    động sản đang theo
                    dõi
                  </p>
                </div>
                <a
                  href="/wishlist"
                  className="btn-geo-secondary"
                >
                  Xem tất cả
                </a>
              </div>

              {recentWishlist.length ? (
                <div className="profile-list-stack">
                  {recentWishlist.map(
                    (item) => (
                      <a
                        key={item.id}
                        href={`/property-detail/${item.id}`}
                        className="profile-list-row"
                      >
                        <strong>
                          {item.title}
                        </strong>
                        <span className="muted-line">
                          {item.address}
                        </span>
                      </a>
                    )
                  )}
                </div>
              ) : (
                <p className="muted-line">
                  Bạn chưa lưu bất động
                  sản nào.
                </p>
              )}
            </section>

            <section className="extra-card profile-side-card">
              <div className="profile-section-head compact">
                <div>
                  <h3>
                    Bộ lọc đã lưu
                  </h3>
                  <p className="muted-line">
                    Dùng lại các truy vấn
                    thường xuyên của bạn
                  </p>
                </div>
                <a
                  href="/properties"
                  className="btn-geo-secondary"
                >
                  Mở danh sách
                </a>
              </div>

              {recentSearches.length ? (
                <div className="profile-list-stack">
                  {recentSearches.map(
                    (item) => (
                      <div
                        className="profile-list-row static"
                        key={item.id}
                      >
                        <strong>
                          {item.name}
                        </strong>
                        <span className="muted-line">
                          {Object.entries(
                            item.filters ||
                              {}
                          )
                            .filter(
                              ([, value]) =>
                                value
                            )
                            .map(
                              ([key, value]) =>
                                `${key}: ${value}`
                            )
                            .join(" · ") ||
                            "Không có điều kiện"}
                        </span>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="muted-line">
                  Chưa có bộ lọc nào được
                  lưu.
                </p>
              )}
            </section>

            <section className="extra-card profile-side-card">
              <div className="profile-section-head compact">
                <div>
                  <h3>
                    Tác vụ nhanh
                  </h3>
                </div>
              </div>
              <div className="profile-quick-links">
                <a
                  className="btn-geo-secondary full"
                  href="/properties"
                >
                  Khám phá nguồn hàng
                </a>
                <a
                  className="btn-geo-secondary full"
                  href="/nearby"
                >
                  Tìm quanh đây
                </a>
                <a
                  className="btn-geo-secondary full"
                  href="/appointments/create"
                >
                  Tạo lịch hẹn
                </a>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
