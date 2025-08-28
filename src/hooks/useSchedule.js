// src/hooks/useSchedule.js
"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Helper function to handle API response errors consistently
 */
async function handleApiError(response, defaultMessage) {
  if (response.status === 401 || response.url.includes('/login')) {
    throw new Error("Authentication required. Please log in.");
  }
  
  let errorMessage = defaultMessage;
  try {
    const errorData = await response.json();
    errorMessage = errorData.error || errorMessage;
  } catch (parseError) {
    // Response is not JSON (might be HTML from redirect)
    errorMessage = `Server error (${response.status})`;
  }
  throw new Error(errorMessage);
}

/**
 * Hook for schedule management
 * Handles schedule CRUD operations and status management
 */
export function useSchedule() {
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);

  // Computed state
  const selectedSchedule = schedules.find((s) => s.id === selectedScheduleId);

  // Fetch all schedules
  const fetchSchedules = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/schedules");

      if (!response.ok) {
        await handleApiError(response, "Failed to fetch schedules");
      }

      const data = await response.json();
      console.log("Fetched schedules:", data); // Debug log

      // Ensure the data is an array
      if (!Array.isArray(data)) {
        console.error("Schedules response is not an array:", data);
        setSchedules([]);
        return;
      }

      setSchedules(data);
    } catch (err) {
      console.error("Error fetching schedules:", err);
      setError(err.message || "Failed to fetch schedules");
      setSchedules([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch a specific schedule
  const fetchSchedule = useCallback(async (scheduleId) => {
    if (!scheduleId) return null;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/schedules/${scheduleId}`);

      if (!response.ok) {
        await handleApiError(response, `Failed to fetch schedule`);
      }

      const schedule = await response.json();

      // Update the schedules list with this schedule
      setSchedules((prev) => {
        const exists = prev.some((s) => s.id === schedule.id);
        if (exists) {
          return prev.map((s) => (s.id === schedule.id ? schedule : s));
        } else {
          return [...prev, schedule];
        }
      });

      setSelectedScheduleId(schedule.id);
      return schedule;
    } catch (err) {
      console.error(`Error fetching schedule:`, err);
      setError(err.message || `Failed to fetch schedule`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new schedule
  const createSchedule = useCallback(async (scheduleData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(scheduleData),
      });

      if (!response.ok) {
        await handleApiError(response, "Failed to create schedule");
      }

      const newSchedule = await response.json();

      // Add to schedules list
      setSchedules((prev) => [...prev, newSchedule]);

      // Select the new schedule
      setSelectedScheduleId(newSchedule.id);

      return newSchedule;
    } catch (err) {
      console.error("Error creating schedule:", err);
      setError(err.message || "Failed to create schedule");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update a schedule
  const updateSchedule = useCallback(async (scheduleId, scheduleData) => {
    if (!scheduleId) return null;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(scheduleData),
      });

      if (!response.ok) {
        await handleApiError(response, "Failed to update schedule");
      }

      const updatedSchedule = await response.json();

      // Update in schedules list
      setSchedules((prev) =>
        prev.map((s) => (s.id === updatedSchedule.id ? updatedSchedule : s))
      );

      return updatedSchedule;
    } catch (err) {
      console.error(`Error updating schedule ${scheduleId}:`, err);
      setError(err.message || `Failed to update schedule`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete a schedule
  const deleteSchedule = useCallback(
    async (scheduleId) => {
      if (!scheduleId) return false;

      if (!confirm("Are you sure you want to delete this schedule?")) {
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/schedules/${scheduleId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          await handleApiError(response, `Failed to delete schedule`);
        }

        setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));

        if (selectedScheduleId === scheduleId) {
          setSelectedScheduleId(null);
        }

        return true;
      } catch (err) {
        console.error(`Error deleting schedule:`, err);
        setError(err.message || `Failed to delete schedule`);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [selectedScheduleId]
  );

  // Toggle schedule status (active/paused)
  const toggleScheduleStatus = useCallback(
    async (scheduleId) => {
      const schedule = schedules.find((s) => s.id === scheduleId);
      if (!schedule) return null;

      const newStatus = schedule.status === "active" ? "paused" : "active";

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/schedules/${scheduleId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          await handleApiError(response, "Failed to toggle schedule status");
        }

        const updatedSchedule = await response.json();

        // Update in schedules list
        setSchedules((prev) =>
          prev.map((s) => (s.id === updatedSchedule.id ? updatedSchedule : s))
        );

        return updatedSchedule;
      } catch (err) {
        console.error(`Error toggling schedule status:`, err);
        setError(err.message || `Failed to toggle schedule status`);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [schedules]
  );

  // Initialize by fetching schedules
  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  return {
    // State
    schedules,
    selectedSchedule,
    selectedScheduleId,
    isLoading,
    error,

    // Actions
    setSelectedScheduleId,
    fetchSchedules,
    fetchSchedule,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    toggleScheduleStatus,
  };
}
