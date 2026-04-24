import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Activity, ArrowLeft } from "lucide-react";
import { useState } from "react";
import api from "../lib/api";

export default function JoinSession() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setError("");
    setLoading(true);

    try {
      await api.get(`/session/${code}`);
      navigate(`/vote/${code}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Session code not found.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="bg-white rounded-3xl p-10 shadow-2xl">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-8 h-8 text-purple-600" strokeWidth={2.5} />
            <h1 className="text-3xl font-bold text-gray-900">LivePulse</h1>
          </div>

          <p className="text-gray-600 mb-8">Join a live session</p>

          <form onSubmit={handleJoin}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Enter Session Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full px-6 py-5 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-center font-mono text-3xl font-bold tracking-wider"
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>

            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Joining…" : "Join Session"}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
