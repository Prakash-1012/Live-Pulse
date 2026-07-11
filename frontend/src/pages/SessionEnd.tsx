import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Activity, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import BackButton from "../components/BackButton";
import api from "../lib/api";

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

export default function SessionEnd() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [finalSummary, setFinalSummary] = useState<FinalSummary | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const loadHostLatestSession = async () => {
      try {
        setLoading(true);
        // Fetch host sessions and pick the most recent one
        const sessionsRes = await api.get("/session/host");
        const sessions = sessionsRes.data || [];
        if (!sessions.length) {
          setError("No sessions found for this host.");
          setLoading(false);
          return;
        }

        // Sort by createdAt desc (fallback to first)
        sessions.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const latest = sessions[0];
        const code = latest.code || latest._id || null;
        setSessionCode(code);

        if (code) {
          // Load final summary and leaderboard
          const [summaryRes, leaderboardRes] = await Promise.all([
            api.get(`/response/session-results/${code}`),
            api.get(`/response/leaderboard/${code}`),
          ]);

          const summary = summaryRes.data || null;
          setFinalSummary(
            summary
              ? {
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
                }
              : null
          );

          setLeaderboard((leaderboardRes.data?.leaderboard as any[]) || []);
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || "Unable to load final results.");
      } finally {
        setLoading(false);
      }
    };

    loadHostLatestSession();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-start justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl bg-transparent"
      >
        <div className="mb-6">
          <BackButton fallback="/dashboard" />
        </div>

        <div className="bg-white rounded-3xl p-10 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full mb-6">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Session Ended</h1>
            <p className="text-gray-600 mb-2">Thank you for hosting!</p>
            {sessionCode && <p className="text-sm text-gray-500">Session code: <span className="font-mono">{sessionCode}</span></p>}
          </div>

          {loading ? (
            <div className="py-12 text-center">Loading final results…</div>
          ) : error ? (
            <div className="py-12 text-center text-red-600">{error}</div>
          ) : finalSummary ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-purple-50">
                  <p className="text-sm text-gray-500">Total submissions</p>
                  <p className="text-3xl font-bold text-gray-900">{finalSummary.totalResponses}</p>
                </div>
                <div className="p-4 rounded-2xl bg-purple-50">
                  <p className="text-sm text-gray-500">Overall accuracy</p>
                  <p className="text-3xl font-bold text-gray-900">{finalSummary.overallAccuracy}%</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Leaderboard</h3>
                {leaderboard.length === 0 ? (
                  <div className="text-center text-gray-500 p-6">No participants found.</div>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((entry: any, idx: number) => (
                      <div key={entry.userId || idx} className="p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${idx === 0 ? 'bg-yellow-400 text-white' : idx === 1 ? 'bg-gray-400 text-white' : idx === 2 ? 'bg-orange-400 text-white' : 'bg-gray-200 text-gray-700'}`}>
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{entry.userName || entry.name || 'Anonymous'}</p>
                            <p className="text-sm text-gray-500">{(entry.correctAnswers ?? entry.correct) || 0} correct · {(entry.totalAnswered ?? entry.total) || 0} answered</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-purple-600">{entry.scorePercentage ?? entry.score ?? '0%'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Question breakdown</h3>
                <div className="space-y-3">
                  {finalSummary.questionResults.map((q) => (
                    <div key={q.questionId} className="p-4 rounded-xl border border-gray-100 bg-white">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">{q.questionText}</p>
                        <span className="text-sm text-gray-500">{q.accuracy}% correct</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">{q.correctCount} / {q.totalCount} correct</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-600">No final results available.</div>
          )}

          <div className="mt-8 flex justify-center">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/")}
              className="px-8 py-3 bg-purple-600 text-white rounded-2xl font-semibold hover:bg-purple-700 transition-colors"
            >
              Back to Home
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
