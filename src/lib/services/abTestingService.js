// src/lib/services/abTestingService.js
import prisma from "@/lib/prisma";

/**
 * A/B Testing Service
 * Provides utility functions for A/B testing operations
 */
export class ABTestingService {
  /**
   * Split recipients into variants based on allocation percentages
   * Now supports recipients with { name, phoneNumber } structure
   */
  static splitRecipients(recipients, variants) {
    // Normalize recipients to ensure consistent structure
    const normalizedRecipients = recipients.map(recipient => {
      if (typeof recipient === 'string') {
        return { phoneNumber: recipient, name: null };
      } else if (typeof recipient === 'object' && recipient.phoneNumber) {
        return {
          phoneNumber: recipient.phoneNumber,
          name: recipient.name || null
        };
      }
      return { phoneNumber: recipient, name: null };
    });

    const shuffled = [...normalizedRecipients].sort(() => Math.random() - 0.5);
    const assignments = [];
    let currentIndex = 0;

    // Sort variants by allocation percentage to ensure fairness
    const sortedVariants = [...variants].sort((a, b) => b.allocationPercentage - a.allocationPercentage);

    for (const variant of sortedVariants) {
      const count = Math.floor((variant.allocationPercentage / 100) * shuffled.length);
      
      for (let i = 0; i < count && currentIndex < shuffled.length; i++) {
        assignments.push({
          recipient: shuffled[currentIndex],
          variantId: variant.id,
          variantName: variant.name
        });
        currentIndex++;
      }
    }

    // Assign remaining recipients to the first variant
    while (currentIndex < shuffled.length) {
      assignments.push({
        recipient: shuffled[currentIndex],
        variantId: sortedVariants[0].id,
        variantName: sortedVariants[0].name
      });
      currentIndex++;
    }

    return assignments;
  }

