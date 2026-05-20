import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "mnm_bandat_dev",
  password: process.env.DB_PASSWORD || "442489",
  port: process.env.DB_PORT || 5432
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("Error acquiring client", err.stack);
    return;
  }

  client.query("SELECT NOW()", (err, result) => {
    release();

    if (err) {
      console.error("DB Connection Error:", err.stack);
    } else {
      console.log("DB Connected:", result.rows[0].now);
    }
  });
});