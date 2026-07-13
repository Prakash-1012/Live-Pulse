const router = require("express").Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const {
  generateQuiz,
  uploadQuiz,
} = require("../controllers/aiController");

// Temporarily remove auth for testing
// const authMiddleware = require("../middleware/authMiddleware");

router.post("/generate-quiz", generateQuiz);
router.post("/upload-quiz", upload.single("ppt"), uploadQuiz);

module.exports = router;
