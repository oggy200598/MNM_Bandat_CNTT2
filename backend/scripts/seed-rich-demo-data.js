import crypto from "crypto";
import fs from "fs";
import path from "path";

import { fileURLToPath } from "url";

import { pool } from "../db.js";
import { viObjectStrings, viText } from "./lib/vi-normalize.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGETS = {
  agents: 16,
  properties: 140,
  amenities: 180,
  users: 36,
  leads: 48,
  appointments: 22,
  agentReviews: 60,
};

const DISTRICTS = [
  { name: "Quan 1", lat: 10.7768, lng: 106.7009, streets: ["Ton Duc Thang", "Le Thanh Ton", "Hai Ba Trung", "Nguyen Hue"] },
  { name: "Quan 3", lat: 10.7828, lng: 106.6868, streets: ["Vo Thi Sau", "Nguyen Dinh Chieu", "Cach Mang Thang 8"] },
  { name: "Binh Thanh", lat: 10.8072, lng: 106.7125, streets: ["Dien Bien Phu", "Nguyen Huu Canh", "No Trang Long"] },
  { name: "Thu Duc", lat: 10.8414, lng: 106.8099, streets: ["Vo Van Ngan", "Pham Van Dong", "Kha Van Can", "Dang Van Bi"] },
  { name: "Quan 7", lat: 10.7296, lng: 106.7218, streets: ["Nguyen Thi Thap", "Huynh Tan Phat", "Tan Trao"] },
  { name: "Phu Nhuan", lat: 10.7987, lng: 106.6799, streets: ["Hoang Van Thu", "Phan Xich Long", "Nguyen Kiem"] },
  { name: "Tan Binh", lat: 10.8016, lng: 106.6527, streets: ["Cong Hoa", "Truong Chinh", "Hoang Hoa Tham"] },
  { name: "Go Vap", lat: 10.8386, lng: 106.6658, streets: ["Phan Van Tri", "Nguyen Oanh", "Quang Trung"] },
  { name: "Quan 2", lat: 10.7872, lng: 106.7497, streets: ["Mai Chi Tho", "Song Hanh", "Tran Nao"] },
  { name: "Nha Be", lat: 10.6936, lng: 106.7352, streets: ["Nguyen Huu Tho", "Le Van Luong", "Huynh Tan Phat"] },
];

const PROPERTY_TEMPLATES = {
  apartment: [
    "Can ho 2PN view song tai {district}",
    "Can ho cao cap gan metro o {district}",
    "Can ho ban giao full noi that trung tam {district}",
    "Can ho cho gia dinh tre tai {district}",
  ],
  house: [
    "Nha pho hem xe hoi khu dan tri cao - {district}",
    "Nha pho 1 tret 3 lau noi that hoan thien - {district}",
    "Nha gan truong hoc va benh vien tai {district}",
    "Nha phu hop vua o vua kinh doanh - {district}",
  ],
  land: [
    "Dat nen gan truc ha tang dang phat trien - {district}",
    "Lo dat vuong dep phu hop dau tu dai han - {district}",
    "Dat khu dan cu hien huu tai {district}",
    "Nen goc hai mat tien tiem nang o {district}",
  ],
  villa: [
    "Biet thu compound san vuon rieng tai {district}",
    "Biet thu song lap khu an ninh cao o {district}",
    "Biet thu ven song khong gian nghi duong - {district}",
    "Biet thu cao cap phu hop o va tiep khach - {district}",
  ],
};

const PROPERTY_CONFIG = {
  apartment: { minPrice: 2_400_000_000, maxPrice: 9_800_000_000, minArea: 52, maxArea: 128 },
  house: { minPrice: 7_800_000_000, maxPrice: 36_000_000_000, minArea: 58, maxArea: 190 },
  land: { minPrice: 2_900_000_000, maxPrice: 21_000_000_000, minArea: 72, maxArea: 260 },
  villa: { minPrice: 18_000_000_000, maxPrice: 78_000_000_000, minArea: 180, maxArea: 520 },
};

const AMENITY_LABELS = {
  school: ["Truong THCS", "Truong tieu hoc", "Truong mam non", "Trung tam ngoai ngu"],
  hospital: ["Benh vien", "Phong kham", "Trung tam y te", "Nha thuoc lon"],
  park: ["Cong vien", "Khu the thao", "San choi cong dong", "Duong di bo"],
  supermarket: ["Sieu thi", "Trung tam thuong mai", "Cua hang tien loi", "Cho dan sinh"],
  other: ["Ngan hang", "Van phong cong chung", "Rap chieu phim", "Ga metro"],
};

