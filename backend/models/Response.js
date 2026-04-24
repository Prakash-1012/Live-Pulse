const mongoose = require("mongoose");

const responseSchema = new mongoose.Schema({
  sessionCode: String,
  questionId: String,
  answer: String,
}, { timestamps: true });

module.exports = mongoose.model("Response",responseSchema);