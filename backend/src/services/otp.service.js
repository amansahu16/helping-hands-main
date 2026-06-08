// In-memory OTP storage for development
const otpStore = new Map();

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
