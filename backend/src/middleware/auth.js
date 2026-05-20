// backend/src/middleware/auth.js

import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "super_secret_key";

/* =========================
   VERIFY TOKEN
========================= */

export function authenticate(
  req,
  res,
  next
) {

  try {

    const authHeader =
      req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {

      return res.status(401).json({
        message: "Unauthorized"
      });

    }

    const token =
      authHeader.split(" ")[1];

    const decoded =
      jwt.verify(
        token,
        JWT_SECRET
      );

    req.user = decoded;

    next();

  } catch (error) {

    return res.status(401).json({
      message: "Token invalid"
    });

  }

}

/* =========================
   ROLE GUARD
========================= */

export function allowRoles(
  ...roles
) {

  return (
    req,
    res,
    next
  ) => {

    if (!req.user) {

      return res.status(401).json({
        message: "Unauthorized"
      });

    }

    if (
      !roles.includes(
        req.user.role
      )
    ) {

      return res.status(403).json({
        message:
          "Forbidden"
      });

    }

    next();

  };

}

export const requireRole =
  allowRoles;