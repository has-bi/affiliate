"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../../../../../components/organisms/Header";
import Card from "../../../../../components/atoms/Card";
import ScheduleForm from "../../../../../components/molecules/ScheduleForm";
import { AlertCircle } from "lucide-react";

export default function EditSchedulePage({ params }) {
  const router = useRouter();
  const { id } = params;

  const [schedule, setSchedule] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchScheduleDetails();
  }, []);

  const fetchScheduleDetails = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/schedules/${id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch schedule details");
      }

      const data = await response.json();
      setSchedule(data);
    } catch (err) {
      console.error("Error fetching schedule details:", err);
      setError(err.message || "Failed to load schedule details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (scheduleData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/schedules/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(scheduleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update schedule");
      }

      // Redirect to schedule details
      router.push(`/schedules/${id}`);
    } catch (err) {
      console.error("Error updating schedule:", err);
      setError(err.message || "Failed to update schedule");
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
                Edit Schedule
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Update your scheduled message
              </p>
            </div>
          </div>

          <Card>
            <Card.Content>
              {isLoading ? (
                <div className="text-center py-10">
                  <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading schedule details...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Error</h3>
                    <p className="mt-1">{error}</p>
                  </div>
                </div>
              ) : schedule ? (
                <ScheduleForm
                  initialData={schedule}
                  onSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                />
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500">Schedule not found</p>
                </div>
              )}
            </Card.Content>
          </Card>
        </div>
      </main>
    </div>
  );
}
