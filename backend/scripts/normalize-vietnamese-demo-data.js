import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { pool } from "../db.js";
import { viObjectStrings, viText } from "./lib/vi-normalize.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readJson(fileName) {
  const filePath = path.join(__dirname, "..", "data", fileName);
  return {
    filePath,
    data: JSON.parse(fs.readFileSync(filePath, "utf8")),
  };
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

async function normalizeAgents() {
  const result = await pool.query(`
    SELECT id, name
    FROM accounts_agent
    ORDER BY id ASC
  `);

  let updated = 0;
  for (const row of result.rows) {
    const nextName = viText(row.name);
    if (nextName !== row.name) {
      await pool.query(
        `UPDATE accounts_agent SET name = $2 WHERE id = $1`,
        [row.id, nextName]
      );
      updated += 1;
    }
  }
  return updated;
}

async function normalizeProperties() {
  const result = await pool.query(`
    SELECT id, title, description, address
    FROM properties_property
    ORDER BY id ASC
  `);

  let updated = 0;
  for (const row of result.rows) {
    const nextTitle = viText(row.title);
    const nextDescription = viText(row.description);
    const nextAddress = viText(row.address);

    if (
      nextTitle !== row.title ||
      nextDescription !== row.description ||
      nextAddress !== row.address
    ) {
      await pool.query(
        `
        UPDATE properties_property
        SET title = $2, description = $3, address = $4
        WHERE id = $1
        `,
        [row.id, nextTitle, nextDescription, nextAddress]
      );
      updated += 1;
    }
  }
  return updated;
}

async function normalizePropertyImages() {
  const result = await pool.query(`
    SELECT id, caption
    FROM properties_propertyimage
    ORDER BY id ASC
  `);

  let updated = 0;
  for (const row of result.rows) {
    const nextCaption = viText(row.caption);
    if (nextCaption !== row.caption) {
      await pool.query(
        `UPDATE properties_propertyimage SET caption = $2 WHERE id = $1`,
        [row.id, nextCaption]
      );
      updated += 1;
    }
  }
  return updated;
}

async function normalizeAmenities() {
  const result = await pool.query(`
    SELECT id, name, category
    FROM properties_amenity
    ORDER BY id ASC
  `);

  let updated = 0;
  for (const row of result.rows) {
    const nextName = viText(row.name)
      .replace(/\s+\d+\s*$/, "")
      .trim();
    const nextCategory = viText(row.category);
    if (nextName !== row.name || nextCategory !== row.category) {
      await pool.query(
        `UPDATE properties_amenity SET name = $2, category = $3 WHERE id = $1`,
        [row.id, nextName, nextCategory]
      );
      updated += 1;
    }
  }
  return updated;
}

function normalizeAuthUsers() {
  const { filePath, data } = readJson("auth-users.json");
  data.users = data.users.map((user) => ({
    ...user,
    full_name: viText(user.full_name),
  }));
  writeJson(filePath, data);
  return data.users.length;
}

function normalizeForms() {
  const { filePath, data } = readJson("forms.json");
  const nextData = {
    ...data,
    leads: data.leads.map((lead) => ({
      ...lead,
      name: viText(lead.name),
      property_interest: viText(lead.property_interest),
      message: viText(lead.message),
    })),
    appointments: data.appointments.map((appointment) => ({
      ...appointment,
      full_name: viText(appointment.full_name),
      note: viText(appointment.note),
    })),
    agentReviews: data.agentReviews.map((review) => ({
      ...review,
      comment: viText(review.comment),
      author_name: viText(review.author_name),
    })),
  };
  writeJson(filePath, nextData);
  return {
    leads: nextData.leads.length,
    appointments: nextData.appointments.length,
    reviews: nextData.agentReviews.length,
  };
}

function normalizeCollections() {
  const { filePath, data } = readJson("collections.json");
  const nextData = viObjectStrings(data);
  writeJson(filePath, nextData);
  return Object.keys(nextData.savedSearches || {}).length;
}

async function main() {
  try {
    await pool.query("BEGIN");
    const properties = await normalizeProperties();
    const images = await normalizePropertyImages();
    const amenities = await normalizeAmenities();
    const agents = await normalizeAgents();
    await pool.query("COMMIT");

    const authUsers = normalizeAuthUsers();
    const forms = normalizeForms();
    const collections = normalizeCollections();

    console.log("Normalized Vietnamese demo data.");
    console.table({
      properties,
      images,
      amenities,
      agents,
      authUsers,
      formLeads: forms.leads,
      formAppointments: forms.appointments,
      formReviews: forms.reviews,
      collections,
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Normalize failed:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
