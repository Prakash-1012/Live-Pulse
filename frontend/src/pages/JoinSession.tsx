import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Activity } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../lib/api";
import BackButton from "../components/BackButton";

export default function JoinSession() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [currentName, setCurrentName] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed?.name) {
          setCurrentName(parsed.name);
        }
      } catch {
        setCurrentName(null);
      }
    }
  }, []);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    if (!currentName && !name.trim()) {
      setError("Please enter your name or login to join.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await api.get(`/session/${code}`);
      if (name.trim()) {
        localStorage.setItem(`livepulse_joiner_name_${code}`, name.trim());
      }
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
        <BackButton fallback="/participant" className="text-white/80 hover:text-white mb-8" />

        <div className="bg-white rounded-3xl p-10 shadow-2xl">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-8 h-8 text-purple-600" strokeWidth={2.5} />
            <h1 className="text-3xl font-bold text-gray-900">LivePulse</h1>
          </div>

          <p className="text-gray-600 mb-8">Join a live session</p>

          {currentName ? (
            <div className="rounded-3xl border border-purple-200 bg-purple-50 p-4 mb-6">
              <p className="text-gray-900 font-semibold">Logged in as {currentName}</p>
              <p className="text-sm text-gray-600">If you want to use another name, logout and sign in using a different account.</p>
            </div>
          ) : (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Your name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="e.g., Session123"
              />
              <p className="text-sm text-gray-500 mt-2">
                Enter your name so the host can track your score by person.
              </p>
            </div>
          )}

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

          {!currentName && (
            <p className="text-sm text-center text-gray-600 mt-6">
              Already have a participant account?{' '}
              <button
                onClick={() => navigate("/participant/login")}
                className="font-semibold text-purple-600 hover:underline"
              >
                Login here
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
