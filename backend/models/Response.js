const mongoose = require("mongoose");

const responseSchema = new mongoose.Schema({
  sessionCode: String,
  questionId: String,
  userId: String,
  userName: String,
  answer: String,
  isCorrect: Boolean,
}, { timestamps: true });

module.exports = mongoose.model("Response",responseSchema);