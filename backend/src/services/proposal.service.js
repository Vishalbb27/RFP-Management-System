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
  /**
   * Parse vendor email response into structured proposal data
   */
  async createFromEmail(emailData, rfpId, vendorId) {
    try {
      console.log(`Creating proposal for RFP ${rfpId}`);

      // 1. ✅ Use YOUR parseVendorEmailToProposal()
      const { parsedData } = await this.parseVendorEmailToProposal(
        vendorId || "",
        emailData.text || emailData.html || "",
        emailData.attachments || []
      );

      // 2. Score proposal
      const RFP = require("../models/rfp.model");
      const rfp = await RFP.findById(rfpId);
      if (!rfp) throw new Error(`RFP ${rfpId} not found`);

      const scores = await this.scoreProposal(rfp, { parsedData });

      // 3. ✅ Use YOUR createProposal() method!
      const proposal = await this.createProposal(
        rfpId,
        vendorId,
        emailData.text || emailData.html || "",
        emailData.attachments || [],
        parsedData
      );

      // 4. Add scoring (update existing proposal)
      proposal.scoredByAI = scores;
      proposal.status = "evaluated";
      await proposal.save();

      // 5. Update RFP
      rfp.proposals = rfp.proposals || [];
      if (!rfp.proposals.includes(proposal._id)) {
        rfp.proposals.push(proposal._id);
        rfp.status = "responses_received";
        await rfp.save();
      }

      // 6. Update Vendor history
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
      // Find vendor by email
      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        throw new Error(`Vendor not found for ID: ${vendorId}`);
      }

      // Extract content from email and attachments
      const fullContent = await this.extractEmailContent(
        emailContent,
        attachments
      );

      // Use AI to parse the content
      const parsedData = await this.useAIToParseProposal(fullContent);

      return { vendor, parsedData };
    } catch (error) {
      console.error("Error parsing vendor email:", error);
      throw error;
    }
  }

  /**
   * Extract text from email and attachments
   */
  async extractEmailContent(emailContent, attachments) {
    let content = emailContent;

    // Add attachment file names and extracted text
    for (const attachment of attachments) {
      content += `\n\n[Attachment: ${attachment.filename}]`;
      if (attachment.contentType.includes("text")) {
        content += `\n${attachment.content}`;
      }
    }

    return content;
  }

  /**
   * Use AI to parse proposal from unstructured email content
   */
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

    // const response = await client.chat.completions.create({
    //   model: process.env.LLM_MODEL || 'gpt-4',
    //   messages: [
    //     { role: 'system', content: systemPrompt },
    //     { role: 'user', content: userPrompt }
    //   ],
    //   temperature: 0.1,
    //   max_tokens: 2000
    // });

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

  /**
   * Score a proposal against RFP requirements
   */
  async scoreProposal(rfp, proposal) {
    // Price score: lower is better (normalized against budget)
    const priceScore = this.calculatePriceScore(
      proposal.parsedData.pricing.totalPrice,
      rfp.specifications.budget.total
    );

    // Delivery score: meets deadline
    const deliveryScore = this.calculateDeliveryScore(
      proposal.parsedData.deliveryDetails,
      rfp.specifications.deliveryTerms
    );

    // Compliance score: specs matched
    const complianceScore = this.calculateComplianceScore(
      proposal.parsedData.compliance,
      rfp.specifications.items
    );

    // Support score
    const supportScore = this.calculateSupportScore(proposal.parsedData.terms);

    // Overall weighted score
    const overallScore =
      priceScore * 0.3 +
      deliveryScore * 0.25 +
      complianceScore * 0.35 +
      supportScore * 0.1;

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

  calculatePriceScore(proposedPrice, budgetTotal) {
    if (proposedPrice > budgetTotal) return 30; // Way over budget
    if (proposedPrice === budgetTotal) return 70; // At budget
    return 100 - ((budgetTotal - proposedPrice) / budgetTotal) * 30; // Scaled based on savings
  }

  calculateDeliveryScore(deliveryDetails, deliveryTerms) {
    // Estimate delivery score based on lead time vs requirement
    const leadTimeDays = parseInt(deliveryDetails.leadTime) || 30;
    const requiredDays = deliveryTerms.leadTimeDays || 30;

    if (leadTimeDays <= requiredDays) return 100;
    if (leadTimeDays > requiredDays * 1.5) return 30;
    return 100 - ((leadTimeDays - requiredDays) / requiredDays) * 70;
  }

  calculateComplianceScore(compliance, requiredItems) {
    const totalSpecs = requiredItems.length;
    const matchedSpecs = compliance.specsMatched.length;
    return (matchedSpecs / totalSpecs) * 100;
  }

  calculateSupportScore(terms) {
    let score = 50;
    if (terms.warranty.includes("24") || terms.warranty.includes("24/7"))
      score += 30;
    if (terms.sla) score += 20;
    return Math.min(score, 100);
  }

  /**
   * Create proposal record in database
   */
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

  /**
   * Get all proposals for an RFP
   */
  async getProposalsByRFP(rfpId) {
    return Proposal.find({ rfpId })
      .populate("vendorId", "name email")
      .sort({ receivedAt: -1 });
  }
}

module.exports = new ProposalService();
