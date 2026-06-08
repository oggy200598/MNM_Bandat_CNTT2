import { Link } from "react-router-dom";
import { MapPinned, Home, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-10 col-lg-8 col-xl-6">
          <div className="card border-0 shadow-sm text-center p-4 p-md-5">
            <h1 className="display-1 fw-bold text-dark">404</h1>

            <div className="mb-4">
              <MapPinned size={90} className="text-secondary" />
            </div>

            <h2 className="mb-3">Mất dấu tọa độ!</h2>

            <p className="lead text-secondary mb-4">
              Xin lỗi, tọa độ bạn đang tìm kiếm không tồn tại trên bản đồ của
              chúng tôi hoặc đã bị di dời.
            </p>

            <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
              <Link to="/" className="btn btn-primary">
                <Home size={18} className="me-2" />
                Về trang chủ
              </Link>

              <button
                type="button"
                onClick={() => window.history.back()}
                className="btn btn-outline-secondary"
              >
                <ArrowLeft size={18} className="me-2" />
                Quay lại
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
