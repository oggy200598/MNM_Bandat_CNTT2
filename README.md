# MNM_Bandat

Ứng dụng web bất động sản gồm:

- `frontend/`: React + Vite
- `backend/`: Express + PostgreSQL/PostGIS

Hệ thống hiện có:

- trang chủ, danh sách bất động sản, chi tiết bất động sản
- tìm quanh đây, tiện ích khu vực, so sánh, wishlist
- đăng nhập/đăng ký/hồ sơ
- dashboard khách hàng, môi giới, quản trị
- `Admin Console` với CRUD cho bất động sản, môi giới, tiện ích, ảnh
- báo cáo quản trị với mini chart, biểu đồ cột/tròn, xuất CSV/PDF

## 1. Cấu trúc thư mục

```text
MNM_Bandat/
├─ frontend/
├─ backend/
├─ media/
└─ README.md
```

## 2. Yêu cầu môi trường

- Node.js 18+
- npm
- PostgreSQL
- PostGIS

## 3. Cài đặt

### Frontend

```powershell
cd frontend
npm install
```

### Backend

```powershell
cd backend
npm install
```

## 4. Chạy dự án

### Backend

```powershell
cd backend
npm start
```

API mặc định chạy tại:

```text
http://127.0.0.1:5000
```

### Frontend

```powershell
cd frontend
npm run dev
```

Frontend mặc định chạy tại:

```text
http://127.0.0.1:5173
```

## 5. Tài khoản mẫu

Đã xác nhận dùng được:

- `admin / 1`
- `moigioi / 1`
- `khachhang / 1`

Lưu ý:

- `admin` có role `admin`
- `moigioi` có role `agent`
- `khachhang` có role `user`

## 6. Các route frontend chính

### Public

- `/`
- `/about`
- `/properties`
- `/property-detail/:id`
- `/nearby`
- `/amenities`
- `/compare`
- `/login`
- `/register`
- `/password-reset`

### User đã đăng nhập

- `/wishlist`
- `/profile`
- `/agent-profile/:id`
- `/customer-dashboard`
- `/lead-form`
- `/appointments/create`

### Agent / Admin

- `/dashboard`
- `/properties/create`
- `/properties/edit/:id`
- `/properties/images/:id`

### Admin

- `/admin-dashboard`
- `/admin-console/*`

## 7. Chức năng chính

### Bất động sản

- xem danh sách có phân trang
- tìm kiếm từ trang chủ
- lọc theo query
- xem chi tiết bất động sản
- xem ảnh, môi giới, đánh giá, bản đồ, tìm đường

### Tìm kiếm theo vị trí

- `Tìm quanh đây`: GPS hoặc nhập địa điểm cụ thể
- `Tiện ích khu vực`: GPS hoặc nhập địa điểm cụ thể
- có autocomplete địa điểm
- có vòng tròn bán kính trên bản đồ

### Môi giới và đánh giá

- chỉ người dùng đã đăng nhập mới được đánh giá
- mỗi tài khoản chỉ có 1 đánh giá cho 1 môi giới
- đánh giá lại sẽ cập nhật đánh giá cũ

### Admin Console

- CRUD bất động sản
- bulk action bất động sản: duyệt / ẩn / xóa hàng loạt
- CRUD môi giới
- CRUD tiện ích
- quản lý ảnh theo từng bất động sản
- kéo-thả sắp xếp ảnh
- báo cáo chi tiết + xuất CSV/PDF

## 8. API chính

### Public / chung

- `GET /api/health`
- `GET /api/properties`
- `GET /api/properties/:id`
- `GET /api/properties/map-data`
- `GET /api/properties/nearby/search`
- `GET /api/amenities`
- `GET /api/amenities/nearby`
- `GET /api/agents`
- `GET /api/agents/:id`
- `GET /api/agents/:id/reviews`
- `GET /api/dashboard`
- `GET /api/route`

### Auth

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`
- `PUT /api/auth/profile`
- `POST /api/auth/password-reset-request`

### User actions

- `POST /api/leads`
- `POST /api/appointments`
- `GET /api/wishlist`
- `POST /api/wishlist/:propertyId/toggle`
- `DELETE /api/wishlist/:propertyId`
- `GET /api/compare`
- `POST /api/compare/:propertyId/toggle`
- `DELETE /api/compare/:propertyId`
- `GET /api/saved-searches`
- `POST /api/saved-searches`
- `DELETE /api/saved-searches/:searchId`
- `POST /api/agents/:id/reviews`

### Agent / Admin

- `POST /api/properties`
- `PUT /api/properties/:id`
- `PATCH /api/properties/:id/stage`
- `DELETE /api/properties/:id`
- `GET /api/properties/:id/images`
- `POST /api/properties/:id/images`
- `POST /api/properties/images/:imageId/primary`
- `POST /api/properties/images/:imageId/reorder`
- `DELETE /api/properties/images/:imageId`

### Admin only

- `POST /api/agents`
- `PUT /api/agents/:id`
- `DELETE /api/agents/:id`
- `POST /api/amenities`
- `PUT /api/amenities/:id`
- `DELETE /api/amenities/:id`
- `PATCH /api/leads/:id/stage`
- `DELETE /api/leads/:id`

## 9. Những gì đã kiểm tra

Đã kiểm tra nhanh thành công:

- frontend build: `npm run build`
- backend syntax:
  - `node --check src/routes/api.js`
  - `node --check src/controllers/api.controller.js`
  - `node --check src/services/api.service.js`
- API smoke test:
  - health
  - properties list
  - property detail
  - nearby properties
  - nearby amenities
  - agents
  - dashboard
  - login admin
  - wishlist / compare / saved-searches
  - create lead
  - create appointment
  - CRUD agent bằng API admin

## 10. Tình trạng hiện tại / cần lưu ý

Hiện tại `frontend` vẫn chưa sạch lint.

Kết quả `npm run lint` đang còn:

- lỗi Hook naming / effect dependency ở:
  - `frontend/src/pages/PropertyPages.jsx`
  - `frontend/src/pages/admin/AdminConsolePage.jsx`
  - `frontend/src/pages/admin/AdminDashboardPage.jsx`
  - `frontend/src/pages/property/PropertyDetailPage.jsx`
- ngoài ra còn một số warning `react-hooks/exhaustive-deps`

Điều này có nghĩa là:

- web build và chạy được
- API chính đang dùng được
- nhưng code frontend vẫn cần một đợt dọn lint/hook rules để ổn định hơn về lâu dài

## 11. Hướng phát triển tiếp

- dọn toàn bộ lỗi `eslint` và `react-hooks`
- thêm filter thời gian riêng cho `reports`
- cải thiện export PDF theo layout thương hiệu
- thêm tooltip cho biểu đồ
- tách `App.css` thành các file nhỏ hơn để dễ bảo trì

