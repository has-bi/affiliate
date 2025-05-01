// src/hooks/useSchedule.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { createLogger } from "@/lib/utils";

const logger = createLogger("[useSchedule]");

/**
 * Hook for schedule management
 * Handles schedule CRUD operations
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
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch schedules");
      }

      const data = await response.json();
      logger.info("Fetched schedules:", data.length);

      setSchedules(Array.isArray(data) ? data : []);
    } catch (err) {
      logger.error("Error fetching schedules:", err);
      setError(err.message || "Failed to fetch schedules");
      setSchedules([]);
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
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to fetch schedule ${scheduleId}`
        );
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
      logger.error(`Error fetching schedule ${scheduleId}:`, err);
      setError(err.message || `Failed to fetch schedule ${scheduleId}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new schedule
  const createSchedule = useCallback(
    async (scheduleData) => {
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
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to create schedule");
        }

        // Handle empty response
        const responseText = await response.text();
        let newSchedule;

        if (responseText.trim()) {
          newSchedule = JSON.parse(responseText);
        } else {
          // If no response body, fetch schedules to get the new one
          await fetchSchedules();
          return { success: true };
        }

        // Add to schedules list if we got a response
        if (newSchedule) {
          setSchedules((prev) => [...prev, newSchedule]);
          setSelectedScheduleId(newSchedule.id);
        }

        return newSchedule || { success: true };
      } catch (err) {
        logger.error("Error creating schedule:", err);
        setError(err.message || "Failed to create schedule");
        throw err; // Rethrow for the UI to handle
      } finally {
        setIsLoading(false);
      }
    },
    [fetchSchedules]
  );

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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update schedule");
      }

      const updatedSchedule = await response.json();

      // Update in schedules list
      setSchedules((prev) =>
        prev.map((s) => (s.id === updatedSchedule.id ? updatedSchedule : s))
      );

      return updatedSchedule;
    } catch (err) {
      logger.error(`Error updating schedule ${scheduleId}:`, err);
      setError(err.message || `Failed to update schedule`);
      throw err; // Rethrow for the UI to handle
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete a schedule
  const deleteSchedule = useCallback(
    async (scheduleId) => {
      if (!scheduleId) return false;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/schedules/${scheduleId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to delete schedule`);
        }

        // Remove from schedules list
        setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));

        // Reset selection if this was the selected schedule
        if (selectedScheduleId === scheduleId) {
          setSelectedScheduleId(null);
        }

        return true;
      } catch (err) {
        logger.error(`Error deleting schedule ${scheduleId}:`, err);
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

      try {
        return await updateSchedule(scheduleId, { status: newStatus });
      } catch (err) {
        logger.error(`Error toggling schedule status ${scheduleId}:`, err);
        return null;
      }
    },
    [schedules, updateSchedule]
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
