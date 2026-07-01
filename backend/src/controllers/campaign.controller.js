//  CAMPAIGNS — controllers/campaign.controller.js
// ============================================================
import pool, { mapRowKeys, mapRows } from "../config/db.js";
import crypto from "crypto";
 
async function listCampaigns(req, res) {
  try {
    // Automatically transition expired campaigns to COMPLETED in the database
    await pool.query(
      "UPDATE campaigns SET status = 'COMPLETED' WHERE time_to IS NOT NULL AND time_to < NOW() AND status NOT IN ('COMPLETED', 'CANCELLED')"
    );

    const { status, type, location, organizerUserId, organizerNgoId, page = 1, limit = 100 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const params = [];
    let paramIndex = 1;

    let queryText = `
      SELECT c.*, 
             u.name AS "user_name", u.photo_url AS "user_photoUrl",
             n.name AS "ngo_name", n.photo_url AS "ngo_photoUrl",
             (SELECT COUNT(*)::int FROM campaign_participants cp WHERE cp.campaign_id = c.id) AS "participants_count"
      FROM campaigns c
      LEFT JOIN users u ON c.organizer_user_id = u.id
      LEFT JOIN ngos n ON c.organizer_ngo_id = n.id
      WHERE 1=1
    `;

    if (status) {
      queryText += ` AND c.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
      if (status === "PLANNED" || status === "ONGOING") {
        queryText += ` AND (c.time_to IS NULL OR c.time_to > NOW())`;
      }
    } else {
      queryText += ` AND c.status NOT IN ($${paramIndex}, $${paramIndex + 1})`;
      params.push("COMPLETED", "CANCELLED");
      paramIndex += 2;
      queryText += ` AND (c.time_to IS NULL OR c.time_to > NOW())`;
    }

    if (type) {
      queryText += ` AND c.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (location) {
      queryText += ` AND c.location ILIKE $${paramIndex}`;
      params.push(`%${location}%`);
      paramIndex++;
    }

    if (organizerUserId) {
      queryText += ` AND c.organizer_user_id = $${paramIndex}`;
      params.push(organizerUserId);
      paramIndex++;
    }

    if (organizerNgoId) {
      queryText += ` AND c.organizer_ngo_id = $${paramIndex}`;
      params.push(organizerNgoId);
      paramIndex++;
    }

    queryText += ` ORDER BY c.time_from ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), offset);

    const { rows } = await pool.query(queryText, params);
    const campaigns = rows.map((row) => {
      const camel = mapRowKeys(row);
      return {
        ...camel,
        organizerUser: row.organizer_user_id ? { id: row.organizer_user_id, name: row.user_name, photoUrl: row.user_photoUrl } : null,
        organizerNgo: row.organizer_ngo_id ? { id: row.organizer_ngo_id, name: row.ngo_name, photoUrl: row.ngo_photoUrl } : null,
        _count: { participants: row.participants_count || 0 },
      };
    });

    return res.json(campaigns);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function getCampaignById(req, res) {
  try {
    // Automatically transition expired campaigns to COMPLETED in the database
    await pool.query(
      "UPDATE campaigns SET status = 'COMPLETED' WHERE time_to IS NOT NULL AND time_to < NOW() AND status NOT IN ('COMPLETED', 'CANCELLED')"
    );

    const queryText = `
      SELECT c.*, 
             u.name AS "user_name", u.photo_url AS "user_photoUrl",
             n.name AS "ngo_name", n.photo_url AS "ngo_photoUrl",
             (SELECT COUNT(*)::int FROM campaign_participants cp WHERE cp.campaign_id = c.id) AS "participants_count"
      FROM campaigns c
      LEFT JOIN users u ON c.organizer_user_id = u.id
      LEFT JOIN ngos n ON c.organizer_ngo_id = n.id
      WHERE c.id = $1
    `;
    const { rows } = await pool.query(queryText, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Campaign not found" });

    const row = rows[0];
    const camel = mapRowKeys(row);
    const campaign = {
      ...camel,
      organizerUser: row.organizer_user_id ? { id: row.organizer_user_id, name: row.user_name, photoUrl: row.user_photoUrl } : null,
      organizerNgo: row.organizer_ngo_id ? { id: row.organizer_ngo_id, name: row.ngo_name, photoUrl: row.ngo_photoUrl } : null,
      _count: { participants: row.participants_count || 0 },
    };

    return res.json(campaign);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function getCampaignParticipants(req, res) {
  try {
    const queryText = `
      SELECT cp.*, 
             u.name AS "user_name", u.email AS "user_email", u.phone_number AS "user_phone", 
             u.date_of_birth AS "user_dob", u.location AS "user_location", 
             u.photo_url AS "user_photoUrl", u.occupation AS "user_occupation"
      FROM campaign_participants cp
      JOIN users u ON cp.account_id = u.id
      WHERE cp.campaign_id = $1
    `;
    const { rows } = await pool.query(queryText, [req.params.id]);
    
    const participants = mapRows(rows).map((row, idx) => {
      const origRow = rows[idx];
      return {
        ...row,
        user: {
          id: row.userId,
          name: origRow.user_name,
          email: origRow.user_email,
          phoneNumber: origRow.user_phone,
          dateOfBirth: origRow.user_dob,
          location: origRow.user_location,
          photoUrl: origRow.user_photoUrl,
          occupation: origRow.user_occupation,
        },
      };
    });

    return res.json(participants);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function createCampaign(req, res) {
  try {
    const { name, type, description, location, timeFrom, timeTo, maxParticipants, latitude, longitude } = req.body;
    const { id, role } = req.user;
 
    const idVal = crypto.randomUUID();
    const parsedTimeFrom = timeFrom ? new Date(timeFrom) : null;
    const parsedTimeTo = timeTo ? new Date(timeTo) : null;
    const parsedMax = maxParticipants ? Number(maxParticipants) : null;
    const lat = latitude !== undefined && latitude !== null ? parseFloat(latitude) : null;
    const lon = longitude !== undefined && longitude !== null ? parseFloat(longitude) : null;
    const organizerUserId = role === "user" ? id : null;
    const organizerNgoId = role === "ngo" ? id : null;

    const { rows } = await pool.query(
      `INSERT INTO campaigns (
        id, name, type, description, location, time_from, time_to, max_participants,
        current_participants, status, created_at, latitude, longitude, organizer_user_id, organizer_ngo_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 'PLANNED', NOW(), $9, $10, $11, $12) RETURNING *`,
      [
        idVal,
        name,
        type || "OTHER",
        description || null,
        location || null,
        parsedTimeFrom,
        parsedTimeTo,
        parsedMax,
        lat,
        lon,
        organizerUserId,
        organizerNgoId,
      ]
    );

    const campaign = mapRowKeys(rows[0]);
    return res.status(201).json(campaign);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function updateCampaign(req, res) {
  try {
    const { rows: checkRows } = await pool.query("SELECT * FROM campaigns WHERE id = $1", [req.params.id]);
    const campaign = checkRows[0] ? mapRowKeys(checkRows[0]) : null;
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });
 
    const { id, role } = req.user;
    const isOrganizer =
      (role === "user" && campaign.organizerUserId === id) ||
      (role === "ngo"  && campaign.organizerNgoId  === id);
    if (!isOrganizer) return res.status(403).json({ message: "Forbidden" });
 
    const { name, description, location, timeFrom, timeTo, maxParticipants, latitude, longitude } = req.body;
    
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      params.push(name);
      paramIndex++;
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(description);
      paramIndex++;
    }
    if (location !== undefined) {
      updates.push(`location = $${paramIndex}`);
      params.push(location);
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
    if (maxParticipants !== undefined) {
      updates.push(`max_participants = $${paramIndex}`);
      params.push(maxParticipants !== null ? Number(maxParticipants) : null);
      paramIndex++;
    }
    if (latitude !== undefined) {
      updates.push(`latitude = $${paramIndex}`);
      params.push(latitude !== null ? parseFloat(latitude) : null);
      paramIndex++;
    }
    if (longitude !== undefined) {
      updates.push(`longitude = $${paramIndex}`);
      params.push(longitude !== null ? parseFloat(longitude) : null);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.json(campaign);
    }

    params.push(req.params.id);
    const query = `UPDATE campaigns SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`;
    const { rows: updateRows } = await pool.query(query, params);
    
    return res.json(mapRowKeys(updateRows[0]));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function deleteCampaign(req, res) {
  try {
    const { rows: checkRows } = await pool.query("SELECT * FROM campaigns WHERE id = $1", [req.params.id]);
    const campaign = checkRows[0] ? mapRowKeys(checkRows[0]) : null;
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });
 
    const { id, role } = req.user;
    const isOrganizer =
      (role === "user" && campaign.organizerUserId === id) ||
      (role === "ngo"  && campaign.organizerNgoId  === id);
    if (!isOrganizer) return res.status(403).json({ message: "Forbidden" });
 
    await pool.query("DELETE FROM campaigns WHERE id = $1", [req.params.id]);
    return res.json({ message: "Campaign deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function updateStatus(req, res) {
  try {
    const { rows: checkRows } = await pool.query("SELECT * FROM campaigns WHERE id = $1", [req.params.id]);
    const campaign = checkRows[0] ? mapRowKeys(checkRows[0]) : null;
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });
 
    const { id, role } = req.user;
    const isOrganizer =
      (role === "user" && campaign.organizerUserId === id) ||
      (role === "ngo"  && campaign.organizerNgoId  === id);
    if (!isOrganizer) return res.status(403).json({ message: "Forbidden" });
 
    const { status } = req.body;
    const { rows } = await pool.query(
      "UPDATE campaigns SET status = $1 WHERE id = $2 RETURNING *",
      [status, req.params.id]
    );
    return res.json(mapRowKeys(rows[0]));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function joinCampaign(req, res) {
  try {
    const { rows: checkRows } = await pool.query("SELECT * FROM campaigns WHERE id = $1", [req.params.id]);
    const campaign = checkRows[0] ? mapRowKeys(checkRows[0]) : null;
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });
    if (campaign.status !== "PLANNED" && campaign.status !== "ONGOING") {
      return res.status(409).json({ message: "Campaign is not open for registration" });
    }
    if (campaign.maxParticipants && campaign.currentParticipants >= campaign.maxParticipants) {
      return res.status(409).json({ message: "Campaign is full" });
    }
 
    const { identityNumber } = req.body || {};
    const id = crypto.randomUUID();

    const { rows } = await pool.query(
      `INSERT INTO campaign_participants (id, campaign_id, account_id, identity_number, status, joined_at)
       VALUES ($1, $2, $3, $4, 'PENDING', NOW()) RETURNING *`,
      [id, campaign.id, req.user.id, identityNumber || null]
    );
    
    return res.status(201).json(mapRowKeys(rows[0]));
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ message: "Already registered" });
    return res.status(500).json({ message: err.message });
  }
}
 
async function leaveCampaign(req, res) {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM campaign_participants WHERE campaign_id = $1 AND account_id = $2",
      [req.params.id, req.user.id]
    );
    const participant = rows[0] ? mapRowKeys(rows[0]) : null;
    if (!participant) return res.status(404).json({ message: "You are not registered for this campaign" });
 
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      
      await client.query("DELETE FROM campaign_participants WHERE id = $1", [participant.id]);
      
      if (participant.status === "APPROVED" || participant.status === "REGISTERED") {
        await client.query(
          "UPDATE campaigns SET current_participants = current_participants - 1 WHERE id = $1",
          [req.params.id]
        );
      }
      
      await client.query("COMMIT");
      return res.json({ message: "Left campaign successfully" });
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
 
async function updateParticipantStatus(req, res) {
  try {
    const { status, code } = req.body; // APPROVED | REJECTED | ATTENDED | CANCELLED
    
    const { rows: partRows } = await pool.query(
      `SELECT cp.*, c.organizer_user_id, c.organizer_ngo_id
       FROM campaign_participants cp
       JOIN campaigns c ON cp.campaign_id = c.id
       WHERE cp.id = $1`,
      [req.params.participantId]
    );
    
    const participant = partRows[0] ? mapRowKeys(partRows[0]) : null;
    if (!participant) return res.status(404).json({ message: "Participant not found" });
 
    const { id, role } = req.user;
    const isOrganizer =
      (role === "user" && participant.organizerUserId === id) ||
      (role === "ngo"  && participant.organizerNgoId  === id);
    if (!isOrganizer) return res.status(403).json({ message: "Forbidden" });
 
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // If moving from PENDING to APPROVED, increment campaign's currentParticipants
      if (participant.status === "PENDING" && status === "APPROVED") {
        await client.query(
          "UPDATE campaigns SET current_participants = current_participants + 1 WHERE id = $1",
          [participant.campaignId]
        );
      }
      // If moving from APPROVED to CANCELLED/REJECTED, decrement campaign's currentParticipants
      if ((participant.status === "APPROVED" || participant.status === "REGISTERED") && (status === "CANCELLED" || status === "REJECTED")) {
        await client.query(
          "UPDATE campaigns SET current_participants = current_participants - 1 WHERE id = $1",
          [participant.campaignId]
        );
      }
      
      let updateQuery;
      let params;
      if (code !== undefined) {
        updateQuery = "UPDATE campaign_participants SET status = $1, code = $2 WHERE id = $3 RETURNING *";
        params = [status, code, req.params.participantId];
      } else {
        updateQuery = "UPDATE campaign_participants SET status = $1 WHERE id = $2 RETURNING *";
        params = [status, req.params.participantId];
      }

      const updateRes = await client.query(updateQuery, params);
      
      await client.query("COMMIT");
      return res.json(mapRowKeys(updateRes.rows[0]));
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
 
export const campaignController = {
  listCampaigns, getCampaignById, getCampaignParticipants,
  createCampaign, updateCampaign, deleteCampaign, updateStatus,
  joinCampaign, leaveCampaign, updateParticipantStatus,
};