const router = require("express").Router();

const {
  submitResponse,
  getResults,
  getSessionResults,
  getSessionLeaderboard,
} = require("../controllers/responseController");

router.post("/submit", submitResponse);

router.get("/results/:questionId", getResults);
router.get("/session-results/:sessionCode", getSessionResults);
router.get("/leaderboard/:sessionCode", getSessionLeaderboard);

module.exports = router;