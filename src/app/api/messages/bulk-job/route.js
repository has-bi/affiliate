// src/app/api/messages/bulk-job/route.js
import jobQueue from "@/lib/services/jobQueue";
import { createLogger } from "@/lib/utils";
import { formatPhoneNumber } from "@/lib/utils";
import { formatPhoneNumbers, validateAndFormatPhone } from "@/lib/utils/phoneValidator";

const logger = createLogger("[API][BulkJob]");

export async function POST(req) {
  try {
    const body = await req.json();
    logger.info("Bulk job request received:", { 
      recipientCount: body.recipients?.length,
      hasMessage: !!body.message 
    });

    // Validate required fields
    if (!body.recipients || !Array.isArray(body.recipients) || body.recipients.length === 0) {
      return Response.json(
        { error: "Recipients array is required and cannot be empty" },
        { status: 400 }
      );
    }

    if (!body.message) {
      return Response.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Format and validate phone numbers
    let formattedRecipients = { valid: [], invalid: [] };
    
    try {
      if (Array.isArray(body.recipients)) {
        const seenNumbers = new Set();
        
        body.recipients.forEach((phone) => {
          if (!phone || typeof phone !== 'string') {
            formattedRecipients.invalid.push({
              input: phone || '',
              error: 'Invalid phone number input'
            });
            return;
          }

          const result = validateAndFormatPhone(phone);
          
          if (result.isValid) {
            // Check for duplicates
            if (seenNumbers.has(result.cleanNumber)) {
              formattedRecipients.invalid.push({
                input: phone,
                error: 'Duplicate number'
              });
            } else {
              seenNumbers.add(result.cleanNumber);
              formattedRecipients.valid.push(result.formatted);
            }
          } else {
            formattedRecipients.invalid.push({
              input: phone,
              error: result.error
            });
          }
        });
      }
      
      logger.info(`Formatted ${formattedRecipients.valid.length} valid phone numbers`);
      
      if (formattedRecipients.invalid.length > 0) {
        logger.warn(`Found ${formattedRecipients.invalid.length} invalid phone numbers`);
      }
    } catch (error) {
      logger.error("Phone number formatting failed:", error);
      return Response.json(
        { error: "Failed to validate phone numbers: " + error.message },
        { status: 400 }
      );
    }

    if (formattedRecipients.valid.length === 0) {
      return Response.json(
        { 
          error: "No valid phone numbers found",
          invalidNumbers: formattedRecipients.invalid
        },
        { status: 400 }
      );
    }

    // Create job options
    const jobOptions = {
      session: body.session || 'youvit',
      delay: body.delay || 8000,
      imageUrl: body.imageUrl || null,
      templateName: body.templateName || 'Manual broadcast'
    };

    // Create the job
    const jobId = jobQueue.createJob(
      formattedRecipients.valid,
      body.message,
      jobOptions
    );

    logger.info(`Created bulk job ${jobId} with ${formattedRecipients.valid.length} recipients`);

    // Return job details
    return Response.json({
      success: true,
      jobId: jobId,
      recipients: {
        total: body.recipients.length,
        valid: formattedRecipients.valid.length,
        invalid: formattedRecipients.invalid.length,
        invalidNumbers: formattedRecipients.invalid
      },
      estimatedDuration: Math.ceil(formattedRecipients.valid.length * jobOptions.delay / 1000 / 60), // minutes
      message: `Bulk message job created successfully. ${formattedRecipients.valid.length} messages will be sent.`
    });

  } catch (error) {
    logger.error("Bulk job creation failed:", error);
    return Response.json(
      { error: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (jobId) {
      // Get specific job
      const job = jobQueue.getJob(jobId);
      if (!job) {
        return Response.json(
          { error: "Job not found" },
          { status: 404 }
        );
      }

      return Response.json({
        success: true,
        job: {
          id: job.id,
          status: job.status,
          progress: job.progress,
          createdAt: job.createdAt,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
          error: job.error,
          results: job.results
        }
      });
    } else {
      // Get all jobs
      const jobs = jobQueue.getAllJobs();
      return Response.json({
        success: true,
        jobs: jobs.map(job => ({
          id: job.id,
          status: job.status,
          progress: job.progress,
          createdAt: job.createdAt,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
          error: job.error
        }))
      });
    }
  } catch (error) {
    logger.error("Failed to get job status:", error);
    return Response.json(
      { error: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return Response.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    const success = jobQueue.cancelJob(jobId);
    
    if (success) {
      return Response.json({
        success: true,
        message: `Job ${jobId} cancelled successfully`
      });
    } else {
      return Response.json(
        { error: "Job not found or cannot be cancelled" },
        { status: 400 }
      );
    }
  } catch (error) {
    logger.error("Failed to cancel job:", error);
    return Response.json(
      { error: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}