require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
console.log('API key loaded:', !!apiKey);

if (apiKey) {
  console.log('API key starts with:', apiKey.substring(0, 10) + '...');
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    console.log('Model created successfully');
  } catch (error) {
    console.error('Error creating model:', error.message);
  }
} else {
  console.log('No API key found');
}