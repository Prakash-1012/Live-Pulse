const router = require("express").Router();

const {
  createSession,
  getSession,
  getHostSessions,
  advanceQuestion,
  endSession,
} = require("../controllers/sessionController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/create", authMiddleware, createSession);
router.get("/host", authMiddleware, getHostSessions);
router.get("/:code", getSession);
router.put("/:code/advance", authMiddleware, advanceQuestion);
router.put("/:code/end", authMiddleware, endSession);

module.exports = router;