import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import dns from "dns";

// Force Node to prefer IPv4 DNS resolution globally.
// This completely resolves IPv6 connection failures (ENETUNREACH) on platforms like Render.com.
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env")
});

