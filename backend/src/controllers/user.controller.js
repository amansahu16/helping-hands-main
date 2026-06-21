// ============================================================
//  USER PROFILE — controllers/user.controller.js
// ============================================================
import bcrypt from "bcrypt";
import pool, { mapRowKeys, mapRows } from "../config/db.js";
import { uploadSingleImage } from "../utils/cloudinary.js";
 
async function getProfile(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, phone_number, date_of_birth, location, 
              occupation, photo_url, otp_verified, created_at 
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    const user = rows[0] ? mapRowKeys(rows[0]) : null;
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function updateProfile(req, res) {
  try {
    const { name, phoneNumber, dateOfBirth, location, occupation, photoUrl } = req.body;
    
    let finalPhotoUrl = photoUrl;
    if (photoUrl && photoUrl.startsWith("data:")) {
      finalPhotoUrl = await uploadSingleImage(photoUrl);
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      params.push(name);
      paramIndex++;
    }
    if (phoneNumber !== undefined) {
      updates.push(`phone_number = $${paramIndex}`);
      params.push(phoneNumber);
      paramIndex++;
    }
    if (dateOfBirth !== undefined) {
      updates.push(`date_of_birth = $${paramIndex}`);
      params.push(dateOfBirth ? new Date(dateOfBirth) : null);
      paramIndex++;
    }
    if (location !== undefined) {
      updates.push(`location = $${paramIndex}`);
      params.push(location);
      paramIndex++;
    }
    if (occupation !== undefined) {
      updates.push(`occupation = $${paramIndex}`);
      params.push(occupation);
      paramIndex++;
    }
    if (finalPhotoUrl !== undefined) {
      updates.push(`photo_url = $${paramIndex}`);
      params.push(finalPhotoUrl);
      paramIndex++;
    }

    if (updates.length === 0) {
      const { rows } = await pool.query("SELECT id, name, email, photo_url FROM users WHERE id = $1", [req.user.id]);
      return res.json(mapRowKeys(rows[0]));
    }

    params.push(req.user.id);
    const queryText = `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING id, name, email, photo_url`;
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
    
    const { rows } = await pool.query("SELECT password_hash FROM users WHERE id = $1", [req.user.id]);
    const user = rows[0] ? mapRowKeys(rows[0]) : null;
    if (!user) return res.status(404).json({ message: "User not found" });
 
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(400).json({ message: "Current password is incorrect" });
 
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*_])[A-Za-z\d!@#$%^&*_]{8,16}$/.test(newPassword)) {
      return res.status(400).json({ message: "New password must be 8 to 16 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special symbol from !@#$%^&*__." });
    }
 
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [passwordHash, req.user.id]);
    return res.json({ message: "Password changed successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function deleteAccount(req, res) {
  try {
    await pool.query("DELETE FROM users WHERE id = $1", [req.user.id]);
    return res.json({ message: "Account deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function getMyDonations(req, res) {
  try {
    console.log(`[USER CONTROLLER] Fetching donations for user: ${req.user?.id}`);
    const { rows: donationRows } = await pool.query(
      "SELECT * FROM donations WHERE donor_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    const donations = mapRows(donationRows);

    for (const d of donations) {
      const { rows: itemRows } = await pool.query(
        "SELECT * FROM donation_items WHERE donation_id = $1",
        [d.id]
      );
      d.items = mapRows(itemRows);

      if (d.recipientNgoId) {
        const { rows: ngoRows } = await pool.query(
          "SELECT id, name, photo_url, registration_number, upi_id FROM ngos WHERE id = $1",
          [d.recipientNgoId]
        );
        d.recipientNgo = ngoRows[0] ? mapRowKeys(ngoRows[0]) : null;
      } else {
        d.recipientNgo = null;
      }
    }

    return res.json(donations);
  } catch (err) {
    console.error("[USER CONTROLLER] getMyDonations Error:", err);
    return res.status(500).json({ message: err.message, error: err.stack });
  }
}
 
async function getMyAdoptions(req, res) {
  try {
    const { rows: adoptionRows } = await pool.query(
      "SELECT * FROM adoptions WHERE adopter_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    const adoptions = mapRows(adoptionRows);

    for (const a of adoptions) {
      const { rows: animalRows } = await pool.query(
        "SELECT * FROM animals WHERE id = $1",
        [a.animalId]
      );
      a.animal = animalRows[0] ? mapRowKeys(animalRows[0]) : null;

      if (a.ngoId) {
        const { rows: ngoRows } = await pool.query(
          "SELECT id, name FROM ngos WHERE id = $1",
          [a.ngoId]
        );
        a.ngo = ngoRows[0] ? mapRowKeys(ngoRows[0]) : null;
      } else {
        a.ngo = null;
      }
    }

    return res.json(adoptions);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function getMyRescueRequests(req, res) {
  try {
    const { rows: rescueRows } = await pool.query(
      "SELECT * FROM rescue_requests WHERE reporter_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    const rescues = mapRows(rescueRows);

    for (const r of rescues) {
      if (r.nearbyCenterId) {
        const { rows: ngoRows } = await pool.query(
          "SELECT id, name FROM ngos WHERE id = $1",
          [r.nearbyCenterId]
        );
        r.nearbyCenter = ngoRows[0] ? mapRowKeys(ngoRows[0]) : null;
      } else {
        r.nearbyCenter = null;
      }
    }

    return res.json(rescues);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function getMyCampaigns(req, res) {
  try {
    const { rows: orgRows } = await pool.query(
      "SELECT * FROM campaigns WHERE organizer_user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    const organized = mapRows(orgRows);

    const { rows: partRows } = await pool.query(
      "SELECT * FROM campaign_participants WHERE user_id = $1 ORDER BY joined_at DESC",
      [req.user.id]
    );
    const joined = mapRows(partRows);

    for (const j of joined) {
      const { rows: campRows } = await pool.query(
        "SELECT * FROM campaigns WHERE id = $1",
        [j.campaignId]
      );
      j.campaign = campRows[0] ? mapRowKeys(campRows[0]) : null;
    }

    return res.json({ organized, joined });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getDonationStats(req, res) {
  try {
    const userId = req.user.id;
    // 1. Total donations count & amount (monetary completed/pending)
    const statsRes = await pool.query(
      `SELECT COUNT(*)::int AS count, COALESCE(SUM(amount), 0)::float AS sum 
       FROM donations 
       WHERE donor_id = $1 AND category = 'MONEY'`,
      [userId]
    );
    const count = statsRes.rows[0].count;
    const sum = statsRes.rows[0].sum;

    // 2. NGO-wise Donation Summary
    const ngoSummaryRes = await pool.query(
      `SELECT n.name AS "ngoName", COALESCE(SUM(d.amount), 0)::float AS "totalAmount"
       FROM donations d
       JOIN ngos n ON d.recipient_ngo_id = n.id OR d.ngo_id = n.id
       WHERE d.donor_id = $1 AND d.category = 'MONEY'
       GROUP BY n.name`,
      [userId]
    );
    const ngoSummary = mapRows(ngoSummaryRes.rows);

    // 3. Recent Donation History (monetary)
    const recentRes = await pool.query(
      `SELECT d.id, d.amount, d.status, d.created_at, d.transaction_id, n.name AS "recipientNgoName"
       FROM donations d
       LEFT JOIN ngos n ON d.recipient_ngo_id = n.id OR d.ngo_id = n.id
       WHERE d.donor_id = $1 AND d.category = 'MONEY'
       ORDER BY d.created_at DESC
       LIMIT 10`,
      [userId]
    );
    const recent = mapRows(recentRes.rows);

    return res.json({
      totalDonations: count,
      totalAmount: sum,
      ngoSummary,
      recent
    });
  } catch (err) {
    console.error("[USER CONTROLLER] getDonationStats error:", err);
    return res.status(500).json({ message: "Failed to fetch donation statistics", error: err.message });
  }
}
 
export const userController = {
  getProfile, updateProfile, changePassword, deleteAccount,
  getMyDonations, getMyAdoptions, getMyRescueRequests, getMyCampaigns,
  getDonationStats,
};