const AMENITY_CATEGORY = {
  school: "Giao duc",
  hospital: "Y te",
  park: "Giai tri",
  supermarket: "Mua sam",
  other: "Tien ich khac",
};

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

const AGENT_NAMES = [
  "Tran Minh An",
  "Nguyen Gia Bao",
  "Le Hoang Chau",
  "Pham Quoc Dat",
  "Vo Thanh Duy",
  "Bui Khanh Linh",
  "Do My Linh",
  "Tran Nhat Minh",
  "Nguyen Bao Ngoc",
  "Phan Thao Nhi",
  "Le Thanh Phong",
  "Huynh Gia Huy",
  "Dang Quynh Trang",
  "Doan Tuan Kiet",
  "Ngo Thanh Truc",
  "Luong Minh Tri",
  "Duong Gia Hân",
  "Tran Thi Yen",
  "Phung Minh Quan",
  "Mai Thu Trang",
];

const USER_NAMES = [
  "Minh Khang", "Gia Han", "Bao Tran", "Thanh Lam", "Quoc Huy", "Thuy Tien", "Anh Khoa", "Kim Anh",
  "Minh Thu", "Quynh Nhu", "Duc Huy", "Hoang Yen", "Thanh Dat", "Bao Nhi", "Gia Huy", "Thanh Truc",
  "Quoc Bao", "My Duyen", "Khanh An", "Nhat Vy", "Thanh Nhan", "Tuan Kiet", "Ngoc Mai", "Gia Linh",
  "Hoang Nam", "Bao Chau", "Anh Thu", "Minh Chau", "Tien Dat", "Hong Nhung", "Phuc An", "Nha Uyen",
];

const LEAD_MESSAGES = [
  "Can tim nha de o trong 2 thang toi.",
  "Quan tam can ho gan truong hoc va metro.",
  "Can san pham de dau tu cho thue.",
  "Muon xem nha vao cuoi tuan nay.",
  "Can dat nen de giu tai san trong 2-3 nam.",
  "Uu tien khu compound va an ninh cao.",
];

const REVIEW_COMMENTS = [
  "Tu van ro rang, bam sat nhu cau va theo suot qua trinh.",
  "Phan hoi nhanh, thong tin minh bach va di xem nha dung gio.",
  "Ho tro thu tuc on, giao tiep de chiu va chuyen nghiep.",
  "De xuat san pham hop ly, co tam trong viec cham soc khach hang.",
  "Can them lua chon phu hop ngan sach hon nhung thai do tot.",
  "Lam viec co trach nhiem, xu ly van de nhanh gon.",
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, digits = 6) {
  return Number((Math.random() * (max - min) + min).toFixed(digits));
}

function pick(items) {
  return items[randomInt(0, items.length - 1)];
}

function slugify(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ".");
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(String(password), salt, 120000, 32, "sha256").toString("base64");
  return `pbkdf2$${salt}$${hash}`;
}

function daysAgo(maxDays = 120) {
  const now = Date.now();
  const offset = randomInt(0, maxDays * 24 * 60 * 60 * 1000);
  return new Date(now - offset);
}

function pointLatLng(district) {
  return {
    lat: randomFloat(district.lat - 0.018, district.lat + 0.018),
    lng: randomFloat(district.lng - 0.018, district.lng + 0.018),
  };
}

function propertyDescription(type, district, street) {
  const intros = {
    apartment: "Can ho co thiet ke toi uu, khong gian sang va van hanh tot cho nhu cau o that.",
    house: "Nha co ket cau chac chan, khu dan cu dong bo va ket noi giao thong thuan tien.",
    land: "San pham co vi tri de tiep can, phu hop tich luy va dau tu trung han.",
    villa: "Biet thu co khong gian rieng tu, mat do xay dung thoang va gia tri su dung cao.",
  };
  return `${intros[type]} Vi tri gan ${street}, khu vuc ${district} dang co thanh khoan tot, phu hop o va dau tu dai han.`;
}

function ensureJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), "utf8");
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function saveJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

