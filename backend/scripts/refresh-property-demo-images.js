import { pool } from "../db.js";
import { viText } from "./lib/vi-normalize.js";

const IMAGE_URLS = [
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600607687644-c7f34be3c2f4?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1605146768851-eda79da39897?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1200&auto=format&fit=crop",
];

function imageFor(propertyId, index) {
  return IMAGE_URLS[(Number(propertyId) + index) % IMAGE_URLS.length];
}

async function refreshPropertyImages() {
  const propertiesResult = await pool.query(`
    SELECT id
    FROM properties_property
    ORDER BY id ASC
  `);

  let updated = 0;
  let created = 0;

  for (const row of propertiesResult.rows) {
    const propertyId = row.id;
    const imagesResult = await pool.query(
      `
      SELECT id
      FROM properties_propertyimage
      WHERE property_id = $1
      ORDER BY is_primary DESC, sort_order ASC, id ASC
      `,
      [propertyId]
    );

    const images = imagesResult.rows;
    const desiredCount = Math.max(3, images.length || 0);

    for (let index = 0; index < desiredCount; index += 1) {
      const nextImage = imageFor(propertyId, index);
      const nextCaption = viText(index === 0 ? "Anh chinh" : `Khong gian ${index + 1}`);
      const isPrimary = index === 0;

      if (images[index]) {
        await pool.query(
          `
          UPDATE properties_propertyimage
          SET
            image = $2,
            caption = $3,
            is_primary = $4,
            sort_order = $5
          WHERE id = $1
          `,
          [images[index].id, nextImage, nextCaption, isPrimary, index]
        );
        updated += 1;
      } else {
        await pool.query(
          `
          INSERT INTO properties_propertyimage
          (
            property_id,
            image,
            caption,
            is_primary,
            sort_order,
            created_at
          )
          VALUES
          (
            $1,
            $2,
            $3,
            $4,
            $5,
            NOW()
          )
          `,
          [propertyId, nextImage, nextCaption, isPrimary, index]
        );
        created += 1;
      }
    }
  }

  return {
    properties: propertiesResult.rows.length,
    updated,
    created,
  };
}

async function main() {
  try {
    const result = await refreshPropertyImages();
    console.log("Refresh demo images completed:", result);
  } catch (error) {
    console.error("Refresh demo images failed:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
