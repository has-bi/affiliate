// src/components/molecules/RepeatScheduler/index.js
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

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

  // Parse initial cron expression when component mounts
  useEffect(() => {
    if (initialCron) {
      parseCronExpression(initialCron);
    }
  }, [initialCron]);

  // Parse existing cron expression and set appropriate UI state
  const parseCronExpression = (cronExpression) => {
    const parts = cronExpression.split(" ");
    if (parts.length !== 5) return; // Invalid cron

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    // Parse time
    const timeStr = `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;

    // Determine frequency and settings
    if (dayOfMonth === "*" && dayOfWeek !== "*") {
      // Weekly schedule
      setFrequency("weekly");

      // Parse days of week
      const days = dayOfWeek.split(",").map((d) => {
        return parseInt(d, 10);
      });

      setWeeklySettings({
        days: days,
        time: timeStr,
      });
    } else if (dayOfMonth !== "*" && dayOfWeek === "*") {
      // Monthly by day of month
      setFrequency("monthly");
      setMonthlySettings({
        type: "dayOfMonth",
        dayOfMonth: parseInt(dayOfMonth, 10),
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
        dayOfWeek: dow,
        weekOfMonth: week,
        time: timeStr,
      });
    }
  };

  // Update the parent component with equivalent cron expression
  useEffect(() => {
    const cronExpression = generateCronExpression();
    if (onChange) {
      onChange(cronExpression);
    }
  }, [frequency, dailySettings, weeklySettings, monthlySettings, onChange]);

  // Convert UI selections to cron expression
  const generateCronExpression = () => {
    const [hours, minutes] = getTimeComponents();

    switch (frequency) {
      case "daily":
        return `${minutes} ${hours} * * *`;

      case "weekly":
        const weekdays = weeklySettings.days.join(",");
        return `${minutes} ${hours} * * ${weekdays}`;

      case "monthly":
        if (monthlySettings.type === "dayOfMonth") {
          return `${minutes} ${hours} ${monthlySettings.dayOfMonth} * *`;
        } else {
          // Day of week in specific week of month
          return `${minutes} ${hours} * * ${monthlySettings.dayOfWeek}#${monthlySettings.weekOfMonth}`;
        }

      default:
        return "0 9 * * *"; // Default to daily at 9 AM
    }
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
      {/* Frequency Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Send messages:
        </label>
        <div className="flex space-x-2">
          {["daily", "weekly", "monthly"].map((option) => (
            <Button
              key={option}
              type="button"
              onClick={() => setFrequency(option)}
              className={`px-4 py-2 text-sm rounded-md ${
                frequency === option
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Daily Settings */}
      {frequency === "daily" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time:
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
              On which days:
            </label>
            <div className="grid grid-cols-7 gap-2">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                <Button
                  key={index}
                  type="button"
                  onClick={() => {
                    const newDays = weeklySettings.days.includes(index)
                      ? weeklySettings.days.filter((d) => d !== index)
                      : [...weeklySettings.days, index];
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
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time:
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
              Select option:
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
                Day of month
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
                Specific day
              </Button>
            </div>
          </div>

          {/* Day of month selector */}
          {monthlySettings.type === "dayOfMonth" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Day of month:
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
                  Which week:
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
                  <option value={1}>First</option>
                  <option value={2}>Second</option>
                  <option value={3}>Third</option>
                  <option value={4}>Fourth</option>
                  <option value={5}>Last</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Which day:
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
                  <option value={0}>Sunday</option>
                  <option value={1}>Monday</option>
                  <option value={2}>Tuesday</option>
                  <option value={3}>Wednesday</option>
                  <option value={4}>Thursday</option>
                  <option value={5}>Friday</option>
                  <option value={6}>Saturday</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time:
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
          Cron expression: {generateCronExpression()}
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
        return `Every day at ${timeFormatted}`;

      case "weekly": {
        const dayNames = weeklySettings.days
          .map(
            (d) =>
              [
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
              ][d]
          )
          .join(", ");
        return `Every ${dayNames} at ${timeFormatted}`;
      }

      case "monthly":
        if (monthlySettings.type === "dayOfMonth") {
          return `On day ${monthlySettings.dayOfMonth} of every month at ${timeFormatted}`;
        } else {
          const weekNames = ["first", "second", "third", "fourth", "last"];
          const dayNames = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ];
          return `On the ${weekNames[monthlySettings.weekOfMonth - 1]} ${
            dayNames[monthlySettings.dayOfWeek]
          } of every month at ${timeFormatted}`;
        }

      default:
        return "Custom schedule";
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
