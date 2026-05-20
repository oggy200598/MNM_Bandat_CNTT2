// backend/src/routes/property.routes.js

import express from "express";

import {
  pool
} from "../../db.js";

import {
  authenticate,
  allowRoles
} from "../middleware/auth.js";

const router =
  express.Router();

/* =========================
   PUBLIC
========================= */

router.get(
  "/",
  async (req, res) => {

    try {

      const result =
        await pool.query(`
          SELECT
            p.id,
            p.title,
            p.description,
            p.property_type,
            p.price,
            p.area,
            p.address,
            p.listing_status,
            p.is_featured,
            p.created_at,
            a.name AS agent_name
          FROM properties_property p
          LEFT JOIN accounts_agent a
          ON p.agent_id = a.id
          ORDER BY p.id DESC
        `);

      res.json(
        result.rows
      );

    } catch (error) {

      res.status(500).json({
        message:
          error.message
      });

    }

  }
);

/* =========================
   ADMIN + AGENT
========================= */

router.post(
  "/",
  authenticate,
  allowRoles(
    "admin",
    "agent"
  ),
  async (req, res) => {

    try {

      const {
        title,
        description,
        property_type,
        price,
        area,
        address
      } = req.body;

      const result =
        await pool.query(
          `
          INSERT INTO properties_property
          (
            title,
            description,
            property_type,
            price,
            area,
            address,
            agent_id,
            listing_status,
            created_at
          )
          VALUES
          (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            'active',
            NOW()
          )
          RETURNING *
          `,
          [
            title,
            description,
            property_type,
            price,
            area,
            address,
            req.user.id
          ]
        );

      res.json(
        result.rows[0]
      );

    } catch (error) {

      res.status(500).json({
        message:
          error.message
      });

    }

  }
);

/* =========================
   ADMIN ONLY
========================= */

router.delete(
  "/:id",
  authenticate,
  allowRoles("admin"),
  async (req, res) => {

    try {

      await pool.query(
        `
        DELETE
        FROM properties_property
        WHERE id=$1
        `,
        [req.params.id]
      );

      res.json({
        success: true
      });

    } catch (error) {

      res.status(500).json({
        message:
          error.message
      });

    }

  }
);

export default router;