  /**
   * Validate experiment configuration
   */
  static validateExperiment(experimentData) {
    const errors = [];

    // Required fields
    if (!experimentData.name?.trim()) {
      errors.push("Experiment name is required");
    }

    if (!experimentData.sessionName?.trim()) {
      errors.push("WhatsApp session is required");
    }

    // Variants validation
    if (!experimentData.variants || experimentData.variants.length < 2) {
      errors.push("At least 2 variants are required");
    }

    if (experimentData.variants) {
      // Check allocation percentages
      const totalAllocation = experimentData.variants.reduce(
        (sum, variant) => sum + (variant.allocationPercentage || 0), 0
      );

      if (Math.abs(totalAllocation - 100) > 0.01) {
        errors.push("Variant allocation percentages must sum to 100%");
      }

      // Check variant content
      experimentData.variants.forEach((variant, index) => {
        if (!variant.templateId && !variant.customMessage?.trim()) {
          errors.push(`Variant ${index + 1} must have either a template or custom message`);
        }

        if (variant.allocationPercentage <= 0 || variant.allocationPercentage > 100) {
          errors.push(`Variant ${index + 1} allocation must be between 1-100%`);
        }
      });
    }

    // Recipients validation
    if (!experimentData.recipients || experimentData.recipients.length === 0) {
      errors.push("At least one recipient is required");
    }

    // Settings validation
    if (experimentData.cooldownMinutes && experimentData.cooldownMinutes < 1) {
      errors.push("Cooldown must be at least 1 minute");
    }

    if (experimentData.batchSize && experimentData.batchSize < 1) {
      errors.push("Batch size must be at least 1");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate experiment statistics
   */
  static async calculateExperimentStats(experimentId) {
    const experiment = await prisma.aBExperiment.findUnique({
      where: { id: experimentId },
      include: {
        variants: true,
        recipients: true,
        results: true
      }
    });

    if (!experiment) {
      throw new Error("Experiment not found");
    }

    const stats = {
      experiment: {
        id: experiment.id,
        name: experiment.name,
        status: experiment.status,
        totalRecipients: experiment.recipients.length,
        startedAt: experiment.startedAt,
        endedAt: experiment.endedAt
      },
      variants: []
    };

    // Calculate stats for each variant
    for (const variant of experiment.variants) {
      const variantResults = experiment.results.filter(r => r.variantId === variant.id);
      const variantRecipients = experiment.recipients.filter(r => r.variantId === variant.id);

      const sent = variantResults.filter(r => r.status === "sent").length;
      const failed = variantResults.filter(r => r.status === "failed").length;
      const delivered = variantResults.filter(r => r.deliveryStatus === "delivered").length;
      const read = variantResults.filter(r => r.deliveryStatus === "read").length;

      const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;
      const readRate = sent > 0 ? (read / sent) * 100 : 0;

      stats.variants.push({
        id: variant.id,
        name: variant.name,
        allocationPercentage: variant.allocationPercentage,
        recipients: variantRecipients.length,
        sent,
        failed,
        delivered,
        read,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        readRate: Math.round(readRate * 100) / 100
      });
    }

    return stats;
  }

  /**
   * Check if experiment can be started
   */
  static async canStartExperiment(experimentId) {
    const experiment = await prisma.aBExperiment.findUnique({
      where: { id: experimentId },
      include: {
        variants: true,
        recipients: true
      }
    });

    if (!experiment) {
      return { canStart: false, reason: "Experiment not found" };
    }

    if (experiment.status !== "draft") {
      return { canStart: false, reason: "Only draft experiments can be started" };
    }

    if (experiment.variants.length < 2) {
      return { canStart: false, reason: "At least 2 variants are required" };
    }

    if (experiment.recipients.length === 0) {
      return { canStart: false, reason: "No recipients assigned to experiment" };
    }

    // Check if all variants have content
    for (const variant of experiment.variants) {
      if (!variant.templateId && !variant.customMessage) {
        return { 
          canStart: false, 
          reason: `Variant ${variant.name} has no content (template or custom message)` 
        };
      }
    }

    return { canStart: true };
  }

  /**
   * Get experiment progress
   */
  static async getExperimentProgress(experimentId) {
    const [totalRecipients, sentCount, failedCount] = await Promise.all([
      prisma.aBRecipient.count({
        where: { experimentId }
      }),
      prisma.aBRecipient.count({
        where: { experimentId, status: "sent" }
      }),
      prisma.aBRecipient.count({
        where: { experimentId, status: "failed" }
      })
    ]);

    const pendingCount = totalRecipients - sentCount - failedCount;
    const progressPercentage = totalRecipients > 0 ? 
      ((sentCount + failedCount) / totalRecipients) * 100 : 0;

    return {
      total: totalRecipients,
      sent: sentCount,
      failed: failedCount,
      pending: pendingCount,
      progressPercentage: Math.round(progressPercentage * 100) / 100,
      isComplete: pendingCount === 0
    };
  }

  /**
   * Get next batch recipients for a variant
   */
  static async getNextBatchRecipients(experimentId, variantId, batchSize) {
    return prisma.aBRecipient.findMany({
      where: {
        experimentId,
        variantId,
        status: "assigned"
      },
      take: batchSize,
      orderBy: { assignedAt: "asc" }
    });
  }

  /**
   * Generate experiment report
   */
  static async generateExperimentReport(experimentId) {
    const experiment = await prisma.aBExperiment.findUnique({
      where: { id: experimentId },
      include: {
        variants: {
          include: {
            template: { select: { id: true, name: true, content: true } }
          }
        }
      }
    });

    if (!experiment) {
      throw new Error("Experiment not found");
    }

    const stats = await this.calculateExperimentStats(experimentId);
    const progress = await this.getExperimentProgress(experimentId);

    // Get performance metrics
    const batches = await prisma.aBBatch.count({
      where: { experimentId }
    });

    const avgBatchTime = await prisma.aBBatch.aggregate({
      where: { experimentId },
      _avg: { recipientCount: true }
    });

    // Calculate overall success rate
    const totalSent = stats.variants.reduce((sum, v) => sum + v.sent, 0);
    const totalDelivered = stats.variants.reduce((sum, v) => sum + v.delivered, 0);
    const overallDeliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;

    // Determine winner (highest delivery rate)
    const winner = stats.variants.reduce((best, current) => 
      current.deliveryRate > best.deliveryRate ? current : best, 
      stats.variants[0]
    );

    const report = {
      experiment: {
        id: experiment.id,
        name: experiment.name,
        description: experiment.description,
        status: experiment.status,
        createdAt: experiment.createdAt,
        startedAt: experiment.startedAt,
        endedAt: experiment.endedAt,
        duration: experiment.startedAt && experiment.endedAt ? 
          Math.round((experiment.endedAt - experiment.startedAt) / (1000 * 60 * 60 * 24)) : null
      },
      progress,
      performance: {
        totalBatches: batches,
        averageBatchSize: Math.round(avgBatchTime._avg.recipientCount || 0),
        overallDeliveryRate: Math.round(overallDeliveryRate * 100) / 100
      },
      variants: stats.variants,
      winner: winner ? {
        name: winner.name,
        deliveryRate: winner.deliveryRate,
        improvement: winner.deliveryRate > 0 ? 
          Math.round((winner.deliveryRate - (overallDeliveryRate - winner.deliveryRate)) * 100) / 100 : 0
      } : null,
      recommendations: this.generateRecommendations(stats, experiment)
    };

    return report;
  }

  /**
   * Generate recommendations based on experiment results
   */
  static generateRecommendations(stats, experiment) {
    const recommendations = [];

    // Analyze delivery rates
    const deliveryRates = stats.variants.map(v => v.deliveryRate);
    const avgDeliveryRate = deliveryRates.reduce((sum, rate) => sum + rate, 0) / deliveryRates.length;
    const maxDeliveryRate = Math.max(...deliveryRates);
    const minDeliveryRate = Math.min(...deliveryRates);

    if (maxDeliveryRate - minDeliveryRate > 10) {
      const winner = stats.variants.find(v => v.deliveryRate === maxDeliveryRate);
      recommendations.push({
        type: "winner",
        message: `Variant ${winner.name} shows significantly better performance with ${winner.deliveryRate}% delivery rate`
      });
    }

    if (avgDeliveryRate < 70) {
      recommendations.push({
        type: "improvement",
        message: "Overall delivery rate is below 70%. Consider reviewing message content and recipient list quality"
      });
    }

    // Analyze sample sizes
    const minSampleSize = Math.min(...stats.variants.map(v => v.sent));
    if (minSampleSize < 30) {
      recommendations.push({
        type: "sample_size",
        message: "Sample sizes are small (< 30). Consider running longer for more reliable results"
      });
    }

    // Analyze read rates
    const readRates = stats.variants.map(v => v.readRate);
    const avgReadRate = readRates.reduce((sum, rate) => sum + rate, 0) / readRates.length;
    
    if (avgReadRate < 20) {
      recommendations.push({
        type: "engagement",
        message: "Read rates are low. Consider improving message content to increase engagement"
      });
    }

    return recommendations;
  }
}

export default ABTestingService;