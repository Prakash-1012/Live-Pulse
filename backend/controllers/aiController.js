const genAI = require("../config/gemini");
const JSZip = require("jszip");

async function extractTextFromPptx(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files).filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name));

  const textBlocks = [];

  for (const slideFile of slideFiles) {
    const xml = await zip.file(slideFile).async("text");
    const matches = [...xml.matchAll(/<a:t[^>]*>([^<]*)<\/a:t>/g)];
    const slideText = matches.map((match) => match[1]).join(" ").trim();

    if (slideText) {
      textBlocks.push(slideText);
    }
  }

  return textBlocks.join("\n\n");
}

function buildPromptFromTopic(topic) {
  return `Generate 5 quiz questions about ${topic}. Return valid JSON as an array of objects with keys: question (string), options (array of strings), type (string, either "MCQ" or "Yes/No"), and correctAnswer (string - must be one of the options provided).

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
}

function buildPromptFromPptText(slideText, userPrompt = "", numQuestions = 8) {
  const header = `Generate ${numQuestions} quiz questions based on the following PowerPoint presentation content. Use the slide text as your source material and return valid JSON as an array of objects with keys: question (string), options (array of strings), type (string, either "MCQ" or "Yes/No"), and correctAnswer (string - must be one of the options provided).`;

  const promptParts = [header];

  if (userPrompt && userPrompt.trim()) {
    promptParts.push(`User instructions: ${userPrompt.trim()}`);
  }

  promptParts.push(`\nPresentation text:\n${slideText}\n\nIMPORTANT: correctAnswer MUST be exactly one of the options in the options array.`);

  return promptParts.join("\n\n");
}

function parseNumFromPrompt(promptText) {
  if (!promptText) return null;
  // look for explicit mentions like '12 questions' or 'generate 12 questions'
  const m = promptText.match(/(\d+)\s*(?:questions|question|qs|q)\b/i);
  if (m) return parseInt(m[1], 10);
  const m2 = promptText.match(/generate\s+(\d+)\b/i);
  if (m2) return parseInt(m2[1], 10);
  return null;
}

async function sendPromptToGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("AI service not configured");
  }

  const modelName = process.env.GEMINI_MODEL || "gemini-flash-latest";
  const model = genAI.getGenerativeModel({ model: modelName });
  let text = null;
  let attempt = 0;
  const maxAttempts = 3;

  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      const result = await model.generateContent(prompt);

      if (result && result.response && typeof result.response.text === "function") {
        text = await result.response.text();
      } else if (result && result.output && Array.isArray(result.output) && result.output[0] && result.output[0].content) {
        const content = result.output[0].content[0];
        text = (content && (content.text || content["@type"] && JSON.stringify(content))) || JSON.stringify(result);
      } else {
        text = typeof result === "string" ? result : JSON.stringify(result);
      }

      break;
    } catch (e) {
      if (attempt >= maxAttempts) throw e;
      await new Promise((res) => setTimeout(res, 1000 * Math.pow(2, attempt - 1)));
    }
  }

  return text;
}

async function parseQuizResponse(text) {
  let quiz;
  try {
    const cleanedText = text.replace(/```json\s*|\s*```/g, "").trim();
    quiz = JSON.parse(cleanedText);
  } catch (parseError) {
    throw new Error("AI generated invalid response format");
  }

  if (!Array.isArray(quiz)) {
    throw new Error("AI generated invalid quiz format");
  }

  return quiz.map((q, index) => {
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
}

function handleAIErrors(res, error, fallbackMessage) {
  if (error.message === "AI service not configured") {
    return res.status(500).json({ message: "AI service not configured" });
  }

  if (error.message === "AI generated invalid response format" || error.message === "AI generated invalid quiz format") {
    return res.status(500).json({ message: "AI generated invalid response format" });
  }

  if (error.status === 429 || (error.message && error.message.includes("Too Many Requests"))) {
    return res.status(429).json({ message: "AI service quota exceeded" });
  }

  if (error.status === 503 || (error.message && error.message.includes("Service Unavailable"))) {
    return res.status(503).json({ message: "AI service unavailable" });
  }

  if (error.status === 403 || (error.message && error.message.includes("denied access"))) {
    return res.status(403).json({ message: "AI service access denied" });
  }

  return res.status(500).json({ message: fallbackMessage, details: error.message || "Unknown error" });
}

exports.generateQuiz = async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({ message: "Topic is required" });
    }

    const prompt = buildPromptFromTopic(topic);
    const text = await sendPromptToGemini(prompt);
    const validatedQuiz = await parseQuizResponse(text);

    return res.json({ quiz: validatedQuiz });
  } catch (error) {
    console.error("AI generation error:", error);
    return handleAIErrors(res, error, "Failed to generate quiz");
  }
};

exports.uploadQuiz = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: "PowerPoint file is required" });
    }

    const slideText = await extractTextFromPptx(req.file.buffer);
    if (!slideText) {
      return res.status(400).json({ message: "Could not extract text from the uploaded PowerPoint" });
    }

    // allow optional prompt from the multipart form; parse requested count from prompt
    const userPrompt = (req.body && (req.body.prompt || "")) || "";
    const parsedNum = parseNumFromPrompt(userPrompt);
    const numQuestions = parsedNum && Number.isFinite(parsedNum) ? parsedNum : 8;

    // Some models may effectively cap sensible outputs per call (observed ~8).
    // If user requests more than CHUNK_SIZE, generate in batches and combine.
    const CHUNK_SIZE = 8;
    const combined = [];

    let remaining = numQuestions;
    let attempts = 0;

    while (remaining > 0 && attempts < 10) {
      attempts += 1;
      const chunkSize = Math.min(CHUNK_SIZE, remaining);

      // Provide previously generated questions to avoid duplicates.
      const previousQuestionsText = combined.map((q) => q.question).join("\n");

      let chunkPrompt = buildPromptFromPptText(slideText, userPrompt, chunkSize);
      if (combined.length > 0) {
        chunkPrompt += `\n\nPreviously generated questions (do not repeat):\n${previousQuestionsText}`;
      }

      console.debug("uploadQuiz: requesting chunkSize=", chunkSize, "remaining=", remaining);
      const text = await sendPromptToGemini(chunkPrompt);

      let chunkQuiz;
      try {
        chunkQuiz = await parseQuizResponse(text);
      } catch (e) {
        console.warn("uploadQuiz: failed to parse chunk response", e.message || e);
        break;
      }

      // Append unique questions only
      for (const q of chunkQuiz) {
        if (combined.length >= numQuestions) break;
        const already = combined.find((ex) => ex.question.trim() === q.question.trim());
        if (!already) combined.push(q);
      }

      remaining = numQuestions - combined.length;

      // Safety: if the chunk didn't add new items, stop to avoid infinite loop
      if (chunkQuiz.length === 0 || combined.length > 0 && chunkQuiz.every((q) => combined.find((ex) => ex.question.trim() === q.question.trim()))) {
        console.warn("uploadQuiz: chunk produced no new unique questions — stopping");
        break;
      }
    }

    // Trim to requested size
    const finalQuiz = combined.slice(0, numQuestions);

    return res.json({ quiz: finalQuiz });
  } catch (error) {
    console.error("AI upload quiz error:", error);
    return handleAIErrors(res, error, "Failed to generate quiz from uploaded file");
  }
};