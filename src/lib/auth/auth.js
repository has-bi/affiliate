// src/lib/auth/auth.js

// Currently using simple auth - could be extended to use Clerk or NextAuth
export async function getCurrentUser() {
  // For now, return basic user info from cookies or session
  // Replace with Clerk or your preferred auth system when ready
  return {
    id: "1",
    name: "Admin User",
    role: "admin",
    // Add other user properties as needed
  };
}

// Verify credentials with simple comparison
export function verifyCredentials(username, password) {
  // Set your credentials via environment variables
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "***REMOVED***";

  return username === adminUsername && password === adminPassword;
}

// Login function - sets cookies/session
export async function login(credentials) {
  const { username, password } = credentials;

  // Verify credentials
  if (!verifyCredentials(username, password)) {
    return { success: false, error: "Invalid credentials" };
  }

  // Return user info for frontend
  return {
    success: true,
    user: {
      id: "1",
      name: "Admin User",
      username: username,
      role: "admin",
    },
  };
}

// Logout function - clears cookies/session
export async function logout() {
  // Clear session/cookies
  return { success: true };
}
