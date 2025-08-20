// src/app/api/ab-testing/experiments/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/ab-testing/experiments
 * Get all A/B testing experiments with pagination and filtering
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    // Build filter conditions
    const where = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get experiments with pagination
    const [experiments, total] = await Promise.all([
      prisma.aBExperiment.findMany({
        where,
        include: {
          variants: {
            include: {
              template: {
                select: { id: true, name: true }
              }
            }
          },
          _count: {
            select: {
              recipients: true,
              results: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.aBExperiment.count({ where }),
    ]);

    // Calculate summary statistics for each experiment
    const experimentsWithStats = await Promise.all(
      experiments.map(async (experiment) => {
        const stats = await prisma.aBResult.groupBy({
          by: ["status"],
          where: { experimentId: experiment.id },
          _count: { _all: true },
        });

        const statusCounts = stats.reduce((acc, stat) => {
          acc[stat.status || "pending"] = stat._count._all;
          return acc;
        }, {});

        return {
          ...experiment,
          stats: {
            totalRecipients: experiment._count.recipients,
            totalResults: experiment._count.results,
            sent: statusCounts.sent || 0,
            failed: statusCounts.failed || 0,
            pending: statusCounts.pending || 0,
          }
        };
      })
    );

    return NextResponse.json({
      experiments: experimentsWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching A/B experiments:", error);
    return NextResponse.json(
      { error: "Failed to fetch experiments" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ab-testing/experiments
 * Create a new A/B testing experiment
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      sessionName,
      cooldownMinutes = 5,
      batchSize = 50,
      variants = [],
      recipients = [],
      settings = {},
    } = body;

    // Validate required fields
    if (!name || !sessionName || variants.length < 2) {
      return NextResponse.json(
        { 
          error: "Name, session, and at least 2 variants are required" 
        },
        { status: 400 }
      );
    }

    // Validate variant allocation percentages sum to 100
    const totalAllocation = variants.reduce((sum, variant) => sum + (variant.allocationPercentage || 0), 0);
    if (Math.abs(totalAllocation - 100) > 0.01) {
      return NextResponse.json(
        { 
          error: "Variant allocation percentages must sum to 100%" 
        },
        { status: 400 }
      );
    }

    // Validate recipients
    if (!recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: "At least one recipient is required" },
        { status: 400 }
      );
    }

    // Validate recipients format (now supports objects with name and phoneNumber)
    const invalidRecipients = recipients.filter(recipient => {
      if (typeof recipient === 'string') {
        return !recipient.trim();
      } else if (typeof recipient === 'object') {
        return !recipient.phoneNumber || !recipient.phoneNumber.trim();
      }
      return true;
    });

    if (invalidRecipients.length > 0) {
      return NextResponse.json(
        { error: "Invalid recipient format found" },
        { status: 400 }
      );
    }

    // Create experiment in a transaction
    const experiment = await prisma.$transaction(async (tx) => {
      // Create the experiment
      const newExperiment = await tx.aBExperiment.create({
        data: {
          name,
          description,
          sessionName,
          cooldownMinutes,
          batchSize,
          totalRecipients: recipients.length,
          settings,
          status: "draft",
        },
      });

      // Create variants
      const createdVariants = await Promise.all(
        variants.map(async (variant, index) => {
          return tx.aBVariant.create({
            data: {
              experimentId: newExperiment.id,
              name: variant.name || String.fromCharCode(65 + index), // A, B, C, etc.
              templateId: variant.templateId || null,
              customMessage: variant.customMessage || null,
              allocationPercentage: variant.allocationPercentage,
            },
          });
        })
      );

      // Normalize recipients to objects with phoneNumber and name
      const normalizedRecipients = recipients.map(recipient => {
        if (typeof recipient === 'string') {
          return { phoneNumber: recipient, name: null };
        } else if (typeof recipient === 'object') {
          return {
            phoneNumber: recipient.phoneNumber,
            name: recipient.name || null
          };
        }
        return { phoneNumber: '', name: null };
      });

      // Assign recipients to variants based on allocation
      const recipientAssignments = [];
      let recipientIndex = 0;

      for (const variant of createdVariants) {
        const variantRecipientCount = Math.floor(
          (variant.allocationPercentage / 100) * normalizedRecipients.length
        );

        for (let i = 0; i < variantRecipientCount && recipientIndex < normalizedRecipients.length; i++) {
          const recipient = normalizedRecipients[recipientIndex];
          recipientAssignments.push({
            experimentId: newExperiment.id,
            variantId: variant.id,
            phoneNumber: recipient.phoneNumber,
            name: recipient.name,
          });
          recipientIndex++;
        }
      }

      // Assign any remaining recipients to the first variant
      while (recipientIndex < normalizedRecipients.length) {
        const recipient = normalizedRecipients[recipientIndex];
        recipientAssignments.push({
          experimentId: newExperiment.id,
          variantId: createdVariants[0].id,
          phoneNumber: recipient.phoneNumber,
          name: recipient.name,
        });
        recipientIndex++;
      }

      // Create recipient assignments
      await tx.aBRecipient.createMany({
        data: recipientAssignments,
      });

      return newExperiment;
    });

    // Fetch the complete experiment with relations
    const completeExperiment = await prisma.aBExperiment.findUnique({
      where: { id: experiment.id },
      include: {
        variants: {
          include: {
            template: { select: { id: true, name: true } },
            _count: { select: { recipients: true } }
          }
        },
        _count: {
          select: { recipients: true }
        }
      },
    });

    return NextResponse.json(completeExperiment, { status: 201 });
  } catch (error) {
    console.error("Error creating A/B experiment:", error);
    return NextResponse.json(
      { error: "Failed to create experiment" },
      { status: 500 }
    );
  }
}