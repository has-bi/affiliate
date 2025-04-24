"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../../../components/organisms/Header";
import Card from "../../../../components/atoms/Card";
import ScheduleForm from "../../../../components/molecules/ScheduleForm";

export default function NewSchedulePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (scheduleData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(scheduleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create schedule");
      }

      // Redirect to schedules list
      router.push("/schedules");
    } catch (err) {
      console.error("Error creating schedule:", err);
      setError(err.message || "Failed to create schedule");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:leading-9">
                Create New Schedule
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Set up an automated message to be sent at a specific time
              </p>
            </div>
          </div>

          <Card>
            <Card.Content>
              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
                  {error}
                </div>
              )}

              <ScheduleForm
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            </Card.Content>
          </Card>
        </div>
      </main>
    </div>
  );
}
