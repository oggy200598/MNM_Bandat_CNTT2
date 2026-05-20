import PageShell from "../../components/layout/PageShell";

export default function ErrorPage({
  code = "404"
}) {

  const forbidden =
    code === "403";

  return (

    <PageShell
      eyebrow="Bản đồ hệ thống"
      title={
        forbidden
          ? "Khu vực hạn chế!"
          : "Mất dấu tọa độ!"
      }
      desc={
        forbidden

          ? "Tài khoản của bạn không có đủ quyền hạn để truy cập vào phân khu này."

          : "Tọa độ bạn đang tìm kiếm không tồn tại trên bản đồ hoặc đã bị di dời."
      }
      maxWidth="760px"
    >

      <div className="extra-card error-card">

        <div
          className={
            forbidden
              ? "error-code danger"
              : "error-code"
          }
        >

          {code}

        </div>

        <div className="mini-actions center">

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

                Đăng nhập ngay

              </a>

            )

          }

        </div>

      </div>

    </PageShell>

  );

}