import { motion, AnimatePresence } from "framer-motion";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Background Overlay */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            className="relative bg-gray-900 text-white rounded-2xl shadow-2xl w-[90%] max-w-md p-8"
            initial={{ scale: 0.8, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 40 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {/* Title */}
            <h3 className="text-2xl font-bold mb-3 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Load Prompt to Production
            </h3>

            {/* Message */}
            <p className="text-gray-300 text-center mb-8">
              Are you sure you want to <span className="font-semibold">publish</span> 
              this prompt into <span className="text-green-400">Production</span>?  
              This will overwrite the existing production version if it exists.
            </p>

            {/* Actions */}
            <div className="flex justify-center gap-4">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 transition text-sm font-medium"
              >
                Cancel
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onConfirm}
                disabled={loading}
                className={`px-5 py-2.5 rounded-xl text-white font-semibold text-sm shadow-lg transition ${
                  loading
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                }`}
              >
                {loading ? "Publishing..." : "Yes, Publish"}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;
