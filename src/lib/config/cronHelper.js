// src/lib/config/cronHelper.js
export const commonCronExpressions = [
  // Testing options
  { label: "Test: Every minute", value: "* * * * *" },
  { label: "Test: Every 2 minutes", value: "*/2 * * * *" },
  { label: "Test: Every 3 minutes", value: "*/3 * * * *" },

  // Daily options
  { label: "Every day at 9 AM", value: "0 9 * * *" },
  { label: "Every day at 12 PM", value: "0 12 * * *" },
  { label: "Every day at 5 PM", value: "0 17 * * *" },

  // Weekly options
  { label: "Every Monday at 9 AM", value: "0 9 * * 1" },
  { label: "Every Friday at 4 PM", value: "0 16 * * 5" },
  { label: "Weekdays at 9 AM", value: "0 9 * * 1-5" },
  { label: "Weekends at 10 AM", value: "0 10 * * 0,6" },

  // Monthly options
  { label: "First day of month at 9 AM", value: "0 9 1 * *" },
  { label: "15th of month at 9 AM", value: "0 9 15 * *" },
  { label: "First Monday of month", value: "0 9 * * 1#1" },
  { label: "Last Friday of month", value: "0 16 * * 5#5" },
];

export function validateCronExpression(expression) {
  if (!expression) return false;

  // Clean up common mistakes
  const cleaned = expression.replace(/\bstar\b/g, "*").trim();

  const parts = cleaned.split(/\s+/);
  if (parts.length !== 5) return false;

  // Basic validation for each part
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Standard pattern for most fields
  const standardPattern =
    /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])-(([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9]))(\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9]))?|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])(,([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9]))*)$/;

  // Special pattern for day of week that includes the # syntax for nth weekday
  const dayOfWeekPattern =
    /^(\*|([0-6])|\*\/([0-6])|([0-6])-([0-6])(\/([0-6]))?|([0-6])(,([0-6]))*|([0-6])#([1-5]))$/;

  // Check minute, hour, day of month, and month
  if (
    !standardPattern.test(minute) ||
    !standardPattern.test(hour) ||
    !standardPattern.test(dayOfMonth) ||
    !standardPattern.test(month)
  ) {
    return false;
  }

  // Check day of week with special pattern
  if (!dayOfWeekPattern.test(dayOfWeek)) {
    return false;
  }

  return true;
}
