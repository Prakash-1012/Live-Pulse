import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Activity, ArrowLeft, Play } from "lucide-react";
import { useState, useEffect } from "react";
import api from "../lib/api";

export default function CreateSession() {
  const navigate = useNavigate();
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
  }, [navigate]);

  const createSession = async () => {
    setError("");
    setLoading(true);

    // Debug: Check if token exists
    const token = localStorage.getItem("token");
    console.log("Token in localStorage:", token);

    try {
      const response = await api.post("/session/create");
      setSessionCode(response.data.code);
    } catch (err: any) {
      console.error("Create session error:", err);
      setError(err?.response?.data?.message || "Unable to create session.");
    } finally {
      setLoading(false);
    }
  };

  const startSession = () => {
    if (sessionCode) {
      navigate(`/add-question/${sessionCode}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <Activity className="w-8 h-8 text-purple-600" strokeWidth={2.5} />
          <h1 className="text-2xl font-bold text-gray-900">LivePulse</h1>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Create New Session
          </h2>
          <p className="text-gray-600 mb-12">
            Start your live session and invite participants with a session code.
          </p>

          {error && <p className="text-sm text-red-600 mb-6">{error}</p>}

          {!sessionCode ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={createSession}
              disabled={loading}
              className="px-12 py-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Creating…" : "Create Session"}
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-12 shadow-xl"
            >
              <div className="mb-8">
                <p className="text-gray-600 mb-3">Session Code</p>
                <div className="font-mono text-6xl font-bold text-purple-600 mb-4">
                  {sessionCode}
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={startSession}
                className="flex items-center justify-center gap-3 px-10 py-5 bg-green-500 text-white rounded-2xl font-semibold text-lg shadow-lg hover:bg-green-600 transition-colors mx-auto"
              >
                <Play className="w-5 h-5" />
                Start Session
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
