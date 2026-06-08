const serverUrl =
  process.env.OPENAPI_SERVER_URL ||
  "http://127.0.0.1:5000";

const jsonContent = {
  "application/json": {
    schema: {
      type: "object",
      additionalProperties: true,
    },
  },
};

const authHeader = {
  bearerAuth: [],
};

const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "MNM Bandat API",
    version: "1.0.0",
    description:
      "Tai lieu API co ban cho backend Express cua du an MNM Bandat.",
  },
  servers: [
    {
      url: serverUrl,
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  tags: [
    { name: "System" },
    { name: "Auth" },
    { name: "Properties" },
    { name: "Amenities" },
    { name: "Agents" },
    { name: "Collections" },
    { name: "Content" },
    { name: "Leads" },
    { name: "Appointments" },
    { name: "Tasks" },
    { name: "Routing" },
  ],
  paths: {
    "/api/health": {
      get: {
        tags: ["System"],
        summary: "Kiem tra trang thai backend",
        responses: {
          200: {
            description: "Backend dang hoat dong",
            content: jsonContent,
          },
        },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Dang ky tai khoan",
        requestBody: {
          required: true,
          content: jsonContent,
        },
        responses: {
          201: { description: "Dang ky thanh cong", content: jsonContent },
          400: { description: "Du lieu khong hop le", content: jsonContent },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Dang nhap",
        requestBody: {
          required: true,
          content: jsonContent,
        },
        responses: {
          200: { description: "Dang nhap thanh cong", content: jsonContent },
          400: { description: "Sai tai khoan hoac mat khau", content: jsonContent },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Lay thong tin nguoi dung hien tai",
        security: [authHeader],
        responses: {
          200: { description: "Thong tin nguoi dung", content: jsonContent },
          401: { description: "Chua dang nhap", content: jsonContent },
        },
      },
      put: {
        tags: ["Auth"],
        summary: "Cap nhat ho so nguoi dung",
        security: [authHeader],
        requestBody: {
          required: true,
          content: jsonContent,
        },
        responses: {
          200: { description: "Cap nhat thanh cong", content: jsonContent },
          400: { description: "Cap nhat that bai", content: jsonContent },
        },
      },
    },
    "/api/auth/password-reset-request": {
      post: {
        tags: ["Auth"],
        summary: "Gui yeu cau quen mat khau",
        requestBody: {
          required: true,
          content: jsonContent,
        },
        responses: {
          201: { description: "Gui yeu cau thanh cong", content: jsonContent },
          400: { description: "Gui yeu cau that bai", content: jsonContent },
        },
      },
    },
    "/api/properties": {
      get: {
        tags: ["Properties"],
        summary: "Lay danh sach bat dong san",
        responses: {
          200: { description: "Danh sach bat dong san", content: jsonContent },
        },
      },
      post: {
        tags: ["Properties"],
        summary: "Tao bat dong san",
        security: [authHeader],
        requestBody: {
          required: true,
          content: jsonContent,
        },
        responses: {
          200: { description: "Tao thanh cong", content: jsonContent },
          401: { description: "Khong co quyen", content: jsonContent },
        },
      },
    },
    "/api/properties/map-data": {
      get: {
        tags: ["Properties"],
        summary: "Lay du lieu ban do bat dong san",
        responses: {
          200: { description: "Du lieu ban do", content: jsonContent },
        },
      },
    },
    "/api/properties/nearby/search": {
      get: {
        tags: ["Properties"],
        summary: "Tim bat dong san lan can",
        responses: {
          200: { description: "Ket qua tim quanh day", content: jsonContent },
        },
      },
    },
    "/api/properties/{id}": {
      get: {
        tags: ["Properties"],
        summary: "Lay chi tiet bat dong san",
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Chi tiet bat dong san", content: jsonContent },
        },
      },
      put: {
        tags: ["Properties"],
        summary: "Cap nhat bat dong san",
        security: [authHeader],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: jsonContent,
        },
        responses: {
          200: { description: "Cap nhat thanh cong", content: jsonContent },
        },
      },
      delete: {
        tags: ["Properties"],
        summary: "Xoa bat dong san",
        security: [authHeader],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Xoa thanh cong", content: jsonContent },
        },
      },
    },
    "/api/properties/{id}/images": {
      get: {
        tags: ["Properties"],
        summary: "Lay danh sach anh cua bat dong san",
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Danh sach anh", content: jsonContent },
        },
      },
      post: {
        tags: ["Properties"],
        summary: "Them anh cho bat dong san",
        security: [authHeader],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: jsonContent,
        },
        responses: {
          200: { description: "Them anh thanh cong", content: jsonContent },
        },
      },
    },
    "/api/amenities": {
      get: {
        tags: ["Amenities"],
        summary: "Lay danh sach tien ich",
        responses: {
          200: { description: "Danh sach tien ich", content: jsonContent },
        },
      },
      post: {
        tags: ["Amenities"],
        summary: "Tao tien ich",
        security: [authHeader],
        requestBody: {
          required: true,
          content: jsonContent,
        },
        responses: {
          200: { description: "Tao thanh cong", content: jsonContent },
        },
      },
    },
    "/api/amenities/nearby": {
      get: {
        tags: ["Amenities"],
        summary: "Tim tien ich lan can",
        responses: {
          200: { description: "Ket qua tim tien ich", content: jsonContent },
        },
      },
    },
    "/api/agents": {
      get: {
        tags: ["Agents"],
        summary: "Lay danh sach moi gioi",
        responses: {
          200: { description: "Danh sach moi gioi", content: jsonContent },
        },
      },
      post: {
        tags: ["Agents"],
        summary: "Tao moi gioi",
        security: [authHeader],
        requestBody: {
          required: true,
          content: jsonContent,
        },
        responses: {
          200: { description: "Tao thanh cong", content: jsonContent },
        },
      },
    },
    "/api/agents/{id}": {
      get: {
        tags: ["Agents"],
        summary: "Lay chi tiet moi gioi",
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Chi tiet moi gioi", content: jsonContent },
        },
      },
    },
    "/api/dashboard": {
      get: {
        tags: ["System"],
        summary: "Lay thong ke tong quan",
        responses: {
          200: { description: "Thong ke tong quan", content: jsonContent },
        },
      },
    },
    "/api/content/about": {
      get: {
        tags: ["Content"],
        summary: "Lay noi dung trang gioi thieu",
        responses: {
          200: { description: "Noi dung gioi thieu", content: jsonContent },
        },
      },
      put: {
        tags: ["Content"],
        summary: "Cap nhat noi dung trang gioi thieu",
        security: [authHeader],
        requestBody: {
          required: true,
          content: jsonContent,
        },
        responses: {
          200: { description: "Cap nhat thanh cong", content: jsonContent },
        },
      },
    },
    "/api/leads": {
      get: {
        tags: ["Leads"],
        summary: "Lay danh sach leads",
        responses: {
          200: { description: "Danh sach leads", content: jsonContent },
        },
      },
      post: {
        tags: ["Leads"],
        summary: "Tao lead moi",
        requestBody: {
          required: true,
          content: jsonContent,
        },
        responses: {
          200: { description: "Tao lead thanh cong", content: jsonContent },
        },
      },
    },
    "/api/appointments": {
      post: {
        tags: ["Appointments"],
        summary: "Tao lich hen",
        requestBody: {
          required: true,
          content: jsonContent,
        },
        responses: {
          200: { description: "Tao lich hen thanh cong", content: jsonContent },
        },
      },
    },
    "/api/wishlist": {
      get: {
        tags: ["Collections"],
        summary: "Lay danh sach luu tin",
        responses: {
          200: { description: "Danh sach wishlist", content: jsonContent },
        },
      },
    },
    "/api/wishlist/{propertyId}/toggle": {
      post: {
        tags: ["Collections"],
        summary: "Them hoac bo luu tin",
        parameters: [
          {
            in: "path",
            name: "propertyId",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Cap nhat wishlist", content: jsonContent },
        },
      },
    },
    "/api/compare": {
      get: {
        tags: ["Collections"],
        summary: "Lay danh sach so sanh",
        responses: {
          200: { description: "Danh sach compare", content: jsonContent },
        },
      },
    },
    "/api/compare/{propertyId}/toggle": {
      post: {
        tags: ["Collections"],
        summary: "Them hoac bo so sanh",
        parameters: [
          {
            in: "path",
            name: "propertyId",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Cap nhat compare", content: jsonContent },
        },
      },
    },
    "/api/saved-searches": {
      get: {
        tags: ["Collections"],
        summary: "Lay bo loc da luu",
        responses: {
          200: { description: "Danh sach bo loc da luu", content: jsonContent },
        },
      },
      post: {
        tags: ["Collections"],
        summary: "Luu bo loc tim kiem",
        requestBody: {
          required: true,
          content: jsonContent,
        },
        responses: {
          201: { description: "Luu bo loc thanh cong", content: jsonContent },
        },
      },
    },
    "/api/tasks": {
      get: {
        tags: ["Tasks"],
        summary: "Lay danh sach tasks",
        responses: {
          200: { description: "Danh sach tasks", content: jsonContent },
        },
      },
      post: {
        tags: ["Tasks"],
        summary: "Tao task moi",
        requestBody: {
          required: true,
          content: jsonContent,
        },
        responses: {
          200: { description: "Tao task thanh cong", content: jsonContent },
        },
      },
    },
    "/api/route": {
      get: {
        tags: ["Routing"],
        summary: "Lay duong di",
        responses: {
          200: { description: "Ket qua route", content: jsonContent },
        },
      },
    },
  },
};

export default openApiDocument;
