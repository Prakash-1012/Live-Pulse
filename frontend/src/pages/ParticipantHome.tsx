import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Activity, ArrowRight, UserPlus, LogIn } from "lucide-react";
import { useEffect, useState } from "react";
import BackButton from "../components/BackButton";

export default function ParticipantHome() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const parsed = JSON.parse(user);
        setUserName(parsed.name || null);
      } catch {
        setUserName(null);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUserName(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-3xl bg-white rounded-[32px] shadow-2xl p-10"
      >
        <div className="mb-6">
          <BackButton fallback="/" />
        </div>
        <div className="flex flex-col items-center text-center gap-4 mb-10">
          <div className="flex items-center justify-center w-20 h-20 bg-purple-100 rounded-3xl">
            <Activity className="w-10 h-10 text-purple-600" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-5xl font-bold text-gray-900">LivePulse</h1>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
              Join live sessions, answer questions, and let the host track your score by name.
            </p>
          </div>
        </div>

        {userName ? (
          <div className="mb-8 rounded-3xl border border-purple-200 bg-purple-50 p-6">
            <p className="text-lg text-gray-900 font-semibold">Welcome back, {userName}.</p>
            <p className="text-sm text-gray-600 mt-2">You can join a session immediately or log out to switch accounts.</p>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={() => navigate("/join")}
                className="flex-1 py-4 bg-purple-600 text-white rounded-2xl font-semibold hover:bg-purple-700 transition-colors"
              >
                Join Session
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-4 border border-purple-600 text-purple-600 rounded-2xl font-semibold hover:bg-purple-100 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-8 rounded-3xl border border-gray-200 p-6">
            <p className="text-lg text-gray-900 font-semibold">New to LivePulse?</p>
            <p className="text-sm text-gray-600 mt-2">Sign up or log in as a participant to preserve your name and score.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <button
                onClick={() => navigate("/participant/signup")}
                className="flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-semibold hover:opacity-90 transition-opacity"
              >
                <UserPlus className="w-5 h-5" />
                Sign Up
              </button>
              <button
                onClick={() => navigate("/participant/login")}
                className="flex items-center justify-center gap-2 py-4 border border-purple-600 text-purple-600 rounded-2xl font-semibold hover:bg-purple-50 transition-colors"
              >
                <LogIn className="w-5 h-5" />
                Log In
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-3xl border border-gray-200 p-6 bg-white">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Join a session</h2>
            <p className="text-gray-600 mb-6">
              Enter the host's session code and participate as yourself. Your name will appear on the leaderboard.
            </p>
            <button
              onClick={() => navigate("/join")}
              className="w-full py-4 bg-purple-600 text-white rounded-2xl font-semibold hover:bg-purple-700 transition-colors"
            >
              Enter Session Code
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
