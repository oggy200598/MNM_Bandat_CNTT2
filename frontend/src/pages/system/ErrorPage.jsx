export default function ErrorPage({
  code = "404"
}) {

  const forbidden =
    code === "403";

  return (

    <div className="error-page-custom">

      <div className="error-bg-glow" />

      <div className="error-box">

        <div
          className={
            forbidden
              ? "error-code danger"
              : "error-code"
          }
        >

          {code}

        </div>

        <p className="error-eyebrow">

          BẢN ĐỒ HỆ THỐNG

        </p>

        <h1 className="error-title">

          {
            forbidden
              ? "Khu vực hạn chế!"
              : "Mất dấu tọa độ!"
          }

        </h1>

        <p className="error-desc">

          {
            forbidden
              ? "Tài khoản của bạn không đủ quyền để truy cập khu vực này."
              : "Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển."
          }

        </p>

        <div className="error-actions">

          <a
            href="/"
            className="btn-geo-primary"
          >

            Về trang chủ

          </a>

          {

            forbidden && (

              <a
                href="/login"
                className="btn-geo-secondary"
              >

                Đăng nhập

              </a>

            )

          }

        </div>

      </div>

    </div>

  );

}