const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is not set");
  process.exit(1);
}

const client = new GoogleGenerativeAI(apiKey);

async function listModels() {
  try {
    const models = await client.listModels();
    console.log("Available models:");
    models.models.forEach((model) => {
      console.log(`- ${model.name} (display name: ${model.displayName})`);
    });
  } catch (error) {
    console.error("Error listing models:", error.message);
  }
}

listModels();
