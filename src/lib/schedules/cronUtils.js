// src/lib/schedules/cronUtils.js
import { parseExpression } from "cron-parser";
import { createLogger } from "@/lib/utils";

const logger = createLogger("[CronUtils]");

/**
 * Calculate the next run time based on schedule type and configuration
 * @param {string} scheduleType - 'once' or 'recurring'
 * @param {Object} config - Schedule configuration
 * @returns {Date|null} The next run time
 */
export function calculateNextRunTime(scheduleType, config) {
  if (!config) return null;

  try {
    if (scheduleType === "once") {
      // For one-time schedules, next run is the scheduled date
      if (!config.date) return null;

      return new Date(config.date);
    } else if (scheduleType === "recurring" && config.cronExpression) {
      // For recurring schedules, calculate next occurrence based on cron
      try {
        const interval = parseExpression(config.cronExpression);
        return interval.next().toDate();
      } catch (cronError) {
        logger.error("Error parsing cron expression:", cronError);
        return null;
      }
    }
    return null;
  } catch (error) {
    logger.error("Error calculating next run time:", error);
    return null;
  }
}

/**
 * Validate a cron expression format
 * @param {string} expression - Cron expression to validate
 * @returns {boolean} Whether the expression is valid
 */
export function validateCronExpression(expression) {
  if (!expression) return false;

  try {
    // Attempt to parse the expression - if it throws, it's invalid
    parseExpression(expression);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get a human-readable description of a cron schedule
 * @param {string} expression - Cron expression
 * @returns {string} Human-readable description
 */
export function getScheduleDescription(expression) {
  if (!expression) return "Invalid schedule";

  try {
    // Simple mapping for common expressions
    const commonExpressions = {
      "0 9 * * *": "Every day at 9 AM",
      "0 9 * * 1": "Every Monday at 9 AM",
      "0 9 1 * *": "First day of each month at 9 AM",
      "0 * * * *": "Every hour",
      "*/15 * * * *": "Every 15 minutes",
      "0 9-17 * * 1-5": "Weekdays 9 AM to 5 PM, hourly",
    };

    if (commonExpressions[expression]) {
      return commonExpressions[expression];
    }

    // Basic parsing for simple expressions
    const parts = expression.split(" ");
    if (parts.length !== 5) return "Custom schedule";

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    if (minute === "0" && hour !== "*") {
      if (dayOfWeek === "*" && dayOfMonth === "*" && month === "*") {
        return `Every day at ${hour}:00`;
      }

      if (dayOfWeek !== "*" && dayOfMonth === "*" && month === "*") {
        const days = {
          "0,7": "Sunday",
          1: "Monday",
          2: "Tuesday",
          3: "Wednesday",
          4: "Thursday",
          5: "Friday",
          6: "Saturday",
          "1-5": "Weekdays",
          "0,6": "Weekends",
        };

        return `Every ${days[dayOfWeek] || "specified day"} at ${hour}:00`;
      }
    }

    // Default for complex expressions
    return "Custom schedule";
  } catch (error) {
    return "Complex schedule";
  }
}
