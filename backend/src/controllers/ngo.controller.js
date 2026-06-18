//  NGO — controllers/ngo.controller.js
// ============================================================
import bcrypt from "bcrypt";
import crypto from "crypto";
import pool, { mapRowKeys, mapRows } from "../config/db.js";
import { uploadSingleImage } from "../utils/cloudinary.js";
 
async function listNgos(req, res) {
  try {
    const { verified, location, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const params = [];
    let paramIndex = 1;

    let queryText = `
      SELECT id, name, email, phone_number, location, photo_url, verified, area_of_work, description,
             registration_number, created_at, latitude, longitude, upi_id
      FROM ngos WHERE 1=1
    `;

    if (verified !== undefined) {
      queryText += ` AND verified = $${paramIndex}`;
      params.push(verified === "true");
      paramIndex++;
    }

    if (location) {
      queryText += ` AND location ILIKE $${paramIndex}`;
      params.push(`%${location}%`);
      paramIndex++;
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), offset);

    const { rows } = await pool.query(queryText, params);
    return res.json(mapRows(rows));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function getNgoById(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, phone_number, registration_number, location, photo_url, verified, created_at,
              area_of_work, description, achievements, work_done, latitude, longitude, upi_id, website_url
       FROM ngos WHERE id = $1`,
      [req.params.id]
    );
    const ngo = rows[0] ? mapRowKeys(rows[0]) : null;
    if (!ngo) return res.status(404).json({ message: "NGO not found" });
    return res.json(ngo);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function getNgoPosts(req, res) {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM ngo_posts WHERE ngo_id = $1 ORDER BY created_at DESC",
      [req.params.id]
    );
    return res.json(mapRows(rows));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function getMyProfile(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, phone_number, registration_number, location, photo_url,
              verified, otp_verified, created_at, area_of_work, description, achievements, work_done,
              upi_id, website_url
       FROM ngos WHERE id = $1`,
      [req.user.id]
    );
    const ngo = rows[0] ? mapRowKeys(rows[0]) : null;
    return res.json(ngo);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function updateMyProfile(req, res) {
  try {
    const { name, phoneNumber, location, photoUrl, registrationNumber, areaOfWork, description, achievements, workDone, upiId, websiteUrl } = req.body;
    
    let finalPhotoUrl = photoUrl;
    if (photoUrl && photoUrl.startsWith("data:")) {
      finalPhotoUrl = await uploadSingleImage(photoUrl);
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    const fields = {
      name,
      phone_number: phoneNumber,
      location,
      photo_url: finalPhotoUrl,
      registration_number: registrationNumber,
      area_of_work: areaOfWork,
      description,
      achievements,
      work_done: workDone,
      upi_id: upiId,
      website_url: websiteUrl,
    };

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      const { rows } = await pool.query(
        `SELECT id, name, email, photo_url, phone_number, location, registration_number,
                area_of_work, description, achievements, work_done, upi_id, website_url
         FROM ngos WHERE id = $1`,
        [req.user.id]
      );
      return res.json(mapRowKeys(rows[0]));
    }

    params.push(req.user.id);
    const queryText = `
      UPDATE ngos 
      SET ${updates.join(", ")} 
      WHERE id = $${paramIndex} 
      RETURNING id, name, email, photo_url, phone_number, location, registration_number,
                area_of_work, description, achievements, work_done, upi_id, website_url
    `;
    const { rows } = await pool.query(queryText, params);
    const updated = mapRowKeys(rows[0]);
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const { rows } = await pool.query("SELECT password_hash FROM ngos WHERE id = $1", [req.user.id]);
    const ngo = rows[0] ? mapRowKeys(rows[0]) : null;
    if (!ngo) return res.status(404).json({ message: "NGO not found" });

    const valid = await bcrypt.compare(currentPassword, ngo.passwordHash);
    if (!valid) return res.status(400).json({ message: "Current password is incorrect" });
 
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*_])[A-Za-z\d!@#$%^&*_]{8,16}$/.test(newPassword)) {
      return res.status(400).json({ message: "New password must be 8 to 16 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special symbol from !@#$%^&*__." });
    }
 
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await pool.query("UPDATE ngos SET password_hash = $1 WHERE id = $2", [passwordHash, req.user.id]);
    return res.json({ message: "Password changed" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function getMyDonations(req, res) {
  try {
    console.log(`[NGO CONTROLLER] Fetching donations for NGO: ${req.user?.id}`);
    const { rows: donationRows } = await pool.query(
      "SELECT * FROM donations WHERE recipient_ngo_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    const donations = mapRows(donationRows);

    for (const d of donations) {
      const { rows: itemRows } = await pool.query(
        "SELECT * FROM donation_items WHERE donation_id = $1",
        [d.id]
      );
      d.items = mapRows(itemRows);

      if (d.donorId) {
        const { rows: uRows } = await pool.query("SELECT id, name, phone_number FROM users WHERE id = $1", [d.donorId]);
        d.donor = uRows[0] ? mapRowKeys(uRows[0]) : null;
      } else {
        d.donor = null;
      }

      if (d.donorNgoId) {
        const { rows: nRows } = await pool.query("SELECT id, name, phone_number FROM ngos WHERE id = $1", [d.donorNgoId]);
        d.donorNgo = nRows[0] ? mapRowKeys(nRows[0]) : null;
      } else {
        d.donorNgo = null;
      }
    }

    return res.json(donations);
  } catch (err) {
    console.error("[NGO CONTROLLER] getMyDonations Error:", err);
    return res.status(500).json({ message: err.message, error: err.stack });
  }
}
 
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
 
async function getNearbyRescueRequests(req, res) {
  try {
    const { rows: ngoRows } = await pool.query("SELECT * FROM ngos WHERE id = $1", [req.user.id]);
    const ngo = ngoRows[0] ? mapRowKeys(ngoRows[0]) : null;
    if (!ngo) return res.status(404).json({ message: "NGO not found" });
 
    // Fetch all open rescue requests or requests assigned to this NGO
    const { rows: rescueRows } = await pool.query(
      "SELECT * FROM rescue_requests WHERE status = 'OPEN' OR nearby_center_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    const rescues = mapRows(rescueRows);

    for (const r of rescues) {
      if (r.reporterId) {
        const { rows: uRows } = await pool.query("SELECT id, name, phone_number FROM users WHERE id = $1", [r.reporterId]);
        r.reporter = uRows[0] ? mapRowKeys(uRows[0]) : null;
      } else {
        r.reporter = null;
      }

      if (r.reporterNgoId) {
        const { rows: nRows } = await pool.query("SELECT id, name, phone_number FROM ngos WHERE id = $1", [r.reporterNgoId]);
        r.reporterNgo = nRows[0] ? mapRowKeys(nRows[0]) : null;
      } else {
        r.reporterNgo = null;
      }
    }
 
    let results = rescues;
    if (ngo.latitude && ngo.longitude) {
      results = rescues.map((r) => {
        if (r.latitude && r.longitude) {
          const dist = calculateDistance(ngo.latitude, ngo.longitude, r.latitude, r.longitude);
          return { ...r, distance: Number(dist.toFixed(2)) };
        }
        return { ...r, distance: 9999 };
      });
      // Sort by distance
      results.sort((a, b) => a.distance - b.distance);
    } else {
      results = rescues.map((r) => ({ ...r, distance: null }));
    }
 
    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function createPost(req, res) {
  try {
    const { postType, title, description, location } = req.body;
    const id = crypto.randomUUID();

    const { rows } = await pool.query(
      `INSERT INTO ngo_posts (id, ngo_id, post_type, title, description, location, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
      [id, req.user.id, postType, title, description, location]
    );

    const post = mapRowKeys(rows[0]);
    return res.status(201).json(post);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function updatePost(req, res) {
  try {
    const { title, description, location, postType } = req.body;
    const { rows: checkRows } = await pool.query(
      "SELECT * FROM ngo_posts WHERE id = $1 AND ngo_id = $2",
      [req.params.postId, req.user.id]
    );
    const post = checkRows[0];
    if (!post) return res.status(404).json({ message: "Post not found" });
 
    const { rows: updateRows } = await pool.query(
      `UPDATE ngo_posts
       SET title = $1, description = $2, location = $3, post_type = $4
       WHERE id = $5 RETURNING *`,
      [title, description, location, postType, req.params.postId]
    );

    const updated = mapRowKeys(updateRows[0]);
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function deletePost(req, res) {
  try {
    const { rows: checkRows } = await pool.query(
      "SELECT * FROM ngo_posts WHERE id = $1 AND ngo_id = $2",
      [req.params.postId, req.user.id]
    );
    const post = checkRows[0];
    if (!post) return res.status(404).json({ message: "Post not found" });
 
    await pool.query("DELETE FROM ngo_posts WHERE id = $1", [req.params.postId]);
    return res.json({ message: "Post deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function createNgoReview(req, res) {
  try {
    const { content, rating } = req.body;
    const ngoId = req.params.id;
 
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }
 
    const { rows: ngoRows } = await pool.query("SELECT * FROM ngos WHERE id = $1", [ngoId]);
    if (ngoRows.length === 0) return res.status(404).json({ message: "NGO not found" });
 
    const id = crypto.randomUUID();
    const { rows: insertRows } = await pool.query(
      `INSERT INTO ngo_reviews (id, ngo_id, user_id, content, rating, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [id, ngoId, req.user.id, content || "", Number(rating)]
    );

    const review = mapRowKeys(insertRows[0]);

    const { rows: uRows } = await pool.query("SELECT id, name, photo_url FROM users WHERE id = $1", [req.user.id]);
    review.user = uRows[0] ? mapRowKeys(uRows[0]) : null;
 
    return res.status(201).json(review);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function listNgoReviews(req, res) {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM ngo_reviews WHERE ngo_id = $1 ORDER BY created_at DESC",
      [req.params.id]
    );
    const reviews = mapRows(rows);

    for (const r of reviews) {
      const { rows: uRows } = await pool.query("SELECT id, name, photo_url FROM users WHERE id = $1", [r.userId]);
      r.user = uRows[0] ? mapRowKeys(uRows[0]) : null;
    }

    return res.json(reviews);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
export const ngoController = {
  listNgos, getNgoById, getNgoPosts,
  getMyProfile, updateMyProfile, changePassword,
  getMyDonations, getNearbyRescueRequests,
  createPost, updatePost, deletePost,
  createNgoReview, listNgoReviews,
};
