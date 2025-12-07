const {Ollama} = require('ollama');
const Proposal = require('../models/proposal.model');
const RFP = require('../models/rfp.model');

const ollama = new Ollama({
  host: process.env.OLLAMA_HOST || 'https://ollama.com',
  headers: { 
    Authorization: `Bearer ${process.env.OLLAMA_API_KEY}` 
  },
});

class ComparisonService {
  /**
   * Generate AI-powered comparison and recommendation
   */
  async compareAndRecommend(rfpId) {
    try {
      // Fetch RFP and all proposals
      const rfp = await RFP.findById(rfpId);
      const proposals = await Proposal.find({ rfpId }).populate('vendorId');

      if (!proposals || proposals.length === 0) {
        throw new Error('No proposals found for this RFP');
      }

      // Score each proposal
      const scoredProposals = proposals.map(proposal => ({
        vendor: proposal.vendorId,
        proposal,
        scores: proposal.scoredByAI || {}
      }));

      // Use AI to generate detailed recommendation
      const recommendation = await this.generateRecommendation(rfp, scoredProposals);

      return {
        rfpId,
        totalProposals: scoredProposals.length,
        proposals: scoredProposals,
        recommendation,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error comparing proposals:', error);
      throw error;
    }
  }

  /**
   * Generate AI recommendation from scored proposals
   */
  async generateRecommendation(rfp, scoredProposals) {
    // Build context for AI
    const proposalSummaries = scoredProposals.map(sp => 
      this.buildProposalSummary(sp.vendor, sp.proposal, sp.scores)
    ).join('\n\n---\n\n');

    const systemPrompt = `
You are a procurement expert advisor. Analyze the vendor proposals and RFP requirements.
Provide a structured recommendation in JSON format.

Respond with ONLY valid JSON (no extra text):
{
  "recommendedVendor": "Vendor Name",
  "overallReasoning": "Detailed explanation of why this vendor is recommended",
  "keyStrengths": ["strength 1", "strength 2", "strength 3"],
  "riskFactors": ["risk 1", "risk 2"],
  "alternatives": [
    {
      "vendorName": "name",
      "whyConsider": "explanation"
    }
  ],
  "decision": "Executive summary for decision maker"
}
`;

    const userPrompt = `
RFP Requirements:
Budget: ${rfp.specifications.budget.total} ${rfp.specifications.budget.currency}
Delivery Required: ${rfp.specifications.deliveryTerms.deadline}
Key Items: ${rfp.specifications.items.map(i => i.name).join(', ')}

Vendor Proposals:
${proposalSummaries}

Based on the scores and details above, which vendor should we choose and why?
`;

    const response = await ollama.chat({
      model: process.env.LLM_MODEL || 'llama3.1',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      stream: false,
    });

    try {
      const jsonString = response.message.content.trim();
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Failed to parse recommendation JSON:', error);
      return {
        recommendedVendor: 'Unable to generate recommendation',
        overallReasoning: 'Error in AI analysis',
        keyStrengths: [],
        riskFactors: [],
        alternatives: []
      };
    }
  }

  /**
   * Build summary of a proposal for AI analysis
   */
  buildProposalSummary(vendor, proposal, scores) {
    const { pricing, deliveryDetails, terms, compliance } = proposal.parsedData;

    return `
**Vendor: ${vendor.name}** (${vendor.email})

Pricing:
- Total: ${pricing.currency} ${pricing.totalPrice?.toLocaleString() || 'N/A'}
- Breakdown: ${pricing.breakdown?.map(b => `${b.itemName} @ ${b.currency} ${b.unitPrice}/unit`).join(', ') || 'N/A'}
- Discounts: ${pricing.discounts || 'None'}

Delivery:
- Lead Time: ${deliveryDetails.leadTime || 'N/A'}
- Estimated Delivery: ${deliveryDetails.estimatedDate || 'N/A'}
- Shipping Cost: ${deliveryDetails.shippingCost || 'Included'}

Terms:
- Payment: ${terms.paymentTerms || 'Net 30'}
- Warranty: ${terms.warranty || '12 months'}
- Support: ${terms.supportLevel || 'Standard'}

Compliance:
- Specs Matched: ${compliance.specsMatched?.length || 0}
- Specs Not Matched: ${compliance.specsNotMatched?.join(', ') || 'None'}

Overall Score: ${scores.overall || 'N/A'}/100
`;
  }
}

module.exports = new ComparisonService();
