"use client";

import { motion } from "framer-motion";

interface TypingLoaderProps {
  speed?: number; // optional speed multiplier, default slower
}

export default function TypingLoader({ speed = 1 }: TypingLoaderProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="flex items-center space-x-3">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-5 h-5 bg-blue-500 rounded-full shadow-lg shadow-blue-500/60"
            animate={{
              y: [0, -12, 0], // bounce
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.2, 1], // subtle glow
            }}
            transition={{
              duration: 0.9 * speed, // slower
              repeat: Infinity,
              delay: i * 0.25,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}
