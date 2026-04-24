import { motion } from "motion/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Activity, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import api from "../lib/api";
import socket from "../socket";

interface QuestionItem {
  _id: string;
  questionText: string;
  options: string[];
}

interface ResultItem {
  _id: string;
  count: number;
}

export default function LiveResults() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<QuestionItem | null>(null);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const questionIdFromUrl = new URLSearchParams(location.search).get("questionId");

  const loadResults = async (questionId?: string) => {
    if (!sessionId) return;
    setLoading(true);
    setError("");

    try {
      const sessionRes = await api.get(`/session/${sessionId}`);
      const questionRes = await api.get(`/question/${sessionId}`);
      const questions: QuestionItem[] = questionRes.data;
      const activeQuestion = questions.find((item) => item._id === questionId) || questions[sessionRes.data.currentQuestion] || questions[0];
      setQuestion(activeQuestion ?? null);

      if (activeQuestion) {
        const resultsResponse = await api.get(`/response/results/${activeQuestion._id}`);
        setResults(resultsResponse.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to load results.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults(questionIdFromUrl || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, questionIdFromUrl]);

  useEffect(() => {
    if (!sessionId) return;

    socket.connect();
    socket.emit("join-session", sessionId);

    const handleVote = (payload: any) => {
      if (!question || payload.questionId !== question._id) return;
      setResults((current) => {
        const existing = current.find((item) => item._id === payload.answer);
        if (existing) {
          return current.map((item) => (item._id === payload.answer ? { ...item, count: item.count + 1 } : item));
        }
        return [...current, { _id: payload.answer, count: 1 }];
      });
    };

    const handleQuestionChanged = () => loadResults(undefined);
    const handleSessionEnded = () => navigate("/session-end");

    socket.on("new-vote", handleVote);
    socket.on("question-changed", handleQuestionChanged);
    socket.on("session-ended", handleSessionEnded);

    return () => {
      socket.off("new-vote", handleVote);
      socket.off("question-changed", handleQuestionChanged);
      socket.off("session-ended", handleSessionEnded);
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, [sessionId, navigate, question]);

  const chartData = results.map((item) => ({ name: item._id, votes: item.count }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex flex-col">
      <nav className="bg-white/10 backdrop-blur-sm border-b border-white/20 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl">
          <div className="bg-white rounded-3xl p-10 shadow-2xl">
            <div className="flex items-center justify-center gap-3 mb-8">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <h2 className="text-3xl font-bold text-gray-900">Live Results</h2>
            </div>

            {loading ? (
              <div className="text-center py-20">
                <p className="text-xl font-semibold text-gray-900">Loading results…</p>
              </div>
            ) : error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : question ? (
              <>
                <p className="text-xl text-gray-700 mb-8 text-center">{question.questionText}</p>

                <div className="h-80 mb-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="votes" fill="#9333ea" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  {chartData.map((result, index) => (
                    <motion.div
                      key={result.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-4"
                    >
                      <div className="flex-1 bg-gray-100 rounded-xl overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((result.votes / Math.max(...chartData.map((item) => item.votes, 1))) * 100, 100)}%` }}
                          transition={{ duration: 0.8, delay: index * 0.1 }}
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3"
                        >
                          <span className="font-semibold text-white">{result.name}</span>
                        </motion.div>
                      </div>
                      <div className="flex items-baseline gap-2 min-w-[100px] justify-end">
                        <span className="text-2xl font-bold text-gray-900">{result.votes}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-8 p-6 bg-purple-50 rounded-2xl text-center">
                  <p className="text-purple-700 font-semibold">Waiting for next question...</p>
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <p className="text-xl font-semibold text-gray-900">No active results yet.</p>
                <p className="text-gray-600 mt-3">Please return to the voting screen or wait for the host to start the poll.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
