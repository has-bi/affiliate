// src/lib/cronHelper.js
export const commonCronExpressions = [
  { label: "Test: Every minute", value: "* * * * *" },
  { label: "Test: Every 2 minutes", value: "*/2 * * * *" },
  { label: "Test: Every 3 minutes", value: "*/3 * * * *" },
  { label: "Every 5 minutes", value: "*/5 * * * *" },
  { label: "Every 15 minutes", value: "*/15 * * * *" },
  { label: "Every 30 minutes", value: "*/30 * * * *" },
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every day at 9 AM", value: "0 9 * * *" },
  { label: "Every Monday at 9 AM", value: "0 9 * * 1" },
  { label: "First day of month at 9 AM", value: "0 9 1 * *" },
];

export function validateCronExpression(expression) {
  if (!expression) return false;

  // Clean up common mistakes
  const cleaned = expression.replace(/\bstar\b/g, "*").trim();

  const parts = cleaned.split(/\s+/);
  if (parts.length !== 5) return false;

  // Basic validation for each part
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Check if each part is valid format
  const validPattern =
    /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])-(([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9]))(\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9]))?|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])(,([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9]))*)$/;

  return parts.every((part) => validPattern.test(part));
}
