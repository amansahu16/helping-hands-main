//  ANIMALS — controllers/animal.controller.js
// ============================================================
import pool, { mapRowKeys, mapRows } from "../config/db.js";
import crypto from "crypto";
import { uploadMultipleImages } from "../utils/cloudinary.js";
import { sendAdoptionNotification } from "../services/otp.service.js";
 
async function listAnimals(req, res) {
  try {
    const { status, category, location, page = 1, limit = 12 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const params = [];
    let paramIndex = 1;
    
    let queryText = `
      SELECT a.*, 
             u.name AS "user_name", 
             n.name AS "ngo_name", n.photo_url AS "ngo_photo_url", n.phone_number AS "ngo_phone_number", n.email AS "ngo_email"
      FROM animals a
      LEFT JOIN users u ON a.posted_by_user_id = u.id
      LEFT JOIN ngos n ON a.posted_by_ngo_id = n.id
      WHERE 1=1
    `;

    if (status) {
      queryText += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    } else {
      queryText += ` AND a.status != $${paramIndex}`;
      params.push("ADOPTED");
      paramIndex++;
    }

    if (category) {
      queryText += ` AND a.category ILIKE $${paramIndex}`;
      params.push(`%${category}%`);
      paramIndex++;
    }

    if (location) {
      queryText += ` AND a.location ILIKE $${paramIndex}`;
      params.push(`%${location}%`);
      paramIndex++;
    }

    queryText += ` ORDER BY a.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), offset);

    const { rows } = await pool.query(queryText, params);
    
    const animals = rows.map((row) => {
      const camel = mapRowKeys(row);
      return {
        ...camel,
        postedByUser: row.posted_by_user_id ? { id: row.posted_by_user_id, name: row.user_name } : null,
        postedByNgo: row.posted_by_ngo_id ? {
          id: row.posted_by_ngo_id,
          name: row.ngo_name,
          photoUrl: row.ngo_photo_url,
          phoneNumber: row.ngo_phone_number,
          email: row.ngo_email,
        } : null,
      };
    });

    return res.json(animals);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function getAnimalById(req, res) {
  try {
    const { rows } = await pool.query("SELECT * FROM animals WHERE id = $1", [req.params.id]);
    const animalRaw = rows[0];
    if (!animalRaw) return res.status(404).json({ message: "Animal not found" });

    const animal = mapRowKeys(animalRaw);

    if (animal.postedByUserId) {
      const { rows: uRows } = await pool.query("SELECT id, name, photo_url FROM users WHERE id = $1", [animal.postedByUserId]);
      animal.postedByUser = uRows[0] ? mapRowKeys(uRows[0]) : null;
    } else {
      animal.postedByUser = null;
    }

    if (animal.postedByNgoId) {
      const { rows: nRows } = await pool.query("SELECT id, name, photo_url FROM ngos WHERE id = $1", [animal.postedByNgoId]);
      animal.postedByNgo = nRows[0] ? mapRowKeys(nRows[0]) : null;
    } else {
      animal.postedByNgo = null;
    }

    const { rows: adoptRows } = await pool.query("SELECT status, adopted_at AS \"adoptedAt\" FROM adoptions WHERE animal_id = $1", [animal.id]);
    animal.adoptions = mapRows(adoptRows);

    return res.json(animal);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function createAnimal(req, res) {
  try {
    const { category, name, age, location, latitude, longitude, description, photos } = req.body;
    const { id: posterId, role } = req.user;
 
    const uploadedPhotos = Array.isArray(photos) ? await uploadMultipleImages(photos) : [];

    const id = crypto.randomUUID();
    const lat = latitude ? parseFloat(latitude) : null;
    const lon = longitude ? parseFloat(longitude) : null;
    const postedByUserId = role === "user" ? posterId : null;
    const postedByNgoId = role === "ngo" ? posterId : null;

    const { rows } = await pool.query(
      `INSERT INTO animals (
        id, category, name, age, location, description, latitude, longitude, photos,
        posted_by_user_id, posted_by_ngo_id, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'AVAILABLE', NOW()) RETURNING *`,
      [
        id,
        category || null,
        name || null,
        age || null,
        location || null,
        description || null,
        lat,
        lon,
        uploadedPhotos,
        postedByUserId,
        postedByNgoId,
      ]
    );

    const animal = mapRowKeys(rows[0]);
    return res.status(201).json(animal);
  } catch (err) {
    console.error("createAnimal error:", err);
    return res.status(500).json({ message: err.message });
  }
}
 
async function updateAnimal(req, res) {
  try {
    const { rows: checkRows } = await pool.query("SELECT * FROM animals WHERE id = $1", [req.params.id]);
    const animal = checkRows[0] ? mapRowKeys(checkRows[0]) : null;
    if (!animal) return res.status(404).json({ message: "Animal not found" });
 
    const { id, role } = req.user;
    const isOwner =
      (role === "user" && animal.postedByUserId === id) ||
      (role === "ngo"  && animal.postedByNgoId  === id);
    if (!isOwner) return res.status(403).json({ message: "Forbidden" });
 
    const { category, location, description, photos, status } = req.body;
    const uploadedPhotos = Array.isArray(photos) ? await uploadMultipleImages(photos) : undefined;

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (category !== undefined) {
      updates.push(`category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }
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
    if (uploadedPhotos !== undefined) {
      updates.push(`photos = $${paramIndex}`);
      params.push(uploadedPhotos);
      paramIndex++;
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.json(animal);
    }

    params.push(req.params.id);
    const query = `UPDATE animals SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`;
    const { rows: updateRows } = await pool.query(query, params);
    const updated = mapRowKeys(updateRows[0]);

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function deleteAnimal(req, res) {
  try {
    const { rows: checkRows } = await pool.query("SELECT * FROM animals WHERE id = $1", [req.params.id]);
    const animal = checkRows[0] ? mapRowKeys(checkRows[0]) : null;
    if (!animal) return res.status(404).json({ message: "Animal not found" });
 
    const { id, role } = req.user;
    const isOwner =
      (role === "user" && animal.postedByUserId === id) ||
      (role === "ngo"  && animal.postedByNgoId  === id);
    if (!isOwner) return res.status(403).json({ message: "Forbidden" });
 
    await pool.query("UPDATE incidents SET status = 'CANCELLED' WHERE id = $1", [req.params.id]);
    return res.json({ message: "Animal listing cancelled" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function initiateAdoption(req, res) {
  try {
    const { rows: checkRows } = await pool.query("SELECT * FROM animals WHERE id = $1", [req.params.id]);
    const animal = checkRows[0] ? mapRowKeys(checkRows[0]) : null;
    if (!animal) return res.status(404).json({ message: "Animal not found" });
    if (animal.status !== "AVAILABLE") {
      return res.status(409).json({ message: "Animal is not available for adoption" });
    }
 
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      
      const adoptionId = crypto.randomUUID();
      const insertRes = await client.query(
        `INSERT INTO adoptions (id, animal_id, adopter_id, ngo_id, status, created_at)
         VALUES ($1, $2, $3, $4, 'IN_PROGRESS', NOW()) RETURNING *`,
        [adoptionId, animal.id, req.user.id, animal.postedByNgoId ?? null]
      );

      // Trigger maps compat.adoptions view to update incidents.status to PENDING_ADOPTION
      
      await client.query("COMMIT");

      // Notify the poster via email
      let posterEmail = null;
      let posterName = null;
      if (animal.postedByUserId) {
        const { rows: uRows } = await pool.query("SELECT email, name FROM accounts WHERE id = $1", [animal.postedByUserId]);
        if (uRows[0]) {
          posterEmail = uRows[0].email;
          posterName = uRows[0].name;
        }
      } else if (animal.postedByNgoId) {
        const { rows: nRows } = await pool.query("SELECT email, name FROM accounts WHERE id = $1", [animal.postedByNgoId]);
        if (nRows[0]) {
          posterEmail = nRows[0].email;
          posterName = nRows[0].name;
        }
      }

      if (posterEmail) {
        try {
          await sendAdoptionNotification(posterEmail, req.user.name, animal.name || "Unnamed Pet");
        } catch (mailErr) {
          console.warn("Mail send skipped:", mailErr.message);
        }
      }

      const adoption = mapRowKeys(insertRes.rows[0]);
      return res.status(201).json(adoption);
    } catch (txErr) {
      await client.query("ROLLBACK");
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function confirmAdoption(req, res) {
  try {
    const { id } = req.params;
    const { rows: checkRows } = await pool.query("SELECT * FROM animals WHERE id = $1", [id]);
    const animal = checkRows[0] ? mapRowKeys(checkRows[0]) : null;
    if (!animal) return res.status(404).json({ message: "Animal not found" });

    const isOwner = (animal.postedByUserId === req.user.id) || (animal.postedByNgoId === req.user.id);
    if (!isOwner) return res.status(403).json({ message: "Only the owner who posted the animal can confirm adoption" });

    if (animal.status !== "PENDING_ADOPTION") {
      return res.status(400).json({ message: "No pending adoption request for this animal" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Update animal status to ADOPTED
      await client.query("UPDATE incidents SET status = 'ADOPTED' WHERE id = $1", [id]);
      
      // Update adopted_at in resolution
      await client.query(
        "UPDATE incident_resolutions SET adopted_at = NOW() WHERE incident_id = $1",
        [id]
      );

      await client.query("COMMIT");
      return res.json({ message: "Adoption completed and confirmed successfully!" });
    } catch (txErr) {
      await client.query("ROLLBACK");
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function rejectAdoption(req, res) {
  try {
    const { id } = req.params;
    const { rows: checkRows } = await pool.query("SELECT * FROM animals WHERE id = $1", [id]);
    const animal = checkRows[0] ? mapRowKeys(checkRows[0]) : null;
    if (!animal) return res.status(404).json({ message: "Animal not found" });

    const isOwner = (animal.postedByUserId === req.user.id) || (animal.postedByNgoId === req.user.id);
    if (!isOwner) return res.status(403).json({ message: "Only the owner who posted the animal can reject adoption" });

    if (animal.status !== "PENDING_ADOPTION") {
      return res.status(400).json({ message: "No pending adoption request for this animal" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Mark animal back as AVAILABLE
      await client.query("UPDATE incidents SET status = 'AVAILABLE' WHERE id = $1", [id]);
      
      // Clear adopter_id and adopted_at in resolutions
      await client.query(
        "UPDATE incident_resolutions SET adopter_id = NULL, adopted_at = NULL WHERE incident_id = $1",
        [id]
      );

      await client.query("COMMIT");
      return res.json({ message: "Adoption request declined." });
    } catch (txErr) {
      await client.query("ROLLBACK");
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getIncomingAdoptions(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT ad.*, 
              an.name AS "animal_name", an.category AS "animal_category", an.photos AS "animal_photos",
              u.name AS "adopter_name", u.email AS "adopter_email", u.phone_number AS "adopter_phone"
       FROM adoptions ad
       JOIN animals an ON ad.animal_id = an.id
       JOIN accounts u ON ad.adopter_id = u.id
       WHERE an.posted_by_user_id = $1 OR an.posted_by_ngo_id = $1
       ORDER BY ad.created_at DESC`,
      [req.user.id]
    );
    return res.json(mapRows(rows));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export const animalController = {
  listAnimals, getAnimalById, createAnimal, updateAnimal, deleteAnimal, initiateAdoption, confirmAdoption, rejectAdoption, getIncomingAdoptions,
};