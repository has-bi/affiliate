// src/lib/auth.js

// Verify credentials with simple comparison
export function verifyCredentials(username, password) {
  // Set your credentials directly or use environment variables
  const adminUsername = process.env.ADMIN_USERNAME || "***REMOVED***";
  const adminPassword = process.env.ADMIN_PASSWORD || "your-simple-password";

  // Direct string comparison
  return username === adminUsername && password === adminPassword;
}

export async function getCurrentUser() {
  return await currentUser();
}
