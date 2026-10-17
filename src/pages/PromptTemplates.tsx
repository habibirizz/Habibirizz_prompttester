import React, { useEffect, useState } from "react";
import { deleteApi, getApi, postApi } from "../utils/api";
import { URLS } from "../utils/urls";
import { motion, AnimatePresence } from "framer-motion";
import PromptById from "./PromptById";
import TypingLoader from "../utils/Lodaer";
import ConfirmationModal from "../utils/ConfirmationModal";
import CreatePromptForm from "../utils/CreatePromptForm";
import { Trash2 } from "lucide-react"; // Import delete icon
import { toast } from "sonner";

interface Prompt {
  _id: string;
  key: string;
  title?: string; 
  generation: string;
  persona: string;
}

const formatPromptKey = (key: string): string => {
  return key
    .split("_")
    .map((word) => {
      if (/^V\d+$/i.test(word)) {
        return `Version ${word.replace("V", "")}`;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
};

// Motion variants for staggered animation
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const tooltipVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0 },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.9 },
};

const PromptTemplates: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [allPrompts, setAllPrompts] = useState<Prompt[]>([]);
  const [filteredPrompts, setFilteredPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedGender, setSelectedGender] = useState<string>("");
  const [selectedGen, setSelectedGen] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<
    "ALL" | "ACTIVE" | "ACTIVE_WEB" | "BOTH_ACTIVE"
  >("ALL");
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateTitle, setDuplicateTitle] = useState("");
  const [selectedDuplicateId, setSelectedDuplicateId] = useState<string | null>(
    null
  );
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => Promise<void>>(
    async () => {}
  );
const [showPasswordModal, setShowPasswordModal] = useState(false);
const [password, setPassword] = useState("");
const [showPassword, setShowPassword] = useState(false);
const [deletingPromptId, setDeletingPromptId] = useState<string | null>(null);
  const isDefaultVersion = (key: string) =>
    /(_GENZ|_MILLENNIAL_V1)$/i.test(key);

  const getAllPrompts = async () => {
    setLoading(true);
    try {
      const response = await getApi(`${URLS.getAllPrompts}`);
      if (response.status === 200) {
        const allP = response?.data?.data?.prompts || [];
        setAllPrompts(allP);
        setFilteredPrompts(allP);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllPrompts();
  }, []);

  useEffect(() => {
    const filtered = allPrompts.filter((p) => {
      const gender = p.persona === "HABIBI" ? "MALE" : "FEMALE";
      const gen = p.generation === "GENZ" ? "GENZ" : "MILLENNIAL";
      if (selectedGender && gender !== selectedGender) return false;
      if (selectedGen && gen !== selectedGen) return false;
      return true;
    });
    setFilteredPrompts(filtered);
  }, [selectedGender, selectedGen, allPrompts]);

  const handleSelectPrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setShowCreateForm(false); 
  };

  const handleOpenCreateForm = () => {
    setShowCreateForm(true);
    setSelectedPrompt(null); 
  };

  useEffect(() => {
    const filtered = allPrompts.filter((p) => {
      const gender = p.persona === "HABIBI" ? "MALE" : "FEMALE";
      const gen = p.generation === "GENZ" ? "GENZ" : "MILLENNIAL";
      const isActive = (p as any).isActive;
      const isActiveWeb = (p as any).isActiveWeb;

      if (selectedGender && gender !== selectedGender) return false;

      if (selectedGen && gen !== selectedGen) return false;

      if (activeFilter === "ACTIVE" && !isActive) return false;
      if (activeFilter === "ACTIVE_WEB" && !isActiveWeb) return false;
      if (activeFilter === "BOTH_ACTIVE" && !(isActive && isActiveWeb))
        return false;

      return true;
    });

    setFilteredPrompts(filtered);
  }, [selectedGender, selectedGen, activeFilter, allPrompts]);

const handleDeletePrompt = (id: string) => {
  setDeletingPromptId(id);
  setShowPasswordModal(true);
};

