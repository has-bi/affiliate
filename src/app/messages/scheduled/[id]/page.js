// src/app/schedules/[id]/edit/page.js
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ScheduleForm from "@/components/molecules/ScheduleForm";
import PageLayout from "@/components/templates/PageLayout";
import { AlertCircle } from "lucide-react";

export default function EditSchedulePage({ params }) {
  const router = useRouter();
  const { id } = params;
  const [schedule, setSchedule] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSchedule();
  }, [id]);

  const fetchSchedule = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/schedules/${id}`);
      if (!response.ok) throw new Error("Failed to fetch schedule");

      const data = await response.json();
      setSchedule(data);
    } catch (err) {
      console.error("Error fetching schedule:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/schedules/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update schedule");
      }

      router.push("/schedules");
    } catch (err) {
      console.error("Error updating schedule:", err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <PageLayout title="Edit Schedule">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Edit Schedule">
        <div className="bg-red-50 p-4 rounded-md text-red-700 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium">Error loading schedule</h3>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Edit Schedule"
      description={`Edit schedule: ${schedule?.name}`}
    >
      <ScheduleForm
        initialData={schedule}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </PageLayout>
  );
}
