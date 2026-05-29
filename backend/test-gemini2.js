const { GoogleGenerativeAI } = require('@google/generative-ai');
const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  console.error('NO API KEY');
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(apiKey);
const prompt = `Generate 5 quiz questions about make a quiz of 10 questions on javaScript basics. Return valid JSON as an array of objects with keys: question (string), options (array of strings), and type (string, either "MCQ" or "Yes/No").

Example format:
[
  {
    "question": "What is the capital of France?",
    "options": ["Paris", "London", "Berlin", "Madrid"],
    "type": "MCQ"
  },
  {
    "question": "Is the Earth round?",
    "options": ["Yes", "No"],
    "type": "Yes/No"
  }
]`;
(async () => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    const res = await model.generateContent(prompt);
    const text = await res.response.text();
    console.log('TEXT:', text);
  } catch (e) {
    console.error('ERROR:', e.message);
    if (e.response) {
      try { const body = await e.response.text(); console.error('BODY:', body); } catch (err) { console.error('BODY ERR', err); }
    }
  }
})();
