// src/lib/auth.js

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "your-development-secret-key";
const TOKEN_EXPIRY = "7d"; // 7 days

// Verify credentials from env variables or hard-coded admin user
export async function verifyCredentials(username, password) {
  // In production, use environment variables
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPasswordHash =
    process.env.ADMIN_PASSWORD_HASH ||
    "$2a$10$8PTRDtAawhcqn4YVQO4NienzQR7QscbGPhcjnCWm3TE94W0iGZsQm"; // Default hash for 'password'

  // Quick validation
  if (username !== adminUsername) return null;

  // Verify password
  const isValid = await bcrypt.compare(password, adminPasswordHash);
  if (!isValid) return null;

  // Return user object
  return {
    id: "admin",
    username: adminUsername,
    name: "Admin",
    role: "admin",
  };
}

// Generate token
export function generateToken(user) {
  const payload = {
    sub: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

// Verify token
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Get user from token
export function getUserFromToken(token) {
  const decoded = verifyToken(token);
  if (!decoded) return null;

  return {
    id: decoded.sub,
    username: decoded.username,
    name: decoded.name,
    role: decoded.role,
  };
}
