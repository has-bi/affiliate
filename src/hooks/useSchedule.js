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
        throw new Error("Failed to fetch schedules");
      }

      const data = await response.json();
      setSchedules(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching schedules:", err);
      setError(err.message || "Failed to fetch schedules");
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
        throw new Error(`Failed to fetch schedule`);
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
        throw new Error(`Failed to create schedule`);
      }

      const newSchedule = await response.json();
      setSchedules((prev) => [...prev, newSchedule]);
      setSelectedScheduleId(newSchedule.id);
      toast.success("Schedule created successfully");
      return newSchedule;
    } catch (err) {
      console.error(`Error creating schedule:`, err);
      setError(err.message || `Failed to create schedule`);
      toast.error(`Failed to create schedule: ${err.message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update a schedule
  const updateSchedule = useCallback(async (scheduleId, scheduleData) => {
    if (!scheduleId) return false;

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
        throw new Error(`Failed to update schedule`);
      }

      const updatedSchedule = await response.json();

      setSchedules((prev) =>
        prev.map((s) => (s.id === updatedSchedule.id ? updatedSchedule : s))
      );

      toast.success("Schedule updated successfully");
      return updatedSchedule;
    } catch (err) {
      console.error(`Error updating schedule:`, err);
      setError(err.message || `Failed to update schedule`);
      toast.error(`Failed to update schedule: ${err.message}`);
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
          throw new Error(`Failed to delete schedule`);
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

  // Toggle schedule status (active/paused)
  const toggleScheduleStatus = useCallback(
    async (scheduleId) => {
      if (!scheduleId) return false;

      const schedule = schedules.find((s) => s.id === scheduleId);
      if (!schedule) return false;

      const newStatus = schedule.status === "active" ? "paused" : "active";

      return await updateSchedule(scheduleId, { status: newStatus });
    },
    [schedules, updateSchedule]
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
    createSchedule,
    updateSchedule,
    deleteSchedule,
    toggleScheduleStatus,
  };
}
