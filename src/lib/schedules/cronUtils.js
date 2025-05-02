// src/lib/schedules/cronUtils.js
import { parseExpression } from "cron-parser";
import { createLogger } from "@/lib/utils";

const logger = createLogger("[CronUtils]");

export function calculateNextRunTime(scheduleType, config) {
  logger.info(
    `Calculating next run time for ${scheduleType} schedule:`,
    config
  );

  if (!config) {
    logger.error("No schedule config provided");
    return null;
  }

  try {
    if (scheduleType === "once") {
      // For one-time schedules, next run is the scheduled date
      if (!config.date) {
        logger.error("One-time schedule missing date");
        return null;
      }

      // Ensure we have a valid date object
      let nextDate;
      if (typeof config.date === "string") {
        // If it's a string (like from an API), parse it
        nextDate = new Date(config.date);

        // Ensure the date is valid
        if (isNaN(nextDate.getTime())) {
          logger.error(`Invalid date string provided: ${config.date}`);
          return null;
        }
      } else if (config.date instanceof Date) {
        // If it's already a Date object, use it directly
        nextDate = config.date;
      } else {
        logger.error(`Unsupported date format: ${typeof config.date}`);
        return null;
      }

      logger.info(`Next run for one-time schedule: ${nextDate.toISOString()}`);
      return nextDate;
    } else if (scheduleType === "cron") {
      // For cron-based schedules, calculate the next run time
      if (!config.expression) {
        logger.error("Cron schedule missing expression");
        return null;
      }

      try {
        const interval = parseExpression(config.expression);
        const nextDate = interval.next().toDate();
        logger.info(`Next run for cron schedule: ${nextDate.toISOString()}`);
        return nextDate;
      } catch (cronError) {
        logger.error("Error parsing cron expression:", cronError);
        return null;
      }
    } else {
      logger.error(`Invalid schedule type: ${scheduleType}`);
      return null;
    }
  } catch (error) {
    logger.error("Error calculating next run time:", error);
    return null;
  }
}
