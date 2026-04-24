const router = require("express").Router();

const {
  addQuestion,
  getQuestions
} = require("../controllers/questionController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/add", authMiddleware, addQuestion);

router.get("/:code", getQuestions);

module.exports = router;