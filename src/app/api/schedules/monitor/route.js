import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Get all active and pending schedules with related data
    const schedules = await prisma.schedule.findMany({
      where: {
        status: {
          in: ['active', 'pending', 'processing']
        }
      },
      include: {
        parameters: true,
        recipients: true,
        batches: {
          select: {
            id: true,
            batchNumber: true,
            status: true,
            successCount: true,
            failedCount: true,
            recipientsCount: true,
            startedAt: true,
            completedAt: true
          },
          orderBy: { batchNumber: 'asc' }
        },
        _count: {
          select: {
            messageQueue: {
              where: {
                OR: [
                  { status: 'sent' },
                  { status: 'failed' },
                  { status: 'pending' }
                ]
              }
            }
          }
        }
      },
      orderBy: [
        { status: 'asc' }, // Active first
        { nextRun: 'asc' }  // Next to run first
      ]
    });

    // Enrich schedule data with statistics
    const enrichedSchedules = await Promise.all(schedules.map(async (schedule) => {
      // Get message statistics
      const messageStats = await prisma.messageQueue.groupBy({
        by: ['status'],
        where: { scheduleId: schedule.id },
        _count: { status: true }
      });

      const messageStatsSummary = messageStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.status;
        acc.total += stat._count.status;
        return acc;
      }, { total: 0, sent: 0, failed: 0, pending: 0, processing: 0 });

      // Get batch statistics
      const batchStats = {
        total: schedule.batches.length,
        completed: schedule.batches.filter(b => b.status === 'completed').length,
        processing: schedule.batches.filter(b => b.status === 'processing').length,
        failed: schedule.batches.filter(b => b.status === 'failed').length,
        pending: schedule.batches.filter(b => b.status === 'pending').length
      };

      // Calculate estimated completion time
      let estimatedCompletion = null;
      if (schedule.status === 'active' && messageStatsSummary.total > 0) {
        const remainingMessages = messageStatsSummary.total - messageStatsSummary.sent - messageStatsSummary.failed;
        if (remainingMessages > 0 && schedule.batchSize > 0 && schedule.batchDelay > 0) {
          const remainingBatches = Math.ceil(remainingMessages / schedule.batchSize);
          const estimatedSeconds = remainingBatches * schedule.batchDelay;
          estimatedCompletion = new Date(Date.now() + estimatedSeconds * 1000);
        }
      }

      // Get recent activity
      const recentActivity = await prisma.messageQueue.findMany({
        where: { scheduleId: schedule.id },
        select: {
          id: true,
          recipient: true,
          status: true,
          sentAt: true,
          errorMessage: true
        },
        orderBy: { updatedAt: 'desc' },
        take: 5
      });

      return {
        id: schedule.id,
        name: schedule.name,
        status: schedule.status,
        scheduleType: schedule.scheduleType,
        nextRun: schedule.nextRun,
        lastRun: schedule.lastRun,
        sessionName: schedule.sessionName,
        batchSize: schedule.batchSize,
        batchDelay: schedule.batchDelay,
        dailyLimit: schedule.dailyLimit,
        createdAt: schedule.createdAt,
        messageStats: messageStatsSummary,
        batchStats,
        estimatedCompletion,
        recentActivity,
        recipientCount: schedule.recipients.length
      };
    }));

    return NextResponse.json(enrichedSchedules);

  } catch (error) {
    console.error("Error fetching schedule monitoring data:", error);
    return NextResponse.json(
      { error: "Failed to fetch monitoring data", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { action, scheduleIds } = await request.json();

    if (!action || !scheduleIds || !Array.isArray(scheduleIds)) {
      return NextResponse.json(
        { error: "Invalid request. Need action and scheduleIds array." },
        { status: 400 }
      );
    }

    let updateData = {};
    
    switch (action) {
      case 'pause':
        updateData = { status: 'paused' };
        break;
      case 'resume':
        updateData = { status: 'active' };
        break;
      case 'stop':
        updateData = { status: 'stopped' };
        break;
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    // Update schedules
    const result = await prisma.schedule.updateMany({
      where: {
        id: { in: scheduleIds },
        status: { not: 'completed' } // Don't modify completed schedules
      },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      updated: result.count,
      action
    });

  } catch (error) {
    console.error("Error executing bulk action:", error);
    return NextResponse.json(
      { error: "Failed to execute action", details: error.message },
      { status: 500 }
    );
  }
}