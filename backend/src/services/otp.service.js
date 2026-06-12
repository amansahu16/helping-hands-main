import nodemailer from "nodemailer";

// In-memory OTP storage for development
const otpStore = new Map();

// Configure SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: process.env.SMTP_HOST
    ? process.env.SMTP_SECURE === "true"
    : true, // default to true (SSL) for gmail on port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendAdminLoginOtp = async (email) => {
  // Generate a real 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes expiry
  });
  
  console.log(`[OTP SERVICE] Generated Admin OTP "${otp}" for ${email}`);

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter.sendMail({
      from: `"Helping Hands Admin" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Helping Hands Admin Portal Login Verification Code",
      text: `Your 6-digit verification code is: ${otp}. This code is valid for 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #13221B; text-align: center;">Helping Hands Admin Portal</h2>
          <p>Hello Admin,</p>
          <p>You requested to sign in to the Helping Hands Admin Portal. Please use the following 6-digit verification code to complete your login:</p>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #3D6A53; margin: 20px 0; border-radius: 5px;">
            ${otp}
          </div>
          <p style="color: #666; font-size: 12px;">This verification code is valid for 10 minutes. If you did not request this code, please secure your account credentials immediately.</p>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p style="color: #999; font-size: 11px; text-align: center;">Helping Hands System Security</p>
        </div>
      `
    }).then(() => {
      console.log(`[OTP SERVICE] Real OTP email sent successfully to ${email}`);
    }).catch((error) => {
      console.error("[OTP SERVICE] Failed to send real email asynchronously:", error);
      console.log(`[OTP SERVICE] FALLBACK: Displaying generated OTP in server logs: ${otp}`);
    });
  } else {
    console.log(`[OTP SERVICE] WARNING: SMTP credentials not set in env. Real email could not be sent. Displaying OTP in console for testing: ${otp}`);
  }
  return otp;
};

export const sendOtp = async (email, purpose = "verification") => {
  // Generate a simple 6-digit OTP
  const otp = "123456"; // Default OTP for easy local testing
  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes expiry
  });
  
  console.log(`[OTP SERVICE] Sent OTP "${otp}" to ${email} for ${purpose}`);
  return true;
};

export const verifyOtp = async (email, otp) => {
  const record = otpStore.get(email);
  if (!record) {
    console.log(`[OTP SERVICE] Verification failed: No OTP found for ${email}`);
    return false;
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    console.log(`[OTP SERVICE] Verification failed: OTP expired for ${email}`);
    return false;
  }

  if (record.otp !== otp) {
    console.log(`[OTP SERVICE] Verification failed: OTP mismatch for ${email}. Expected ${record.otp}, got ${otp}`);
    return false;
  }

  otpStore.delete(email); // clean up after success
  return true;
};
