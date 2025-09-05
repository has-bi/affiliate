// src/app/api/reports/campaigns/route.js
import messageHistory from "@/lib/services/messageHistory";
import { createLogger } from "@/lib/utils";

const logger = createLogger("[API][Reports][Campaigns]");

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const session = searchParams.get('session');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')) : 50;

    const filters = {};
    if (status) filters.status = status;
    if (type) filters.type = type;
    if (session) filters.session = session;
    filters.limit = limit;

    const campaigns = messageHistory.getCampaigns(filters);

    return Response.json({
      success: true,
      campaigns: campaigns,
      total: campaigns.length
    });

  } catch (error) {
    logger.error("Failed to get campaigns:", error);
    return Response.json(
      { error: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    
    const campaignId = messageHistory.createCampaign({
      name: body.name,
      type: body.type,
      session: body.session,
      message: body.message,
      imageUrl: body.imageUrl,
      templateId: body.templateId,
      templateName: body.templateName,
      jobId: body.jobId,
      totalRecipients: body.totalRecipients,
      metadata: body.metadata
    });

    const campaign = messageHistory.getCampaign(campaignId);

    return Response.json({
      success: true,
      campaignId: campaignId,
      campaign: campaign
    });

  } catch (error) {
    logger.error("Failed to create campaign:", error);
    return Response.json(
      { error: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}