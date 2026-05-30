const router = require("express").Router();

const {
  submitResponse,
  getResults,
  getSessionResults,
} = require("../controllers/responseController");

router.post("/submit", submitResponse);

router.get("/results/:questionId", getResults);
router.get("/session-results/:sessionCode", getSessionResults);

module.exports = router;