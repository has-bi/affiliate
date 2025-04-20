// src/lib/scheduleUtils.js
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid"; // Need to install uuid package

const SCHEDULES_FILE = path.join(
  process.cwd(),
  "src/lib/data/scheduledMessages.json"
);

// Initialize the file if it doesn't exist
function initSchedulesFile() {
  try {
    if (!fs.existsSync(SCHEDULES_FILE)) {
      const dirPath = path.dirname(SCHEDULES_FILE);

      // Create directory if it doesn't exist
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      fs.writeFileSync(
        SCHEDULES_FILE,
        JSON.stringify({ scheduledMessages: [] }, null, 2),
        "utf8"
      );
    }
  } catch (error) {
    console.error("Error initializing schedules file:", error);
  }
}

// Load all scheduled messages
export function getAllSchedules() {
  try {
    initSchedulesFile();
    const fileContent = fs.readFileSync(SCHEDULES_FILE, "utf8");
    return JSON.parse(fileContent).scheduledMessages || [];
  } catch (error) {
    console.error("Error loading schedules:", error);
    return [];
  }
}

// Save all scheduled messages
export function saveAllSchedules(schedules) {
  try {
    initSchedulesFile();
    const data = { scheduledMessages: schedules };
    fs.writeFileSync(SCHEDULES_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Error saving schedules:", error);
    return false;
  }
}

// Get a specific schedule by ID
export function getScheduleById(id) {
  const schedules = getAllSchedules();
  return schedules.find((schedule) => schedule.id === id) || null;
}

// Create a new schedule
export function createSchedule(scheduleData) {
  const schedules = getAllSchedules();

  const newSchedule = {
    id: `schedule-${uuidv4()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "pending",
    history: [],
    ...scheduleData,
  };

  schedules.push(newSchedule);
  saveAllSchedules(schedules);
  return newSchedule;
}

// Update a schedule
export function updateSchedule(id, scheduleData) {
  const schedules = getAllSchedules();
  const index = schedules.findIndex((schedule) => schedule.id === id);

  if (index === -1) return null;

  const updatedSchedule = {
    ...schedules[index],
    ...scheduleData,
    updatedAt: new Date().toISOString(),
  };

  schedules[index] = updatedSchedule;
  saveAllSchedules(schedules);
  return updatedSchedule;
}

// Delete a schedule
export function deleteSchedule(id) {
  const schedules = getAllSchedules();
  const filteredSchedules = schedules.filter((schedule) => schedule.id !== id);

  if (filteredSchedules.length === schedules.length) return false;

  saveAllSchedules(filteredSchedules);
  return true;
}

// Add history entry to a schedule
export function addScheduleHistory(id, historyEntry) {
  const schedules = getAllSchedules();
  const index = schedules.findIndex((schedule) => schedule.id === id);

  if (index === -1) return null;

  schedules[index].history.push({
    ...historyEntry,
    runAt: new Date().toISOString(),
  });

  schedules[index].lastRun = new Date().toISOString();
  schedules[index].updatedAt = new Date().toISOString();

  saveAllSchedules(schedules);
  return schedules[index];
}
