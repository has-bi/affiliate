// src/app/api/ab-testing/experiments/[id]/analytics/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/ab-testing/experiments/[id]/analytics
 * Get detailed analytics for an A/B testing experiment
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const experimentId = parseInt(id);
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get("timeframe") || "7d"; // 1d, 7d, 30d, all

    if (!experimentId) {
      return NextResponse.json(
        { error: "Invalid experiment ID" },
        { status: 400 }
      );
    }

    const experiment = await prisma.aBExperiment.findUnique({
      where: { id: experimentId },
      include: {
        variants: {
          include: {
            template: { select: { id: true, name: true } }
          }
        }
      }
    });

    if (!experiment) {
      return NextResponse.json(
        { error: "Experiment not found" },
        { status: 404 }
      );
    }

    // Calculate date range based on timeframe
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case "1d":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = experiment.startedAt || experiment.createdAt;
    }

    // Get overall experiment statistics
    const overallStats = await getExperimentStats(experimentId, startDate);
    
    // Get variant comparison data
    const variantComparison = await getVariantComparison(experimentId, startDate);
    
    // Get time series data for charts
    const timeSeries = await getTimeSeriesData(experimentId, startDate);
    
    // Get performance metrics
    const performanceMetrics = await getPerformanceMetrics(experimentId);
    
    // Get recent activity
    const recentActivity = await getRecentActivity(experimentId, 50);

    // Calculate statistical significance
    const statisticalSignificance = await calculateStatisticalSignificance(experimentId);

    return NextResponse.json({
      experiment: {
        id: experiment.id,
        name: experiment.name,
        status: experiment.status,
        startedAt: experiment.startedAt,
        endedAt: experiment.endedAt,
        totalRecipients: experiment.totalRecipients
      },
      timeframe,
      overall: overallStats,
      variants: variantComparison,
      timeSeries,
      performance: performanceMetrics,
      recentActivity,
      statisticalSignificance
    });
  } catch (error) {
    console.error("Error fetching A/B experiment analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

/**
 * Get overall experiment statistics
 */
async function getExperimentStats(experimentId, startDate) {
  const results = await prisma.aBResult.findMany({
    where: {
      experimentId,
      sentAt: { gte: startDate }
    }
  });

  const totalSent = results.filter(r => r.status === "sent").length;
  const totalFailed = results.filter(r => r.status === "failed").length;
  const totalDelivered = results.filter(r => r.deliveryStatus === "delivered").length;
  const totalRead = results.filter(r => r.deliveryStatus === "read").length;

  const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
  const readRate = totalSent > 0 ? (totalRead / totalSent) * 100 : 0;
  const failureRate = (totalSent + totalFailed) > 0 ? (totalFailed / (totalSent + totalFailed)) * 100 : 0;

  return {
    totalSent,
    totalFailed,
    totalDelivered,
    totalRead,
    deliveryRate: Math.round(deliveryRate * 100) / 100,
    readRate: Math.round(readRate * 100) / 100,
    failureRate: Math.round(failureRate * 100) / 100
  };
}

/**
 * Get variant comparison data
 */
async function getVariantComparison(experimentId, startDate) {
  const variants = await prisma.aBVariant.findMany({
    where: { experimentId },
    include: {
      template: { select: { id: true, name: true } },
      _count: { select: { recipients: true } }
    }
  });

  const variantStats = await Promise.all(
    variants.map(async (variant) => {
      const results = await prisma.aBResult.findMany({
        where: {
          experimentId,
          variantId: variant.id,
          sentAt: { gte: startDate }
        }
      });

      const sent = results.filter(r => r.status === "sent").length;
      const failed = results.filter(r => r.status === "failed").length;
      const delivered = results.filter(r => r.deliveryStatus === "delivered").length;
      const read = results.filter(r => r.deliveryStatus === "read").length;

      const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;
      const readRate = sent > 0 ? (read / sent) * 100 : 0;
      const failureRate = (sent + failed) > 0 ? (failed / (sent + failed)) * 100 : 0;

      return {
        id: variant.id,
        name: variant.name,
        template: variant.template,
        allocationPercentage: variant.allocationPercentage,
        totalRecipients: variant._count.recipients,
        stats: {
          sent,
          failed,
          delivered,
          read,
          deliveryRate: Math.round(deliveryRate * 100) / 100,
          readRate: Math.round(readRate * 100) / 100,
          failureRate: Math.round(failureRate * 100) / 100
        }
      };
    })
  );

  return variantStats;
}

/**
 * Get time series data for charts
 */
async function getTimeSeriesData(experimentId, startDate) {
  // Group results by date and variant
  const results = await prisma.aBResult.findMany({
    where: {
      experimentId,
      sentAt: { gte: startDate }
    },
    select: {
      variantId: true,
      sentAt: true,
      status: true,
      deliveryStatus: true,
      variant: { select: { name: true } }
    },
    orderBy: { sentAt: "asc" }
  });

  // Group by date
  const dailyStats = {};
  
  results.forEach(result => {
    if (!result.sentAt) return;
    
    const date = result.sentAt.toISOString().split('T')[0];
    const variantName = result.variant.name;
    
    if (!dailyStats[date]) {
      dailyStats[date] = {};
    }
    
    if (!dailyStats[date][variantName]) {
      dailyStats[date][variantName] = {
        sent: 0,
        delivered: 0,
        read: 0,
        failed: 0
      };
    }
    
    if (result.status === "sent") {
      dailyStats[date][variantName].sent++;
      
      if (result.deliveryStatus === "delivered") {
        dailyStats[date][variantName].delivered++;
      } else if (result.deliveryStatus === "read") {
        dailyStats[date][variantName].read++;
      }
    } else if (result.status === "failed") {
      dailyStats[date][variantName].failed++;
    }
  });

  // Convert to array format for charts
  const timeSeriesData = Object.entries(dailyStats).map(([date, variants]) => ({
    date,
    variants
  }));

  return timeSeriesData;
}

/**
 * Get performance metrics
 */
async function getPerformanceMetrics(experimentId) {
  const batches = await prisma.aBBatch.findMany({
    where: { experimentId },
    orderBy: { sentAt: "desc" },
    take: 10
  });

  if (batches.length === 0) {
    return {
      averageBatchTime: 0,
      averageBatchSize: 0,
      averageSuccessRate: 0,
      lastBatchSent: null
    };
  }

  const avgBatchSize = batches.reduce((sum, batch) => sum + batch.recipientCount, 0) / batches.length;
  const avgSuccessRate = batches.reduce((sum, batch) => {
    const total = batch.successCount + batch.failedCount;
    return sum + (total > 0 ? (batch.successCount / total) * 100 : 0);
  }, 0) / batches.length;

  // Calculate average time between batches
  let avgBatchTime = 0;
  if (batches.length > 1) {
    const timeDiffs = [];
    for (let i = 0; i < batches.length - 1; i++) {
      const timeDiff = batches[i].sentAt.getTime() - batches[i + 1].sentAt.getTime();
      timeDiffs.push(timeDiff);
    }
    avgBatchTime = timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length;
  }

  return {
    averageBatchTime: Math.round(avgBatchTime / 1000 / 60), // in minutes
    averageBatchSize: Math.round(avgBatchSize),
    averageSuccessRate: Math.round(avgSuccessRate * 100) / 100,
    lastBatchSent: batches[0]?.sentAt || null,
    totalBatches: batches.length
  };
}

/**
 * Get recent activity
 */
async function getRecentActivity(experimentId, limit = 50) {
  const recentResults = await prisma.aBResult.findMany({
    where: { experimentId },
    include: {
      variant: { select: { name: true } },
      recipient: { select: { phoneNumber: true } },
      batch: { select: { batchNumber: true } }
    },
    orderBy: { sentAt: "desc" },
    take: limit
  });

  return recentResults.map(result => ({
    id: result.id,
    variant: result.variant.name,
    recipient: result.recipient.phoneNumber,
    batchNumber: result.batch?.batchNumber,
    status: result.status,
    deliveryStatus: result.deliveryStatus,
    sentAt: result.sentAt,
    errorMessage: result.errorMessage
  }));
}

/**
 * Calculate statistical significance between variants
 */
async function calculateStatisticalSignificance(experimentId) {
  const variants = await prisma.aBVariant.findMany({
    where: { experimentId }
  });

  if (variants.length < 2) {
    return { hasSignificance: false, message: "Need at least 2 variants for comparison" };
  }

  // Get success rates for each variant (using delivery rate as success metric)
  const variantMetrics = await Promise.all(
    variants.map(async (variant) => {
      const results = await prisma.aBResult.findMany({
        where: {
          experimentId,
          variantId: variant.id,
          status: "sent"
        }
      });

      const delivered = results.filter(r => r.deliveryStatus === "delivered").length;
      const total = results.length;
      const rate = total > 0 ? delivered / total : 0;

      return {
        name: variant.name,
        successes: delivered,
        trials: total,
        rate
      };
    })
  );

  // Simple statistical comparison (z-test)
  if (variantMetrics.length >= 2 && variantMetrics.every(m => m.trials >= 30)) {
    const [variantA, variantB] = variantMetrics;
    
    const pooledRate = (variantA.successes + variantB.successes) / (variantA.trials + variantB.trials);
    const pooledSE = Math.sqrt(pooledRate * (1 - pooledRate) * (1/variantA.trials + 1/variantB.trials));
    const zScore = Math.abs(variantA.rate - variantB.rate) / pooledSE;
    
    // z-score > 1.96 indicates 95% confidence
    const isSignificant = zScore > 1.96;
    const winner = variantA.rate > variantB.rate ? variantA.name : variantB.name;
    
    return {
      hasSignificance: isSignificant,
      zScore: Math.round(zScore * 100) / 100,
      confidenceLevel: isSignificant ? "95%" : "< 95%",
      winner: isSignificant ? winner : null,
      improvement: isSignificant ? 
        Math.round(Math.abs(variantA.rate - variantB.rate) * 10000) / 100 : 0,
      metrics: variantMetrics
    };
  }

  return {
    hasSignificance: false,
    message: "Insufficient data for statistical analysis (need at least 30 samples per variant)",
    metrics: variantMetrics
  };
}