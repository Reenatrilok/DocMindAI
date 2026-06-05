import { motion } from "framer-motion";
import { useState } from "react";

export default function App() {
  const [position, setPosition] = useState({
    x: 0,
    y: 0,
  });

  const features = [
    "🧠 AI Summary",
    "📝 Notes Generator",
    "❓ MCQ Generator",
    "💼 Resume Analyzer",
    "📄 Merge PDF",
    "🌍 Translate PDF",
  ];

  return (
    <div
      className="min-h-screen bg-slate-950 text-white overflow-hidden relative"
      onMouseMove={(e) =>
        setPosition({
          x: e.clientX,
          y: e.clientY,
        })
      }
    >
      {/* Mouse Glow */}
      <div
        className="pointer-events-none fixed w-96 h-96 rounded-full blur-3xl opacity-20"
        style={{
          left: position.x - 180,
          top: position.y - 180,
          background:
            "radial-gradient(circle, #3b82f6, transparent 70%)",
        }}
      />

      {/* Floating Background Orb */}
      <motion.div
        animate={{
          y: [0, -50, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
        }}
        className="absolute top-20 left-10 w-80 h-80 bg-blue-500 rounded-full blur-3xl opacity-20"
      />

      <motion.div
        animate={{
          y: [0, 60, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
        }}
        className="absolute bottom-20 right-10 w-80 h-80 bg-purple-500 rounded-full blur-3xl opacity-20"
      />

      {/* Hero Section */}
      <section className="h-screen flex flex-col justify-center items-center text-center px-6">
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-7xl font-bold"
        >
          🚀 DocMind AI
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="text-gray-400 text-xl mt-6 max-w-3xl"
        >
          AI Powered Document Intelligence Platform
        </motion.p>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="mt-10 bg-blue-600 px-8 py-4 rounded-2xl"
        >
          Start Free
        </motion.button>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto py-32 px-6">
        <h2 className="text-5xl font-bold text-center mb-20">
          Powerful Features
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((item, index) => (
            <motion.div
              key={item}
              initial={{
                opacity: 0,
                y: 80,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                delay: index * 0.1,
                duration: 0.7,
              }}
              whileHover={{
                scale: 1.05,
              }}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8"
            >
              <h3 className="text-2xl font-bold mb-4">
                {item}
              </h3>

              <p className="text-gray-400">
                Powerful AI document processing and automation.
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-32">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10 px-6 text-center">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white/5 rounded-3xl p-10"
          >
            <h3 className="text-5xl font-bold text-blue-400">
              50K+
            </h3>
            <p className="mt-3 text-gray-400">
              Documents Processed
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white/5 rounded-3xl p-10"
          >
            <h3 className="text-5xl font-bold text-purple-400">
              99.9%
            </h3>
            <p className="mt-3 text-gray-400">
              Accuracy
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white/5 rounded-3xl p-10"
          >
            <h3 className="text-5xl font-bold text-green-400">
              24/7
            </h3>
            <p className="mt-3 text-gray-400">
              AI Assistance
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}