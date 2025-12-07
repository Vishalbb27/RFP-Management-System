const {Ollama} = require("ollama");
const RFP = require("../models/rfp.model");

const ollama = new Ollama({
  host: process.env.OLLAMA_HOST || 'https://ollama.com',
  headers: { 
    Authorization: `Bearer ${process.env.OLLAMA_API_KEY}` 
  },
});

class RFPService {
  async createFromNaturalLanguage(userInput) {
    try {
      const structuredData = await this.parseNaturalLanguageToJSON(userInput);

      const rfp = new RFP({
        title: structuredData.title || "Procurement Request",
        description: userInput,
        specifications: structuredData,
        status: "draft",
      });

      await rfp.save();
      return rfp;
    } catch (err) {
      console.error("Error creating RFP:", err);
      throw err;
    }
  }

  async parseNaturalLanguageToJSON(userInput) {
    const systemPrompt = `
You are an expert procurement assistant. Parse the user's natural language input 
into structured JSON for an RFP.

Return ONLY valid JSON, no explanations.
{
  "title": "Short title",
  "items": [
    {
      "name": "Product name",
      "quantity": number,
      "specs": { "key": "value" }
    }
  ],
  "budget": { "total": number, "currency": "USD" },
  "deliveryTerms": {
    "deadline": "YYYY-MM-DD",
    "leadTimeDays": number,
    "location": "delivery location"
  },
  "paymentTerms": { "netDays": number, "milestone": "payment milestone" },
  "warranty": { "period": number, "coverage": "coverage description" }
}
`;

    const userPrompt = `Parse this procurement request: "${userInput}"`;

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
      const structuredData = JSON.parse(jsonString);
      return structuredData;
    } catch (err) {
      console.error("Failed to parse JSON:", err);
      throw new Error(
        "Failed to structure the RFP from your input. Try again."
      );
    }
  }

  async getRFPs(filter = {}) {
    return RFP.find(filter).sort({ createdAt: -1 });
  }

  async getRFPById(id) {
    return RFP.findById(id).populate("vendors").populate("proposals");
  }

  async updateRFPVendors(id, vendorIds) {
    return RFP.findByIdAndUpdate(
      id,
      { $set: { vendors: vendorIds, status: "sent" } },
      { new: true }
    );
  }
}

module.exports = new RFPService();
