import { motion } from "motion/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Activity, Sparkles, Plus } from "lucide-react";
import { useState, useEffect, DragEvent } from "react";
import api from "../lib/api";
import BackButton from "../components/BackButton";

interface GeneratedQuestion {
  text: string;
  type: "MCQ" | "Yes/No";
  options: string[];
  correctAnswer?: string;
}

export default function AIGenerator() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId } = useParams();
  const [topic, setTopic] = useState("");
  const [pptFile, setPptFile] = useState<File | null>(null);
  const [pptPrompt, setPptPrompt] = useState("");
  const [generated, setGenerated] = useState<GeneratedQuestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
  }, [navigate]);

  const generateQuestions = async () => {
    if (!topic.trim()) return;
    setError("");
    setIsGenerating(true);

    try {
      const response = await api.post("/ai/generate-quiz", { topic });
      const quiz = response.data.quiz;
      const parsed = typeof quiz === "string" ? JSON.parse(quiz) : quiz;

      if (!Array.isArray(parsed)) {
        throw new Error("Unexpected quiz format");
      }

      setGenerated(
        parsed.map((item: any) => ({
          text: item.question || item.text || "",
          type: item.type === "Yes/No" ? "Yes/No" : "MCQ",
          options: item.options || ["Yes", "No"],
          correctAnswer: item.correctAnswer || "",
        }))
      );
    } catch (err: any) {
      // Handle rate-limit responses from the server
      if (err?.response && err.response.status === 429) {
        const retrySec = err.response.data?.retryAfterSec || err.response.headers?.["retry-after"];
        setError(
          retrySec
            ? `Service is rate-limited. Please try again in ${retrySec} seconds.`
            : "Service is rate-limited. Please wait a moment and try again."
        );
      } else {
        setError(err?.message || "Unable to generate quiz. Try another topic.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const uploadPptQuiz = async () => {
    if (!pptFile) return;
    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("ppt", pptFile);
      // include optional user prompt (user should specify desired count inside the prompt)
      if (pptPrompt && pptPrompt.trim()) formData.append("prompt", pptPrompt.trim());

      const response = await api.post("/ai/upload-quiz", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const quiz = response.data.quiz;
      const parsed = typeof quiz === "string" ? JSON.parse(quiz) : quiz;

      if (!Array.isArray(parsed)) {
        throw new Error("Unexpected quiz format");
      }

      setGenerated(
        parsed.map((item: any) => ({
          text: item.question || item.text || "",
          type: item.type === "Yes/No" ? "Yes/No" : "MCQ",
          options: item.options || ["Yes", "No"],
          correctAnswer: item.correctAnswer || "",
        }))
      );
    } catch (err: any) {
      if (err?.response && err.response.status === 429) {
        const retrySec = err.response.data?.retryAfterSec || err.response.headers?.["retry-after"];
        setError(
          retrySec
            ? `Service is rate-limited. Please try again in ${retrySec} seconds.`
            : "Service is rate-limited. Please wait a moment and try again."
        );
      } else {
        setError(err?.message || "Unable to generate quiz from PPT. Try again.");
      }
    } finally {
      setUploading(false);
    }
  };

  const [dragActive, setDragActive] = useState(false);

  const handleFileDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      setPptFile(files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const addToSession = () => {
    navigate(`/add-question/${sessionId}`, {
      state: { generatedQuestions: generated },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton fallback={`/add-question/${sessionId ?? ""}`} />
            <Activity className="w-8 h-8 text-purple-600" strokeWidth={2.5} />
            <h1 className="text-2xl font-bold text-gray-900">BrainBuzz</h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-gray-600">Code:</span>
            <span className="font-mono text-xl font-bold text-purple-600">
              {sessionId}
            </span>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-2xl mb-4">
              <Sparkles className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-3">AI Quiz Generator</h2>
            <p className="text-gray-600">Generate questions automatically based on a topic.</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">Topic</label>
            <div className="flex gap-3 mb-4 flex-col sm:flex-row">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="flex-1 px-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="e.g., Climate Change, Machine Learning, History..."
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={generateQuestions}
                disabled={!topic.trim() || isGenerating}
                className="px-8 py-4 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                {isGenerating ? "Generating..." : "Generate"}
              </motion.button>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-3">Optional prompt for PPT</label>
            <div className="mb-4">
              <textarea
                value={pptPrompt}
                onChange={(e) => setPptPrompt(e.target.value)}
                placeholder="Optional: give the AI a specific focus or instructions for the quiz (e.g., focus on definitions, include difficulty tags)."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                rows={3}
              />
              <p className="text-sm text-gray-500 mt-2">Specify the desired number of questions in the prompt above (e.g., "Generate 12 questions focusing on definitions").</p>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-3">Upload PowerPoint</label>
            <div className="flex flex-col gap-3 sm:flex-row items-start">
              <label
                htmlFor="ppt-file-input"
                className={`flex-1 block rounded-xl border-2 border-dashed ${dragActive ? "border-indigo-600 bg-indigo-50" : "border-gray-300 bg-white"} cursor-pointer transition-colors`}
                onDragOver={handleDragOver}
                onDragEnter={() => setDragActive(true)}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleFileDrop}
              >
                <div className="w-full h-full inline-flex items-center justify-center px-8 py-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
                  <Sparkles className="w-5 h-5 mr-2" />
                  {pptFile ? pptFile.name : "Choose File or Drag Here"}
                </div>
                <input
                  id="ppt-file-input"
                  type="file"
                  accept=".ppt,.pptx"
                  onChange={(e) => setPptFile(e.target.files ? e.target.files[0] : null)}
                  className="hidden"
                />
              </label>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={uploadPptQuiz}
                disabled={!pptFile || uploading}
                className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                {uploading ? "Uploading..." : "Upload PPT"}
              </motion.button>
            </div>
            {pptFile && <p className="text-sm text-gray-700 mt-2">Selected file: {pptFile.name}</p>}
            <p className="text-xs text-gray-500 mt-2">Upload a PowerPoint file to create a quiz from your slides.</p>
          </div>

          {error && <p className="text-sm text-red-600 mb-6">{error}</p>}

          {generated.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Generated Questions ({generated.length})</h3>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={addToSession}
                  className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add to Session
                </motion.button>
              </div>

              <div className="space-y-4">
                {generated.map((question, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-medium text-gray-500">Q{index + 1}</span>
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                        {question.type}
                      </span>
                      {question.correctAnswer && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                          ✓ Answer Set
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-gray-900 mb-3">{question.text}</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {question.options.map((option, i) => (
                        <span 
                          key={i} 
                          className={`px-3 py-1 rounded-lg text-sm font-medium ${
                            option === question.correctAnswer 
                              ? "bg-green-100 text-green-700 border-2 border-green-600" 
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {option}
                          {option === question.correctAnswer && " ✓"}
                        </span>
                      ))}
                    </div>
                    {question.correctAnswer && (
                      <p className="text-xs text-green-600 mt-2">
                        Correct answer: <span className="font-semibold">{question.correctAnswer}</span>
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
