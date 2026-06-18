import nodemailer from "nodemailer";
import dns from "dns";

// In-memory OTP storage
const otpStore = new Map();

// Initialize NodeMailer SMTP Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // usually false for port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  family: 4, // Kuch Nodemailer versions mein direct family: 4 kaam karta hai
  dns: {
    family: 4 // Baaki versions ke liye DNS level par IPv4 force karta hai
  }
});

// Send Admin Login OTP
export const sendAdminLoginOtp = async (email) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 min
  });

  console.log(`[OTP SERVICE] Generated OTP "${otp}" for Admin: ${email}`);

  // Send email in the background without awaiting
  transporter.sendMail({
    from: `"Helping Hands" <${process.env.SMTP_USER || "no-reply@helpinghands.org"}>`,
    to: email,
    subject: "Helping Hands Admin Portal Login Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px;">
        <h2>Helping Hands Admin Portal</h2>
        <p>Hello Admin,</p>
        <p>Please use the following verification code to complete your login:</p>
        <div style="
          font-size:32px;
          font-weight:bold;
          text-align:center;
          letter-spacing:5px;
          padding:20px;
          background:#f5f5f5;
          border-radius:8px;
        ">
          ${otp}
        </div>
        <p>This code is valid for 10 minutes.</p>
      </div>
    `,
  })
    .then(() => {
      console.log("✅ Admin Login OTP Email sent successfully via SMTP");
    })
    .catch((error) => {
      console.error("❌ Failed to send Admin Login OTP Email via SMTP:", error.message);
    });

  return otp;
};

// Generic OTP sender using NodeMailer SMTP
export const sendOtp = async (email, purpose = "verification") => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  console.log(
    `[OTP SERVICE] Generated OTP "${otp}" for ${email} for ${purpose}`
  );

  const subject = purpose === "reset"
    ? "Helping Hands - Reset Password Verification Code"
    : "Helping Hands - Email Verification Code";

  const title = purpose === "reset"
    ? "Reset Your Password"
    : "Verify Your Email";

  const message = purpose === "reset"
    ? "Please use the following verification code to reset your password:"
    : "Thank you for joining Helping Hands. Please use the following verification code to complete your verification:";

  // Send email in the background without awaiting
  transporter.sendMail({
    from: `"Helping Hands" <${process.env.SMTP_USER || "no-reply@helpinghands.org"}>`,
    to: email,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px;">
        <h2>Helping Hands</h2>
        <h3>${title}</h3>
        <p>${message}</p>
        <div style="
          font-size:32px;
          font-weight:bold;
          text-align:center;
          letter-spacing:5px;
          padding:20px;
          background:#f5f5f5;
          border-radius:8px;
        ">
          ${otp}
        </div>
        <p>This code is valid for 10 minutes.</p>
      </div>
    `,
  })
    .then(() => {
      console.log(`✅ ${purpose.toUpperCase()} OTP Email sent successfully via SMTP`);
    })
    .catch((error) => {
      console.error(`❌ Failed to send ${purpose.toUpperCase()} OTP Email via SMTP:`, error.message);
    });

  return otp;
};

// Verify OTP
export const verifyOtp = async (email, otp) => {
  const record = otpStore.get(email);

  if (!record) {
    console.log(`[OTP SERVICE] No OTP found for ${email}`);
    return false;
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    console.log(`[OTP SERVICE] OTP expired for ${email}`);
    return false;
  }

  if (record.otp !== otp) {
    console.log(
      `[OTP SERVICE] OTP mismatch for ${email}. Expected ${record.otp}, got ${otp}`
    );
    return false;
  }

  otpStore.delete(email);

  console.log(`[OTP SERVICE] OTP verified successfully for ${email}`);

  return true;
};
