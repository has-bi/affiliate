// src/hooks/useBulkJob.js
"use client";

import { useState, useCallback, useEffect } from "react";

export const useBulkJob = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  const [activeJob, setActiveJob] = useState(null);
  const [jobHistory, setJobHistory] = useState([]);

  /**
   * Create a new bulk message job
   * @param {string} sessionName - WhatsApp session name
   * @param {Array} recipients - Array of phone numbers
   * @param {string} message - Message content
   * @param {Object} image - Optional image object
   * @returns {Promise<Object>} Job creation result
   */
  const createBulkJob = useCallback(async (sessionName, recipients, message, image = null) => {
    setIsCreating(true);
    setError(null);

    try {
      const payload = {
        recipients,
        message,
        session: sessionName,
        delay: 8000, // 8 second delay between messages
        templateName: "Manual broadcast"
      };

      // Add image URL if provided
      if (image && image.url) {
        payload.imageUrl = image.url;
      }

      const response = await fetch("/api/messages/bulk-job", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create bulk job");
      }

      const data = await response.json();
      
      // Start monitoring this job
      setActiveJob({
        jobId: data.jobId,
        status: 'pending',
        progress: {
          total: data.recipients.valid,
          processed: 0,
          successful: 0,
          failed: 0,
          currentBatch: 0,
          totalBatches: Math.ceil(data.recipients.valid / 25) // 25 per batch
        },
        createdAt: new Date(),
        estimatedDuration: data.estimatedDuration
      });
      
      return data;

    } catch (err) {
      const errorMessage = err.message || "Failed to create bulk message job";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  }, []);

  /**
   * Check status of a specific job
   * @param {string} jobId - Job ID to check
   * @returns {Promise<Object>} Job status
   */
  const checkJobStatus = useCallback(async (jobId) => {
    try {
      const response = await fetch(`/api/messages/bulk-job?jobId=${jobId}`);
      
      if (!response.ok) {
        throw new Error('Failed to get job status');
      }

      const data = await response.json();
      return data.job;
    } catch (err) {
      console.error('Error checking job status:', err);
      return null;
    }
  }, []);

  /**
   * Cancel a job
   * @param {string} jobId - Job ID to cancel
   * @returns {Promise<boolean>} Success status
   */
  const cancelJob = useCallback(async (jobId) => {
    try {
      const response = await fetch(`/api/messages/bulk-job?jobId=${jobId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to cancel job');
      }

      // Update active job if it's the one being cancelled
      if (activeJob && activeJob.jobId === jobId) {
        setActiveJob(prev => ({
          ...prev,
          status: 'cancelled'
        }));
      }

      return true;
    } catch (err) {
      console.error('Error cancelling job:', err);
      setError(err.message);
      return false;
    }
  }, [activeJob]);

  /**
   * Get all jobs
   * @returns {Promise<Array>} All jobs
   */
  const getAllJobs = useCallback(async () => {
    try {
      const response = await fetch('/api/messages/bulk-job');
      
      if (!response.ok) {
        throw new Error('Failed to get jobs');
      }

      const data = await response.json();
      setJobHistory(data.jobs);
      return data.jobs;
    } catch (err) {
      console.error('Error getting jobs:', err);
      return [];
    }
  }, []);

  /**
   * Monitor active job progress
   */
  const monitorActiveJob = useCallback(async () => {
    if (!activeJob || activeJob.status === 'completed' || activeJob.status === 'failed' || activeJob.status === 'cancelled') {
      return;
    }

    const jobStatus = await checkJobStatus(activeJob.jobId);
    if (jobStatus) {
      setActiveJob(prev => ({
        ...prev,
        ...jobStatus
      }));
    }
  }, [activeJob, checkJobStatus]);

  /**
   * Clear active job
   */
  const clearActiveJob = useCallback(() => {
    setActiveJob(null);
    setError(null);
  }, []);

  /**
   * Auto-monitor active job every 2 seconds
   */
  useEffect(() => {
    if (!activeJob || activeJob.status === 'completed' || activeJob.status === 'failed' || activeJob.status === 'cancelled') {
      return;
    }

    const interval = setInterval(monitorActiveJob, 2000);
    return () => clearInterval(interval);
  }, [activeJob, monitorActiveJob]);

  /**
   * Get progress percentage
   */
  const getProgressPercentage = useCallback(() => {
    if (!activeJob || !activeJob.progress) return 0;
    return Math.round((activeJob.progress.processed / activeJob.progress.total) * 100);
  }, [activeJob]);

  /**
   * Get estimated time remaining
   */
  const getTimeRemaining = useCallback(() => {
    if (!activeJob || !activeJob.progress || activeJob.status !== 'running') return null;
    
    const processed = activeJob.progress.processed;
    const total = activeJob.progress.total;
    const remaining = total - processed;
    
    if (remaining <= 0 || processed === 0) return null;
    
    // Estimate based on 8 second delay + processing time
    const avgTimePerMessage = 8.5; // seconds
    const remainingMinutes = Math.ceil((remaining * avgTimePerMessage) / 60);
    
    return remainingMinutes;
  }, [activeJob]);

  return {
    isCreating,
    error,
    activeJob,
    jobHistory,
    createBulkJob,
    checkJobStatus,
    cancelJob,
    getAllJobs,
    clearActiveJob,
    getProgressPercentage,
    getTimeRemaining,
  };
};