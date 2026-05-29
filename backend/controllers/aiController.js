const genAI = require("../config/gemini");

exports.generateQuiz = async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({ message: "Topic is required" });
    }

    // Check if API key is available
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Gemini API key not found in environment variables");
      return res.status(500).json({ message: "AI service not configured" });
    }

    console.log("Generating quiz for topic:", topic);

    const modelName = process.env.GEMINI_MODEL || "gemini-flash-latest";
    console.log("Using Gemini model:", modelName);

    const model = genAI.getGenerativeModel({
      model: modelName,
    });

    const prompt = `Generate 5 quiz questions about ${topic}. Return valid JSON as an array of objects with keys: question (string), options (array of strings), type (string, either "MCQ" or "Yes/No"), and correctAnswer (string - must be one of the options provided).

Example format:
[
  {
    "question": "What is the capital of France?",
    "options": ["Paris", "London", "Berlin", "Madrid"],
    "type": "MCQ",
    "correctAnswer": "Paris"
  },
  {
    "question": "Is the Earth round?",
    "options": ["Yes", "No"],
    "type": "Yes/No",
    "correctAnswer": "Yes"
  }
]

IMPORTANT: correctAnswer MUST be exactly one of the options in the options array.`;

    console.log("Sending prompt to Gemini API");
    const result = await model.generateContent(prompt);
    const text = await result.response.text();

    console.log("Gemini API response:", text);

    let quiz;

    try {
      // Clean up the response - remove markdown code blocks if present
      const cleanedText = text.replace(/```json\s*|\s*```/g, '').trim();
      quiz = JSON.parse(cleanedText);
      console.log("Parsed quiz successfully:", quiz);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw response:", text);
      return res.status(500).json({
        message: "AI generated invalid response format",
        details: "The AI service returned a response that couldn't be parsed as JSON"
      });
    }

    if (!Array.isArray(quiz)) {
      console.error("Quiz is not an array:", quiz);
      return res.status(500).json({
        message: "AI generated invalid quiz format",
        details: "Expected an array of questions"
      });
    }

    // Validate and ensure all questions have correct answers
    const validatedQuiz = quiz.map((q, index) => {
      if (!q.question) {
        throw new Error(`Question ${index + 1} missing 'question' field`);
      }
      if (!Array.isArray(q.options) || q.options.length === 0) {
        throw new Error(`Question ${index + 1} missing or empty 'options' field`);
      }
      if (!q.type) {
        throw new Error(`Question ${index + 1} missing 'type' field`);
      }
      if (!q.correctAnswer) {
        throw new Error(`Question ${index + 1} missing 'correctAnswer' field`);
      }

      // Verify correctAnswer is one of the options
      if (!q.options.includes(q.correctAnswer)) {
        console.warn(`Warning: Question ${index + 1} correctAnswer "${q.correctAnswer}" not in options. Using first option as default.`);
        q.correctAnswer = q.options[0];
      }

      return {
        question: q.question,
        options: q.options,
        type: q.type,
        correctAnswer: q.correctAnswer,
      };
    });

    res.json({ quiz: validatedQuiz });
  } catch (error) {
    console.error("AI generation error:", error);

    // Handle specific Gemini API errors
    if (error.code === 'API_KEY_INVALID') {
      return res.status(500).json({ message: "AI service authentication failed" });
    }

    if (error.status === 429 || (error.message && error.message.includes('Too Many Requests'))) {
      return res.status(429).json({
        message: "AI service quota exceeded",
        details: "Your Gemini API key has reached its quota limit. Please check billing or use a different key."
      });
    }

    if (error.status === 503 || (error.message && error.message.includes('Service Unavailable'))) {
      return res.status(503).json({
        message: "AI service unavailable",
        details: "Gemini is temporarily overloaded. Please try again in a few moments."
      });
    }

    if (error.status === 403 || (error.message && error.message.includes('denied access'))) {
      return res.status(403).json({
        message: "AI service access denied",
        details: "Your Gemini account or project does not have access to the requested model."
      });
    }

    if (error.message && error.message.includes('API_KEY')) {
      return res.status(500).json({ message: "AI service configuration error" });
    }

    res.status(500).json({
      message: "Failed to generate quiz",
      details: error.message || "Unknown error"
    });
  }
};
