//  PUBLIC / MISC — controllers/public.controller.js
// ============================================================
import pool, { mapRowKeys, mapRows } from "../config/db.js";
import crypto from "crypto";
import https from "https";

// 15-second in-memory caches for stats to prevent DB pool exhaustion
let statsCache = null;
let statsCacheTime = 0;

let animalStatsCache = null;
let animalStatsCacheTime = 0;

let leaderboardCache = null;
let leaderboardCacheTime = 0;

// ── FAQs ─────────────────────────────────────────────────────

async function listFaqs(req, res) {
  try {
    const { category } = req.query;
    let queryText = `
      SELECT f.*, a.name AS "creator_admin_name"
      FROM faqs f
      LEFT JOIN admins a ON f.created_by_admin_id = a.id
    `;
    const params = [];
    if (category) {
      queryText += " WHERE f.category ILIKE $1";
      params.push(`%${category}%`);
    }
    queryText += " ORDER BY f.category ASC, f.id ASC";

    const { rows } = await pool.query(queryText, params);
    const faqs = mapRows(rows).map(row => ({
      ...row,
      createdByAdmin: row.createdByAdminId ? { name: row.creatorAdminName } : null
    }));
    return res.json(faqs);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// ── Testimonials ─────────────────────────────────────────────

async function listTestimonials(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT t.*, u.name AS "user_name", u.photo_url AS "user_photoUrl"
      FROM testimonials t
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
      LIMIT 50
    `);
    const testimonials = mapRows(rows).map(row => ({
      ...row,
      user: row.userId ? { id: row.userId, name: row.userName, photoUrl: row.userPhotoUrl } : null
    }));

    return res.json(testimonials);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function createTestimonial(req, res) {
  try {
    const { content, rating } = req.body;

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const id = crypto.randomUUID();
    const { rows } = await pool.query(
      "INSERT INTO testimonials (id, user_id, content, rating, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *",
      [id, req.user.id, content, rating]
    );

    const testimonial = mapRowKeys(rows[0]);
    return res.status(201).json(testimonial);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// ── Newsletter ────────────────────────────────────────────────

async function subscribeNewsletter(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    // Check if email matches an existing user or NGO
    const userCheck = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    const userId = userCheck.rows[0]?.id || null;

    const ngoCheck = await pool.query("SELECT id FROM ngos WHERE email = $1", [email]);
    const ngoId = ngoCheck.rows[0]?.id || null;

    const check = await pool.query("SELECT id FROM newsletters WHERE email = $1", [email]);
    let subscriptionId;

    if (check.rows.length > 0) {
      subscriptionId = check.rows[0].id;
      // Optionally update user_id / ngo_id if not already set
      await pool.query(
        "UPDATE newsletters SET user_id = COALESCE(user_id, $1), ngo_id = COALESCE(ngo_id, $2) WHERE id = $3",
        [userId, ngoId, subscriptionId]
      );
    } else {
      const id = crypto.randomUUID();
      const insert = await pool.query(
        "INSERT INTO newsletters (id, email, user_id, ngo_id, subscribed_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id",
        [id, email, userId, ngoId]
      );
      subscriptionId = insert.rows[0].id;
    }

    return res.status(201).json({ message: "Subscribed successfully", id: subscriptionId });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function unsubscribeNewsletter(req, res) {
  try {
    const { email } = req.body;
    await pool.query("DELETE FROM newsletters WHERE email = $1", [email]);
    return res.json({ message: "Unsubscribed successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// ── Contact ───────────────────────────────────────────────────

async function sendContactMessage(req, res) {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "Name, email, and message are required" });
    }

    // Check if email matches an existing user or NGO
    const userCheck = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    const userId = userCheck.rows[0]?.id || null;

    const ngoCheck = await pool.query("SELECT id FROM ngos WHERE email = $1", [email]);
    const ngoId = ngoCheck.rows[0]?.id || null;

    const id = crypto.randomUUID();
    const { rows } = await pool.query(
      `INSERT INTO contact_messages (id, name, email, phone, message, user_id, ngo_id, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', NOW()) RETURNING id`,
      [id, name, email, phone || null, message, userId, ngoId]
    );

    return res.status(201).json({ message: "Message received. We'll get back to you soon.", id: rows[0].id });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// ── Locations ─────────────────────────────────────────────────

async function listLocations(req, res) {
  try {
    const { type } = req.query;
    let queryText = `
      SELECT l.*, 
             a.name AS "creator_admin_name",
             n.name AS "ngo_name"
      FROM locations l
      LEFT JOIN admins a ON l.created_by_admin_id = a.id
      LEFT JOIN ngos n ON l.ngo_id = n.id
    `;
    const params = [];
    if (type) {
      queryText += " WHERE l.type = $1";
      params.push(type);
    }
    queryText += " ORDER BY l.name ASC";

    const { rows } = await pool.query(queryText, params);
    const locations = mapRows(rows).map(row => ({
      ...row,
      createdByAdmin: row.createdByAdminId ? { name: row.creatorAdminName } : null,
      ngo: row.ngoId ? { name: row.ngoName } : null
    }));
    return res.json(locations);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getLocationById(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT l.*, 
             a.name AS "creator_admin_name",
             n.name AS "ngo_name"
      FROM locations l
      LEFT JOIN admins a ON l.created_by_admin_id = a.id
      LEFT JOIN ngos n ON l.ngo_id = n.id
      WHERE l.id = $1
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Location not found" });
    }
    const row = mapRowKeys(rows[0]);
    const location = {
      ...row,
      createdByAdmin: row.createdByAdminId ? { name: row.creatorAdminName } : null,
      ngo: row.ngoId ? { name: row.ngoName } : null
    };
    return res.json(location);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getStats(req, res) {
  try {
    const now = Date.now();
    if (statsCache && (now - statsCacheTime < 15000)) {
      return res.json(statsCache);
    }

    const queryHelper = async (queryText, params = []) => {
      try {
        const res = await pool.query(queryText, params);
        return parseInt(res.rows[0].count, 10);
      } catch {
        return 0;
      }
    };

    const [donationsCount, animalsCount, ngosCount, volunteersCount] = await Promise.all([
      queryHelper("SELECT COUNT(*)::int AS count FROM donations"),
      queryHelper("SELECT COUNT(*)::int AS count FROM rescue_requests WHERE status = 'RESOLVED'"),
      queryHelper("SELECT COUNT(*)::int AS count FROM ngos"),
      queryHelper("SELECT COUNT(*)::int AS count FROM users")
    ]);

    const result = {
      success: true,
      data: {
        donations: donationsCount,
        animals: animalsCount,
        ngos: ngosCount,
        volunteers: volunteersCount,
      },
    };

    statsCache = result;
    statsCacheTime = now;
    return res.json(result);
  } catch (err) {
    console.error("Failed to query stats from DB:", err.message);
    return res.json({
      success: true,
      data: {
        donations: 0,
        animals: 0,
        ngos: 0,
        volunteers: 0,
      },
    });
  }
}

async function getLeaderboard(req, res) {
  try {
    const now = Date.now();
    if (leaderboardCache && (now - leaderboardCacheTime < 15000)) {
      return res.json(leaderboardCache);
    }

    const queryText = `
      WITH campaign_counts AS (
        SELECT organizer_user_id AS user_id, COUNT(*)::int AS count FROM campaigns GROUP BY organizer_user_id
      ),
      participant_counts AS (
        SELECT user_id, COUNT(*)::int AS count FROM campaign_participants GROUP BY user_id
      ),
      donation_counts AS (
        SELECT donor_id AS user_id, COUNT(*)::int AS count FROM donations GROUP BY donor_id
      ),
      rescue_counts AS (
        SELECT reporter_id AS user_id, COUNT(*)::int AS count FROM rescue_requests GROUP BY reporter_id
      ),
      adoption_counts AS (
        SELECT adopter_id AS user_id, COUNT(*)::int AS count FROM adoptions GROUP BY adopter_id
      )
      SELECT 
        u.id, 
        u.name, 
        u.photo_url,
        COALESCE(cc.count, 0) AS "campaignsOrganized",
        COALESCE(pc.count, 0) AS "campaignsJoined",
        COALESCE(dc.count, 0) AS "donationsCount",
        COALESCE(rc.count, 0) AS "rescueRequestsCount",
        COALESCE(ac.count, 0) AS "adoptionsCount"
      FROM users u
      LEFT JOIN campaign_counts cc ON u.id = cc.user_id
      LEFT JOIN participant_counts pc ON u.id = pc.user_id
      LEFT JOIN donation_counts dc ON u.id = dc.user_id
      LEFT JOIN rescue_counts rc ON u.id = rc.user_id
      LEFT JOIN adoption_counts ac ON u.id = ac.user_id
    `;

    const { rows } = await pool.query(queryText);

    const leaderboard = rows.map(user => {
      const organized = user.campaignsOrganized || 0;
      const joined = user.campaignsJoined || 0;
      const donations = user.donationsCount || 0;
      const rescues = user.rescueRequestsCount || 0;
      const adoptions = user.adoptionsCount || 0;

      const points = (organized * 10) + (joined * 5) + (donations * 5) + (rescues * 8) + (adoptions * 10);

      return {
        id: user.id,
        name: user.name,
        photoUrl: user.photo_url,
        points
      };
    })
      .sort((a, b) => b.points - a.points)
      .slice(0, 10);

    leaderboardCache = leaderboard;
    leaderboardCacheTime = now;
    return res.json(leaderboard);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getAnimalStats(req, res) {
  try {
    const now = Date.now();
    if (animalStatsCache && (now - animalStatsCacheTime < 15000)) {
      return res.json(animalStatsCache);
    }

    const queryHelper = async (queryText, params = []) => {
      try {
        const res = await pool.query(queryText, params);
        return parseInt(res.rows[0].count, 10);
      } catch {
        return 0;
      }
    };

    const [rescued, adopted, fed, shelters] = await Promise.all([
      queryHelper("SELECT COUNT(*)::int AS count FROM rescue_requests WHERE status IN ('RESOLVED', 'CLOSED')"),
      queryHelper("SELECT COUNT(*)::int AS count FROM adoptions WHERE status IN ('ADOPTED', 'COMPLETED')"),
      queryHelper("SELECT COUNT(*)::int AS count FROM campaigns WHERE type = 'ANIMAL_WELFARE' AND status = 'COMPLETED'"),
      queryHelper("SELECT COUNT(*)::int AS count FROM ngos WHERE area_of_work = 'Animal Welfare'")
    ]);

    const result = {
      rescued,
      adopted,
      fed,
      shelters
    };

    animalStatsCache = result;
    animalStatsCacheTime = now;
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getOsmShelters(req, res) {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ message: "Query is required" });
    }

    const postData = "data=" + encodeURIComponent(query);
    let lastError = null;
    let data = null;

    const endpoints = [
      "overpass-api.de",
      "lz4.overpass-api.de",
      "overpass.kumi.systems"
    ];

    for (const host of endpoints) {
      try {
        const options = {
          hostname: host,
          port: 443,
          path: "/api/interpreter",
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": Buffer.byteLength(postData),
            "User-Agent": "HelpingHandsPlatform/1.0 (https://github.com/amansahu16/helping-hands-main)"
          },
          timeout: 6000
        };

        const result = await new Promise((resolve, reject) => {
          const request = https.request(options, (response) => {
            let responseData = "";
            response.on("data", (chunk) => {
              responseData += chunk;
            });
            response.on("end", () => {
              if (response.statusCode >= 200 && response.statusCode < 300) {
                try {
                  resolve(JSON.parse(responseData));
                } catch (e) {
                  reject(new Error("Failed to parse response from " + host));
                }
              } else {
                reject(new Error(`Host ${host} responded with status ${response.statusCode}`));
              }
            });
          });

          request.on("error", (error) => {
            reject(error);
          });

          request.on("timeout", () => {
            request.destroy();
            reject(new Error(`Timeout querying ${host}`));
          });

          request.write(postData);
          request.end();
        });

        data = result;
        break;
      } catch (err) {
        console.log(`Overpass API attempt on ${host} failed:`, err.message);
        lastError = err;
      }
    }

    if (data) {
      return res.json(data);
    }

    console.log("All Overpass API endpoints failed. Last error:", lastError?.message);
    return res.json({ elements: [] });
  } catch (err) {
    console.error("getOsmShelters global error:", err.message);
    return res.json({ elements: [] });
  }
}

export const publicController = {
  listFaqs,
  listTestimonials, createTestimonial,
  subscribeNewsletter, unsubscribeNewsletter,
  sendContactMessage,
  listLocations, getLocationById,
  getStats,
  getLeaderboard,
  getAnimalStats,
  getOsmShelters,
};