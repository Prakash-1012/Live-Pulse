const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  code: String,
  hostId: String,
  isActive: {
    type: Boolean,
    default: true,
  },
  currentQuestion: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model("Session",sessionSchema);