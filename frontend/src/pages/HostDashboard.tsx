import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Activity, Plus, LogOut, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../lib/api";
import BackButton from "../components/BackButton";

interface SessionItem {
  _id: string;
  code: string;
  currentQuestion: number;
  isActive: boolean;
  createdAt: string;
}

export default function HostDashboard() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchSessions = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/session/host");
        setSessions(response.data);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Unable to load sessions.");
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton fallback="/" />
            <Activity className="w-8 h-8 text-purple-600" strokeWidth={2.5} />
            <h1 className="text-2xl font-bold text-gray-900">LivePulse</h1>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              navigate("/");
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600 mb-12">
            Create a new session or view your previous active sessions.
          </p>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/create-session")}
            className="flex items-center gap-3 px-8 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-shadow mb-16"
          >
            <Plus className="w-6 h-6" />
            Start New Session
          </motion.button>

          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Your Sessions</h3>
              {loading && <span className="text-sm text-gray-500">Loading…</span>}
            </div>

            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

            <div className="grid gap-4">
              {sessions.length === 0 && !loading ? (
                <div className="bg-white rounded-2xl p-10 border border-dashed border-gray-300 text-center text-gray-500">
                  No sessions yet. Create your first one to start polling.
                </div>
              ) : (
                sessions.map((session, index) => (
                  <motion.div
                    key={session._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-purple-300 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-medium text-gray-500">Code:</span>
                          <span className="font-mono text-xl font-bold text-purple-600">{session.code}</span>
                        </div>
                        <div className="text-sm text-gray-600">Created {new Date(session.createdAt).toLocaleDateString()}</div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${session.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {session.isActive ? "Live" : "Ended"}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3 items-center justify-between">
                      <span className="text-sm text-gray-600">Current question {session.currentQuestion + 1}</span>
                      <button
                        onClick={() => navigate(`/host-live/${session.code}`)}
                        className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
                      >
                        Manage
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
