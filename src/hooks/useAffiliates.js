// src/hooks/useAffiliates.js
"use client";

import { useState, useEffect, useCallback } from "react";

export function useAffiliates() {
  const [newAffiliates, setNewAffiliates] = useState([]);
  const [activeAffiliates, setActiveAffiliates] = useState([]);
  const [counts, setCounts] = useState({ new: 0, active: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all affiliate data including counts
   */
  const fetchAllAffiliateData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/affiliates");

      if (!response.ok) {
        throw new Error(`Error fetching affiliates: ${response.status}`);
      }

      const data = await response.json();

      // Set state with the returned data
      setNewAffiliates(data.new || []);
      setActiveAffiliates(data.active || []);
      setCounts(data.counts || { new: 0, active: 0 });

      return data;
    } catch (err) {
      console.error("Error fetching affiliates:", err);
      setError(err.message || "Failed to fetch affiliates");
      return { new: [], active: [], counts: { new: 0, active: 0 } };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch only new affiliates
   */
  const fetchNewAffiliates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/affiliates?status=new");

      if (!response.ok) {
        throw new Error(`Error fetching new affiliates: ${response.status}`);
      }

      const data = await response.json();
      setNewAffiliates(Array.isArray(data) ? data : []);
      setCounts((prev) => ({
        ...prev,
        new: Array.isArray(data) ? data.length : 0,
      }));

      return data;
    } catch (err) {
      console.error("Error fetching new affiliates:", err);
      setError(err.message || "Failed to fetch new affiliates");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch only active affiliates
   */
  const fetchActiveAffiliates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/affiliates?status=active");

      if (!response.ok) {
        throw new Error(`Error fetching active affiliates: ${response.status}`);
      }

      const data = await response.json();

      // Handle different response formats
      let affiliates = [];
      if (Array.isArray(data)) {
        affiliates = data;
      } else if (typeof data === "object") {
        // Handle object format (map of phone -> affiliate)
        affiliates = Object.values(data);
      }

      setActiveAffiliates(affiliates);
      setCounts((prev) => ({ ...prev, active: affiliates.length }));

      return affiliates;
    } catch (err) {
      console.error("Error fetching active affiliates:", err);
      setError(err.message || "Failed to fetch active affiliates");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize by fetching affiliates data
  useEffect(() => {
    fetchAllAffiliateData();
  }, [fetchAllAffiliateData]);

  return {
    // State
    newAffiliates,
    activeAffiliates,
    isLoading,
    error,

    // Counts
    newAffiliatesCount: counts.new,
    activeAffiliatesCount: counts.active,

    // Actions
    fetchAllAffiliateData,
    fetchNewAffiliates,
    fetchActiveAffiliates,
  };
}
