import React, { useState } from "react";
import { motion } from "framer-motion";

interface CreatePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function CreatePromptModal({ isOpen, onClose, onCreated }: CreatePromptModalProps) {
  const [key, setKey] = useState("");
  const [generation, setGeneration] = useState("");
  const [persona, setPersona] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Call your API here to create new prompt
      console.log({ key, generation, persona });

      // After success
      onCreated(); // refresh list
      onClose();   // close modal
    } catch (error) {
      console.error("Failed to create prompt", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-800 p-6 rounded-2xl shadow-lg w-[400px] text-white"
      >
        <h2 className="text-xl font-semibold mb-4">Create New Prompt</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Generation"
            value={generation}
            onChange={(e) => setGeneration(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Persona"
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500"
            >
              Create
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default CreatePromptModal;
