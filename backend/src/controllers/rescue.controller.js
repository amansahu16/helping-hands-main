//  RESCUE REQUESTS — controllers/rescue.controller.js
// ============================================================
import pool, { mapRowKeys, mapRows } from "../config/db.js";
import crypto from "crypto";
import { uploadMultipleImages } from "../utils/cloudinary.js";
 
async function listRescueRequests(req, res) {
  try {
    const { status, location, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const params = [];
    let paramIndex = 1;
    
    let queryText = `
      SELECT r.*, 
             u.name AS "reporter_name", 
             n1.name AS "reporterNgo_name", 
             n2.name AS "nearbyCenter_name", n2.phone_number AS "nearbyCenter_phone"
      FROM rescue_requests r
      LEFT JOIN users u ON r.reporter_id = u.id
      LEFT JOIN ngos n1 ON r.reporter_ngo_id = n1.id
      LEFT JOIN ngos n2 ON r.nearby_center_id = n2.id
      WHERE 1=1
    `;

    if (status) {
      queryText += ` AND r.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    } else {
      queryText += ` AND r.status NOT IN ($${paramIndex}, $${paramIndex + 1})`;
      params.push("RESOLVED", "CLOSED");
      paramIndex += 2;
    }

    if (location) {
      queryText += ` AND r.location ILIKE $${paramIndex}`;
      params.push(`%${location}%`);
      paramIndex++;
    }

    queryText += ` ORDER BY r.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), offset);

    const { rows } = await pool.query(queryText, params);
    
    const rescues = rows.map((row) => {
      const camel = mapRowKeys(row);
      return {
        ...camel,
        reporter: row.reporter_id ? { id: row.reporter_id, name: row.reporter_name } : null,
        reporterNgo: row.reporter_ngo_id ? { id: row.reporter_ngo_id, name: row.reporterNgo_name } : null,
        nearbyCenter: row.nearby_center_id ? { id: row.nearby_center_id, name: row.nearbyCenter_name, phoneNumber: row.nearbyCenter_phone } : null,
      };
    });

    return res.json(rescues);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function getRescueById(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT r.*, 
              u.name AS "rep_name", u.phone_number AS "rep_phone", 
              n1.name AS "repNgo_name", n1.phone_number AS "repNgo_phone", 
              n2.name AS "center_name", n2.phone_number AS "center_phone", n2.location AS "center_loc"
       FROM rescue_requests r
       LEFT JOIN users u ON r.reporter_id = u.id
       LEFT JOIN ngos n1 ON r.reporter_ngo_id = n1.id
       LEFT JOIN ngos n2 ON r.nearby_center_id = n2.id
       WHERE r.id = $1`,
      [req.params.id]
    );

    if (rows.length === 0) return res.status(404).json({ message: "Rescue request not found" });
    const row = rows[0];
    const rescue = mapRowKeys(row);
    rescue.reporter = row.reporter_id ? { id: row.reporter_id, name: row.rep_name, phoneNumber: row.rep_phone } : null;
    rescue.reporterNgo = row.reporter_ngo_id ? { id: row.reporter_ngo_id, name: row.repNgo_name, phoneNumber: row.repNgo_phone } : null;
    rescue.nearbyCenter = row.nearby_center_id ? { id: row.nearby_center_id, name: row.center_name, phoneNumber: row.center_phone, location: row.center_loc } : null;

    return res.json(rescue);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function createRescueRequest(req, res) {
  try {
    const {
      animalType, location, latitude, longitude,
      description, condition, photos,
      nearbyHospital, nearbyCenterId,
    } = req.body;
 
    const uploadedPhotos = Array.isArray(photos) ? await uploadMultipleImages(photos) : [];
 
    const isNgo = req.user?.role === "ngo";
    const id = crypto.randomUUID();
    const reporterId = !isNgo ? (req.user?.id || null) : null;
    const reporterNgoId = isNgo ? req.user.id : null;
    const lat = latitude ? parseFloat(latitude) : null;
    const lon = longitude ? parseFloat(longitude) : null;
    const centerId = (nearbyCenterId && nearbyCenterId.trim() !== "") ? nearbyCenterId : null;

    const { rows } = await pool.query(
      `INSERT INTO rescue_requests (
        id, reporter_id, reporter_ngo_id, location, latitude, longitude,
        description, condition, photos, nearby_hospital, nearby_center_id, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'OPEN', NOW()) RETURNING *`,
      [
        id,
        reporterId,
        reporterNgoId,
        location || null,
        lat,
        lon,
        description || null,
        condition || animalType || null,
        uploadedPhotos,
        nearbyHospital || null,
        centerId,
      ]
    );

    const rescue = mapRowKeys(rows[0]);
    return res.status(201).json(rescue);
  } catch (err) {
    console.error("createRescueRequest error:", err);
    return res.status(500).json({ message: err.message });
  }
}
 
async function updateRescueRequest(req, res) {
  try {
    const { rows: checkRows } = await pool.query("SELECT * FROM rescue_requests WHERE id = $1", [req.params.id]);
    const rescue = checkRows[0] ? mapRowKeys(checkRows[0]) : null;
    if (!rescue) return res.status(404).json({ message: "Rescue request not found" });

    const isReporter = (rescue.reporterId === req.user.id) || (rescue.reporterNgoId === req.user.id);
    if (!isReporter) return res.status(403).json({ message: "Forbidden" });
 
    const { location, description, condition, photos, nearbyHospital } = req.body;
    const uploadedPhotos = Array.isArray(photos) ? await uploadMultipleImages(photos) : undefined;

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (location !== undefined) {
      updates.push(`location = $${paramIndex}`);
      params.push(location);
      paramIndex++;
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(description);
      paramIndex++;
    }
    if (condition !== undefined) {
      updates.push(`condition = $${paramIndex}`);
      params.push(condition);
      paramIndex++;
    }
    if (uploadedPhotos !== undefined) {
      updates.push(`photos = $${paramIndex}`);
      params.push(uploadedPhotos);
      paramIndex++;
    }
    if (nearbyHospital !== undefined) {
      updates.push(`nearby_hospital = $${paramIndex}`);
      params.push(nearbyHospital);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.json(rescue);
    }

    params.push(req.params.id);
    const query = `UPDATE rescue_requests SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`;
    const { rows } = await pool.query(query, params);
    
    return res.json(mapRowKeys(rows[0]));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function deleteRescueRequest(req, res) {
  try {
    const { rows: checkRows } = await pool.query("SELECT * FROM rescue_requests WHERE id = $1", [req.params.id]);
    const rescue = checkRows[0] ? mapRowKeys(checkRows[0]) : null;
    if (!rescue) return res.status(404).json({ message: "Rescue request not found" });

    const isReporter = (rescue.reporterId === req.user.id) || (rescue.reporterNgoId === req.user.id);
    if (!isReporter) return res.status(403).json({ message: "Forbidden" });
 
    await pool.query("UPDATE incidents SET status = 'CANCELLED' WHERE id = $1", [req.params.id]);
    return res.json({ message: "Rescue request cancelled" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function updateStatus(req, res) {
  try {
    const { status } = req.body; // ASSIGNED | RESOLVED | CLOSED
    const allowed = ["ASSIGNED", "RESOLVED", "CLOSED"];
    if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid status" });
 
    const { rows: checkRows } = await pool.query("SELECT * FROM rescue_requests WHERE id = $1", [req.params.id]);
    const rescue = checkRows[0] ? mapRowKeys(checkRows[0]) : null;
    if (!rescue) return res.status(404).json({ message: "Rescue request not found" });
 
    let nearbyCenterId = rescue.nearbyCenterId;
    if (status === "ASSIGNED") {
      // If already assigned to someone else, block it
      if (rescue.nearbyCenterId && rescue.nearbyCenterId !== req.user.id) {
        return res.status(403).json({ message: "This case is already claimed by another center" });
      }
      nearbyCenterId = req.user.id;
    } else {
      // RESOLVED or CLOSED require the NGO to be the assigned center
      if (rescue.nearbyCenterId !== req.user.id) {
        return res.status(403).json({ message: "Only the assigned NGO can update status to RESOLVED or CLOSED" });
      }
    }
 
    const { rows } = await pool.query(
      "UPDATE rescue_requests SET status = $1, nearby_center_id = $2 WHERE id = $3 RETURNING *",
      [status, nearbyCenterId, req.params.id]
    );

    return res.json(mapRowKeys(rows[0]));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
export const rescueController = {
  listRescueRequests, getRescueById, createRescueRequest,
  updateRescueRequest, deleteRescueRequest, updateStatus,
};