const confirmDeletePrompt = async () => {
  if (!password.trim()) {
    toast.error("Please enter your password");
    return;
  }

  try {
    const response = await postApi(`${URLS.deletePrompt}`, {
      id: deletingPromptId,
      password,
    });

    if (response.status === 200) {
      toast.success(response.data.message);
      setShowPasswordModal(false);
      setPassword("");
      setDeletingPromptId(null);
      getAllPrompts();
      if (selectedPrompt?._id === deletingPromptId) setSelectedPrompt(null);
    } else {
      
      toast.error("Failed to delete prompt");
    }
  } catch (err: any) {
    toast.error(err.response.data.message || "Invalid Password");
    console.log(err)
  }
};
  const handleDuplicatePrompt = async () => {
    if (!selectedDuplicateId || !duplicateTitle.trim())
      return toast("Enter a title!");
    try {
      const response = await postApi(`${URLS.duplicatePrompt}`, {
        id: selectedDuplicateId,
        title: duplicateTitle,
      });
      if (response.status === 200) {
        toast.success("Prompt duplicated successfully!");
        setShowDuplicateModal(false);
        setDuplicateTitle("");
        setSelectedDuplicateId(null);
        getAllPrompts(); 
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to duplicate prompt");
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      {/* Top Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <div className="flex gap-3 items-center flex-wrap">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpenCreateForm}
            className={`px-6 py-3 rounded-lg text-white transition-all duration-300 ${
              showCreateForm
                ? "bg-green-700 hover:bg-green-700"
                : "bg-green-600  hover:bg-green-700"
            }`}
          >
            Add New Prompt +
          </motion.button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex flex-wrap gap-3 mt-3 sm:mt-0"
        >
          <select
            value={activeFilter}
            onChange={(e) =>
              setActiveFilter(
                e.target.value as
                  | "ALL"
                  | "ACTIVE"
                  | "ACTIVE_WEB"
                  | "BOTH_ACTIVE"
              )
            }
            className="px-3 py-2 rounded-lg bg-gray-700 text-gray-100 border border-gray-600"
          >
            <option value="ALL">All Prompts</option>
            <option value="ACTIVE">Active App Prompts</option>
            <option value="ACTIVE_WEB">Active Tester Prompts</option>
            {/* <option value="BOTH_ACTIVE">Both Active</option> */}
          </select>

          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="px-3 py-2 rounded-lg bg-gray-700 text-gray-100 border border-gray-600"
          >
            <option value="">All Genders</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>

          <select
            value={selectedGen}
            onChange={(e) => setSelectedGen(e.target.value)}
            className="px-3 py-2 rounded-lg bg-gray-700 text-gray-100 border border-gray-600"
          >
            <option value="">All Generations</option>
            <option value="GENZ">Gen Z</option>
            <option value="MILLENNIAL">Millennial</option>
          </select>
        </motion.div>
      </div>

      {/* Create Prompt Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="mb-6"
          >
            <CreatePromptForm
              onCancel={() => setShowCreateForm(false)}
              onCreated={() => {
                getAllPrompts();
                setShowCreateForm(false);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
<div className="flex flex-wrap gap-3 sm:gap-6 text-xs sm:text-sm text-gray-300 mb-6">
        {/* App Active */}
        <motion.div
    className="relative flex items-center gap-1.5 sm:gap-2 cursor-pointer"
          initial="hidden"
          whileHover="visible"
          variants={{
            visible: {},
            hidden: {},
          }}
        >
          <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
          <span>App</span>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 6, scale: 0.95 },
              visible: { opacity: 1, y: 0, scale: 1 },
            }}
            transition={{ duration: 0.25 }}
                 className="absolute bottom-6 left-0 w-max max-w-[200px] sm:max-w-none bg-gray-800 text-gray-100 text-xs px-3 py-2 rounded-md shadow-md pointer-events-none z-10"
          >
            Prompts Active in Mobile App
          </motion.div>
        </motion.div>

        {/* Web Active */}
        <motion.div
    className="relative flex items-center gap-1.5 sm:gap-2 cursor-pointer"
          initial="hidden"
          whileHover="visible"
          variants={{
            visible: {},
            hidden: {},
          }}
        >
    <div className="w-3 h-3 bg-purple-600 rounded-full flex-shrink-0"></div>
    <span className="whitespace-nowrap">Prompt Tester</span>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 6, scale: 0.95 },
              visible: { opacity: 1, y: 0, scale: 1 },
            }}
            transition={{ duration: 0.25 }}
                 className="absolute bottom-6 left-0 w-max max-w-[200px] sm:max-w-none bg-gray-800 text-gray-100 text-xs px-3 py-2 rounded-md shadow-md pointer-events-none z-10"
          >
            Prompts Active only for Web Prompt Testing
          </motion.div>
        </motion.div>

        {/* Both Active */}
        <motion.div
    className="relative flex items-center gap-1.5 sm:gap-2 cursor-pointer"
          initial="hidden"
          whileHover="visible"
          variants={{
            visible: {},
            hidden: {},
          }}
        >
    <div className="w-3 h-3 bg-teal-600 rounded-full flex-shrink-0"></div>
    <span className="whitespace-nowrap">Both</span>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 6, scale: 0.95 },
              visible: { opacity: 1, y: 0, scale: 1 },
            }}
            transition={{ duration: 0.25 }}
                className="absolute bottom-6 left-0 w-max max-w-[200px] sm:max-w-none bg-gray-800 text-gray-100 text-xs px-3 py-2 rounded-md shadow-md pointer-events-none z-10"
          >
            Active for both App & Prompt Tester Site
          </motion.div>
        </motion.div>
      </div>

      {/* Prompts List */}
      {loading ? (
        <TypingLoader />
      ) : filteredPrompts.length === 0 ? (
        <p className="text-gray-300 text-center mt-6">No prompts available.</p>
      ) : (
        <motion.div
  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence>
            <AnimatePresence>
              {filteredPrompts &&
                !showCreateForm &&
                filteredPrompts.map((prompt) => {
                  const isSelected = selectedPrompt?._id === prompt._id;
                  const isActive = (prompt as any).isActive;
                  const isActiveWeb = (prompt as any).isActiveWeb;

                  return (
                 <motion.div
  key={prompt._id}
  layout
  variants={itemVariants}
  initial="hidden"
  animate="visible"
  exit="exit"
  className="relative"
>
 <motion.button
  className={`w-full px-5 py-3 pt-10 rounded-lg font-medium text-sm transition-all duration-300 min-w-[140px] text-left border-4
    ${
      isSelected
        ? "border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" // glow effect
        : "border-transparent"
    }
    ${
      isActive && isActiveWeb
        ? "bg-teal-600 text-white shadow-md"
        : isActiveWeb
        ? "bg-purple-600 text-white shadow-md hover:bg-purple-700"
        : isActive
        ? "bg-orange-600 text-white shadow-md hover:bg-orange-700"
        : "bg-gray-700 text-white hover:bg-gray-600"
    }`}
  whileHover={{ scale: 1.03 }}
  whileTap={{ scale: 0.95 }}
  onClick={() => handleSelectPrompt(prompt)}
>
  <div className="font-semibold">
    {(prompt as any).title || formatPromptKey(prompt.key)}
  </div>
  <div className="text-xs mt-2 opacity-80">
    <div>
      Created:{" "}
      {new Date((prompt as any).createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })}
    </div>
    <div>
      Modified:{" "}
      {new Date((prompt as any).updatedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })}
    </div>
  </div>
</motion.button>

  <div className="absolute top-2 right-2 flex gap-4 z-10 ">
    <button
      onClick={(e) => {
        e.stopPropagation();
        setSelectedDuplicateId(prompt._id);
        setShowDuplicateModal(true);
      }}
      className="p-1.5 rounded bg-white bg-opacity-10 hover:bg-white hover:bg-opacity-40 transition-all duration-200 group"
      title="Duplicate Prompt"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-white group-hover:text-white transition-colors"
      >
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
    </button>

    {!isDefaultVersion(prompt.key) && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDeletePrompt(prompt._id);
        }}
        className="p-1.5 rounded bg-white bg-opacity-10 hover:bg-red-500 hover:bg-opacity-100 transition-all duration-200 group"
        title="Delete Prompt"
      >
        <Trash2 size={14} className="text-white group-hover:text-white transition-colors" />
      </button>
    )}
  </div>
</motion.div>
                  );
                })}
            </AnimatePresence>
          </AnimatePresence>
        </motion.div>
      )}

      {selectedPrompt && (
        <PromptById
          id={selectedPrompt._id}
          onRequestLoadToProduction={(action) => {
            setConfirmAction(() => action);
            setIsConfirmOpen(true);
          }}
           onPromptUpdated={getAllPrompts} 
        />
      )}

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={async () => {
          await confirmAction();
          setIsConfirmOpen(false);
        }}
      />


