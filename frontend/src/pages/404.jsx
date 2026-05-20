import { Link } from "react-router-dom";
import { MapPinned, Home, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="container py-5 text-center">
      <div className="error-container py-5">
        <h1 className="display-1 fw-bold text-geo-primary">404</h1>

        <div className="error-icon mb-4">
          <MapPinned size={90} className="text-secondary" />
        </div>

        <h2 className="mb-3">Mất dấu tọa độ!</h2>

        <p className="lead mb-5">
          Xin lỗi, tọa độ bạn đang tìm kiếm không tồn tại trên bản đồ của
          chúng tôi hoặc đã bị di dời.
        </p>

        <div className="d-flex justify-content-center gap-3">
          <Link to="/" className="btn-geo-primary">
            <Home size={18} className="me-2" />
            Về trang chủ
          </Link>

          <button
            onClick={() => window.history.back()}
            className="btn-geo-outline"
          >
            <ArrowLeft size={18} className="me-2" />
            Quay lại
          </button>
        </div>
      </div>

      <style>{`
        .text-geo-primary {
          color: #2c3e50;
        }

        .btn-geo-primary {
          background-color: #2c3e50;
          color: white;
          padding: 10px 25px;
          border-radius: 5px;
          text-decoration: none;
          transition: 0.3s;
          display: inline-flex;
          align-items: center;
          border: none;
        }

        .btn-geo-primary:hover {
          background-color: #1a252f;
          color: white;
        }

        .btn-geo-outline {
          border: 2px solid #2c3e50;
          color: #2c3e50;
          padding: 8px 25px;
          border-radius: 5px;
          background: transparent;
          transition: 0.3s;
          display: inline-flex;
          align-items: center;
        }

        .btn-geo-outline:hover {
          background-color: #2c3e50;
          color: white;
        }
      `}</style>
    </div>
  );
}