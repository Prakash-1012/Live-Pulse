import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Activity, CheckCircle } from "lucide-react";
import BackButton from "../components/BackButton";

export default function SessionEnd() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="absolute left-6 top-6">
          <BackButton fallback="/" className="text-white/80 hover:text-white" />
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full mb-8"
        >
          <CheckCircle className="w-16 h-16 text-green-500" />
        </motion.div>

        <h1 className="text-5xl font-bold text-white mb-4">Session Ended</h1>

        <p className="text-2xl text-white/90 mb-12 max-w-md mx-auto">
          Thank you for participating!
        </p>

        <div className="flex items-center justify-center gap-3 mb-8">
          <Activity className="w-12 h-12 text-white/80" strokeWidth={2.5} />
          <span className="text-3xl font-bold text-white">LivePulse</span>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/")}
          className="px-12 py-5 bg-white text-purple-600 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-shadow"
        >
          Back to Home
        </motion.button>
      </motion.div>
    </div>
  );
}
