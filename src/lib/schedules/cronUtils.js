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

      const date = new Date(config.date);
      return date;
    } else if (scheduleType === "recurring") {
      // For cron-based schedules, calculate the next run time
      if (!config.cronExpression) {
        logger.error("Recurring schedule missing cronExpression");
        return null;
      }

      try {
        const interval = parseExpression(config.cronExpression);
        const nextDate = interval.next().toDate();
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
