const router = require("express").Router();

const {
  submitResponse,
  getResults
} = require("../controllers/responseController");

router.post("/submit", submitResponse);

router.get("/results/:questionId", getResults);

module.exports = router;