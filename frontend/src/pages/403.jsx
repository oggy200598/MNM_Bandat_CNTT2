import { Link } from "react-router-dom";
import { ShieldAlert, Home, LogIn } from "lucide-react";

export default function ForbiddenPage({ isAuthenticated = false }) {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-10 col-lg-8 col-xl-6">
          <div className="card border-0 shadow-sm text-center p-4 p-md-5">
            <h1 className="display-1 fw-bold text-danger">403</h1>

            <div className="mb-4">
              <ShieldAlert size={90} className="text-danger" />
            </div>

            <h2 className="mb-3">Khu vực hạn chế!</h2>

            <p className="lead text-secondary mb-4">
              Tài khoản của bạn không có đủ quyền hạn để truy cập vào phân khu này.
            </p>

            <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
              <Link to="/" className="btn btn-primary">
                <Home size={18} className="me-2" />
                Về trang chủ
              </Link>

              {!isAuthenticated && (
                <Link to="/login" className="btn btn-outline-secondary">
                  <LogIn size={18} className="me-2" />
                  Đăng nhập ngay
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
