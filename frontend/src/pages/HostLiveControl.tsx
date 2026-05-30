import { motion } from "motion/react";
import { useNavigate, useParams } from "react-router-dom";
import { Activity, SkipForward, StopCircle, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import api from "../lib/api";
import socket from "../socket";

interface QuestionItem {
  _id: string;
  sessionCode: string;
  questionText: string;
  options: string[];
  type: string;
  correctAnswer?: string;
}

interface SessionData {
  currentQuestion: number;
  isActive: boolean;
}

export default function HostLiveControl() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [session, setSession] = useState<SessionData | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [results, setResults] = useState<{ name: string; votes: number; isCorrect?: boolean }[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const currentQuestionRef = useRef<string | null>(null);

  const currentQuestion = questions[session?.currentQuestion ?? 0];

  const fetchSessionData = async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      const [sessionRes, questionRes] = await Promise.all([
        api.get(`/session/${sessionId}`),
        api.get(`/question/${sessionId}`),
      ]);
      setSession(sessionRes.data);
      setQuestions(questionRes.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to load session.");
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async (questionId?: string) => {
    if (!questionId) return;

    try {
      const response = await api.get(`/response/results/${questionId}`);
      const resultItems = response.data?.results ?? [];
      setCorrectAnswer(response.data?.correctAnswer || "");
      setResults(
        resultItems
          .map((item: any) => ({
            name: item._id,
            votes: item.count,
            isCorrect: item._id === response.data?.correctAnswer,
          }))
          .sort((a: any, b: any) => b.votes - a.votes)
      );
    } catch (err) {
      setResults([]);
      setCorrectAnswer("");
    }
  };

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetchSessionData();
  }, [sessionId]);

  useEffect(() => {
    if (!currentQuestion) return;
    currentQuestionRef.current = currentQuestion._id;
    fetchResults(currentQuestion._id);
  }, [currentQuestion]);

  useEffect(() => {
    if (!sessionId) return;

    socket.connect();
    socket.emit("join-session", sessionId);

    const handleNewVote = (payload: any) => {
      if (!currentQuestionRef.current || payload.questionId !== currentQuestionRef.current) return;
      setResults((prev) => {
        const existing = prev.find((item) => item.name === payload.answer);
        if (existing) {
          return prev.map((item) =>
            item.name === payload.answer ? { ...item, votes: item.votes + 1 } : item
          );
        }
        return [...prev, { name: payload.answer, votes: 1 }];
      });
    };

    const handleQuestionChanged = () => {
      fetchSessionData();
    };

    const handleSessionEnded = () => {
      navigate("/session-end");
    };

    socket.on("new-vote", handleNewVote);
    socket.on("question-changed", handleQuestionChanged);
    socket.on("session-ended", handleSessionEnded);

    return () => {
      socket.off("new-vote", handleNewVote);
      socket.off("question-changed", handleQuestionChanged);
      socket.off("session-ended", handleSessionEnded);
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, [sessionId, navigate]);

  const nextQuestion = async () => {
    if (!sessionId || updating) return;
    setUpdating(true);

    try {
      const response = await api.put(`/session/${sessionId}/advance`);
      setSession(response.data);
      socket.emit("next-question", sessionId);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to move to the next question.");
    } finally {
      setUpdating(false);
    }
  };

  const endSession = async () => {
    if (!sessionId) return;
    setUpdating(true);

    try {
      await api.put(`/session/${sessionId}/end`);
      socket.emit("end-session", sessionId);
      navigate("/session-end");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to end session.");
    } finally {
      setUpdating(false);
    }
  };

  const totalVotes = results.reduce((sum, item) => sum + item.votes, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-purple-600" strokeWidth={2.5} />
            <h1 className="text-2xl font-bold text-gray-900">LivePulse</h1>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">LIVE</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-900">{totalVotes}</span>
              <span className="text-gray-600">responses</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-gray-600">Code:</span>
              <span className="font-mono text-xl font-bold text-purple-600">{sessionId}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-5 gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-3">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 mb-6">
              {loading ? (
                <div className="py-20 text-center">
                  <p className="text-lg font-semibold text-gray-900">Loading session data…</p>
                </div>
              ) : error ? (
                <div className="py-20 text-center text-red-600">{error}</div>
              ) : currentQuestion ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-sm font-medium text-gray-500">
                      Question {session?.currentQuestion + 1} of {questions.length}
                    </span>
                  </div>

                  <h2 className="text-3xl font-bold text-gray-900 mb-8">{currentQuestion.questionText}</h2>

                  <div className="space-y-4 mb-6">
                    <div className="rounded-3xl bg-purple-50 p-5 border border-purple-100">
                      <p className="text-sm text-gray-500">Correct answer</p>
                      <p className="mt-2 text-xl font-semibold text-gray-900">{correctAnswer || "Not available yet"}</p>
                    </div>
                    <div className="rounded-3xl bg-blue-50 p-5 border border-blue-100">
                      <p className="text-sm text-gray-500">Total responses</p>
                      <p className="mt-2 text-xl font-semibold text-gray-900">{totalVotes}</p>
                    </div>
                  </div>

                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={results.length ? results : [{ name: "No votes yet", votes: 0 }] }>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          type="number"
                          domain={[0, Math.max(totalVotes, 1)]}
                          tickCount={Math.min(Math.max(totalVotes + 1, 2), 6)}
                          tickFormatter={(value) => Number(value).toFixed(0)}
                        />
                        <YAxis type="category" dataKey="name" width={180} />
                        <Tooltip formatter={(value) => `${value} votes`} />
                        <Bar dataKey="votes" radius={[8, 8, 0, 0]}>
                          {results.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.isCorrect ? "#16a34a" : "#9333ea"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-4">
                    {results.map((item) => (
                      <div key={item.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <span className="font-medium text-gray-900">{item.name}</span>
                        <span className="text-2xl font-bold text-purple-600">{item.votes}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-20 text-center">
                  <p className="text-lg font-semibold text-gray-900">No active question yet.</p>
                  <p className="text-gray-600 mt-2">Add questions to the session and start the poll.</p>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={nextQuestion}
                disabled={!currentQuestion || updating || (session && session.currentQuestion >= questions.length - 1)}
                className="flex-1 flex items-center justify-center gap-3 py-5 bg-purple-600 text-white rounded-2xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SkipForward className="w-5 h-5" />
                Next Question
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={endSession}
                disabled={updating}
                className="flex-1 flex items-center justify-center gap-3 py-5 bg-red-500 text-white rounded-2xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <StopCircle className="w-5 h-5" />
                End Session
              </motion.button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 sticky top-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">All Questions</h3>
              <div className="space-y-3">
                {questions.map((question, index) => (
                  <div key={question._id} className={`p-4 rounded-xl border-2 transition-colors ${index === session?.currentQuestion ? "border-purple-600 bg-purple-50" : "border-gray-200 bg-white"}`}>
                    <div className="flex items-start gap-3">
                      <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold ${index === session?.currentQuestion ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-600"}`}>{index + 1}</span>
                      <p className="text-sm font-medium text-gray-900">{question.questionText}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
