import { motion } from "motion/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Activity, ArrowLeft, Plus, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../lib/api";

interface Question {
  id: string;
  text: string;
  type: "MCQ" | "Yes/No";
  options: string[];
}

export default function AddQuestion() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId } = useParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<"MCQ" | "Yes/No">("MCQ");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const generated = (location.state as any)?.generatedQuestions;

    if (Array.isArray(generated) && generated.length > 0) {
      const mapped = generated.map((question: any, index: number) => ({
        id: Date.now().toString() + index,
        text: question.text || question.question || "",
        type: question.type === "Yes/No" ? "Yes/No" : "MCQ",
        options: question.options ?? (question.type === "Yes/No" ? ["Yes", "No"] : []),
      }));

      setQuestions((prev) => [...prev, ...mapped]);
    }
  }, [location.state]);

  const addQuestion = () => {
    if (!questionText.trim()) return;

    const newQuestion: Question = {
      id: Date.now().toString(),
      text: questionText.trim(),
      type: questionType,
      options: questionType === "MCQ" ? options.filter(Boolean) : ["Yes", "No"],
    };

    setQuestions([...questions, newQuestion]);
    setQuestionText("");
    setOptions(["", "", "", ""]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const goLive = async () => {
    if (!sessionId || questions.length === 0) return;

    setError("");
    setLoading(true);

    try {
      const payload = questions.map((question) => ({
        text: question.text,
        options: question.options,
        type: question.type,
      }));

      await api.post("/question/add", {
        sessionCode: sessionId,
        questions: payload,
      });

      navigate(`/host-live/${sessionId}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to add questions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <Activity className="w-8 h-8 text-purple-600" strokeWidth={2.5} />
            <h1 className="text-2xl font-bold text-gray-900">LivePulse</h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-gray-600">Code:</span>
            <span className="font-mono text-xl font-bold text-purple-600">
              {sessionId}
            </span>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Add Questions</h2>
              <button
                onClick={() => navigate(`/ai-generator/${sessionId}`)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-xl font-semibold hover:bg-purple-200 transition-colors"
              >
                <Sparkles className="w-5 h-5" />
                AI Generate
              </button>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question
                  </label>
                  <input
                    type="text"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="Enter your question"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value as "MCQ" | "Yes/No")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  >
                    <option value="MCQ">Multiple Choice</option>
                    <option value="Yes/No">Yes/No</option>
                  </select>
                </div>

                {questionType === "MCQ" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Options
                    </label>
                    <div className="space-y-2">
                      {options.map((option, index) => (
                        <input
                          key={index}
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...options];
                            newOptions[index] = e.target.value;
                            setOptions(newOptions);
                          }}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                          placeholder={`Option ${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {error && <p className="text-sm text-red-600">{error}</p>}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={addQuestion}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add Question
                </motion.button>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Questions ({questions.length})</h2>

            {questions.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
                <p className="text-gray-500">No questions added yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-500">Q{index + 1}</span>
                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                            {question.type}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900">{question.text}</p>
                      </div>
                      <button
                        onClick={() => removeQuestion(question.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {question.options.map((option, i) => (
                        <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">
                          {option}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={goLive}
                  disabled={questions.length === 0 || loading}
                  className="w-full py-5 bg-green-500 text-white rounded-2xl font-semibold text-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Saving…" : "Go Live"}
                </motion.button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
