import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '24h'; // 24h, 7d, 30d
    const scheduleId = searchParams.get('scheduleId');

    // Calculate date range based on timeframe
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Build where clause
    const whereClause = {
      createdAt: { gte: startDate }
    };
    
    if (scheduleId) {
      whereClause.scheduleId = parseInt(scheduleId);
    }

    // Get message statistics
    const messageStats = await prisma.messageQueue.groupBy({
      by: ['status'],
      where: whereClause,
      _count: { status: true },
      _avg: { attempts: true },
      _max: { attempts: true }
    });

    // Calculate total and breakdown
    const totalMessages = messageStats.reduce((sum, stat) => sum + stat._count.status, 0);
    
    const statsSummary = messageStats.reduce((acc, stat) => {
      acc[stat.status] = {
        count: stat._count.status,
        percentage: totalMessages > 0 ? (stat._count.status / totalMessages) * 100 : 0,
        avgAttempts: stat._avg.attempts || 0,
        maxAttempts: stat._max.attempts || 0
      };
      return acc;
    }, {});

    // Add missing statuses with 0 values
    ['pending', 'processing', 'sent', 'failed'].forEach(status => {
      if (!statsSummary[status]) {
        statsSummary[status] = { count: 0, percentage: 0, avgAttempts: 0, maxAttempts: 0 };
      }
    });

    // Calculate retry statistics
    const retryStats = await prisma.messageQueue.findMany({
      where: {
        ...whereClause,
        attempts: { gt: 1 }
      },
      select: {
        attempts: true,
        status: true
      }
    });

    const retriedMessages = retryStats.length;
    const retryRate = totalMessages > 0 ? (retriedMessages / totalMessages) * 100 : 0;
    
    const retrySuccessful = retryStats.filter(r => r.status === 'sent').length;
    const retrySuccessRate = retriedMessages > 0 ? (retrySuccessful / retriedMessages) * 100 : 0;

    // Get performance metrics
    const performanceData = await prisma.messageQueue.findMany({
      where: {
        ...whereClause,
        status: 'sent',
        sentAt: { not: null }
      },
      select: {
        createdAt: true,
        sentAt: true,
        attempts: true
      }
    });

    const processingTimes = performanceData
      .map(msg => msg.sentAt.getTime() - msg.createdAt.getTime())
      .filter(time => time > 0);

    const avgProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length / 1000 // Convert to seconds
      : 0;

    // Get hourly breakdown for charts
    const hourlyBreakdown = [];
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000);
      hourStart.setMinutes(0, 0, 0);
      
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
      
      const hourData = await prisma.messageQueue.groupBy({
        by: ['status'],
        where: {
          scheduleId: scheduleId ? parseInt(scheduleId) : undefined,
          createdAt: {
            gte: hourStart,
            lt: hourEnd
          }
        },
        _count: { status: true }
      });

      const hourSummary = hourData.reduce((acc, stat) => {
        acc[stat.status] = stat._count.status;
        acc.total += stat._count.status;
        return acc;
      }, { total: 0, sent: 0, failed: 0, pending: 0, processing: 0 });

      hourlyBreakdown.push({
        hour: hourStart.getHours(),
        timestamp: hourStart.toISOString(),
        ...hourSummary
      });
    }

    // Get top error reasons
    const errorReasons = await prisma.messageQueue.groupBy({
      by: ['errorMessage'],
      where: {
        ...whereClause,
        status: 'failed',
        errorMessage: { not: null }
      },
      _count: { errorMessage: true },
      orderBy: { _count: { errorMessage: 'desc' } },
      take: 10
    });

    const topErrors = errorReasons.map(error => ({
      message: error.errorMessage,
      count: error._count.errorMessage,
      percentage: totalMessages > 0 ? (error._count.errorMessage / totalMessages) * 100 : 0
    }));

    // Get schedule performance breakdown
    const schedulePerformance = await prisma.schedule.findMany({
      where: scheduleId ? { id: parseInt(scheduleId) } : {},
      include: {
        _count: {
          select: {
            messageQueue: {
              where: {
                createdAt: { gte: startDate }
              }
            }
          }
        }
      }
    });

    const scheduleBreakdown = await Promise.all(
      schedulePerformance.map(async (schedule) => {
        const scheduleStats = await prisma.messageQueue.groupBy({
          by: ['status'],
          where: {
            scheduleId: schedule.id,
            createdAt: { gte: startDate }
          },
          _count: { status: true }
        });

        const scheduleTotal = scheduleStats.reduce((sum, stat) => sum + stat._count.status, 0);
        const scheduleSent = scheduleStats.find(s => s.status === 'sent')?._count.status || 0;
        const scheduleFailed = scheduleStats.find(s => s.status === 'failed')?._count.status || 0;

        return {
          id: schedule.id,
          name: schedule.name,
          status: schedule.status,
          total: scheduleTotal,
          sent: scheduleSent,
          failed: scheduleFailed,
          successRate: scheduleTotal > 0 ? (scheduleSent / scheduleTotal) * 100 : 0
        };
      })
    );

    const response = {
      timeframe,
      period: {
        start: startDate.toISOString(),
        end: now.toISOString()
      },
      total: totalMessages,
      sent: statsSummary.sent.count,
      failed: statsSummary.failed.count,
      pending: statsSummary.pending.count,
      processing: statsSummary.processing.count,
      successRate: totalMessages > 0 ? (statsSummary.sent.count / totalMessages) * 100 : 0,
      failureRate: totalMessages > 0 ? (statsSummary.failed.count / totalMessages) * 100 : 0,
      retryRate,
      retrySuccessRate,
      avgProcessingTime,
      breakdown: statsSummary,
      hourlyBreakdown,
      topErrors,
      scheduleBreakdown,
      generatedAt: now.toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("Error fetching schedule statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics", details: error.message },
      { status: 500 }
    );
  }
}