const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({
  adjustmentId: { type: String, unique: true },
  summary: String,
  banks: [String],
  paymentInstruments: [String],
  image: String,
  type: String,
});

module.exports = mongoose.model("Offer", offerSchema);
