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

    // Validate that each variant has recipients
    const variantsWithoutRecipients = variants.filter(variant => 
      !variant.recipients || variant.recipients.length === 0
    );

    if (variantsWithoutRecipients.length > 0) {
      return NextResponse.json(
        { 
          error: `The following variants need recipients: ${variantsWithoutRecipients.map(v => v.name).join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Validate recipients format in each variant
    for (const variant of variants) {
      const invalidRecipients = variant.recipients.filter(recipient => {
        if (typeof recipient === 'string') {
          return !recipient.trim();
        } else if (typeof recipient === 'object') {
          return !recipient.phoneNumber || !recipient.phoneNumber.trim();
        }
        return true;
      });

      if (invalidRecipients.length > 0) {
        return NextResponse.json(
          { error: `Invalid recipient format found in variant ${variant.name}` },
          { status: 400 }
        );
      }
    }

    // Calculate total recipients across all variants
    const totalRecipients = variants.reduce((sum, variant) => sum + variant.recipients.length, 0);

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
          totalRecipients,
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
              imageUrl: variant.imageUrl || null,
            },
          });
        })
      );

      // Assign recipients directly to their respective variants
      const recipientAssignments = [];
      
      for (let i = 0; i < createdVariants.length; i++) {
        const variant = createdVariants[i];
        const variantData = variants[i];
        
        // Normalize recipients for this variant
        const normalizedRecipients = variantData.recipients.map(recipient => {
          if (typeof recipient === 'string') {
            return { phoneNumber: recipient, name: null };
          } else if (typeof recipient === 'object') {
            return {
              phoneNumber: recipient.phoneNumber,
              name: recipient.name || null
            };
          }
          return { phoneNumber: recipient, name: null };
        });

        // Add all recipients for this variant
        for (const recipient of normalizedRecipients) {
          recipientAssignments.push({
            experimentId: newExperiment.id,
            variantId: variant.id,
            phoneNumber: recipient.phoneNumber,
            name: recipient.name,
          });
        }
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