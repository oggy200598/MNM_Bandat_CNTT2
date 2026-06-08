import express from "express";
import cors from "cors";
import path from "path";
import swaggerUi from "swagger-ui-express";

import { fileURLToPath } from "url";

import apiRoutes from "./src/routes/api.js";
import authRoutes from "./src/routes/auth.routes.js";
import openApiDocument from "./src/openapi.js";

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

const app =
  express();

app.use(cors());
app.use(express.json({
  limit: "10mb"
}));

app.use(
  "/media",
  express.static(
    path.join(
      __dirname,
      "..",
      "media"
    )
  )
);

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api",
  apiRoutes
);

app.get(
  "/openapi.json",
  (_req, res) => {
    res.json(openApiDocument);
  }
);

app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    explorer: true,
    customSiteTitle: "MNM Bandat API Docs",
  })
);

app.listen(
  5000,
  () => {
    console.log(
      "SERVER RUNNING"
    );
  }
);
