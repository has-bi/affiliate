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

// Login function
export async function login(credentials) {
  const { username, password } = credentials;

  if (!verifyCredentials(username, password)) {
    return { success: false, error: "Invalid credentials" };
  }

  const user = {
    id: "1",
    name: "Admin User",
    username: username,
    role: "admin",
  };

  return {
    success: true,
    user: user,
  };
}

// Logout function
export async function logout() {
  return { success: true };
}

async function handleLogin(username, password) {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    // Check if response is OK before parsing as JSON
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(`Login failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Login error:", error);
    // Handle error appropriately in your UI
    throw error;
  }
}
