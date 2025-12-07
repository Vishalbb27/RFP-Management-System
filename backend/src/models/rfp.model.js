const mongoose = require("mongoose");

const ItemSpecSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    specs: { type: mongoose.Schema.Types.Mixed }, 
  },
  { _id: false }
);

const RfpSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    specifications: {
      items: [ItemSpecSchema],
      budget: {
        total: { type: Number },
        currency: { type: String, default: "USD" },
        allocation: { type: mongoose.Schema.Types.Mixed },
      },
      deliveryTerms: {
        deadline: { type: Date },
        location: { type: String },
        leadTimeDays: { type: Number },
        conditions: { type: String },
      },
      paymentTerms: {
        netDays: { type: Number },
        milestone: { type: String },
      },
      warranty: {
        period: { type: Number }, 
        coverage: { type: String },
      },
    },

    vendors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vendor",
      },
    ],

    proposals: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Proposal",
      },
    ],

    status: {
      type: String,
      enum: ["draft", "sent", "responses_received", "evaluated"],
      default: "draft",
    },

    createdBy: { type: String }, 
  },
  { timestamps: true }
);

RfpSchema.index({ createdAt: -1 });
RfpSchema.index({ status: 1 });

module.exports = mongoose.model("RFP", RfpSchema);
