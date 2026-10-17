import React, { useState } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { postApi } from "./api";
import { URLS } from "./urls";

interface AddPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "scenario" | "relationshipLevel" | null;
  mainConvoId: string;
  setEditedData: React.Dispatch<React.SetStateAction<any>>;
}

const AddPromptModal: React.FC<AddPromptModalProps> = ({
  isOpen,
  onClose,
  type,
  mainConvoId,
  setEditedData,
}) => {
  const [title, setTitle] = useState<string>("");
  const [promptAddOn, setPromptAddOn] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (!title.trim() || !promptAddOn.trim()) {
      toast.error("Please fill all fields");
      return;
    }

    if (!type) return;

    setLoading(true);
    try {
      const payload = { mainConvoId, title, promptAddOn };

      let response;
      if (type === "scenario") {
        response = await postApi(URLS.createScenarioAndAttach, payload);
      } else if (type === "relationshipLevel") {
        response = await postApi(
          URLS.createRelationshipLevelAndAttach,
          payload
        );
      }

      const newItem =
        response?.data?.data?.createdScenario ||
        response?.data?.data?.createdRelationshipLevel;

      if (newItem) {
        setEditedData((prev: any) => ({
          ...prev,
          [type === "scenario" ? "scenarios" : "relationshipLevels"]: [
            ...(prev[
              type === "scenario" ? "scenarios" : "relationshipLevels"
            ] || []),
            newItem,
          ],
        }));
      }

      if (response?.status === 200) {
        toast.success(
          `${
            type === "scenario" ? "Scenario" : "Relationship Level"
          } created successfully!`
        );

        onClose();
        setTitle("");
        setPromptAddOn("");
      } else {
        toast.error("Something went wrong!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error creating item!");
    } finally {
      setLoading(false);
    }
  };

  // Don't render anything if modal is not open
  if (!isOpen) return null;

  // Modal content
  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-2xl p-6 w-[90%] max-w-md shadow-xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Add {type === "scenario" ? "Scenario" : "Relationship Level"}
            </h2>

            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              />

              <textarea
                placeholder="Prompt Add-On"
                value={promptAddOn}
                onChange={(e) => setPromptAddOn(e.target.value)}
                className="border border-gray-300 rounded-lg p-2 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-800"
              />
            </div>

            <div className="flex justify-end mt-5 gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Render modal to document.body using portal
  return ReactDOM.createPortal(modalContent, document.body);
};

export default AddPromptModal;
