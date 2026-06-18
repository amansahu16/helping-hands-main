import { Resend } from "resend";

// Initialize Resend with your API Key
const resend = new Resend(process.env.RESEND_API_KEY);

// In-memory OTP storage
const otpStore = new Map();

// Generic OTP sender using Resend API
export const sendOtp = async (email, purpose = "verification") => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  console.log(`[OTP SERVICE] Generated OTP "${otp}" for ${email} for ${purpose}`);

  const subject = purpose === "reset"
    ? "Helping Hands - Reset Password Verification Code"
    : "Helping Hands - Email Verification Code";

  const title = purpose === "reset" ? "Reset Your Password" : "Verify Your Email";
  const message = purpose === "reset"
    ? "Please use the following verification code to reset your password:"
    : "Thank you for joining Helping Hands. Please use the following verification code to complete your verification:";

  // Send email via Resend API (No SMTP, no network blocks!)
  resend.emails.send({
    from: `"Helping Hands" <${process.env.SENDER_EMAIL}>`, // 👈 Yeh verified domain wala email hona chahiye
    to: email, // 👈 Ab aap kisi bhi dusre gmail par bhej payenge
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:20px;">
        <h2>Helping Hands</h2>
        <h3>${title}</h3>
        <p>${message}</p>
        <div style="font-size:32px; font-weight:bold; text-align:center; letter-spacing:5px; padding:20px; background:#f5f5f5; border-radius:8px;">
          ${otp}
        </div>
        <p>This code is valid for 10 minutes.</p>
      </div>
    `,
  })
    .then(() => {
      console.log(`✅ ${purpose.toUpperCase()} OTP Email sent successfully via Resend API`);
    })
    .catch((error) => {
      console.error(`❌ Resend Error:`, error.message);
    });

  return otp;
};

// Verify OTP Function pehle jaisa hi rahega...
export const verifyOtp = async (email, otp) => {
  const record = otpStore.get(email);
  if (!record) return false;
  if (Date.now() > record.expiresAt) { otpStore.delete(email); return false; }
  if (record.otp !== otp) return false;
  otpStore.delete(email);
  return true;
};