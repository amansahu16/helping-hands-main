import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import pool, { mapRowKeys, mapRows } from "../config/db.js";
import { sendAdminLoginOtp, verifyOtp, sendOtp } from "../services/otp.service.js";

// Helper functions for JWT
function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET || "fallback_secret", { expiresIn: "7d" });
}

function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
}

function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

// ── Admin Auth ───────────────────────────────────────────────

async function registerAdmin(req, res) {
  try {
    const { name, email, password, phoneNumber } = req.body;

    if (!name || !email || !password || !phoneNumber) {
      return res.status(400).json({ message: "Name, email, password, and phone number are required" });
    }

    if (!/^\d{10}$/.test(phoneNumber)) {
      return res.status(400).json({ message: "Phone number must be exactly 10 digits" });
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*_])[A-Za-z\d!@#$%^&*_]{8,16}$/.test(password)) {
      return res.status(400).json({ message: "Password must be 8 to 16 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special symbol from !@#$%^&*__." });
    }

    const checkRes = await pool.query("SELECT id FROM admins WHERE email = $1", [email]);
    if (checkRes.rows.length > 0) return res.status(409).json({ message: "Email already registered as admin" });

    const passwordHash = await hashPassword(password);
    const id = crypto.randomUUID();

    const creatorId = req.user?.id || null;

    const insertRes = await pool.query(
      "INSERT INTO admins (id, name, email, phone_number, password_hash, created_by, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *",
      [id, name, email, phoneNumber, passwordHash, creatorId]
    );
    const admin = mapRowKeys(insertRes.rows[0]);

    return res.status(201).json({
      message: "Admin registered successfully! You can now login.",
      adminId: admin.id,
    });
  } catch (err) {
    console.error("registerAdmin error:", err);
    return res.status(500).json({ message: "Admin registration failed", error: err.message });
  }
}

async function loginAdmin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const { rows } = await pool.query("SELECT * FROM admins WHERE email = $1", [email]);
    const admin = rows[0] ? mapRowKeys(rows[0]) : null;
    if (!admin) return res.status(401).json({ message: "Invalid admin credentials" });

    const valid = await comparePassword(password, admin.passwordHash);
    if (!valid) return res.status(401).json({ message: "Invalid admin credentials" });

    // Send login OTP in the background (non-blocking)
    sendAdminLoginOtp(admin.email).catch((err) => console.error("Error sending admin login OTP:", err));

    return res.json({
      success: true,
      requiresOtp: true,
      email: admin.email,
    });
  } catch (err) {
    console.error("loginAdmin error:", err);
    return res.status(500).json({ message: "Login failed", error: err.message });
  }
}

async function verifyLoginOtp(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const { rows } = await pool.query("SELECT * FROM admins WHERE email = $1", [email]);
    const admin = rows[0] ? mapRowKeys(rows[0]) : null;
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const valid = await verifyOtp(email, otp);
    if (!valid) {
      return res.status(400).json({ message: "Invalid or expired verification code." });
    }

    const token = signToken({ id: admin.id, role: "admin" });
    return res.json({
      token,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        phoneNumber: admin.phoneNumber,
        role: "admin",
      },
    });
  } catch (err) {
    console.error("verifyLoginOtp error:", err);
    return res.status(500).json({ message: "OTP verification failed", error: err.message });
  }
}

