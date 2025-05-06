"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Edit,
  Trash,
  Eye,
  Play,
  Pause,
  Plus,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useSchedule } from "@/hooks/useSchedule";

export default function ScheduleManager() {
  const router = useRouter();
  const { schedules, isLoading, error, deleteSchedule, toggleScheduleStatus } =
    useSchedule();

  // -------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "active":
        return "success";
      case "paused":
        return "secondary"; // fallback when your design‑system has no "warning"
      case "completed":
        return "outline";
      case "failed":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getScheduleDescription = (schedule) => {
    if (schedule.scheduleType === "once") {
      return `One‑time: ${formatDate(schedule.scheduleConfig?.date)}`;
    }
    return `Recurring: ${schedule.scheduleConfig?.cronExpression || "Custom"}`;
  };

  // -------------------------------------------------------------
  // Render
  // -------------------------------------------------------------
  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <div>
          <CardTitle>Scheduled Messages</CardTitle>
          <CardDescription>
            Manage your automated message schedules
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        {/* -------------------------------------------------- */}
        {/* Error banner                                      */}
        {/* -------------------------------------------------- */}
        {error && (
          <div className="bg-red-50 p-4 rounded-md text-red-700 flex items-start mb-4 dark:bg-red-900/20 dark:text-red-300">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium">Error loading schedules</h3>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* -------------------------------------------------- */}
        {/* Skeleton / empty‑state / list                     */}
        {/* -------------------------------------------------- */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-md dark:bg-gray-800/40">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No schedules found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Create your first schedule to automate message sending
            </p>
            <Button
              variant="primary"
              onClick={() => router.push("/messages/scheduled/new")}
            >
              Create Schedule
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <Card
                key={schedule.id}
                className="hover:shadow-sm transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    {/* ---------------------------------- */}
                    {/* Meta                                 */}
                    {/* ---------------------------------- */}
                    <div>
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          {schedule.name}
                        </h3>
                        <Badge
                          variant={getStatusBadgeVariant(schedule.status)}
                          className="ml-2 capitalize"
                        >
                          {schedule.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {getScheduleDescription(schedule)}
                      </p>
                    </div>

                    {/* ---------------------------------- */}
                    {/* Actions                              */}
                    {/* ---------------------------------- */}
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(`/messages/scheduled/${schedule.id}`)
                        }
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {schedule.status !== "completed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            toggleScheduleStatus(schedule.id, schedule.status)
                          }
                          title={
                            schedule.status === "active" ? "Pause" : "Activate"
                          }
                        >
                          {schedule.status === "active" ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSchedule(schedule.id)}
                        title="Delete schedule"
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  {/* ---------------------------------- */}
                  {/* Additional info grid                 */}
                  {/* ---------------------------------- */}
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block">
                        Template
                      </span>
                      <span className="font-medium">
                        #{schedule.templateId}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block">
                        Session
                      </span>
                      <span className="font-medium">
                        {schedule.sessionName}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block">
                        Next run
                      </span>
                      <span className="font-medium">
                        {formatDate(schedule.nextRun)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block">
                        Last run
                      </span>
                      <span className="font-medium">
                        {formatDate(schedule.lastRun)}
                      </span>
                    </div>
                  </div>

                  {/* ---------------------------------- */}
                  {/* Recent history summary               */}
                  {/* ---------------------------------- */}
                  {schedule.history?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Recent history
                      </h4>
                      <div className="space-y-2">
                        {schedule.history.slice(0, 3).map((entry, idx) => (
                          <div key={idx} className="flex items-center text-sm">
                            {entry.failedCount === 0 ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                            )}
                            <span className="text-gray-600 dark:text-gray-400">
                              {formatDate(entry.runAt)}: {entry.successCount}{" "}
                              successful, {entry.failedCount} failed
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
