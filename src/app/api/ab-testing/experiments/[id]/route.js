// src/app/api/ab-testing/experiments/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/ab-testing/experiments/[id]
 * Get a specific A/B testing experiment with detailed information
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const experimentId = parseInt(id);

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
            template: {
              select: { id: true, name: true, content: true }
            },
            _count: {
              select: {
                recipients: true,
                results: true
              }
            }
          }
        },
        batches: {
          orderBy: { sentAt: "desc" },
          take: 10 // Latest 10 batches
        },
        _count: {
          select: {
            recipients: true,
            results: true
          }
        }
      },
    });

    if (!experiment) {
      return NextResponse.json(
        { error: "Experiment not found" },
        { status: 404 }
      );
    }

    // Get detailed analytics for each variant
    const variantAnalytics = await Promise.all(
      experiment.variants.map(async (variant) => {
        const analytics = await prisma.aBResult.groupBy({
          by: ["status"],
          where: { 
            experimentId: experimentId,
            variantId: variant.id 
          },
          _count: { _all: true },
        });

        const statusCounts = analytics.reduce((acc, stat) => {
          acc[stat.status || "pending"] = stat._count._all;
          return acc;
        }, {});

        // Get delivery status analytics
        const deliveryAnalytics = await prisma.aBResult.groupBy({
          by: ["deliveryStatus"],
          where: { 
            experimentId: experimentId,
            variantId: variant.id,
            status: "sent"
          },
          _count: { _all: true },
        });

        const deliveryCounts = deliveryAnalytics.reduce((acc, stat) => {
          acc[stat.deliveryStatus || "unknown"] = stat._count._all;
          return acc;
        }, {});

        return {
          ...variant,
          analytics: {
            sent: statusCounts.sent || 0,
            failed: statusCounts.failed || 0,
            pending: statusCounts.pending || 0,
            delivered: deliveryCounts.delivered || 0,
            read: deliveryCounts.read || 0,
            deliveryFailed: deliveryCounts.failed || 0,
          }
        };
      })
    );

    // Get recent activity
    const recentResults = await prisma.aBResult.findMany({
      where: { experimentId: experimentId },
      include: {
        variant: { select: { name: true } },
        recipient: { select: { phoneNumber: true } }
      },
      orderBy: { sentAt: "desc" },
      take: 20
    });

    return NextResponse.json({
      ...experiment,
      variants: variantAnalytics,
      recentActivity: recentResults
    });
  } catch (error) {
    console.error("Error fetching A/B experiment:", error);
    return NextResponse.json(
      { error: "Failed to fetch experiment" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/ab-testing/experiments/[id]
 * Update an A/B testing experiment
 */
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const experimentId = parseInt(id);
    const body = await request.json();

    if (!experimentId) {
      return NextResponse.json(
        { error: "Invalid experiment ID" },
        { status: 400 }
      );
    }

    // Check if experiment exists and is in editable state
    const existingExperiment = await prisma.aBExperiment.findUnique({
      where: { id: experimentId }
    });

    if (!existingExperiment) {
      return NextResponse.json(
        { error: "Experiment not found" },
        { status: 404 }
      );
    }

    // Only allow editing draft experiments
    if (existingExperiment.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft experiments can be edited" },
        { status: 400 }
      );
    }

    const {
      name,
      description,
      cooldownMinutes,
      batchSize,
      settings,
    } = body;

    const updatedExperiment = await prisma.aBExperiment.update({
      where: { id: experimentId },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(cooldownMinutes && { cooldownMinutes }),
        ...(batchSize && { batchSize }),
        ...(settings && { settings }),
      },
      include: {
        variants: {
          include: {
            template: { select: { id: true, name: true } }
          }
        },
        _count: {
          select: { recipients: true }
        }
      },
    });

    return NextResponse.json(updatedExperiment);
  } catch (error) {
    console.error("Error updating A/B experiment:", error);
    return NextResponse.json(
      { error: "Failed to update experiment" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ab-testing/experiments/[id]
 * Delete an A/B testing experiment
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const experimentId = parseInt(id);

    if (!experimentId) {
      return NextResponse.json(
        { error: "Invalid experiment ID" },
        { status: 400 }
      );
    }

    // Check if experiment exists
    const existingExperiment = await prisma.aBExperiment.findUnique({
      where: { id: experimentId }
    });

    if (!existingExperiment) {
      return NextResponse.json(
        { error: "Experiment not found" },
        { status: 404 }
      );
    }

    // Only allow deleting draft or completed experiments
    if (!["draft", "completed", "cancelled"].includes(existingExperiment.status)) {
      return NextResponse.json(
        { error: "Cannot delete active or running experiments" },
        { status: 400 }
      );
    }

    // Delete experiment (cascade will handle related records)
    await prisma.aBExperiment.delete({
      where: { id: experimentId }
    });

    return NextResponse.json({ message: "Experiment deleted successfully" });
  } catch (error) {
    console.error("Error deleting A/B experiment:", error);
    return NextResponse.json(
      { error: "Failed to delete experiment" },
      { status: 500 }
    );
  }
}