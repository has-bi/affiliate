// src/hooks/useSchedule.js
"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

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
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch schedule`);
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
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to delete schedule`);
        }

        setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));

        if (selectedScheduleId === scheduleId) {
          setSelectedScheduleId(null);
        }

        toast.success("Schedule deleted successfully");
        return true;
      } catch (err) {
        console.error(`Error deleting schedule:`, err);
        setError(err.message || `Failed to delete schedule`);
        toast.error(`Failed to delete schedule: ${err.message}`);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [selectedScheduleId]
  );

  // Initialize on mount
  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  return {
    schedules,
    selectedSchedule,
    selectedScheduleId,
    isLoading,
    error,
    setSelectedScheduleId,
    fetchSchedules,
    fetchSchedule,
    deleteSchedule,
  };
}
