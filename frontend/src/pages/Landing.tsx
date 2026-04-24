import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Activity } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center justify-center gap-3 mb-6"
        >
          <Activity className="w-16 h-16 text-white" strokeWidth={2.5} />
        </motion.div>

        <h1 className="text-7xl font-bold text-white mb-4">LivePulse</h1>

        <p className="text-2xl text-white/90 mb-16 max-w-lg mx-auto">
          Feel the pulse of your audience
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/join")}
            className="px-12 py-5 bg-white text-purple-600 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-shadow"
          >
            Join Session
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/login")}
            className="px-12 py-5 bg-white/10 text-white border-2 border-white rounded-2xl font-semibold text-lg backdrop-blur-sm hover:bg-white/20 transition-colors"
          >
            Host Login
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
