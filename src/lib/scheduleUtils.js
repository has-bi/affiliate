// src/lib/scheduleUtils.js
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Instead of using a file, we'll use in-memory storage for now
// You can replace this with proper database storage later
let scheduledMessages = [];

// Initialize the scheduled messages
export function initSchedules() {
  try {
    // In a real implementation, you would fetch this from your database
    const defaultSchedules = [];
    scheduledMessages = defaultSchedules;
    return true;
  } catch (error) {
    console.error("Error initializing schedules:", error);
    return false;
  }
}

// Load all scheduled messages
export function getAllSchedules() {
  try {
    return scheduledMessages;
  } catch (error) {
    console.error("Error loading schedules:", error);
    return [];
  }
}

// Save all scheduled messages
export function saveAllSchedules(schedules) {
  try {
    scheduledMessages = schedules;
    return true;
  } catch (error) {
    console.error("Error saving schedules:", error);
    return false;
  }
}

// Get a specific schedule by ID
export function getScheduleById(id) {
  return scheduledMessages.find((schedule) => schedule.id === id) || null;
}

// Create a new schedule
export function createSchedule(scheduleData) {
  const newSchedule = {
    id: `schedule-${uuidv4()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "pending",
    history: [],
    ...scheduleData,
  };

  scheduledMessages.push(newSchedule);
  return newSchedule;
}

// Update a schedule
export function updateSchedule(id, scheduleData) {
  const index = scheduledMessages.findIndex((schedule) => schedule.id === id);

  if (index === -1) return null;

  const updatedSchedule = {
    ...scheduledMessages[index],
    ...scheduleData,
    updatedAt: new Date().toISOString(),
  };

  scheduledMessages[index] = updatedSchedule;
  return updatedSchedule;
}

// Delete a schedule
export function deleteSchedule(id) {
  const initialLength = scheduledMessages.length;
  scheduledMessages = scheduledMessages.filter(
    (schedule) => schedule.id !== id
  );
  return scheduledMessages.length !== initialLength;
}

// Add history entry to a schedule
export function addScheduleHistory(id, historyEntry) {
  const index = scheduledMessages.findIndex((schedule) => schedule.id === id);

  if (index === -1) return null;

  if (!scheduledMessages[index].history) {
    scheduledMessages[index].history = [];
  }

  scheduledMessages[index].history.push({
    ...historyEntry,
    runAt: new Date().toISOString(),
  });

  scheduledMessages[index].lastRun = new Date().toISOString();
  scheduledMessages[index].updatedAt = new Date().toISOString();

  return scheduledMessages[index];
}
