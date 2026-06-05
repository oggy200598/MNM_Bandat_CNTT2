import express from "express";
import jwt from "jsonwebtoken";

import authStore from "../services/auth-store.js";
import { authenticate } from "../middleware/auth.js";

const router =
  express.Router();

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "super_secret_key";
const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ||
  "";
const GOOGLE_CLIENT_SECRET =
  process.env.GOOGLE_CLIENT_SECRET ||
  "";
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ||
  "http://127.0.0.1:5000/api/auth/google/callback";
const FRONTEND_BASE_URL =
  process.env.FRONTEND_BASE_URL ||
  "http://127.0.0.1:5173";
const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile"
].join(" ");

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

function buildFrontendRedirect(
  params = {}
) {
  const url =
    new URL(
      "/auth/google/callback",
      FRONTEND_BASE_URL
    );

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        url.searchParams.set(
          key,
          String(value)
        );
      }
    }
  );

  return url.toString();
}

function encodePayload(
  value
) {
  return Buffer.from(
    JSON.stringify(value)
  ).toString("base64url");
}

function decodeState(
  rawState
) {
  if (!rawState) {
    return null;
  }

  try {
    const payload =
      JSON.parse(
        Buffer.from(
          String(rawState),
          "base64url"
        ).toString("utf8")
      );

    if (
      !payload.ts ||
      Date.now() - payload.ts >
        15 * 60 * 1000
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

async function exchangeGoogleCode(
  code
) {
  const response =
    await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded"
        },
        body:
          new URLSearchParams({
            code,
            client_id:
              GOOGLE_CLIENT_ID,
            client_secret:
              GOOGLE_CLIENT_SECRET,
            redirect_uri:
              GOOGLE_REDIRECT_URI,
            grant_type:
              "authorization_code"
          })
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.error_description ||
        data.error ||
        "Google token exchange failed"
    );
  }

  return data;
}

async function fetchGoogleProfile(
  accessToken
) {
  const response =
    await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization:
            `Bearer ${accessToken}`
        }
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.error_description ||
        data.error ||
        "Google userinfo failed"
    );
  }

  return data;
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
          role: "user",
          linked_agent_id: null,
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
  "/google/start",
  async (req, res) => {
    try {
      if (
        !GOOGLE_CLIENT_ID ||
        !GOOGLE_CLIENT_SECRET
      ) {
        return res.redirect(
          buildFrontendRedirect({
            error:
              "google_oauth_not_configured"
          })
        );
      }

      const state =
        encodePayload({
          ts: Date.now(),
          returnTo:
            req.query.returnTo ||
            ""
        });

      const authUrl =
        new URL(
          "https://accounts.google.com/o/oauth2/v2/auth"
        );

      authUrl.searchParams.set(
        "client_id",
        GOOGLE_CLIENT_ID
      );
      authUrl.searchParams.set(
        "redirect_uri",
        GOOGLE_REDIRECT_URI
      );
      authUrl.searchParams.set(
        "response_type",
        "code"
      );
      authUrl.searchParams.set(
        "scope",
        GOOGLE_SCOPES
      );
      authUrl.searchParams.set(
        "access_type",
        "offline"
      );
      authUrl.searchParams.set(
        "prompt",
        "select_account"
      );
      authUrl.searchParams.set(
        "state",
        state
      );

      return res.redirect(
        authUrl.toString()
      );
    } catch (error) {
      return res.redirect(
        buildFrontendRedirect({
          error:
            "google_start_failed"
        })
      );
    }
  }
);

router.get(
  "/google/callback",
  async (req, res) => {
    try {
      if (req.query.error) {
        return res.redirect(
          buildFrontendRedirect({
            error:
              req.query.error
          })
        );
      }

      if (
        !GOOGLE_CLIENT_ID ||
        !GOOGLE_CLIENT_SECRET
      ) {
        return res.redirect(
          buildFrontendRedirect({
            error:
              "google_oauth_not_configured"
          })
        );
      }

      const state =
        decodeState(
          req.query.state
        );

      if (!state) {
        return res.redirect(
          buildFrontendRedirect({
            error:
              "invalid_google_state"
          })
        );
      }

      const tokenData =
        await exchangeGoogleCode(
          req.query.code
        );
      const profile =
        await fetchGoogleProfile(
          tokenData.access_token
        );

      if (
        !profile.email ||
        profile.email_verified ===
          false
      ) {
        return res.redirect(
          buildFrontendRedirect({
            error:
              "google_email_not_verified"
          })
        );
      }

      const result =
        authStore.upsertGoogleUser({
          google_id:
            profile.sub,
          email:
            profile.email,
          full_name:
            profile.name,
          username:
            profile.email
              .split("@")[0],
          avatar_url:
            profile.picture,
          role: "user"
        });
      const publicUser =
        sanitizeUser(
          result.user
        );

      return res.redirect(
        buildFrontendRedirect({
          token:
            signJwt(publicUser),
          user:
            encodePayload(
              publicUser
            ),
          returnTo:
            state.returnTo
        })
      );
    } catch (error) {
      return res.redirect(
        buildFrontendRedirect({
          error:
            "google_login_failed"
        })
      );
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
      const nextLinkedAgentId =
        req.user.role ===
        "admin"
          ? req.body.linked_agent_id
          : current.linked_agent_id;

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
              nextLinkedAgentId,
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
