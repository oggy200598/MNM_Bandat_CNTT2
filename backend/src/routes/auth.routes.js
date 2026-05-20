import express from "express";
import jwt from "jsonwebtoken";

import authStore from "../services/auth-store.js";
import { authenticate } from "../middleware/auth.js";

const router =
  express.Router();

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "super_secret_key";

function toRoleLabel(
  user
) {
  return user?.role || "user";
}

function signJwt(
  user
) {
  return jwt.sign(
    {
      id: user.id,
      role:
        toRoleLabel(user)
    },
    JWT_SECRET,
    {
      expiresIn: "7d"
    }
  );
}

function sanitizeUser(
  user
) {
  return {
    id: user.id,
    username:
      user.username,
    email:
      user.email,
    full_name:
      user.full_name,
    role:
      toRoleLabel(user),
    linked_agent_id:
      user.linked_agent_id ?? null
  };
}

function findByIdentifier(
  identifier
) {
  const value =
    String(identifier || "")
    .trim();

  if (!value) {
    return null;
  }

  const byUsername =
    authStore.findByUsername(
      value
    );

  if (byUsername) {
    return byUsername;
  }

  const candidates = [
    "admin",
    "agent",
    "user"
  ];

  for (const name of candidates) {
    const user =
      authStore.findByUsername(
        name
      );

    if (
      user?.email?.toLowerCase() ===
      value.toLowerCase()
    ) {
      return user;
    }
  }

  return null;
}

router.post(
  "/register",
  async (req, res) => {
    try {
      const result =
        authStore.createUser({
          username:
            req.body.username,
          email:
            req.body.email,
          full_name:
            req.body.full_name,
          role:
            req.body.role,
          linked_agent_id:
            req.body.linked_agent_id,
          password:
            req.body.password
        });

      const user =
        sanitizeUser(
          result.user
        );

      res.status(201).json({
        token:
          signJwt(user),
        user
      });
    } catch (error) {
      res.status(400).json({
        message:
          error.message
      });
    }
  }
);

router.post(
  "/login",
  async (req, res) => {
    try {
      const user =
        findByIdentifier(
          req.body.email ||
            req.body.username
        );

      if (!user) {
        return res.status(400).json({
          message:
            "User not found"
        });
      }

      const valid =
        authStore.verifyPassword(
          user.password,
          req.body.password
        );

      if (!valid) {
        return res.status(400).json({
          message:
            "Wrong password"
        });
      }

      const publicUser =
        sanitizeUser(user);

      res.json({
        token:
          signJwt(publicUser),
        user:
          publicUser
      });
    } catch (error) {
      res.status(500).json({
        message:
          error.message
      });
    }
  }
);

router.get(
  "/me",
  authenticate,
  async (req, res) => {
    try {
      const user =
        authStore.findById(
          req.user.id
        );

      if (!user) {
        return res.status(404).json({
          message:
            "User not found"
        });
      }

      res.json(
        sanitizeUser(user)
      );
    } catch (error) {
      res.status(500).json({
        message:
          error.message
      });
    }
  }
);

router.put(
  "/profile",
  authenticate,
  async (req, res) => {
    try {
      const current =
        authStore.findById(
          req.user.id
        );

      if (!current) {
        return res.status(404).json({
          message:
            "User not found"
        });
      }

      const nextRole =
        req.user.role ===
        "admin"
          ? req.body.role
          : current.role;

      const updated =
        authStore.updateUser(
          req.user.id,
          {
            username:
              req.body.username,
            email:
              req.body.email,
            full_name:
              req.body.full_name,
            linked_agent_id:
              req.body.linked_agent_id,
            role: nextRole,
            password:
              req.body.password
          }
        );

      res.json(
        sanitizeUser(
          updated
        )
      );
    } catch (error) {
      res.status(400).json({
        message:
          error.message
      });
    }
  }
);

router.post(
  "/password-reset-request",
  async (req, res) => {
    try {
      await import("../services/api.service.js")
        .then((module) =>
          module.default.createPasswordResetRequest({
            email:
              req.body.email
          })
        );

      res.status(201).json({
        ok: true
      });
    } catch (error) {
      res.status(400).json({
        message:
          error.message
      });
    }
  }
);

export default router;
