import "./src/loadEnv.js";
import { sendOtp } from "./src/services/otp.service.js";

console.log("Starting SMTP test...");
const startTime = Date.now();

try {
  const result = await sendOtp("amantest045@gmail.com", "reset");
  console.log(`sendOtp returned in ${Date.now() - startTime}ms. OTP is: ${result}`);
} catch (error) {
  console.error("sendOtp error:", error);
}

// Wait for a few seconds to let background sendMail complete or fail
setTimeout(() => {
  console.log(`Script finished in ${Date.now() - startTime}ms.`);
  process.exit(0);
}, 10000);
