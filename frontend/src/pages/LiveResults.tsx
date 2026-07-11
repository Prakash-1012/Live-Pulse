import { motion } from "motion/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Activity, TrendingUp } from "lucide-react";
import BackButton from "../components/BackButton";
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

interface FinalQuestionResult {
  questionId: string;
  questionText: string;
  totalCount: number;
  correctCount: number;
  accuracy: number;
}

interface FinalSummary {
  totalResponses: number;
  correctResponses: number;
  overallAccuracy: number;
  questionResults: FinalQuestionResult[];
}

export default function LiveResults() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [question, setQuestion] = useState<QuestionItem | null>(null);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [session, setSession] = useState<SessionData | null>(null);
  const [finalSummary, setFinalSummary] = useState<FinalSummary | null>(null);
  const [localAnswers, setLocalAnswers] = useState<StoredAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const questionIdFromUrl = new URLSearchParams(location.search).get("questionId");

  const loadLocalAnswers = () => {
    if (!sessionId) return;
    const key = `livepulse_answers_${sessionId}`;
    const answers = JSON.parse(localStorage.getItem(key) || "[]") as StoredAnswer[];
    setLocalAnswers(answers);
  };

  const loadFinalResults = async () => {
    if (!sessionId) return;

    try {
      const response = await api.get(`/response/session-results/${sessionId}`);
      const summary = response.data;

      setFinalSummary({
        totalResponses: summary.totalResponses,
        correctResponses: summary.correctResponses,
        overallAccuracy: Number(String(summary.accuracy).replace("%", "")) || 0,
        questionResults: (summary.questionResults || []).map((item: any) => ({
          questionId: item.questionId,
          questionText: item.questionText,
          totalCount: item.totalCount,
          correctCount: item.correctCount,
          accuracy: Number(String(item.accuracy).replace("%", "")) || 0,
        })),
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to load final results.");
    }
  };

  const loadResults = async (questionId?: string) => {
    if (!sessionId) return;
    setLoading(true);
    setError("");
    setFinalSummary(null);

    try {
      const sessionRes = await api.get(`/session/${sessionId}`);
      const questionRes = await api.get(`/question/${sessionId}`);
      const questions: QuestionItem[] = questionRes.data;
      setQuestions(questions);
      setSession(sessionRes.data);

      if (!sessionRes.data.isActive) {
        setQuestion(null);
        setResults([]);
        await loadFinalResults();
        return;
      }

      const activeQuestion =
        questions.find((item) => item._id === questionId) ||
        questions[sessionRes.data.currentQuestion] ||
        questions[0];
      setQuestion(activeQuestion ?? null);
      setResults([]);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to load results.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocalAnswers();
    loadResults(questionIdFromUrl || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, questionIdFromUrl]);

  useEffect(() => {
    if (!sessionId) return;

    socket.connect();
    socket.emit("join-session", sessionId);

    const handleQuestionChanged = () => {
      if (session?.isActive !== false) {
        navigate(`/vote/${sessionId}`);
      } else {
        loadResults(undefined);
      }
    };

    const handleSessionEnded = () => loadResults(undefined);

    socket.on("question-changed", handleQuestionChanged);
    socket.on("session-ended", handleSessionEnded);

    return () => {
      socket.off("question-changed", handleQuestionChanged);
      socket.off("session-ended", handleSessionEnded);
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, [sessionId, navigate, session]);

  const answeredCorrectly = localAnswers.filter((answer) => answer.isCorrect).length;
  const answeredTotal = localAnswers.length;
  const chartData = finalSummary
    ? [{ name: "Correct Answers", count: answeredCorrectly }]
    : [];
  const isLastQuestion = Boolean(session && questions.length > 0 && session.currentQuestion >= questions.length - 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex flex-col">
      <nav className="bg-white/10 backdrop-blur-sm border-b border-white/20 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton fallback={`/vote/${sessionId ?? ""}`} />
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
            ) : session?.isActive ? (
              <>
                <p className="text-xl text-gray-700 mb-8 text-center">
                  {question?.questionText ?? "Waiting for the host to continue the session..."}
                </p>

                <div className="h-80 mb-8 rounded-3xl border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                  <p className="text-lg text-gray-500 text-center px-6">
                    {isLastQuestion
                      ? "Waiting for final results from the host..."
                      : "Waiting for the next question from the host..."}
                  </p>
                </div>

                <div className="mt-8 p-6 bg-purple-50 rounded-2xl text-center">
                  <p className="text-purple-700 font-semibold">
                    {isLastQuestion ? "Waiting for final results..." : "Waiting for next question..."}
                  </p>
                </div>
              </>
            ) : finalSummary ? (
              <>
                <p className="text-xl text-gray-700 mb-4 text-center">Session complete — final results</p>
                <div className="grid gap-4 sm:grid-cols-2 mb-8">
                  <div className="p-6 rounded-3xl bg-purple-50">
                    <p className="text-sm text-gray-500">Total submissions</p>
                    <p className="text-4xl font-bold text-gray-900">{finalSummary.totalResponses}</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-purple-50">
                    <p className="text-sm text-gray-500">Overall accuracy</p>
                    <p className="text-4xl font-bold text-gray-900">{finalSummary.overallAccuracy}%</p>
                  </div>
                </div>

                <div className="h-96 mb-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip formatter={(value: number) => `${value} correct`} />
                      <Bar dataKey="count" fill="#9333ea" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 mb-8">
                  <div className="p-6 rounded-3xl bg-purple-50">
                    <p className="text-sm text-gray-500">Your correct answers</p>
                    <p className="text-4xl font-bold text-gray-900">{answeredCorrectly}</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-purple-50">
                    <p className="text-sm text-gray-500">Questions answered</p>
                    <p className="text-4xl font-bold text-gray-900">{answeredTotal}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {finalSummary.questionResults.map((result) => (
                    <div key={result.questionId} className="p-4 rounded-3xl bg-white shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-semibold text-gray-900">{result.questionText}</p>
                        <span className="text-sm text-gray-500">{result.accuracy}% correct</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        {result.correctCount} / {result.totalCount} correct answers
                      </p>
                    </div>
                  ))}
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
