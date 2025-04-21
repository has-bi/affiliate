// src/lib/auth.js
import bcryptjs from "bcryptjs";

// Simple credentials verification
export async function verifyCredentials(username, password) {
  // Get admin credentials from environment variables with fallbacks
  const adminUsername = process.env.ADMIN_USERNAME || "***REMOVED***";
  const adminPasswordHash =
    process.env.ADMIN_PASSWORD_HASH ||
    "$2a$10$RerEOYjwPAaZsc8gu7iAU.tZBax0P0aMgm6wLJs.bCaSdY86i.4xe";

  // Basic username check
  if (username !== adminUsername) {
    return false;
  }

  // Verify password with bcryptjs
  try {
    return await bcryptjs.compare(password, adminPasswordHash);
  } catch (error) {
    console.error("Password verification error:", error);
    return false;
  }
}