async function seedAgents(minTotal) {
  const currentResult = await pool.query("SELECT COUNT(*)::int AS total FROM accounts_agent");
  const currentTotal = currentResult.rows[0].total;
  const toCreate = Math.max(0, minTotal - currentTotal);

  for (let index = 0; index < toCreate; index += 1) {
    const district = DISTRICTS[index % DISTRICTS.length];
    const coords = pointLatLng(district);
    const name = AGENT_NAMES[index % AGENT_NAMES.length];
    const email = `${slugify(name)}.${index + 1}@geoestate.demo`;
    const phone = `09${randomInt(10000000, 99999999)}`;
    const createdAt = daysAgo(180);
    const updatedAt = new Date(createdAt.getTime() + randomInt(1, 45) * 24 * 60 * 60 * 1000);

    await pool.query(
      `
      INSERT INTO accounts_agent
      (
        name,
        phone,
        email,
        location,
        created_at,
        updated_at,
        is_verified
      )
      VALUES
      (
        $1,
        $2,
        $3,
        ST_SetSRID(ST_MakePoint($5, $4), 4326)::geography,
        $6,
        $7,
        $8
      )
      `,
      [viText(name), phone, email, coords.lat, coords.lng, createdAt.toISOString(), updatedAt.toISOString(), Math.random() > 0.2]
    );
  }

  const allAgents = await pool.query(`
    SELECT id, name, email
    FROM accounts_agent
    ORDER BY id ASC
  `);

  return {
    created: toCreate,
    agents: allAgents.rows,
  };
}

async function seedProperties(minTotal, agentIds) {
  const currentResult = await pool.query("SELECT COUNT(*)::int AS total FROM properties_property");
  const currentTotal = currentResult.rows[0].total;
  const toCreate = Math.max(0, minTotal - currentTotal);
  const newPropertyIds = [];
  const types = ["apartment", "house", "land", "villa"];
  const statuses = ["active", "active", "active", "pending", "sold", "hidden"];

  for (let index = 0; index < toCreate; index += 1) {
    const district = DISTRICTS[index % DISTRICTS.length];
    const street = pick(district.streets);
    const type = types[index % types.length];
    const config = PROPERTY_CONFIG[type];
    const coords = pointLatLng(district);
    const title = viText(pick(PROPERTY_TEMPLATES[type]).replace("{district}", district.name));
    const price = randomInt(config.minPrice / 100_000_000, config.maxPrice / 100_000_000) * 100_000_000;
    const area = randomInt(config.minArea, config.maxArea);
    const createdAt = daysAgo(210);
    const updatedAt = new Date(createdAt.getTime() + randomInt(1, 60) * 24 * 60 * 60 * 1000);
    const listingStatus = pick(statuses);
    const isFeatured = listingStatus === "active" && Math.random() > 0.75;
    const addressNumber = randomInt(12, 480);
    const address = viText(`${addressNumber} ${street}, ${district.name}, TP.HCM`);
    const agentId = agentIds[randomInt(0, agentIds.length - 1)];

    const inserted = await pool.query(
      `
      INSERT INTO properties_property
      (
        title,
        description,
        property_type,
        price,
        area,
        address,
        location,
        created_at,
        updated_at,
        agent_id,
        is_featured,
        listing_status,
        latitude,
        longitude
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        ST_SetSRID(ST_MakePoint($8, $7), 4326)::geography,
        $9,
        $10,
        $11,
        $12,
        $13,
        $7,
        $8
      )
      RETURNING id
      `,
      [
        title,
        viText(propertyDescription(type, district.name, street)),
        type,
        price,
        area,
        address,
        coords.lat,
        coords.lng,
        createdAt.toISOString(),
        updatedAt.toISOString(),
        agentId,
        isFeatured,
        listingStatus,
      ]
    );

    newPropertyIds.push(inserted.rows[0].id);
  }

  const allProperties = await pool.query("SELECT id FROM properties_property ORDER BY id ASC");

  return {
    created: toCreate,
    propertyIds: allProperties.rows.map((row) => row.id),
    newPropertyIds,
  };
}

