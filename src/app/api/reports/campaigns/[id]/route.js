// src/app/api/reports/campaigns/[id]/route.js
import messageHistory from "@/lib/services/messageHistory";
import { createLogger } from "@/lib/utils";

const logger = createLogger("[API][Reports][Campaign]");

export async function GET(req, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const includeMessages = searchParams.get('includeMessages') === 'true';
    const generateReport = searchParams.get('report') === 'true';

    const campaign = messageHistory.getCampaign(id);
    if (!campaign) {
      return Response.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    let response = { campaign };

    if (includeMessages) {
      response.messages = messageHistory.getCampaignMessages(id);
    }

    if (generateReport) {
      response.report = messageHistory.generateCampaignReport(id);
    }

    return Response.json({
      success: true,
      ...response
    });

  } catch (error) {
    logger.error("Failed to get campaign:", error);
    return Response.json(
      { error: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();

    const success = messageHistory.updateCampaign(id, body);
    
    if (!success) {
      return Response.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    const campaign = messageHistory.getCampaign(id);

    return Response.json({
      success: true,
      campaign: campaign
    });

  } catch (error) {
    logger.error("Failed to update campaign:", error);
    return Response.json(
      { error: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}