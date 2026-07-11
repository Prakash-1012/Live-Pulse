import { motion } from "motion/react";
import { useNavigate, useParams } from "react-router-dom";
import { Activity } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../lib/api";
import socket from "../socket";
import { getSessionJoinerId, getJoinerDisplayName } from "../lib/sessionJoinerId";

interface QuestionItem {
  _id: string;
  questionText: string;
  options: string[];
  type: string;
}

interface SessionData {
  currentQuestion: number;
  isActive: boolean;
}

interface StoredAnswer {
  questionId: string;
  questionText: string;
  answer: string;
  isCorrect: boolean;
}

export default function VotingScreen() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [question, setQuestion] = useState<QuestionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [session, setSession] = useState<SessionData | null>(null);

  const saveAnswerLocally = (storedAnswer: StoredAnswer) => {
    if (!sessionId) return;
    const key = `livepulse_answers_${sessionId}`;
    const existing = JSON.parse(localStorage.getItem(key) || "[]") as StoredAnswer[];
    const updated = existing.filter((item) => item.questionId !== storedAnswer.questionId);
    updated.push(storedAnswer);
    localStorage.setItem(key, JSON.stringify(updated));
  };

  useEffect(() => {
    if (!sessionId) return;

    const loadQuestion = async () => {
      setLoading(true);
      setError("");

      try {
        const [sessionRes, questionRes] = await Promise.all([
          api.get(`/session/${sessionId}`),
          api.get(`/question/${sessionId}`),
        ]);

        setSession(sessionRes.data);
        const questions: QuestionItem[] = questionRes.data;
        const currentQuestion = questions[sessionRes.data.currentQuestion] || questions[0];
        setQuestion(currentQuestion ?? null);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Unable to load the current question.");
      } finally {
        setLoading(false);
      }
    };

    loadQuestion();
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    socket.connect();
    socket.emit("join-session", sessionId);

    const handleQuestionChanged = () => {
      if (sessionId) {
        api.get(`/session/${sessionId}`).then((res) => {
          setSession(res.data);
          api.get(`/question/${sessionId}`).then((questionRes) => {
            const questions = questionRes.data as QuestionItem[];
            const nextQuestion = questions[res.data.currentQuestion] || questions[0];
            setQuestion(nextQuestion ?? null);
            setSelectedOption(null);
          });
        });
      }
    };

    const handleSessionEnded = () => {
      navigate(`/results/${sessionId}`);
    };

    socket.on("question-changed", handleQuestionChanged);
    socket.on("session-ended", handleSessionEnded);

    return () => {
      socket.off("question-changed", handleQuestionChanged);
      socket.off("session-ended", handleSessionEnded);
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, [sessionId, navigate]);

  const submitAnswer = async () => {
    if (!sessionId || !question || selectedOption === null) return;
    setError("");

    try {
      const answer = question.options[selectedOption];
      const joinerId = getSessionJoinerId(sessionId);

      const storedUser = localStorage.getItem("user");
      let joinerName = getJoinerDisplayName(sessionId);
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed?.name) {
            joinerName = parsed.name;
          }
        } catch {
          // ignore parse errors and use stored joiner name
        }
      }

      const response = await api.post("/response/submit", {
        sessionCode: sessionId,
        questionId: question._id,
        answer,
        userId: joinerId,
        userName: joinerName,
      });

      saveAnswerLocally({
        questionId: question._id,
        questionText: question.questionText,
        answer,
        isCorrect: Boolean(response.data?.isCorrect),
      });

      if (!socket.connected) {
        socket.connect();
      }

      socket.emit("join-session", sessionId);
      socket.emit("submit-answer", {
        sessionCode: sessionId,
        questionId: question._id,
        answer,
      });

      navigate(`/results/${sessionId}?questionId=${question._id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to submit your answer.");
    }
  };

  const loadingState = loading || !question;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex flex-col">
      <nav className="bg-white/10 backdrop-blur-sm border-b border-white/20 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton fallback="/join" />
            <Activity className="w-8 h-8 text-white" strokeWidth={2.5} />
            <h1 className="text-2xl font-bold text-white">LivePulse</h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-white/80">Code:</span>
            <span className="font-mono text-xl font-bold text-white">{sessionId}</span>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl">
          <div className="bg-white rounded-3xl p-10 shadow-2xl">
            {loadingState ? (
              <div className="text-center py-20">
                <p className="text-xl font-semibold text-gray-900">Loading question…</p>
              </div>
            ) : question ? (
              <>
                <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{question.questionText}</h2>

                <div className="space-y-4 mb-8">
                  {question.options.map((option, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedOption(index)}
                      className={`w-full p-6 rounded-2xl border-2 font-semibold text-lg transition-all ${
                        selectedOption === index
                          ? "border-purple-600 bg-purple-50 text-purple-700"
                          : "border-gray-200 bg-white text-gray-700 hover:border-purple-300"
                      }`}
                    >
                      {option}
                    </motion.button>
                  ))}
                </div>

                {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={submitAnswer}
                  disabled={selectedOption === null}
                  className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Answer
                </motion.button>
              </>
            ) : (
              <div className="text-center py-20">
                <p className="text-xl font-semibold text-gray-900">No active question yet.</p>
                <p className="text-gray-600 mt-3">Please wait for the host to start the next poll.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
