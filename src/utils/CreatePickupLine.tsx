import React, { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { postApi } from "./api";
import { URLS } from "./urls";
// import { postApi } from "../utils/api";
// import { URLS } from "../utils/urls";

// Dialect options
const dialectOptions = [
  { name: "Egyptian", value: "EGYPTIAN" },
  { name: "Iraqi", value: "IRAQI" },
  { name: "Lebanese", value: "LEBANESE" },
  { name: "Palestinian", value: "PALESTINIAN" },
  { name: "Jordanian", value: "JORDANIAN" },
  { name: "Moroccan", value: "MOROCCAN" },
  { name: "Algerian", value: "ALGERIAN" },
  { name: "Syrian", value: "SYRIAN" },
  { name: "Sudanese", value: "SUDANESE" },
  { name: "Somali", value: "SOMALI" },
  { name: "Yemeni", value: "YEMENI" },
  { name: "Tunisian", value: "TUNISIAN" },
  { name: "Saudi", value: "SAUDI" },
  { name: "Emirati", value: "EMIRATI" },
  { name: "Kuwaiti", value: "KUWAITI" },
  { name: "Qatari", value: "QATARI" },
  { name: "Bahraini", value: "BAHRAINI" },
  { name: "Omani", value: "OMANI" },
  { name: "Libyan", value: "LIBYAN" },
  { name: "Mauritanian", value: "MAURITANIAN" },
  { name: "Djiboutian", value: "DJIBOUTIAN" },
  { name: "Comorian", value: "COMORIAN" },
];

const CreatePickupLine = () => {
  const [formData, setFormData] = useState({
    pickupLine: "",
    language: "ar",
    dialect: "EGYPTIAN",
    gender: "Male",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.pickupLine.trim()) {
      toast.error("Please enter a pickup line");
      return;
    }

    if (formData.language === "ar" && !formData.dialect) {
      toast.error("Please select a dialect for Arabic");
      return;
    }

    setLoading(true);
    try {
      const response = await postApi(URLS.createPickupLine, formData);
      if (response.status === 201) {
        toast.success("Pickup line created successfully!");
        setFormData({
          pickupLine: "",
          language: "ar",
          dialect: "EGYPTIAN",
          gender: "Male",
    
        });
      }

    } catch (error:any) {
      toast.error(error?.response?.data?.message || "Failed to create pickup line");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (lang:any) => {
    setFormData({
      ...formData,
      language: lang,
      dialect: lang === "ar" ? "EGYPTIAN" : "",
    });
  };

 return (
   <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -10 }}
  className="max-w-2xl mx-auto bg-gray-800/70 backdrop-blur-sm rounded-2xl p-7 sm:p-9 shadow-xl"
>

    <h2 className="text-2xl sm:text-3xl font-semibold text-white text-center mb-8 sm:mb-10">
      Create New Pickup Line
    </h2>

    <form className="space-y-7">
      {/* Pickup Line Textarea */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2  text-start">
          Pickup Line <span className="text-red-400 text-base">*</span>
        </label>
        <textarea
          value={formData.pickupLine}
          onChange={(e) => setFormData({ ...formData, pickupLine: e.target.value })}
          placeholder="Write your pickup line here..."
          rows={4}
          className="w-full px-4 py-3.5 bg-gray-900/60 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all resize-y min-h-[120px]"
        />
      </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2 text-start">
              Language <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900/60 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/30 transition-all appearance-none"
            >
              <option value="ar">Arabic</option>
              <option value="en">English</option>
            </select>
          </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2 text-start">
                Dialect <span className="text-red-400">*</span>
                
              </label>
              <select
                value={formData.dialect}
                 disabled={formData.language === "en"}
                onChange={(e) => setFormData({ ...formData, dialect: e.target.value })}
               
                className="w-full px-4 py-3 bg-gray-900/60 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/30 transition-all appearance-none"
              >
                <option value="">Select dialect</option>
                {dialectOptions.map((dialect) => (
                  <option key={dialect.value} value={dialect.value}>
                    {dialect.name}
                  </option>
                ))}
              </select>
            </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2 text-start">
              Intended Gender <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900/60 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/30 transition-all appearance-none"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          {/* Gen Z Toggle
          <div className="flex items-center justify-between py-3 text-start">
            <div>
              <label className="text-sm font-medium text-gray-200">Gen Z Style</label>
              <p className="text-sm text-gray-400 mt-0.5">
                Make it sound more modern / Gen Z friendly
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isGenz}
                onChange={() => setFormData({ ...formData, isGenz: !formData.isGenz })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
            </label>
          </div> */}

          {/* Submit Button */}
     <motion.button
        whileHover={{ scale: loading ? 1 : 1.03, boxShadow: "0 10px 25px rgba(59,130,246,0.3)" }}
        whileTap={{ scale: loading ? 1 : 0.97 }}
        onClick={handleSubmit}
        disabled={loading}
        className={`
          w-full py-4 px-8 rounded-xl font-semibold text-base shadow-xl transition-all duration-300
          bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700
          disabled:opacity-50 disabled:cursor-not-allowed
          text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-gray-900
        `}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-3">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Creating...
          </span>
        ) : (
          "Create Pickup Line"
        )}
      </motion.button>
    </form>
</motion.div>
  );
};

export default CreatePickupLine;