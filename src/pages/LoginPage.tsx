import React, { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import { postApi } from "../utils/api";
import { URLS } from "../utils/urls";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAIProvider } from "../context/AIProviderContext";

function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshProvider } = useAIProvider();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await postApi(`${URLS.login}`, { email, password });
      if (response.status === 200) {
        const token = response?.data?.data?.token;
        const adminRole = response?.data?.data?.role;
        localStorage.setItem("token", token);
        localStorage.setItem("adminRole", adminRole);

        // The provider is fetched once when the app mounts, which is before a
        // token exists. Without this it stayed empty for the whole session and
        // the model dropdown had no default.
        await refreshProvider();

        navigate("/prompt-testing");
      } else {
        toast.error("error");
      }
    } catch (error: any) {
      toast.error(error.response.data.message);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.7,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.2,
      },
    },
  };

  const childVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      navigate("/prompt-testing", { replace: true });
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03),transparent_50%)] pointer-events-none"></div>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md bg-gray-800/80 backdrop-blur-md rounded-3xl shadow-lg p-8 border border-gray-700 relative z-10"
      >
        <h2 className="text-3xl font-extrabold text-gray-100 text-center mb-8 tracking-tight">
          Prompt Testing Login
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div variants={childVariants}>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-gray-700/50 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder-gray-400"
              placeholder="Enter your email"
              required
            />
          </motion.div>
          <motion.div variants={childVariants}>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-gray-700/50 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder-gray-400"
              placeholder="Enter your password"
              required
            />
          </motion.div>
          <motion.button
            variants={childVariants}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 15px rgba(59, 130, 246, 0.4)",
            }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold shadow-md hover:bg-blue-700 transition-all duration-300"
          >
            Login
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

export default LoginPage;