<AnimatePresence>
  {showDuplicateModal && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 px-4 py-6"
      onClick={() => setShowDuplicateModal(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-800 text-white rounded-xl p-5 sm:p-6 w-full max-w-[calc(100%-2rem)] sm:max-w-md shadow-2xl border border-gray-700 overflow-y-auto max-h-[85vh]"
      >
        <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">
          Duplicate Prompt
        </h2>
        <p className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-5">
          Create a copy of this prompt with a new title
        </p>

        <div className="mb-5 sm:mb-6">
          <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
            New Prompt Title
          </label>
          <input
            type="text"
            placeholder="Enter New Title"
            value={duplicateTitle}
            onChange={(e) => setDuplicateTitle(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
            autoFocus
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
          <button
            onClick={() => {
              setShowDuplicateModal(false);
              setDuplicateTitle("");
              setSelectedDuplicateId(null);
            }}
            className="px-4 py-2 sm:px-5 sm:py-2.5 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-all duration-200 font-medium text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={handleDuplicatePrompt}
            disabled={!duplicateTitle.trim()}
            className="px-4 py-2 sm:px-5 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm sm:text-base"
          >
            Duplicate Prompt
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

<AnimatePresence>
  {showPasswordModal && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4 py-6"
      onClick={() => setShowPasswordModal(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-800 border border-gray-700 text-white rounded-xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 w-full max-w-[calc(100%-2rem)] sm:max-w-md overflow-y-auto max-h-[85vh]"
      >
        <h2 className="text-base sm:text-lg font-semibold mb-3">
          Confirm Deletion
        </h2>
        <p className="text-xs sm:text-sm text-gray-400 mb-5 sm:mb-6">
          Enter your admin password to delete this prompt permanently.
        </p>

        <div className="relative mb-5 sm:mb-6">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 pr-10 sm:pr-12 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
          >
            {!showPassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-10-8-10-8a18.07 18.07 0 0 1 4.27-5.94M1 1l22 22" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
          <button
            onClick={() => {
              setShowPasswordModal(false);
              setPassword("");
              setDeletingPromptId(null);
            }}
            className="px-4 py-2 sm:px-5 sm:py-2.5 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-all duration-200 font-medium text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={confirmDeletePrompt}
            className="px-4 py-2 sm:px-5 sm:py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-medium text-sm sm:text-base"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>



    </div>
  );
};

export default PromptTemplates;
