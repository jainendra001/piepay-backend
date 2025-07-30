const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({
  adjustmentId: { type: String, unique: true },
  summary: String,
  banks: [String],
  paymentInstruments: [String],
  image: String,
  type: String,
  // New fields for structured data
  flatDiscount: { type: Number, default: 0 },
  percentDiscount: { type: Number, default: 0 },
  maxCap: { type: Number, default: 0 },
  minOrderValue: { type: Number, default: 0 },
});

module.exports = mongoose.model("Offer", offerSchema);
