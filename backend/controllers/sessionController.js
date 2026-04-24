const Session = require("../models/Session");
const Question = require("../models/Question");

exports.createSession = async (req, res) => {
  try {
    const hostId = req.user?.id;

    if (!hostId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let code = Math.floor(100000 + Math.random() * 900000).toString();
    let existing = await Session.findOne({ code });

    while (existing) {
      code = Math.floor(100000 + Math.random() * 900000).toString();
      existing = await Session.findOne({ code });
    }

    const session = await Session.create({
      code,
      hostId,
    });

    res.json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create session" });
  }
};

exports.getSession = async (req, res) => {
  try {
    const session = await Session.findOne({ code: req.params.code });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load session" });
  }
};

exports.getHostSessions = async (req, res) => {
  try {
    const hostId = req.user?.id;

    if (!hostId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const sessions = await Session.find({ hostId }).sort({ createdAt: -1 });
    res.json(sessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load host sessions" });
  }
};

exports.advanceQuestion = async (req, res) => {
  try {
    const session = await Session.findOne({ code: req.params.code });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const totalQuestions = await Question.countDocuments({ sessionCode: req.params.code });

    if (session.currentQuestion < totalQuestions - 1) {
      session.currentQuestion += 1;
      await session.save();
    }

    res.json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to advance session" });
  }
};

exports.endSession = async (req, res) => {
  try {
    const session = await Session.findOne({ code: req.params.code });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    session.isActive = false;
    await session.save();

    res.json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to end session" });
  }
};
