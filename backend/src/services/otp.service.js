
import { Resend } from "resend";

// In-memory OTP storage
const otpStore = new Map();

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Send Admin Login OTP
export const sendAdminLoginOtp = async (email) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 min
  });

  console.log(`[OTP SERVICE] Generated OTP for ${email}`);

  try {
    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
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
    });

    if (error) {
      console.error("❌ Resend Error:", error);
    } else {
      console.log("✅ Email sent successfully");
      console.log(data);
    }
  } catch (error) {
    console.error("❌ Failed to send email");
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
      `[OTP SERVICE] OTP mismatch for ${email}. Expected ${record.otp}, got ${otp}`
    );
    return false;
  }

  otpStore.delete(email);

  console.log(`[OTP SERVICE] OTP verified successfully for ${email}`);

  return true;
};

