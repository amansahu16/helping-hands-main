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
      `SELECT d.*, 
              n.name AS "recipient_ngo_name", 
              n.photo_url AS "recipient_ngo_photo_url", 
              n.registration_number AS "recipient_ngo_registration_number", 
              n.upi_id AS "recipient_ngo_upi_id"
       FROM donations d
       LEFT JOIN ngos n ON d.recipient_ngo_id = n.id
       WHERE d.donor_id = $1 
       ORDER BY d.created_at DESC`,
      [req.user.id]
    );
    const donations = mapRows(donationRows).map(row => {
      return {
        ...row,
        recipientNgo: row.recipientNgoId ? {
          id: row.recipientNgoId,
          name: row.recipientNgoName,
          photoUrl: row.recipientNgoPhotoUrl,
          registrationNumber: row.recipientNgoRegistrationNumber,
          upiId: row.recipientNgoUpiId
        } : null,
        items: []
      };
    });

    if (donations.length > 0) {
      const donationIds = donations.map(d => d.id);
      const { rows: itemRows } = await pool.query(
        "SELECT * FROM donation_items WHERE donation_id = ANY($1)",
        [donationIds]
      );
      const mappedItems = mapRows(itemRows);
      
      const itemsByDonationId = {};
      mappedItems.forEach(item => {
        if (!itemsByDonationId[item.donationId]) {
          itemsByDonationId[item.donationId] = [];
        }
        itemsByDonationId[item.donationId].push(item);
      });

      donations.forEach(d => {
        d.items = itemsByDonationId[d.id] || [];
      });
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
      `SELECT a.*, 
              an.category AS "animal_category", an.name AS "animal_name", an.age AS "animal_age", an.location AS "animal_location", an.description AS "animal_description", an.photos AS "animal_photos", an.status AS "animal_status",
              n.name AS "ngo_name"
       FROM adoptions a
       LEFT JOIN animals an ON a.animal_id = an.id
       LEFT JOIN ngos n ON a.ngo_id = n.id
       WHERE a.adopter_id = $1 
       ORDER BY a.created_at DESC`,
      [req.user.id]
    );
    
    const adoptions = mapRows(adoptionRows).map(row => {
      return {
        ...row,
        animal: row.animalId ? {
          id: row.animalId,
          category: row.animalCategory,
          name: row.animalName,
          age: row.animalAge,
          location: row.animalLocation,
          description: row.animalDescription,
          photos: row.animalPhotos,
          status: row.animalStatus
        } : null,
        ngo: row.ngoId ? {
          id: row.ngoId,
          name: row.ngoName
        } : null
      };
    });

    return res.json(adoptions);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function getMyRescueRequests(req, res) {
  try {
    const { rows: rescueRows } = await pool.query(
      `SELECT r.*, n.name AS "ngo_name"
       FROM rescue_requests r
       LEFT JOIN ngos n ON r.nearby_center_id = n.id
       WHERE r.reporter_id = $1 
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    
    const rescues = mapRows(rescueRows).map(row => {
      return {
        ...row,
        nearbyCenter: row.nearbyCenterId ? {
          id: row.nearbyCenterId,
          name: row.ngoName
        } : null
      };
    });

    return res.json(rescues);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function getMyCampaigns(req, res) {
  try {
    // Automatically transition expired campaigns to COMPLETED in the database
    await pool.query(
      "UPDATE campaigns SET status = 'COMPLETED' WHERE time_to IS NOT NULL AND time_to < NOW() AND status NOT IN ('COMPLETED', 'CANCELLED')"
    );

    const { rows: orgRows } = await pool.query(
      "SELECT * FROM campaigns WHERE organizer_user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    const organized = mapRows(orgRows);

    const { rows: partRows } = await pool.query(
      `SELECT cp.*, 
              c.name AS "campaign_name", c.type AS "campaign_type", c.description AS "campaign_description", c.location AS "campaign_location", c.time_from AS "campaign_time_from", c.time_to AS "campaign_time_to", c.max_participants AS "campaign_max_participants", c.current_participants AS "campaign_current_participants", c.status AS "campaign_status", c.created_at AS "campaign_created_at"
       FROM campaign_participants cp
       LEFT JOIN campaigns c ON cp.campaign_id = c.id
       WHERE cp.user_id = $1 
       ORDER BY cp.joined_at DESC`,
      [req.user.id]
    );
    
    const joined = mapRows(partRows).map(row => {
      return {
        ...row,
        campaign: row.campaignId ? {
          id: row.campaignId,
          name: row.campaignName,
          type: row.campaignType,
          description: row.campaignDescription,
          location: row.campaignLocation,
          timeFrom: row.campaignTimeFrom,
          timeTo: row.campaignTimeTo,
          maxParticipants: row.campaignMaxParticipants,
          currentParticipants: row.campaignCurrentParticipants,
          status: row.campaignStatus,
          createdAt: row.campaignCreatedAt
        } : null
      };
    });

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