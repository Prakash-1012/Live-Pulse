const Response = require("../models/Response");
const Question = require("../models/Question");

exports.submitResponse = async (req, res) => {
  try {
    const { sessionCode, questionId, answer, userId, userName } = req.body;

    if (!sessionCode || !questionId || !answer) {
      return res.status(400).json({ message: "Session code, questionId and answer are required" });
    }

    // Fetch the question to get the correct answer
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Validate if the answer is correct (case-insensitive)
    const isCorrect = question.correctAnswer && 
                      answer.toLowerCase() === question.correctAnswer.toLowerCase();

    const response = await Response.create({
      sessionCode,
      questionId,
      userId: userId || "anonymous",
      userName: userName || "Anonymous User",
      answer,
      isCorrect,
    });

    res.json({ ...response.toObject(), isCorrect });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to submit response" });
  }
};

exports.getResults = async (req, res) => {
  try {
    const { questionId } = req.params;

    // Fetch the question to get the correct answer
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Get all responses for this question
    const allResponses = await Response.find({ questionId });

    // Calculate accuracy metrics
    const totalResponses = allResponses.length;
    const correctResponses = allResponses.filter(r => r.isCorrect).length;
    const accuracy = totalResponses > 0 ? ((correctResponses / totalResponses) * 100).toFixed(2) : 0;

    // Group responses by answer with correctness info
    const results = await Response.aggregate([
      { $match: { questionId: questionId } },
      { 
        $group: { 
          _id: "$answer", 
          count: { $sum: 1 },
          isCorrect: { $first: "$isCorrect" },
          correctCount: { 
            $sum: { 
              $cond: [{ $eq: ["$isCorrect", true] }, 1, 0] 
            } 
          }
        } 
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      correctAnswer: question.correctAnswer,
      totalResponses,
      correctResponses,
      accuracy: `${accuracy}%`,
      results,
      allResponses: allResponses.map(r => ({
        userName: r.userName,
        answer: r.answer,
        isCorrect: r.isCorrect
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load results" });
  }
};
