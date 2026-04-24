const router = require("express").Router();

const {
  generateQuiz
} = require("../controllers/aiController");

// Temporarily remove auth for testing
// const authMiddleware = require("../middleware/authMiddleware");

router.post("/generate-quiz", generateQuiz);

module.exports = router;