async function forgotAdminPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const { rows } = await pool.query("SELECT * FROM admins WHERE email = $1", [email]);
    const admin = rows[0] ? mapRowKeys(rows[0]) : null;
    if (admin) {
      sendOtp(email, "reset").catch((err) => console.error("Error sending admin forgot password OTP:", err));
    }
    return res.json({ message: "If that email exists, a reset OTP has been sent." });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function resetAdminPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP and new password are required" });
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*_])[A-Za-z\d!@#$%^&*_]{8,16}$/.test(newPassword)) {
      return res.status(400).json({ message: "Password must be 8 to 16 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special symbol from !@#$%^&*__." });
    }
    const valid = await verifyOtp(email, otp);
    if (!valid) return res.status(400).json({ message: "Invalid or expired OTP" });

    const passwordHash = await hashPassword(newPassword);
    await pool.query("UPDATE admins SET password_hash = $1 WHERE email = $2", [passwordHash, email]);
    return res.json({ message: "Password reset successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// ── Admin Stats ──────────────────────────────────────────────

async function getStats(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM donations) AS donations_count,
        (SELECT COUNT(*)::int FROM animals) AS animals_count,
        (SELECT COUNT(*)::int FROM ngos) AS ngos_count,
        (SELECT COUNT(*)::int FROM users) AS users_count,
        (SELECT COUNT(*)::int FROM campaigns) AS campaigns_count,
        (SELECT COUNT(*)::int FROM complaints) AS complaints_count,
        (SELECT COUNT(*)::int FROM rescue_requests WHERE status = 'OPEN') AS open_rescues,
        (SELECT COUNT(*)::int FROM rescue_requests WHERE status = 'ASSIGNED') AS active_rescues,
        (SELECT COUNT(*)::int FROM rescue_requests WHERE status IN ('RESOLVED', 'CLOSED')) AS resolved_rescues,
        (SELECT COUNT(*)::int FROM campaigns WHERE status = 'COMPLETED') AS completed_campaigns,
        (SELECT COUNT(*)::int FROM campaigns WHERE status = 'ONGOING') AS ongoing_campaigns,
        (SELECT COUNT(*)::int FROM campaigns WHERE status = 'PLANNED') AS planned_campaigns,
        (SELECT COUNT(*)::int FROM adoptions WHERE status = 'COMPLETED') AS adopted_animals,
        (SELECT COUNT(*)::int FROM campaigns WHERE type = 'ANIMAL_WELFARE' AND status = 'COMPLETED') AS animals_fed,
        (SELECT COUNT(*)::int FROM donations WHERE status IN ('ACCEPTED', 'PICKED_UP', 'DELIVERED')) AS active_donations_count,
        (SELECT COUNT(*)::int FROM donations WHERE amount IS NOT NULL) AS tx_count,
        (SELECT COALESCE(SUM(amount), 0)::float FROM donations WHERE amount IS NOT NULL) AS tx_sum
    `);

    const stats = rows[0];

    return res.json({
      core: {
        donations: stats.donations_count,
        animals: stats.animals_count,
        ngos: stats.ngos_count,
        users: stats.users_count,
        campaigns: stats.campaigns_count,
        complaints: stats.complaints_count,
      },
      rescues: {
        open: stats.open_rescues,
        active: stats.active_rescues,
        resolved: stats.resolved_rescues,
      },
      campaigns: {
        completed: stats.completed_campaigns,
        ongoing: stats.ongoing_campaigns,
        planned: stats.planned_campaigns,
      },
      welfare: {
        adopted: stats.adopted_animals,
        fed: stats.animals_fed,
      },
      goods: {
        circulated: stats.active_donations_count,
      },
      transactions: {
        count: stats.tx_count || 0,
        sum: stats.tx_sum || 0
      }
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// ── NGO Verification & Management ───────────────────────────

async function listNgos(req, res) {
  try {
    const { rows } = await pool.query("SELECT * FROM ngos ORDER BY created_at DESC");
    return res.json(mapRows(rows));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function verifyNgo(req, res) {
  try {
    const { id } = req.params;
    const { verified } = req.body;

    if (verified === undefined) {
      return res.status(400).json({ message: "verified field is required" });
    }

    const { rows } = await pool.query(
      "UPDATE ngos SET verified = $1 WHERE id = $2 RETURNING *",
      [!!verified, id]
    );
    const ngo = mapRowKeys(rows[0]);

    return res.json({ message: `NGO verified status set to ${verified}`, ngo });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// ── Operation Moderator (Discarding operations/users) ────────

async function listOperations(req, res) {
  try {
    const [cRes, dRes, rRes, uRes, nRes] = await Promise.all([
      pool.query(`
        SELECT c.*, u.name AS "organizerUser_name", n.name AS "organizerNgo_name"
        FROM campaigns c
        LEFT JOIN users u ON c.organizer_user_id = u.id
        LEFT JOIN ngos n ON c.organizer_ngo_id = n.id
        ORDER BY c.created_at DESC
      `),
      pool.query(`
        SELECT d.*, u.name AS "donor_name", n1.name AS "donorNgo_name", n2.name AS "recipientNgo_name"
        FROM donations d
        LEFT JOIN users u ON d.donor_id = u.id
        LEFT JOIN ngos n1 ON d.donor_ngo_id = n1.id
        LEFT JOIN ngos n2 ON d.recipient_ngo_id = n2.id
        ORDER BY d.created_at DESC
      `),
      pool.query(`
        SELECT r.*, u.name AS "reporter_name", n1.name AS "reporterNgo_name", n2.name AS "nearbyCenter_name"
        FROM rescue_requests r
        LEFT JOIN users u ON r.reporter_id = u.id
        LEFT JOIN ngos n1 ON r.reporter_ngo_id = n1.id
        LEFT JOIN ngos n2 ON r.nearby_center_id = n2.id
        ORDER BY r.created_at DESC
      `),
      pool.query("SELECT id, name, email, phone_number, created_at FROM users ORDER BY created_at DESC"),
      pool.query("SELECT id, name, email, registration_number, verified, created_at FROM ngos ORDER BY created_at DESC")
    ]);

    const campaigns = mapRows(cRes.rows).map(row => ({
      ...row,
      organizerUser: row.organizerUserId ? { name: row.organizeruserName } : null,
      organizerNgo: row.organizerNgoId ? { name: row.organizerngoName } : null
    }));

    const donations = mapRows(dRes.rows).map(row => ({
      ...row,
      donor: row.donorId ? { name: row.donorName } : null,
      donorNgo: row.donorNgoId ? { name: row.donorngoName } : null,
      recipientNgo: row.recipientNgoId ? { name: row.recipientngoName } : null
    }));

    const rescues = mapRows(rRes.rows).map(row => ({
      ...row,
      reporter: row.reporterId ? { name: row.reporterName } : null,
      reporterNgo: row.reporterNgoId ? { name: row.reporterngoName } : null,
      nearbyCenter: row.nearbyCenterId ? { name: row.nearbycenterName } : null
    }));

    const users = mapRows(uRes.rows);
    const ngos = mapRows(nRes.rows);

    return res.json({ campaigns, donations, rescues, users, ngos });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function deleteOperation(req, res) {
  try {
    const { type, id } = req.params;

    if (type === "campaign") {
      await pool.query("UPDATE campaigns SET status = 'CANCELLED' WHERE id = $1", [id]);
    } else if (type === "donation") {
      await pool.query("UPDATE donations SET status = 'CANCELLED' WHERE id = $1", [id]);
    } else if (type === "rescue") {
      await pool.query("UPDATE rescue_requests SET status = 'CANCELLED' WHERE id = $1", [id]);
    } else if (type === "user" || type === "ngo") {
      await pool.query(
        "UPDATE accounts SET name = 'Deleted Account', email = 'deleted_' || id || '@deleted.com', password_hash = 'DELETED', phone_number = NULL WHERE id = $1",
        [id]
      );
    } else {
      return res.status(400).json({ message: "Invalid operation type" });
    }

    return res.json({ message: `${type} soft-deleted successfully` });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// ── Contact settings & Office Locations ──────────────────────

async function getContactSettings(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT ss.*, a.name AS "updated_by_admin_name"
      FROM system_settings ss
      LEFT JOIN admins a ON ss.updated_by_admin_id = a.id
    `);
    const settings = mapRows(rows);
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.key] = {
        value: s.value,
        updatedByAdmin: s.updatedByAdminId ? { name: s.updatedByAdminName } : null,
        updatedAt: s.updatedAt
      };
    });

    return res.json({
      contact_email: settingsObj.contact_email?.value || "hello@helpinghands.org",
      contact_phone: settingsObj.contact_phone?.value || "+91 12345 67890",
      contact_network: settingsObj.contact_network?.value || "Pan-India (25+ cities)",
      updatedByAdmin: settingsObj.contact_email?.updatedByAdmin || settingsObj.contact_phone?.updatedByAdmin || settingsObj.contact_network?.updatedByAdmin || null,
      updatedAt: settingsObj.contact_email?.updatedAt || settingsObj.contact_phone?.updatedAt || settingsObj.contact_network?.updatedAt || null
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function updateContactSettings(req, res) {
  try {
    const { contact_email, contact_phone, contact_network } = req.body;
    const adminId = req.user.id;

    if (contact_email) {
      await pool.query(
        "INSERT INTO system_settings (key, value, updated_by_admin_id, updated_at) VALUES ('contact_email', $1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value = $1, updated_by_admin_id = $2, updated_at = NOW()",
        [contact_email, adminId]
      );
    }
    if (contact_phone) {
      await pool.query(
        "INSERT INTO system_settings (key, value, updated_by_admin_id, updated_at) VALUES ('contact_phone', $1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value = $1, updated_by_admin_id = $2, updated_at = NOW()",
        [contact_phone, adminId]
      );
    }
    if (contact_network) {
      await pool.query(
        "INSERT INTO system_settings (key, value, updated_by_admin_id, updated_at) VALUES ('contact_network', $1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value = $1, updated_by_admin_id = $2, updated_at = NOW()",
        [contact_network, adminId]
      );
    }

    return res.json({ message: "Contact settings updated successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function addLocation(req, res) {
  try {
    const { name, address, latitude, longitude, type, ngoId } = req.body;
    if (!name || !address) {
      return res.status(400).json({ message: "Name and address are required" });
    }

    const id = crypto.randomUUID();
    const lat = latitude ? parseFloat(latitude) : null;
    const lon = longitude ? parseFloat(longitude) : null;
    const locType = type || "GENERAL";
    const creatorAdminId = req.user?.id || null;
    const parsedNgoId = ngoId || null;

    const { rows } = await pool.query(
      "INSERT INTO locations (id, name, address, latitude, longitude, type, created_by_admin_id, ngo_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [id, name, address, lat, lon, locType, creatorAdminId, parsedNgoId]
    );
    const location = mapRowKeys(rows[0]);

    return res.status(201).json(location);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function deleteLocation(req, res) {
  try {
    const { id } = req.params;
    await pool.query("UPDATE system_registry SET registry_type = 'DELETED_LOCATION' WHERE id = $1", [id]);
    return res.json({ message: "Location deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// ── Feedback, Contact Messages & Complaints ──────────────────

async function listFeedbacks(req, res) {
  try {
    const [tRes, cRes, compRes] = await Promise.all([
      pool.query(`
        SELECT t.*, u.name AS "user_name", u.email AS "user_email"
        FROM testimonials t
        LEFT JOIN users u ON t.user_id = u.id
        ORDER BY t.created_at DESC
      `),
      pool.query(`
        SELECT cm.*, 
               u.name AS "user_name", u.email AS "user_email",
               n.name AS "ngo_name", n.email AS "ngo_email",
               a.name AS "resolved_by_admin_name"
        FROM contact_messages cm
        LEFT JOIN users u ON cm.user_id = u.id
        LEFT JOIN ngos n ON cm.ngo_id = n.id
        LEFT JOIN admins a ON cm.resolved_by_admin_id = a.id
        ORDER BY cm.created_at DESC
      `),
      pool.query(`
        SELECT c.*, u.name AS "reporter_name", u.email AS "reporter_email"
        FROM complaints c
        LEFT JOIN users u ON c.reporter_id = u.id
        ORDER BY c.created_at DESC
      `)
    ]);

    const testimonials = mapRows(tRes.rows).map(row => ({
      ...row,
      user: row.userId ? { name: row.userName, email: row.userEmail } : null
    }));

    const contactMessages = mapRows(cRes.rows).map(row => ({
      ...row,
      user: row.userId ? { name: row.userName, email: row.userEmail } : null,
      ngo: row.ngoId ? { name: row.ngoName, email: row.ngoEmail } : null,
      resolvedByAdmin: row.resolvedByAdminId ? { name: row.resolvedByAdminName } : null
    }));

    const complaints = mapRows(compRes.rows).map(row => ({
      ...row,
      reporter: row.reporterId ? { name: row.reporterName, email: row.reporterEmail } : null
    }));

    return res.json({ testimonials, contactMessages, complaints });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function deleteFeedback(req, res) {
  try {
    const { type, id } = req.params;
    if (type === "testimonial") {
      await pool.query("UPDATE user_feedbacks SET status = 'DELETED' WHERE id = $1", [id]);
    } else if (type === "message") {
      await pool.query("UPDATE platform_communications SET status = 'DELETED' WHERE id = $1", [id]);
    } else {
      return res.status(400).json({ message: "Invalid type" });
    }
    return res.json({ message: "Deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function resolveComplaint(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body; // RESOLVED | DISMISSED | PENDING

    const { rows } = await pool.query(
      "UPDATE complaints SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );
    const complaint = mapRowKeys(rows[0]);

    return res.json({ message: `Complaint status updated to ${status}`, complaint });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function reportComplaint(req, res) {
  try {
    const { title, description, targetType, targetId } = req.body;
    if (!title || !description || !targetType || !targetId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const id = crypto.randomUUID();
    const reporterId = req.user?.id || null;

    const { rows } = await pool.query(
      `INSERT INTO complaints (id, reporter_id, title, description, target_type, target_id, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', NOW()) RETURNING *`,
      [id, reporterId, title, description, targetType, targetId]
    );
    const complaint = mapRowKeys(rows[0]);

    return res.status(201).json({ message: "Complaint filed successfully", complaint });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function resolveContactMessage(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body; // e.g. RESOLVED, IN_PROGRESS, PENDING
    const adminId = req.user.id;

    const { rows } = await pool.query(
      "UPDATE contact_messages SET status = $1, resolved_by_admin_id = $2 WHERE id = $3 RETURNING *",
      [status, adminId, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Contact message not found" });
    }
    const message = mapRowKeys(rows[0]);
    return res.json({ message: `Contact message status updated to ${status}`, data: message });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function listNewsletterSubscribers(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT n.*, 
             u.name AS "user_name", u.email AS "user_email",
             ngo.name AS "ngo_name", ngo.email AS "ngo_email"
      FROM newsletters n
      LEFT JOIN users u ON n.user_id = u.id
      LEFT JOIN ngos ngo ON n.ngo_id = ngo.id
      ORDER BY n.subscribed_at DESC
    `);
    const subscribers = mapRows(rows).map(row => ({
      ...row,
      user: row.userId ? { name: row.userName, email: row.userEmail } : null,
      ngo: row.ngoId ? { name: row.ngoName, email: row.ngoEmail } : null
    }));
    return res.json(subscribers);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function createFaq(req, res) {
  try {
    const { question, answer, category } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ message: "Question and answer are required" });
    }
    const adminId = req.user.id;

    const { rows } = await pool.query(
      "INSERT INTO faqs (question, answer, category, created_by_admin_id, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *",
      [question, answer, category || null, adminId]
    );
    const faq = mapRowKeys(rows[0]);
    return res.status(201).json(faq);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function updateFaq(req, res) {
  try {
    const { id } = req.params;
    const { question, answer, category } = req.body;

    const { rows } = await pool.query(
      "UPDATE faqs SET question = COALESCE($1, question), answer = COALESCE($2, answer), category = COALESCE($3, category) WHERE id = $4 RETURNING *",
      [question, answer, category, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "FAQ not found" });
    }
    const faq = mapRowKeys(rows[0]);
    return res.json(faq);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function deleteFaq(req, res) {
  try {
    const { id } = req.params;
    await pool.query("UPDATE system_registry SET registry_type = 'DELETED_FAQ' WHERE id = $1", [id]);
    return res.json({ message: "FAQ deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export const adminController = {
  registerAdmin,
  loginAdmin,
  verifyLoginOtp,
  forgotAdminPassword,
  resetAdminPassword,
  getStats,
  listNgos,
  verifyNgo,
  listOperations,
  deleteOperation,
  getContactSettings,
  updateContactSettings,
  addLocation,
  deleteLocation,
  listFeedbacks,
  deleteFeedback,
  resolveComplaint,
  reportComplaint,
  resolveContactMessage,
  listNewsletterSubscribers,
  createFaq,
  updateFaq,
  deleteFaq,
};
