const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY is not set');
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(apiKey);

async function test() {
  const modelsToTry = [
    'gemini-flash-latest',
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
  ];

  for (const modelName of modelsToTry) {
    try {
      console.log(`Testing ${modelName}...`);
      let model = genAI.getGenerativeModel({ model: modelName });
      let result = await model.generateContent('Hello');
      console.log(`✓ ${modelName} works`);
    } catch (e) {
      console.log(`✗ ${modelName} failed:`, e.message.split('\n')[0]);
    }
  }
}

test();
