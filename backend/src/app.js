import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
//import helmet from "helmet";
import errorHandler from "./middlewares/error.middleware.js";

// Route imports
import authRouter        from "./routes/auth.routes.js";
import userRouter        from "./routes/user.routes.js";
import ngoRouter         from "./routes/ngo.routes.js";
import donationRouter    from "./routes/donation.routes.js";
import campaignRouter    from "./routes/campaign.routes.js";
import animalRouter      from "./routes/animals.routes.js";
import rescueRouter      from "./routes/rescue.routes.js";
import publicRouter      from "./routes/public.routes.js";
import adminRouter       from "./routes/admin.routes.js";

const app = express();

// ── Security ─────────────────────────────────────────────────
// app.use(helmet());
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map(o => o.trim())
  : [];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes("*")) {
      return callback(null, true);
    }
    const isAllowed = origin.startsWith("http://localhost:") ||
                      origin.endsWith(".onrender.com") ||
                      origin.endsWith(".vercel.app");
    if (isAllowed) {
      return callback(null, true);
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

// ── Body parsing ─────────────────────────────────────────────
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static("public"));
app.use(cookieParser());

// ── Health check ─────────────────────────────────────────────
app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Routes ───────────────────────────────────────────────────
app.use("/api/v1/auth",         authRouter);
app.use("/api/v1/users",        userRouter);
app.use("/api/v1/ngos",         ngoRouter);
app.use("/api/v1/donations",    donationRouter);
app.use("/api/v1/campaigns",    campaignRouter);
app.use("/api/v1/animals",      animalRouter);
app.use("/api/v1/rescues",      rescueRouter);
app.use("/api/v1/rescue",       rescueRouter);
app.use("/api/v1/public",       publicRouter);
app.use("/api/v1/admin",        adminRouter);

// ── 404 handler ───────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ── Global error handler ─────────────────────────────────────
app.use(errorHandler);

export default app;