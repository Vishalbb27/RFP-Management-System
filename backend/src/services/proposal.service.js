const Proposal = require("../models/proposal.model");
const Vendor = require("../models/vendor.model");
const emailService = require("./email.service");
const RFP = require("../models/rfp.model");

const { Ollama } = require("ollama");

const ollama = new Ollama({
  host: process.env.OLLAMA_HOST || "https://ollama.com",
  headers: {
    Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
  },
});

class ProposalService {
  async createFromEmail(emailData, rfpId, vendorId) {
    try {
      console.log(`Creating proposal for RFP ${rfpId}`);

      const { parsedData } = await this.parseVendorEmailToProposal(
        vendorId || "",
        emailData.text || emailData.html || "",
        emailData.attachments || []
      );

      const RFP = require("../models/rfp.model");
      const rfp = await RFP.findById(rfpId);
      if (!rfp) throw new Error(`RFP ${rfpId} not found`);

      const scores = await this.scoreProposal(rfp, { parsedData });

      const proposal = await this.createProposal(
        rfpId,
        vendorId,
        emailData.text || emailData.html || "",
        emailData.attachments || [],
        parsedData
      );

      proposal.scoredByAI = scores;
      proposal.status = "evaluated";
      await proposal.save();

      rfp.proposals = rfp.proposals || [];
      if (!rfp.proposals.includes(proposal._id)) {
        rfp.proposals.push(proposal._id);
        rfp.status = "responses_received";
        await rfp.save();
      }

      const vendor = await Vendor.findById(vendorId);
      vendor.previousProposals = vendor.previousProposals || [];
      if (!vendor.previousProposals.includes(proposal._id)) {
        vendor.previousProposals.push(proposal._id);
        await vendor.save();
      }

      console.log(`✅ Proposal created & scored: ${scores.overall}`);
      return proposal;
    } catch (error) {
      console.error("createFromEmail failed:", error);
      throw error;
    }
  }

  async parseVendorEmailToProposal(vendorId, emailContent, attachments = []) {
    try {
      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        throw new Error(`Vendor not found for ID: ${vendorId}`);
      }

      const fullContent = await this.extractEmailContent(
        emailContent,
        attachments
      );

      const parsedData = await this.useAIToParseProposal(fullContent);

      return { vendor, parsedData };
    } catch (error) {
      console.error("Error parsing vendor email:", error);
      throw error;
    }
  }

  async extractEmailContent(emailContent, attachments) {
    let content = emailContent;

    for (const attachment of attachments) {
      content += `\n\n[Attachment: ${attachment.filename}]`;
      if (attachment.contentType.includes("text")) {
        content += `\n${attachment.content}`;
      }
    }

    return content;
  }

  async useAIToParseProposal(emailContent) {
    const systemPrompt = `
You are an expert at parsing vendor proposals from unstructured emails.
Extract all relevant information into structured JSON.

Return ONLY valid JSON with this structure:
{
  "pricing": {
    "breakdown": [
      { "itemName": "string", "quantity": number, "unitPrice": number, "subtotal": number }
    ],
    "totalPrice": number,
    "discounts": "string or null",
    "currency": "USD"
  },
  "deliveryDetails": {
    "estimatedDate": "YYYY-MM-DD or null",
    "leadTime": "string (e.g., '3 weeks')",
    "shippingCost": number or null,
    "conditions": "string"
  },
  "terms": {
    "paymentTerms": "string (e.g., 'Net 30')",
    "warranty": "string (e.g., '24 months')",
    "supportLevel": "string (e.g., '24/7 support')",
    "sla": "string or null"
  },
  "compliance": {
    "specsMatched": ["array of matched specs"],
    "specsNotMatched": ["array of unmatched specs"],
    "additionalOfferings": ["extra features offered"]
  }
}
`;

    const userPrompt = `Parse this vendor proposal email:\n\n${emailContent}`;

    const response = await ollama.chat({
      model: process.env.LLM_MODEL || "llama3.1",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: false,
    });

    try {
      const jsonString = response.message.content.trim();
      return JSON.parse(jsonString);
    } catch (error) {
      console.error("Failed to parse LLM response:", error);
      throw new Error("Failed to parse proposal data");
    }
  }

  async scoreProposal(rfp, proposal) {
    const priceScore = this.clamp(
      this.calculatePriceScore(
        proposal.parsedData.pricing.totalPrice,
        rfp.specifications.budget.total
      )
    );

    const deliveryScore = this.clamp(
      this.calculateDeliveryScore(
        proposal.parsedData.deliveryDetails,
        rfp.specifications.deliveryTerms
      )
    );

    const complianceScore = this.clamp(
      this.calculateComplianceScore(
        proposal.parsedData.compliance,
        rfp.specifications.items
      )
    );

    const supportScore = this.clamp(
      this.calculateSupportScore(proposal.parsedData.terms)
    );

    const overallScore = this.clamp(
      priceScore * 0.3 +
        deliveryScore * 0.25 +
        complianceScore * 0.35 +
        supportScore * 0.1
    );

    return {
      priceScore: Math.round(priceScore),
      deliveryScore: Math.round(deliveryScore),
      complianceScore: Math.round(complianceScore),
      supportScore: Math.round(supportScore),
      overall: Math.round(overallScore),
      reasoning: `Price: ${Math.round(priceScore)}/100 | Delivery: ${Math.round(
        deliveryScore
      )}/100 | Compliance: ${Math.round(
        complianceScore
      )}/100 | Support: ${Math.round(supportScore)}/100`,
    };
  }

  async createProposal(
    rfpId,
    vendorId,
    rawEmailBody,
    rawAttachments,
    parsedData
  ) {
    const proposal = new Proposal({
      rfpId,
      vendorId,
      rawEmailBody,
      rawAttachments,
      parsedData,
      status: "parsed",
      receivedAt: new Date(),
    });

    await proposal.save();
    return proposal;
  }

  async getProposalsByRFP(rfpId) {
    return Proposal.find({ rfpId })
      .populate("vendorId", "name email")
      .sort({ receivedAt: -1 });
  }
}

module.exports = new ProposalService();
