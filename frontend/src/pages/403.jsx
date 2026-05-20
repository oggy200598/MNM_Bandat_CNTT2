import { Link } from "react-router-dom";
import { ShieldAlert, Home, LogIn } from "lucide-react";

export default function ForbiddenPage({ isAuthenticated = false }) {
  return (
    <div className="container py-5 text-center">
      <div className="error-container py-5">
        <h1 className="display-1 fw-bold text-danger">403</h1>

        <div className="error-icon mb-4">
          <ShieldAlert size={90} className="text-danger" />
        </div>

        <h2 className="mb-3">Khu vực hạn chế!</h2>

        <p className="lead mb-5">
          Tài khoản của bạn không có đủ quyền hạn để truy cập vào phân khu này.
        </p>

        <div className="d-flex justify-content-center gap-3">
          <Link to="/" className="btn-geo-primary">
            <Home size={18} className="me-2" />
            Về trang chủ
          </Link>

          {!isAuthenticated && (
            <Link to="/login" className="btn-geo-outline">
              <LogIn size={18} className="me-2" />
              Đăng nhập ngay
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}