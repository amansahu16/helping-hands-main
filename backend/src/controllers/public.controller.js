//  PUBLIC / MISC — controllers/public.controller.js
// ============================================================
import pool, { mapRowKeys, mapRows } from "../config/db.js";
import crypto from "crypto";

// ── FAQs ─────────────────────────────────────────────────────

async function listFaqs(req, res) {
  try {
    const { category } = req.query;
    let queryText = "SELECT * FROM faqs";
    const params = [];
    if (category) {
      queryText += " WHERE category ILIKE $1";
      params.push(`%${category}%`);
    }
    queryText += " ORDER BY category ASC";

    const { rows } = await pool.query(queryText, params);
    return res.json(mapRows(rows));
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

    const check = await pool.query("SELECT id FROM newsletters WHERE email = $1", [email]);
    let subscriptionId;

    if (check.rows.length > 0) {
      subscriptionId = check.rows[0].id;
    } else {
      const id = crypto.randomUUID();
      const insert = await pool.query(
        "INSERT INTO newsletters (id, email, subscribed_at) VALUES ($1, $2, NOW()) RETURNING id",
        [id, email]
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

    const id = crypto.randomUUID();
    const { rows } = await pool.query(
      "INSERT INTO contact_messages (id, name, email, phone, message, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id",
      [id, name, email, phone || null, message]
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
    let queryText = "SELECT * FROM locations";
    const params = [];
    if (type) {
      queryText += " WHERE type = $1";
      params.push(type);
    }
    queryText += " ORDER BY name ASC";

    const { rows } = await pool.query(queryText, params);
    return res.json(mapRows(rows));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getLocationById(req, res) {
  try {
    const { rows } = await pool.query("SELECT * FROM locations WHERE id = $1", [req.params.id]);
    const location = rows[0] ? mapRowKeys(rows[0]) : null;
    if (!location) return res.status(404).json({ message: "Location not found" });
    return res.json(location);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getStats(req, res) {
  try {
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

    return res.json({
      success: true,
      data: {
        donations: donationsCount,
        animals: animalsCount,
        ngos: ngosCount,
        volunteers: volunteersCount,
      },
    });
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
    const { rows } = await pool.query(`
      SELECT 
        u.id, 
        u.name, 
        u.photo_url,
        (SELECT COUNT(*)::int FROM campaigns WHERE organizer_user_id = u.id) AS "campaignsOrganized",
        (SELECT COUNT(*)::int FROM campaign_participants WHERE user_id = u.id) AS "campaignsJoined",
        (SELECT COUNT(*)::int FROM donations WHERE donor_id = u.id) AS "donationsCount",
        (SELECT COUNT(*)::int FROM rescue_requests WHERE reporter_id = u.id) AS "rescueRequestsCount",
        (SELECT COUNT(*)::int FROM adoptions WHERE adopter_id = u.id) AS "adoptionsCount"
      FROM users u
    `);

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

    return res.json(leaderboard);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getAnimalStats(req, res) {
  try {
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
      queryHelper("SELECT COUNT(*)::int AS count FROM adoptions WHERE status = 'COMPLETED'"),
      queryHelper("SELECT COUNT(*)::int AS count FROM campaigns WHERE type = 'ANIMAL_WELFARE' AND status = 'COMPLETED'"),
      queryHelper("SELECT COUNT(*)::int AS count FROM ngos WHERE area_of_work = 'Animal Welfare'")
    ]);

    return res.json({
      rescued,
      adopted,
      fed,
      shelters
    });
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

    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: "data=" + encodeURIComponent(query),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "HelpingHandsPlatform/1.0 (https://github.com/amansahu16/helping-hands-main)"
      },
    });

    if (!response.ok) {
      throw new Error(`Overpass API responded with status ${response.status}`);
    }

    const data = await response.json();
    return res.json(data);
  } catch (err) {
    console.error("Error calling Overpass API:", err.message);
    return res.status(500).json({ message: "Failed to fetch from Overpass API", error: err.message });
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