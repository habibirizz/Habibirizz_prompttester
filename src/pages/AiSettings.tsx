import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getApi, patchApi } from "../utils/api";
import { URLS } from "../utils/urls";
import TypingLoader from "../utils/Lodaer";
import { Bot, Sparkle } from "lucide-react";
import { useAIProvider } from "../context/AIProviderContext";

interface OpenAIConfig {
  model: string;
  temperature: number;
}

interface GeminiConfig {
  model: string;
  temperature: number;
}

interface AISettings {
  _id: string;
  activeProvider: "OPENAI" | "GEMINI";
  openai: OpenAIConfig;
  gemini: GeminiConfig;
  createdAt: string;
  updatedAt: string;
}

interface APIResponse {
  success: boolean;
  message?: string;
  data?: AISettings;
  error?: string;
}

const AISettingsComponent: React.FC = () => {
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [selectedProvider, setSelectedProvider] = useState<"OPENAI" | "GEMINI" | null>(null);
const { setProvider } = useAIProvider();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
   
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
     
    }
  };

  // Fetch current settings
  const fetchSettings = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await getApi(`${URLS.getAISettings}`);
      if (response.status === 200) {
        setSettings(response?.data?.data);
        setError("");
      } else {
        setError(response?.data?.message || "Failed to fetch settings");
      }
    } catch (err) {
      setError("Error fetching AI settings");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle provider selection (opens confirmation modal)
  const handleProviderClick = (provider: "OPENAI" | "GEMINI") => {
    if (settings?.activeProvider !== provider) {
      setSelectedProvider(provider);
      setShowConfirmModal(true);
    }
  };

  // Confirm and update provider
  const confirmUpdateProvider = async (): Promise<void> => {
    if (!selectedProvider) return;

    try {
      setUpdating(true);
      setError("");
      setSuccess("");
      setShowConfirmModal(false);

      const response = await patchApi(`${URLS.updateAISettings}`, {
        activeProvider: selectedProvider,
      });

      if (response.status === 200) {
       const updatedProvider = response.data?.data?.activeProvider;
  setSettings(response.data.data);
  setProvider(updatedProvider); 
  setSuccess(`Successfully switched to ${updatedProvider}!`);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(response?.data?.message || "Failed to update provider");
      }
    } catch (err) {
      setError("Error updating provider");
      console.error(err);
    } finally {
      setUpdating(false);
      setSelectedProvider(null);
    }
  };

  // Cancel confirmation
  const cancelUpdate = () => {
    setShowConfirmModal(false);
    setSelectedProvider(null);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

 
  return (
    <>
    {loading ? <>
    <TypingLoader/>
    </> : <> 
     <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-2xl mx-auto mt-4 bg-gray-800/90 backdrop-blur-md rounded-xl shadow-xl p-6 border border-gray-700"
      >
        <h2 className="text-2xl font-bold text-gray-100 text-center mb-6">
          AI Provider Settings
        </h2>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-green-500/20 border border-green-500 rounded-lg text-green-400 text-sm"
          >
            {success}
          </motion.div>
        )}

        {settings && (
          <div className="space-y-6">
            {/* Current Active Provider */}
            <motion.div
              variants={itemVariants}
              className="p-4 bg-gray-700/50 rounded-lg border border-gray-600"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">
                    Current Active Provider
                  </p>
                  <p className="text-xl font-semibold text-gray-100">
                    {settings.activeProvider}
                  </p>
                </div>
                <div
                  className={`w-3 h-3 rounded-full ${
                    settings.activeProvider === "OPENAI"
                      ? "bg-green-500"
                      : "bg-blue-500"
                  } animate-pulse`}
                ></div>
              </div>
            </motion.div>

            {/* Provider Selection */}
            <motion.div variants={itemVariants} className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">
                Switch AI Provider
              </label>

              <div className="grid grid-cols-2 gap-4">
                {/* OpenAI Card */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleProviderClick("OPENAI")}
                  disabled={updating || settings.activeProvider === "OPENAI"}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                    settings.activeProvider === "OPENAI"
                      ? "bg-green-600/20 border-green-500 cursor-not-allowed"
                      : "bg-gray-700 border-gray-600 hover:border-green-500 hover:bg-gray-600"
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                  <Bot size={28} />
                    <h3 className="text-lg font-semibold text-gray-100">
                      OpenAI
                    </h3>
                    {settings.activeProvider === "OPENAI" && (
                      <span className="text-xs text-green-400 font-medium">
                        ✓ Active
                      </span>
                    )}
                  </div>
                </motion.button>

                {/* Gemini Card */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleProviderClick("GEMINI")}
                  disabled={updating || settings.activeProvider === "GEMINI"}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                    settings.activeProvider === "GEMINI"
                      ? "bg-blue-600/20 border-blue-500 cursor-not-allowed"
                      : "bg-gray-700 border-gray-600 hover:border-blue-500 hover:bg-gray-600"
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                                     <Sparkle size={28} />

                    <h3 className="text-lg font-semibold text-gray-100">
                      Gemini
                    </h3>
                    {settings.activeProvider === "GEMINI" && (
                      <span className="text-xs text-blue-400 font-medium">
                        ✓ Active
                      </span>
                    )}
                  </div>
                </motion.button>
              </div>
            </motion.div>

            {/* Refresh Button */}
            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={fetchSettings}
              disabled={updating}
              className="w-full py-2 rounded-lg bg-gray-700 text-gray-100 border border-gray-600 hover:bg-gray-600 transition-all duration-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔄 Refresh Settings
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={cancelUpdate}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 rounded-xl border border-gray-700 shadow-2xl max-w-md w-full p-6"
            >
              <div className="text-center mb-6">
                <div className="mx-auto w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mb-4">
                  <svg 
                    className="w-6 h-6 text-blue-500" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-100 mb-2">
                  Confirm Provider Switch
                </h3>
                <p className="text-gray-400 text-sm">
                  Are you sure you want to switch to <span className="font-semibold text-gray-200">{selectedProvider}</span>?
                </p>
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={cancelUpdate}
                  className="flex-1 py-2.5 rounded-lg bg-gray-700 text-gray-100 border border-gray-600 hover:bg-gray-600 transition-all duration-300 text-sm font-medium"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={confirmUpdateProvider}
                  className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 text-sm font-medium"
                >
                  Confirm
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      {updating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="text-gray-100">Updating provider...</span>
            </div>
          </div>
        </motion.div>
      )}
    </> }
     
    </>
  );
};

export default AISettingsComponent;