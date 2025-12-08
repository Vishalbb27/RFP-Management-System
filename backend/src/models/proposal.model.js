const mongoose = require("mongoose");

const PriceBreakdownSchema = new mongoose.Schema(
  {
    itemName: { type: String },
    quantity: { type: Number },
    unitPrice: { type: Number },
    subtotal: { type: Number },
  },
  { _id: false }
);

const ProposalSchema = new mongoose.Schema(
  {
    rfpId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RFP",
      required: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    rawEmailBody: { type: String },
    rawAttachments: [
      {
        filename: String,
        mimeType: String,
        content: Buffer, 
      },
    ],

    parsedData: {
      pricing: {
        totalPrice: { type: Number },
        currency: { type: String, default: "USD" },
        breakdown: [PriceBreakdownSchema],
        discounts: { type: String },
      },
      deliveryDetails: {
        estimatedDate: { type: Date },
        leadTime: { type: String },
        shippingCost: { type: Number },
        conditions: { type: String },
      },
      terms: {
        paymentTerms: { type: String },
        warranty: { type: String },
        supportLevel: { type: String },
        sla: { type: String },
      },
      compliance: {
        specsMatched: [String],
        specsNotMatched: [String],
        additionalOfferings: [String],
      },
      summaryByAI: { type: String },
    },

    scoredByAI: {
      priceScore: { type: Number },
      deliveryScore: { type: Number },
      complianceScore: { type: Number },
      supportScore: { type: Number },
      overall: { type: Number },
      reasoning: { type: String },
    },

    status: {
      type: String,
      enum: ["received", "parsed", "evaluated", "selected", "rejected"],
      default: "received",
    },

    receivedAt: { type: Date },
    parsedAt: { type: Date },
  },
  { timestamps: true }
);

ProposalSchema.index({ rfpId: 1, vendorId: 1 }, { unique: true });
ProposalSchema.index({ rfpId: 1 });
ProposalSchema.index({ status: 1 });
ProposalSchema.index({ receivedAt: -1 });

module.exports = mongoose.model("Proposal", ProposalSchema);
