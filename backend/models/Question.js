const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  sessionCode: String,
  questionText: String,
  options: [String],
  type: String,
}, { timestamps: true });

module.exports = mongoose.model("Question",questionSchema);