async function seedPropertyImages(propertyIds) {
  let created = 0;

  for (const propertyId of propertyIds) {
    for (let index = 0; index < 3; index += 1) {
      const imageUrl = IMAGE_URLS[(propertyId + index) % IMAGE_URLS.length];
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
          $6
        )
        `,
        [
          propertyId,
          imageUrl,
          viText(index === 0 ? "Anh chinh" : `Khong gian ${index + 1}`),
          index === 0,
          index,
          daysAgo(120).toISOString(),
        ]
      );
      created += 1;
    }
  }

  return { created };
}

async function seedAmenities(minTotal) {
  const currentResult = await pool.query("SELECT COUNT(*)::int AS total FROM properties_amenity");
  const currentTotal = currentResult.rows[0].total;
  const toCreate = Math.max(0, minTotal - currentTotal);
  const types = Object.keys(AMENITY_LABELS);

  for (let index = 0; index < toCreate; index += 1) {
    const district = DISTRICTS[index % DISTRICTS.length];
    const coords = pointLatLng(district);
    const type = types[index % types.length];
    const base = pick(AMENITY_LABELS[type]);
    const name = viText(`${base} ${district.name}`);

    await pool.query(
      `
      INSERT INTO properties_amenity
      (
        name,
        amenity_type,
        location,
        created_at,
        category
      )
      VALUES
      (
        $1,
        $2,
        ST_SetSRID(ST_MakePoint($4, $3), 4326)::geography,
        $5,
        $6
      )
      `,
      [name, type, coords.lat, coords.lng, daysAgo(240).toISOString(), viText(AMENITY_CATEGORY[type])]
    );
  }

  return { created: toCreate };
}

function seedAuthUsers(agentRows) {
  const filePath = path.join(__dirname, "..", "data", "auth-users.json");
  const store = ensureJson(filePath, { nextId: 1, users: [] });
  const toCreate = Math.max(0, TARGETS.users - store.users.length);
  const agentCandidates = agentRows.slice(0, 8);

  for (let index = 0; index < toCreate; index += 1) {
    const fullName = USER_NAMES[index % USER_NAMES.length];
    const username = `${slugify(fullName)}${String(store.nextId).padStart(2, "0")}`;
    const role = index < agentCandidates.length ? "agent" : "user";
    const linkedAgentId = role === "agent" ? agentCandidates[index % agentCandidates.length]?.id || null : null;

    store.users.push({
      id: store.nextId,
      username,
      password: hashPassword("1"),
      email: `${username}@demo.local`,
      full_name: viText(fullName),
      role,
      linked_agent_id: linkedAgentId,
    });
    store.nextId += 1;
  }

  saveJson(filePath, store);
  return { created: toCreate, users: store.users };
}

function seedForms(propertyIds, agentIds, users) {
  const filePath = path.join(__dirname, "..", "data", "forms.json");
  const store = ensureJson(filePath, {
    nextLeadId: 1,
    nextAppointmentId: 1,
    nextPasswordResetRequestId: 1,
    leads: [],
    appointments: [],
    passwordResetRequests: [],
    nextAgentReviewId: 1,
    agentReviews: [],
  });

  const stageCycle = ["new", "contacted", "qualified", "won", "lost"];
  const leadToCreate = Math.max(0, TARGETS.leads - store.leads.length);
  const appointmentToCreate = Math.max(0, TARGETS.appointments - store.appointments.length);
  const reviewsToCreate = Math.max(0, TARGETS.agentReviews - store.agentReviews.length);

  for (let index = 0; index < leadToCreate; index += 1) {
    const name = USER_NAMES[index % USER_NAMES.length];
    const createdAt = daysAgo(150).toISOString();
    store.leads.push({
      id: String(store.nextLeadId),
      name: viText(name),
      email: `${slugify(name)}.${store.nextLeadId}@mail.demo`,
      phone: `09${randomInt(10000000, 99999999)}`,
      property_interest: viText(pick([
        "Can ho 2PN gan trung tam",
        "Nha pho o thuc",
        "Dat nen dau tu",
        "Biet thu compound",
      ])),
      message: viText(pick(LEAD_MESSAGES)),
      created_at: createdAt,
      pipeline_stage: stageCycle[index % stageCycle.length],
    });
    store.nextLeadId += 1;
  }

  for (let index = 0; index < appointmentToCreate; index += 1) {
    const name = USER_NAMES[(index + 5) % USER_NAMES.length];
    const appointmentDate = new Date(Date.now() + randomInt(2, 25) * 24 * 60 * 60 * 1000);
    store.appointments.push({
      id: String(store.nextAppointmentId),
      full_name: viText(name),
      phone: `09${randomInt(10000000, 99999999)}`,
      property_id: String(pick(propertyIds)),
      appointment_date: appointmentDate.toISOString().slice(0, 10),
      note: viText(pick([
        "Can xem buoi toi sau gio hanh chinh.",
        "Can tu van them ve vay ngan hang.",
        "Muon xem thuc te cung gia dinh.",
        "Can trao doi ve phap ly truoc khi dat coc.",
      ])),
      created_at: daysAgo(90).toISOString(),
    });
    store.nextAppointmentId += 1;
  }

  for (let index = 0; index < reviewsToCreate; index += 1) {
    const user = users[index % users.length];
    const createdAt = daysAgo(120).toISOString();
    store.agentReviews.push({
      id: String(store.nextAgentReviewId),
      agent_id: String(pick(agentIds)),
      reviewer_key: `seed:${user.id}:${index + 1}`,
      reviewer_user_id: user.role === "user" ? user.id : null,
      rating: pick([4, 4, 5, 5, 5, 3]),
      comment: viText(pick(REVIEW_COMMENTS)),
      author_name: viText(user.full_name || user.username),
      created_at: createdAt,
      updated_at: createdAt,
    });
    store.nextAgentReviewId += 1;
  }

  saveJson(filePath, store);
  return {
    leadsCreated: leadToCreate,
    appointmentsCreated: appointmentToCreate,
    reviewsCreated: reviewsToCreate,
    leadsTotal: store.leads.length,
    appointmentsTotal: store.appointments.length,
    reviewsTotal: store.agentReviews.length,
  };
}

function seedCollections(propertyIds, users) {
  const filePath = path.join(__dirname, "..", "data", "collections.json");
  const store = ensureJson(filePath, {
    wishlist: {},
    compare: {},
    savedSearches: {},
    nextSavedSearchId: 1,
  });

  const activeUsers = users.filter((user) => user.role === "user").slice(0, 12);

  for (const user of activeUsers) {
    const key = `user:${user.id}`;
    const shuffled = [...propertyIds].sort(() => Math.random() - 0.5);
    store.wishlist[key] = shuffled.slice(0, randomInt(3, 8));
    store.compare[key] = shuffled.slice(8, 10);
    store.savedSearches[key] = viObjectStrings([
      {
        id: String(store.nextSavedSearchId++),
        name: "Can ho gan trung tam",
        filters: { q: "trung tam", type: "apartment", minPrice: 2500000000, maxPrice: 9000000000 },
        created_at: daysAgo(90).toISOString(),
      },
      {
        id: String(store.nextSavedSearchId++),
        name: "Dat nen dau tu",
        filters: { type: "land", listing_status: "active" },
        created_at: daysAgo(60).toISOString(),
      },
    ]);
  }

  store.wishlist.guest ||= propertyIds.slice(0, 2);
  store.compare.guest ||= propertyIds.slice(2, 4);
  store.savedSearches.guest ||= [];

  saveJson(filePath, store);
  return { userBuckets: activeUsers.length };
}

async function main() {
  const summary = {};

  try {
    await pool.query("BEGIN");

    const agentResult = await seedAgents(TARGETS.agents);
    summary.agents = agentResult.created;

    const propertyResult = await seedProperties(
      TARGETS.properties,
      agentResult.agents.map((agent) => agent.id)
    );
    summary.properties = propertyResult.created;

    const imageResult = await seedPropertyImages(propertyResult.newPropertyIds);
    summary.images = imageResult.created;

    const amenityResult = await seedAmenities(TARGETS.amenities);
    summary.amenities = amenityResult.created;

    await pool.query("COMMIT");

    const authResult = seedAuthUsers(agentResult.agents);
    summary.users = authResult.created;

    const formsResult = seedForms(
      propertyResult.propertyIds,
      agentResult.agents.map((agent) => agent.id),
      authResult.users
    );
    summary.leads = formsResult.leadsCreated;
    summary.appointments = formsResult.appointmentsCreated;
    summary.reviews = formsResult.reviewsCreated;

    const collectionsResult = seedCollections(propertyResult.propertyIds, authResult.users);
    summary.collections = collectionsResult.userBuckets;

    const finalCounts = await pool.query(`
      SELECT 'properties_property' AS table_name, COUNT(*)::int AS total FROM properties_property
      UNION ALL
      SELECT 'accounts_agent', COUNT(*)::int FROM accounts_agent
      UNION ALL
      SELECT 'properties_amenity', COUNT(*)::int FROM properties_amenity
      UNION ALL
      SELECT 'properties_propertyimage', COUNT(*)::int FROM properties_propertyimage
    `);

    console.log("Seed completed.");
    console.table(summary);
    console.table(finalCounts.rows);
    console.log({
      leads: formsResult.leadsTotal,
      appointments: formsResult.appointmentsTotal,
      agentReviews: formsResult.reviewsTotal,
      authUsers: authResult.users.length,
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Seed failed:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
