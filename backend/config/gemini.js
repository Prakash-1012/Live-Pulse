const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(apiKey);

module.exports = genAI;