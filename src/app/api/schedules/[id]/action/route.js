import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import batchProcessor from "@/lib/schedules/batchProcessor";
import retryService from "@/lib/schedules/retryService";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { action, options = {} } = await request.json();

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      );
    }

    const scheduleId = parseInt(id);

    // Get current schedule
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        batches: true,
        messageQueue: true
      }
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    let result = {};

    switch (action) {
      case 'start':
        if (schedule.status !== 'pending' && schedule.status !== 'paused') {
          return NextResponse.json(
            { error: "Schedule cannot be started from current status" },
            { status: 400 }
          );
        }

        await prisma.schedule.update({
          where: { id: scheduleId },
          data: { 
            status: 'active',
            updatedAt: new Date()
          }
        });

        // Start batch processing
        batchProcessor.processScheduleWithBatches(scheduleId);
        
        result = { message: "Schedule started successfully" };
        break;

      case 'pause':
        if (schedule.status !== 'active') {
          return NextResponse.json(
            { error: "Only active schedules can be paused" },
            { status: 400 }
          );
        }

        await prisma.schedule.update({
          where: { id: scheduleId },
          data: { 
            status: 'paused',
            updatedAt: new Date()
          }
        });

        result = { message: "Schedule paused successfully" };
        break;

      case 'resume':
        if (schedule.status !== 'paused') {
          return NextResponse.json(
            { error: "Only paused schedules can be resumed" },
            { status: 400 }
          );
        }

        await prisma.schedule.update({
          where: { id: scheduleId },
          data: { 
            status: 'active',
            updatedAt: new Date()
          }
        });

        // Resume batch processing
        batchProcessor.processScheduleWithBatches(scheduleId);
        
        result = { message: "Schedule resumed successfully" };
        break;

      case 'stop':
        if (schedule.status === 'completed' || schedule.status === 'stopped') {
          return NextResponse.json(
            { error: "Schedule is already stopped" },
            { status: 400 }
          );
        }

        await prisma.schedule.update({
          where: { id: scheduleId },
          data: { 
            status: 'stopped',
            updatedAt: new Date()
          }
        });

        // Cancel any pending messages
        await prisma.messageQueue.updateMany({
          where: {
            scheduleId,
            status: { in: ['pending', 'processing'] }
          },
          data: {
            status: 'failed',
            errorMessage: 'Schedule stopped by user'
          }
        });

        result = { message: "Schedule stopped successfully" };
        break;

      case 'retry_failed':
        const retryResult = await retryService.retrySchedule(scheduleId, {
          resetAttempts: options.resetAttempts || false,
          onlyRecentFailures: options.onlyRecentFailures !== false,
          maxMessages: options.maxMessages || 1000
        });

        result = {
          message: `Retried ${retryResult.processedCount} failed messages`,
          ...retryResult
        };
        break;

      case 'reset_failed':
        // Reset all failed messages to pending for retry
        const resetResult = await prisma.messageQueue.updateMany({
          where: {
            scheduleId,
            status: 'failed'
          },
          data: {
            status: 'pending',
            attempts: 0,
            errorMessage: null,
            scheduledFor: new Date()
          }
        });

        result = {
          message: `Reset ${resetResult.count} failed messages to pending`,
          resetCount: resetResult.count
        };
        break;

      case 'force_complete':
        await prisma.schedule.update({
          where: { id: scheduleId },
          data: { 
            status: 'completed',
            updatedAt: new Date()
          }
        });

        // Mark any pending messages as failed
        await prisma.messageQueue.updateMany({
          where: {
            scheduleId,
            status: { in: ['pending', 'processing'] }
          },
          data: {
            status: 'failed',
            errorMessage: 'Schedule marked as completed'
          }
        });

        result = { message: "Schedule marked as completed" };
        break;

      case 'get_status':
        // Return detailed status without making changes
        const batchStatus = await batchProcessor.getBatchStatus(scheduleId);
        
        result = {
          schedule: {
            id: schedule.id,
            name: schedule.name,
            status: schedule.status,
            nextRun: schedule.nextRun,
            lastRun: schedule.lastRun
          },
          ...batchStatus
        };
        break;

      case 'priority_boost':
        // Boost priority of pending messages
        await prisma.messageQueue.updateMany({
          where: {
            scheduleId,
            status: 'pending'
          },
          data: {
            priority: 'high',
            scheduledFor: new Date() // Send immediately
          }
        });

        result = { message: "Boosted priority for pending messages" };
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      scheduleId,
      ...result
    });

  } catch (error) {
    console.error(`Error executing action ${action} on schedule ${id}:`, error);
    return NextResponse.json(
      { 
        error: "Failed to execute action", 
        details: error.message,
        action: request.action 
      },
      { status: 500 }
    );
  }
}