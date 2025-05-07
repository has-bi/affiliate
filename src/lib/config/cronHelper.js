// src/lib/config/cronUtils.js

/**
 * Common cron expressions for easy selection in UI
 */
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
  { label: "Last Friday of month", value: "0 16 * * 5L" },
];

/**
 * Validates a cron expression to ensure proper format
 * @param {string} expression - The cron expression to validate
 * @returns {boolean} True if the expression is valid, false otherwise
 */
export function validateCronExpression(expression) {
  if (!expression) return false;

  // Clean up common mistakes
  const cleaned = expression.replace(/\bstar\b/g, "*").trim();

  // Ensure exactly 5 space-separated parts
  const parts = cleaned.split(/\s+/);
  if (parts.length !== 5) {
    console.error(`Invalid cron parts count: ${parts.length}, expected 5`);
    return false;
  }

  // Extract each part for validation
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Standard pattern for most fields
  const standardPattern =
    /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])-(([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9]))(\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9]))?|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])(,([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9]))*)$/;

  // Special pattern for day of week that includes the # syntax for nth weekday
  const dayOfWeekPattern =
    /^(\*|([0-6])|\*\/([0-6])|([0-6])-([0-6])(\/([0-6]))?|([0-6])(,([0-6]))*|([0-6])#([1-5])|([0-6])L)$/;

  // Validate minute (0-59)
  if (!standardPattern.test(minute)) {
    console.error(`Invalid minute format: ${minute}`);
    return false;
  }

  // Validate hour (0-23)
  if (!standardPattern.test(hour)) {
    console.error(`Invalid hour format: ${hour}`);
    return false;
  }

  // Validate day of month (1-31)
  if (!standardPattern.test(dayOfMonth)) {
    console.error(`Invalid day of month format: ${dayOfMonth}`);
    return false;
  }

  // Validate month (1-12)
  if (!standardPattern.test(month)) {
    console.error(`Invalid month format: ${month}`);
    return false;
  }

  // Validate day of week with special pattern
  if (!dayOfWeekPattern.test(dayOfWeek)) {
    console.error(`Invalid day of week format: ${dayOfWeek}`);
    return false;
  }

  return true;
}

/**
 * Generates a valid cron expression based on provided time components
 * @param {number} hours - Hours (0-23)
 * @param {number} minutes - Minutes (0-59)
 * @param {string} type - Type of schedule ('daily', 'weekly', 'monthly')
 * @param {Object} options - Additional options for schedule
 * @returns {string} A valid cron expression
 */
export function generateCronExpression(
  hours,
  minutes,
  type = "daily",
  options = {}
) {
  // Ensure integer values
  const h = parseInt(hours, 10);
  const m = parseInt(minutes, 10);

  // Validate time components
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    console.error(
      `Invalid time components: hours=${hours}, minutes=${minutes}`
    );
    return "0 9 * * *"; // Fallback to a safe default
  }

  switch (type) {
    case "daily":
      return `${m} ${h} * * *`;

    case "weekly":
      const days = options.days || [1]; // Default to Monday
      return `${m} ${h} * * ${days.join(",")}`;

    case "monthly":
      if (options.dayOfMonth) {
        // Day of month (1-31)
        return `${m} ${h} ${options.dayOfMonth} * *`;
      } else if (options.dayOfWeek && options.weekOfMonth) {
        // Day of week in specific week (e.g., "1#3" for third Monday)
        return `${m} ${h} * * ${options.dayOfWeek}#${options.weekOfMonth}`;
      }
      return `${m} ${h} 1 * *`; // Default to 1st day of month

    default:
      return `${m} ${h} * * *`; // Default to daily
  }
}

/**
 * Get a human-readable description of a cron expression
 * @param {string} expression - The cron expression
 * @returns {string} Human-readable description
 */
export function getHumanReadableCron(expression) {
  if (!validateCronExpression(expression)) {
    return "Invalid schedule format";
  }

  const parts = expression.split(/\s+/);
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Format hour and minute for display
  const formattedHour = parseInt(hour, 10);
  const period = formattedHour >= 12 ? "PM" : "AM";
  const displayHour = formattedHour % 12 || 12;
  const displayMinute = minute.padStart(2, "0");
  const timeString = `${displayHour}:${displayMinute} ${period}`;

  // Check schedule type
  if (dayOfMonth === "*" && dayOfWeek !== "*") {
    // Weekly schedule
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const days = dayOfWeek
      .split(",")
      .map((d) => {
        return dayNames[parseInt(d, 10)];
      })
      .join(", ");

    return `Every ${days} at ${timeString}`;
  } else if (dayOfMonth !== "*" && dayOfWeek === "*") {
    // Monthly by day of month
    return `On day ${dayOfMonth} of every month at ${timeString}`;
  } else if (dayOfMonth === "*" && dayOfWeek === "*") {
    // Daily
    return `Every day at ${timeString}`;
  } else if (dayOfWeek.includes("#")) {
    // Specific day of week in month
    const [dow, week] = dayOfWeek.split("#").map((n) => parseInt(n, 10));
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const ordinals = ["first", "second", "third", "fourth", "fifth"];

    return `On the ${ordinals[week - 1]} ${
      dayNames[dow]
    } of every month at ${timeString}`;
  }

  return `Schedule: ${expression}`;
}

/**
 * Log cron expression details for debugging
 * @param {string} expression - The cron expression
 */
export function debugCronExpression(expression) {
  console.log(`Cron expression: "${expression}"`);

  if (!expression) {
    console.error("Empty cron expression");
    return;
  }

  const parts = expression.split(/\s+/);
  console.log(`Parts (${parts.length}): [${parts.join(", ")}]`);

  const isValid = validateCronExpression(expression);
  console.log(`Validation result: ${isValid ? "Valid" : "INVALID"}`);

  if (isValid) {
    console.log(`Human-readable: ${getHumanReadableCron(expression)}`);
  }
}
