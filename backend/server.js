import express from "express";
import cors from "cors";
import path from "path";

import { fileURLToPath } from "url";

import apiRoutes from "./src/routes/api.js";
import authRoutes from "./src/routes/auth.routes.js";

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

app.listen(
  5000,
  () => {
    console.log(
      "SERVER RUNNING"
    );
  }
);
