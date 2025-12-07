const mongoose = require("mongoose");

const VendorEvaluationSchema = new mongoose.Schema(
  {
    rfpId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RFP",
    },
    score: { type: Number },
    feedback: { type: String },
  },
  { _id: false }
);

const VendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    contactPerson: { type: String },
    phone: { type: String },
    address: { type: String },
    previousProposals: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Proposal",
      },
    ],

    evaluationHistory: [VendorEvaluationSchema],

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

VendorSchema.index({ email: 1 }, { unique: true });
VendorSchema.index({ status: 1 });

module.exports = mongoose.model("Vendor", VendorSchema);
