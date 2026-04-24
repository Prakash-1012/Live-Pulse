const Question = require("../models/Question");

exports.addQuestion = async (req, res) => {
  try {
    const { sessionCode, questionText, options, type, questions } = req.body;

    if (!sessionCode) {
      return res.status(400).json({ message: "Session code is required" });
    }

    if (Array.isArray(questions) && questions.length > 0) {
      const payload = questions.map((question) => ({
        sessionCode,
        questionText: question.text,
        options: question.options || [],
        type: question.type || "MCQ",
      }));

      const created = await Question.insertMany(payload);
      return res.json(created);
    }

    if (!questionText || !type) {
      return res.status(400).json({ message: "Question text and type are required" });
    }

    const question = await Question.create({
      sessionCode,
      questionText,
      options: Array.isArray(options) ? options : [],
      type,
    });

    res.json(question);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add question" });
  }
};

exports.getQuestions = async (req, res) => {
  try {
    const questions = await Question.find({ sessionCode: req.params.code });
    res.json(questions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load questions" });
  }
};
