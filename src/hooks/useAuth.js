// src/hooks/useAuth.js
"use client";

import React, { createContext, useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext(null);
const AUTH_STORAGE_KEY = "auth_user";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check if user is logged in on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  // Login function
  const login = async (username, password) => {
    setLoading(true);
    console.log("useAuth: Starting login process");

    try {
      console.log("useAuth: Sending fetch request");
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
      console.log("useAuth: Received response", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("useAuth: Login response error:", errorText);
        return {
          success: false,
          error: "Login failed: " + response.statusText,
        };
      }

      console.log("useAuth: Parsing response JSON");
      const data = await response.json();
      console.log("useAuth: Parsed data", data);

      if (!data.success) {
        return { success: false, error: data.error || "Login failed" };
      }

      // Store user in localStorage for persistence
      console.log("useAuth: Setting localStorage");
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));
      setUser(data.user);
      console.log("useAuth: Login complete");
      return { success: true };
    } catch (error) {
      console.error("useAuth: Login error:", error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
