const Response = require("../models/Response");

exports.submitResponse = async (req, res) => {
  try {
    const { sessionCode, questionId, answer } = req.body;

    if (!sessionCode || !questionId || !answer) {
      return res.status(400).json({ message: "Session code, questionId and answer are required" });
    }

    const response = await Response.create({
      sessionCode,
      questionId,
      answer,
    });

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to submit response" });
  }
};

exports.getResults = async (req, res) => {
  try {
    const results = await Response.aggregate([
      { $match: { questionId: req.params.questionId } },
      { $group: { _id: "$answer", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load results" });
  }
};
