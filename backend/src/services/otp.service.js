import nodemailer from "nodemailer";
import dns from "dns";

// Prefer IPv4 before IPv6
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

// In-memory OTP store
const otpStore = new Map();

// SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 587),
  secure: false, // STARTTLS on port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 15000,
});

// Send Admin Login OTP
export const sendAdminLoginOtp = async (email) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 min
  });

  console.log(`[OTP SERVICE] Generated OTP for ${email}`);

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error("[OTP SERVICE] SMTP credentials missing.");
    console.log(`[OTP SERVICE] OTP: ${otp}`);
    return otp;
  }

  try {
    // Verify SMTP connection
    await transporter.verify();
    console.log("✅ SMTP Connected");

    const info = await transporter.sendMail({
      from: `"Helping Hands Admin" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Helping Hands Admin Portal Login Verification Code",
      text: `Your verification code is ${otp}. This code is valid for 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px;">
          <h2>Helping Hands Admin Portal</h2>

          <p>Hello Admin,</p>

          <p>
            Use the following verification code to complete your login:
          </p>

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

          <p>
            This code is valid for 10 minutes.
          </p>
        </div>
      `,
    });

    console.log("✅ Email sent successfully");
    console.log("Message ID:", info.messageId);
  } catch (error) {
    console.error("❌ SMTP SEND FAILED");
    console.error(error);

    console.log(`[OTP SERVICE] FALLBACK OTP: ${otp}`);
  }

  return otp;
};

// Generic OTP sender (for testing)
export const sendOtp = async (email, purpose = "verification") => {
  const otp = "123456";

  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  console.log(
    `[OTP SERVICE] Sent OTP "${otp}" to ${email} for ${purpose}`
  );

  return true;
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
      `[OTP SERVICE] OTP mismatch for ${email}. Expected ${record.otp}, received ${otp}`
    );
    return false;
  }

  otpStore.delete(email);
  console.log(`[OTP SERVICE] OTP verified successfully for ${email}`);

  return true;
};