// ============================================================
//  DONATIONS — controllers/donation.controller.js
// ============================================================
import pool, { mapRowKeys, mapRows } from "../config/db.js";
import crypto from "crypto";
import { uploadMultipleImages } from "../utils/cloudinary.js";
 
async function listDonations(req, res) {
  try {
    const { status, category, location, donorId, recipientNgoId, page = 1, limit = 100 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const params = [];
    let paramIndex = 1;

    let queryText = `
      SELECT d.*, 
             u.name AS "donor_name",
             n1.name AS "donorNgo_name", n1.photo_url AS "donorNgo_photoUrl",
             n2.name AS "recipientNgo_name", n2.photo_url AS "recipientNgo_photoUrl"
      FROM donations d
      LEFT JOIN users u ON d.donor_id = u.id
      LEFT JOIN ngos n1 ON d.donor_ngo_id = n1.id
      LEFT JOIN ngos n2 ON d.recipient_ngo_id = n2.id
      WHERE 1=1
    `;

    if (category) {
      queryText += ` AND d.category ILIKE $${paramIndex}`;
      params.push(`%${category}%`);
      paramIndex++;
    }
    if (location) {
      queryText += ` AND d.location ILIKE $${paramIndex}`;
      params.push(`%${location}%`);
      paramIndex++;
    }
    if (donorId) {
      queryText += ` AND d.donor_id = $${paramIndex}`;
      params.push(donorId);
      paramIndex++;
    }
    
    if (recipientNgoId) {
      queryText += ` AND d.recipient_ngo_id = $${paramIndex}`;
      params.push(recipientNgoId);
      paramIndex++;
    } else {
      queryText += ` AND d.recipient_ngo_id IS NULL`;
    }

    if (status) {
      queryText += ` AND d.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    } else {
      queryText += ` AND d.status NOT IN ($${paramIndex}, $${paramIndex + 1})`;
      params.push("DELIVERED", "CANCELLED");
      paramIndex += 2;
    }

    queryText += ` ORDER BY d.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), offset);

    const { rows } = await pool.query(queryText, params);
    
    const donations = rows.map((row) => {
      const camel = mapRowKeys(row);
      return {
        ...camel,
        donor: row.donor_id ? { id: row.donor_id, name: row.donor_name } : null,
        donorNgo: row.donor_ngo_id ? { id: row.donor_ngo_id, name: row.donorNgo_name, photoUrl: row.donorNgo_photoUrl } : null,
        recipientNgo: row.recipient_ngo_id ? { id: row.recipient_ngo_id, name: row.recipientNgo_name, photoUrl: row.recipientNgo_photoUrl } : null,
      };
    });

    return res.json(donations);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function getDonationById(req, res) {
  try {
    const queryText = `
      SELECT d.*, 
             u.name AS "donor_name", u.phone_number AS "donor_phone",
             n.name AS "rec_name", n.phone_number AS "rec_phone"
      FROM donations d
      LEFT JOIN users u ON d.donor_id = u.id
      LEFT JOIN ngos n ON d.recipient_ngo_id = n.id
      WHERE d.id = $1
    `;
    const { rows } = await pool.query(queryText, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Donation not found" });
    
    const row = rows[0];
    const donation = mapRowKeys(row);
    donation.donor = row.donor_id ? { id: row.donor_id, name: row.donor_name, phoneNumber: row.donor_phone } : null;
    donation.recipientNgo = row.recipient_ngo_id ? { id: row.recipient_ngo_id, name: row.rec_name, phoneNumber: row.rec_phone } : null;

    return res.json(donation);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function createDonation(req, res) {
  try {
    const {
      title, category, condition, description, quantity, personsServed,
      location, latitude, longitude, pickupAddress, pickupType,
      timeFrom, timeTo, photos, recipientNgoId,
      amount, transactionId, otp, reachedDonor
    } = req.body;
 
    const uploadedPhotos = Array.isArray(photos) ? await uploadMultipleImages(photos) : [];
 
    const isNgo = req.user?.role === "ngo";
    const idVal = crypto.randomUUID();
    const donorId = !isNgo ? (req.user?.id || null) : null;
    const donorNgoId = isNgo ? req.user.id : null;
    const qty = quantity ? Number(quantity) : null;
    const served = personsServed ? Number(personsServed) : null;
    const lat = latitude ? Number(latitude) : null;
    const lon = longitude ? Number(longitude) : null;
    const recNgoId = (recipientNgoId && recipientNgoId.trim() !== "") ? recipientNgoId : null;
    const amt = amount ? Number(amount) : null;

    let finalOtp = otp;
    if (!finalOtp && category && category.toUpperCase() !== "MONEY") {
      finalOtp = Math.floor(100000 + Math.random() * 900000).toString();
    }

    const { rows } = await pool.query(
      `INSERT INTO donations (
        id, donor_id, donor_ngo_id, title, category, condition, description, quantity, persons_served,
        location, latitude, longitude, pickup_address, pickup_type, time_from, time_to, photos,
        recipient_ngo_id, amount, transaction_id, otp, reached_donor, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, 'PENDING', NOW())
      RETURNING *`,
      [
        idVal,
        donorId,
        donorNgoId,
        title || null,
        category || null,
        condition || null,
        description || null,
        qty,
        served,
        location || null,
        lat,
        lon,
        pickupAddress || null,
        pickupType || null,
        timeFrom ? new Date(timeFrom) : null,
        timeTo ? new Date(timeTo) : null,
        uploadedPhotos,
        recNgoId,
        amt,
        transactionId || null,
        finalOtp || null,
        reachedDonor || false,
      ]
    );

    const donation = mapRowKeys(rows[0]);
    return res.status(201).json(donation);
  } catch (err) {
    console.error("createDonation error:", err);
    return res.status(500).json({ message: err.message });
  }
}
 
async function updateDonation(req, res) {
  try {
    const { rows: checkRows } = await pool.query("SELECT * FROM donations WHERE id = $1", [req.params.id]);
    const donation = checkRows[0] ? mapRowKeys(checkRows[0]) : null;
    if (!donation) return res.status(404).json({ message: "Donation not found" });

    const isDonor = (donation.donorId === req.user.id) || (donation.donorNgoId === req.user.id);
    if (!isDonor) return res.status(403).json({ message: "Forbidden" });
    if (donation.status !== "PENDING") {
      return res.status(409).json({ message: "Can only edit PENDING donations" });
    }
 
    const { category, quantity, personsServed, location, pickupAddress, timeFrom, timeTo, photos } = req.body;
    const uploadedPhotos = Array.isArray(photos) ? await uploadMultipleImages(photos) : undefined;

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (category !== undefined) {
      updates.push(`category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }
    if (quantity !== undefined) {
      updates.push(`quantity = $${paramIndex}`);
      params.push(quantity !== null ? Number(quantity) : null);
      paramIndex++;
    }
    if (personsServed !== undefined) {
      updates.push(`persons_served = $${paramIndex}`);
      params.push(personsServed !== null ? Number(personsServed) : null);
      paramIndex++;
    }
    if (location !== undefined) {
      updates.push(`location = $${paramIndex}`);
      params.push(location);
      paramIndex++;
    }
    if (pickupAddress !== undefined) {
      updates.push(`pickup_address = $${paramIndex}`);
      params.push(pickupAddress);
      paramIndex++;
    }
    if (timeFrom !== undefined) {
      updates.push(`time_from = $${paramIndex}`);
      params.push(timeFrom ? new Date(timeFrom) : null);
      paramIndex++;
    }
    if (timeTo !== undefined) {
      updates.push(`time_to = $${paramIndex}`);
      params.push(timeTo ? new Date(timeTo) : null);
      paramIndex++;
    }
    if (uploadedPhotos !== undefined) {
      updates.push(`photos = $${paramIndex}`);
      params.push(uploadedPhotos);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.json(donation);
    }

    params.push(req.params.id);
    const query = `UPDATE donations SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`;
    const { rows: updateRows } = await pool.query(query, params);

    return res.json(mapRowKeys(updateRows[0]));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function deleteDonation(req, res) {
  try {
    const { rows: checkRows } = await pool.query("SELECT * FROM donations WHERE id = $1", [req.params.id]);
    const donation = checkRows[0] ? mapRowKeys(checkRows[0]) : null;
    if (!donation) return res.status(404).json({ message: "Donation not found" });

    const isDonor = (donation.donorId === req.user.id) || (donation.donorNgoId === req.user.id);
    if (!isDonor) return res.status(403).json({ message: "Forbidden" });
    if (donation.status !== "PENDING") {
      return res.status(409).json({ message: "Can only cancel PENDING donations" });
    }
 
    await pool.query("UPDATE donations SET status = 'CANCELLED' WHERE id = $1", [req.params.id]);
    return res.json({ message: "Donation cancelled" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
// ── Status (NGO) ──────────────────────────────────────────────
 
async function updateStatus(req, res) {
  try {
    const { status } = req.body; // ACCEPTED | PICKED_UP | DELIVERED | CANCELLED
    const allowed = ["ACCEPTED", "PICKED_UP", "DELIVERED", "CANCELLED"];
    if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid status" });
 
    const { rows: checkRows } = await pool.query("SELECT * FROM donations WHERE id = $1", [req.params.id]);
    const donation = checkRows[0] ? mapRowKeys(checkRows[0]) : null;
    if (!donation) return res.status(404).json({ message: "Donation not found" });
    if (donation.recipientNgoId !== req.user.id) {
      return res.status(403).json({ message: "Only the recipient NGO can update status" });
    }
 
    const { rows } = await pool.query(
      "UPDATE donations SET status = $1 WHERE id = $2 RETURNING *",
      [status, req.params.id]
    );

    if (status === "DELIVERED" && donation.category === "MONEY" && donation.status !== "DELIVERED") {
      await pool.query(
        "UPDATE ngos SET virtual_balance = COALESCE(virtual_balance, 0) + $1 WHERE id = $2",
        [Number(donation.amount), donation.recipientNgoId]
      );
    }

    return res.json(mapRowKeys(rows[0]));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function markReached(req, res) {
  try {
    const { rows: checkRows } = await pool.query("SELECT * FROM donations WHERE id = $1", [req.params.id]);
    const donation = checkRows[0] ? mapRowKeys(checkRows[0]) : null;
    if (!donation) return res.status(404).json({ message: "Donation not found" });
    if (donation.recipientNgoId !== req.user.id) {
      return res.status(403).json({ message: "Only the recipient NGO can update this" });
    }
 
    const { rows } = await pool.query(
      "UPDATE donations SET reached_donor = true WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    return res.json({ message: "Donor notified successfully", donation: mapRowKeys(rows[0]) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function verifyOtp(req, res) {
  try {
    const { otp } = req.body;
    const { rows: checkRows } = await pool.query("SELECT * FROM donations WHERE id = $1", [req.params.id]);
    const donation = checkRows[0] ? mapRowKeys(checkRows[0]) : null;
    if (!donation) return res.status(404).json({ message: "Donation not found" });
    const isDonor = (donation.donorId === req.user.id) || (donation.donorNgoId === req.user.id);
    if (!isDonor) {
      return res.status(403).json({ message: "Only the donor can verify the OTP" });
    }
 
    if (!donation.otp || donation.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP code. Please try again." });
    }
 
    // OTP matches! Update donation status to PICKED_UP
    const { rows } = await pool.query(
      "UPDATE donations SET status = 'PICKED_UP', reached_donor = false WHERE id = $1 RETURNING *",
      [req.params.id]
    );
 
    return res.json({ message: "OTP verified successfully. Donation picked up!", donation: mapRowKeys(rows[0]) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
export const donationController = {
  listDonations, getDonationById, createDonation, updateDonation, deleteDonation,
  updateStatus, markReached, verifyOtp,
};