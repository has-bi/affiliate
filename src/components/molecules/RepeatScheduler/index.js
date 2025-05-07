// src/components/molecules/RepeatScheduler/index.js
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  validateCronExpression,
  generateCronExpression,
  debugCronExpression,
} from "@/lib/config/cronHelper";

const RepeatScheduler = ({ initialCron = "0 9 * * *", onChange }) => {
  // Main frequency selection
  const [frequency, setFrequency] = useState("daily");

  // Settings for each frequency type
  const [dailySettings, setDailySettings] = useState({
    time: "09:00",
  });

  const [weeklySettings, setWeeklySettings] = useState({
    days: [1], // Monday by default (0=Sunday, 1=Monday, etc.)
    time: "09:00",
  });

  const [monthlySettings, setMonthlySettings] = useState({
    type: "dayOfMonth", // or "dayOfWeek"
    dayOfMonth: 1, // 1st day of month
    dayOfWeek: 1, // Monday
    weekOfMonth: 1, // 1st week
    time: "09:00",
  });

  // Use a ref to track if initialCron has been processed
  const initialCronProcessed = useRef(false);

  // Parse initial cron expression only once on mount
  useEffect(() => {
    if (initialCron && !initialCronProcessed.current) {
      initialCronProcessed.current = true;

      // Log the initial cron value for debugging
      console.log(`Initial cron: "${initialCron}"`);

      // Validate before attempting to parse
      if (validateCronExpression(initialCron)) {
        parseCronExpression(initialCron);
      } else {
        console.error(`Invalid initial cron expression: "${initialCron}"`);
        // Fall back to default (daily at 9 AM)
        parseCronExpression("0 9 * * *");
      }
    }
  }, [initialCron]);

  // Parse existing cron expression and set appropriate UI state
  const parseCronExpression = (cronExpression) => {
    const parts = cronExpression.split(/\s+/);
    if (parts.length !== 5) {
      console.error(`Invalid cron parts length: ${parts.length}, expected 5`);
      return; // Invalid cron
    }

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    // Parse time
    const hourNum = parseInt(hour, 10);
    const minuteNum = parseInt(minute, 10);

    if (isNaN(hourNum) || isNaN(minuteNum)) {
      console.error(
        `Invalid hour/minute values: hour=${hour}, minute=${minute}`
      );
      return;
    }

    const timeStr = `${hourNum.toString().padStart(2, "0")}:${minuteNum
      .toString()
      .padStart(2, "0")}`;

    // Determine frequency and settings
    if (dayOfMonth === "*" && dayOfWeek !== "*") {
      // Weekly schedule
      setFrequency("weekly");

      // Parse days of week
      const days = dayOfWeek
        .split(",")
        .map((d) => {
          return parseInt(d, 10);
        })
        .filter((d) => !isNaN(d));

      setWeeklySettings({
        days: days.length > 0 ? days : [1], // Default to Monday if parsing fails
        time: timeStr,
      });
    } else if (dayOfMonth !== "*" && dayOfWeek === "*") {
      // Monthly by day of month
      setFrequency("monthly");
      setMonthlySettings({
        type: "dayOfMonth",
        dayOfMonth: parseInt(dayOfMonth, 10) || 1,
        dayOfWeek: 1,
        weekOfMonth: 1,
        time: timeStr,
      });
    } else if (dayOfMonth === "*" && dayOfWeek === "*") {
      // Daily
      setFrequency("daily");
      setDailySettings({
        time: timeStr,
      });
    } else if (dayOfWeek.includes("#")) {
      // Specific day of week in month (e.g., "1#3" for third Monday)
      setFrequency("monthly");

      const [dow, week] = dayOfWeek.split("#").map((n) => parseInt(n, 10));

      setMonthlySettings({
        type: "dayOfWeek",
        dayOfMonth: 1,
        dayOfWeek: dow || 1,
        weekOfMonth: week || 1,
        time: timeStr,
      });
    }
  };

  // Generate cron expression and notify parent when settings change
  // Use a ref to track the last generated cron expression
  const lastCronExpression = useRef("");

  useEffect(() => {
    const cronExpression = generateCronExpressionFromUI();

    // Only call onChange if cron has actually changed and is valid
    if (
      cronExpression !== lastCronExpression.current &&
      validateCronExpression(cronExpression)
    ) {
      lastCronExpression.current = cronExpression;

      // Debug log the generated expression
      debugCronExpression(cronExpression);

      if (onChange) {
        onChange(cronExpression);
      }
    }
  }, [frequency, dailySettings, weeklySettings, monthlySettings, onChange]);

  // Convert UI selections to cron expression
  const generateCronExpressionFromUI = () => {
    // Extract exact hours and minutes to ensure precision
    const [hours, minutes] = getTimeComponents();

    // Ensure hours and minutes are properly formatted as integers
    const formattedMinutes = parseInt(minutes, 10);
    const formattedHours = parseInt(hours, 10);

    // Validate time components to prevent errors
    if (
      isNaN(formattedHours) ||
      isNaN(formattedMinutes) ||
      formattedHours < 0 ||
      formattedHours > 23 ||
      formattedMinutes < 0 ||
      formattedMinutes > 59
    ) {
      console.error("Invalid time components:", hours, minutes);
      return "0 0 * * *"; // Default fallback to midnight
    }

    // Ensure the cron expression has proper spacing between all parts
    let cronExpression;

    switch (frequency) {
      case "daily":
        // Format: minute hour * * *
        cronExpression = `${formattedMinutes} ${formattedHours} * * *`;
        break;

      case "weekly":
        const weekdays = weeklySettings.days.join(",");
        cronExpression = `${formattedMinutes} ${formattedHours} * * ${weekdays}`;
        break;

      case "monthly":
        if (monthlySettings.type === "dayOfMonth") {
          cronExpression = `${formattedMinutes} ${formattedHours} ${monthlySettings.dayOfMonth} * *`;
        } else {
          // Day of week in specific week of month
          cronExpression = `${formattedMinutes} ${formattedHours} * * ${monthlySettings.dayOfWeek}#${monthlySettings.weekOfMonth}`;
        }
        break;

      default:
        cronExpression = "0 0 * * *"; // Default fallback to daily at midnight
    }

    // Double-check we have a valid 5-part expression
    const parts = cronExpression.split(/\s+/);
    if (parts.length !== 5) {
      console.error(
        `Generated invalid cron with ${parts.length} parts: "${cronExpression}"`
      );
      return "0 0 * * *"; // Safe fallback
    }

    return cronExpression;
  };

  // Helper to extract hours and minutes from time string
  const getTimeComponents = () => {
    let timeStr;
    switch (frequency) {
      case "daily":
        timeStr = dailySettings.time;
        break;
      case "weekly":
        timeStr = weeklySettings.time;
        break;
      case "monthly":
        timeStr = monthlySettings.time;
        break;
      default:
        timeStr = "09:00";
    }

    const [hours, minutes] = timeStr.split(":").map((num) => parseInt(num, 10));
    return [hours, minutes];
  };

  return (
    <div className="space-y-4">
      {/* Frequency Selection - Simplified with buttons */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Kirim setiap:
        </label>
        <div className="flex space-x-2">
          {[
            { id: "daily", label: "Hari" },
            { id: "weekly", label: "Minggu" },
            { id: "monthly", label: "Bulan" },
          ].map((option) => (
            <Button
              key={option.id}
              type="button"
              onClick={() => setFrequency(option.id)}
              className={`px-4 py-2 text-sm rounded-md ${
                frequency === option.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Daily Settings */}
      {frequency === "daily" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Waktu:
          </label>
          <input
            type="time"
            value={dailySettings.time}
            onChange={(e) =>
              setDailySettings({ ...dailySettings, time: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      )}

      {/* Weekly Settings */}
      {frequency === "weekly" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hari:
            </label>
            <div className="grid grid-cols-7 gap-2">
              {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map(
                (day, index) => (
                  <Button
                    key={index}
                    type="button"
                    onClick={() => {
                      const newDays = weeklySettings.days.includes(index)
                        ? weeklySettings.days.filter((d) => d !== index)
                        : [...weeklySettings.days, index];

                      // Ensure we always have at least one day selected
                      if (newDays.length === 0) {
                        newDays.push(index);
                      }

                      setWeeklySettings({ ...weeklySettings, days: newDays });
                    }}
                    className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      weeklySettings.days.includes(index)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {day}
                  </Button>
                )
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Waktu:
            </label>
            <input
              type="time"
              value={weeklySettings.time}
              onChange={(e) =>
                setWeeklySettings({ ...weeklySettings, time: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      )}

      {/* Monthly Settings */}
      {frequency === "monthly" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pilih opsi:
            </label>
            <div className="flex space-x-2">
              <Button
                type="button"
                onClick={() =>
                  setMonthlySettings({ ...monthlySettings, type: "dayOfMonth" })
                }
                className={`px-4 py-2 text-sm rounded-md ${
                  monthlySettings.type === "dayOfMonth"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                Tanggal
              </Button>
              <Button
                type="button"
                onClick={() =>
                  setMonthlySettings({ ...monthlySettings, type: "dayOfWeek" })
                }
                className={`px-4 py-2 text-sm rounded-md ${
                  monthlySettings.type === "dayOfWeek"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                Hari tertentu
              </Button>
            </div>
          </div>

          {/* Day of month selector */}
          {monthlySettings.type === "dayOfMonth" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal:
              </label>
              <select
                value={monthlySettings.dayOfMonth}
                onChange={(e) =>
                  setMonthlySettings({
                    ...monthlySettings,
                    dayOfMonth: parseInt(e.target.value, 10),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Day of week in month selector */}
          {monthlySettings.type === "dayOfWeek" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minggu ke:
                </label>
                <select
                  value={monthlySettings.weekOfMonth}
                  onChange={(e) =>
                    setMonthlySettings({
                      ...monthlySettings,
                      weekOfMonth: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value={1}>Pertama</option>
                  <option value={2}>Kedua</option>
                  <option value={3}>Ketiga</option>
                  <option value={4}>Keempat</option>
                  <option value={5}>Terakhir</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hari:
                </label>
                <select
                  value={monthlySettings.dayOfWeek}
                  onChange={(e) =>
                    setMonthlySettings({
                      ...monthlySettings,
                      dayOfWeek: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value={0}>Minggu</option>
                  <option value={1}>Senin</option>
                  <option value={2}>Selasa</option>
                  <option value={3}>Rabu</option>
                  <option value={4}>Kamis</option>
                  <option value={5}>Jumat</option>
                  <option value={6}>Sabtu</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Waktu:
            </label>
            <input
              type="time"
              value={monthlySettings.time}
              onChange={(e) =>
                setMonthlySettings({ ...monthlySettings, time: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      )}

      {/* Preview of generated schedule */}
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <p className="text-sm text-gray-700 font-medium">
          {generateScheduleDescription()}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Cron expression: {generateCronExpressionFromUI()}
        </p>
      </div>
    </div>
  );

  // Generate a human-readable description of the schedule
  function generateScheduleDescription() {
    const [hours, minutes] = getTimeComponents();
    const timeFormatted = formatTime(hours, minutes);

    switch (frequency) {
      case "daily":
        return `Setiap hari pada ${timeFormatted}`;

      case "weekly": {
        const dayNames = weeklySettings.days
          .map(
            (d) =>
              ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][
                d
              ]
          )
          .join(", ");
        return `Setiap ${dayNames} pada ${timeFormatted}`;
      }

      case "monthly":
        if (monthlySettings.type === "dayOfMonth") {
          return `Pada tanggal ${monthlySettings.dayOfMonth} setiap bulan pada ${timeFormatted}`;
        } else {
          const weekNames = [
            "pertama",
            "kedua",
            "ketiga",
            "keempat",
            "terakhir",
          ];
          const dayNames = [
            "Minggu",
            "Senin",
            "Selasa",
            "Rabu",
            "Kamis",
            "Jumat",
            "Sabtu",
          ];
          return `Pada ${dayNames[monthlySettings.dayOfWeek]} ${
            weekNames[monthlySettings.weekOfMonth - 1]
          } setiap bulan pada ${timeFormatted}`;
        }

      default:
        return "Jadwal kustom";
    }
  }

  // Format time components as readable time
  function formatTime(hours, minutes) {
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  }
};

export default RepeatScheduler;
