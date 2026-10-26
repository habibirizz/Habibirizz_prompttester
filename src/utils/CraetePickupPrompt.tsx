import { useState } from "react";
import { motion } from "framer-motion";
import { postApi } from "../utils/api";
import { URLS } from "../utils/urls";

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

interface CreatePromptFormProps {
  onCancel: () => void;
  onCreated: () => void;
}

const formatLabel = (key: string): string => {
  return key
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const languageLabels: Record<string, string> = {
  en: "English",
  ar: "Arabic",
  arbz: "Arabizi",
};

const dialectLabels: Record<string, string> = {
  EGYPTIAN: "Egyptian",
  IRAQI: "Iraqi",
  LEBANESE: "Lebanese",
  PALESTINIAN: "Palestinian",
  JORDANIAN: "Jordanian",
  MOROCCAN: "Moroccan",
  ALGERIAN: "Algerian",
  SYRIAN: "Syrian",
  SUDANESE: "Sudanese",
  SOMALI: "Somali",
  YEMENI: "Yemeni",
  TUNISIAN: "Tunisian",
  SAUDI: "Saudi",
  EMIRATI: "Emirati",
  KUWAITI: "Kuwaiti",
  QATARI: "Qatari",
  BAHRANI: "Bahraini",
  OMANI: "Omani",
  LIBYAN: "Libyan",
  MAURITANIAN: "Mauritanian",
  DJIBOUTIAN: "Djiboutian",
  COMORIAN: "Comorian",
};


interface PromptData {
  gender: "MALE" | "FEMALE" | "";
  isGenZ: boolean;
  role: string;
  title:string;
  submissionPrompt:string;
  messageTypes: Record<string, string>;
  styles: Record<string, string>;
  languages: Record<string, string>;
  dialects: Record<string, string>;
  optimized: {
    role: string;
    messageTypes: Record<string, string>;
    styles: Record<string, string>;
    languages: Record<string, string>;
    dialects: Record<string, string>;
  };
  [key: string]: any;
}

const cleanPayload = (data: any) => {
  const result: any = {};

  // Define required subkeys for every nested object
  const requiredKeysMap: Record<string, string[]> = {
    messageTypes: ["uploadScreenshot", "addManually", "pickup"],
    languages: ["en", "ar", "arbz"],
dialects: [
  "EGYPTIAN",
  "IRAQI",
  "LEBANESE",
  "PALESTINIAN",
  "JORDANIAN",
  "MOROCCAN",
  "ALGERIAN",
  "SYRIAN",
  "SUDANESE",
  "SOMALI",
  "YEMENI",
  "TUNISIAN",
  "SAUDI",
  "EMIRATI",
  "KUWAITI",
  "QATARI",
  "BAHRANI",
  "OMANI",
  "LIBYAN",
  "MAURITANIAN",
  "DJIBOUTIAN",
  "COMORIAN"
],
    styles: [
      "CONSERVATIVE",
      "PLAYFUL",
      "CONFIDENT",
      "FLIRTY",
      "MODEST",
      "SASSY",
    ],
  };

  for (const key in data) {
    const value = data[key];

    if (value === "" || value === null || value === undefined) continue;

    if (typeof value === "object" && !Array.isArray(value)) {
      const nested: any = {};

      // If the key has predefined required subkeys, ensure all exist (even empty)
      if (requiredKeysMap[key]) {
        requiredKeysMap[key].forEach((subKey) => {
          nested[subKey] = value[subKey] ?? "";
        });
        result[key] = nested;
      } else {
        // Recursively clean other nested objects (like optimized)
        const nestedCleaned = cleanPayload(value);
        if (Object.keys(nestedCleaned).length) result[key] = nestedCleaned;
      }
    } else {
      result[key] = value;
    }
  }

  return result;
};

const CreatePickupPromptForm: React.FC<CreatePromptFormProps> = ({
  onCancel,
  onCreated,
}) => {
  const [formData, setFormData] = useState<PromptData>({
    gender: "",
    isGenZ: false,
    role: "",
    title:"",
    messageTypes: { uploadScreenshot: "", addManually: "", pickup: "" },
    styles: {
      CONSERVATIVE: "",
      PLAYFUL: "",
      CONFIDENT: "",
      FLIRTY: "",
      MODEST: "",
      SASSY: "",
    },
    languages: { en: "", ar: "", arbz: "" },
dialects: {
  EGYPTIAN: "",
  IRAQI: "",
  LEBANESE: "",
  PALESTINIAN: "",
  JORDANIAN: "",
  MOROCCAN: "",
  ALGERIAN: "",
  SYRIAN: "",
  SUDANESE: "",
  SOMALI: "",
  YEMENI: "",
  TUNISIAN: "",
  SAUDI: "",
  EMIRATI: "",
  KUWAITI: "",
  QATARI: "",
  BAHRANI: "",
  OMANI: "",
  LIBYAN: "",
  MAURITANIAN: "",
  DJIBOUTIAN: "",
  COMORIAN: ""
},
    optimized: {
      role: "",
      messageTypes: {},
      styles: {},
      languages: {},
      dialects: {},
    },
    submissionPrompt:""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>(
    {}
  );

  const handleInputChange = (
    field: keyof PromptData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedChange = (
    parentField: string,
    childField: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [parentField]: { ...(prev[parentField] || {}), [childField]: value },
    }));
  };

  const toggleAccordion = (field: string) => {
    setOpenAccordions((prev) => ({ ...prev, [field]: !prev[field] }));
  };

const renderInputField = (
  label: string,
  value: string,
  onChange: (value: string) => void,
  isTextarea: boolean = true,  // default to textarea
  isRequired: boolean = false,
  titleField = false
) => {
  const isEmpty = isRequired && !value.trim();

  // Title field ONLY stays input
  if (titleField) {
    return (
      <motion.div variants={itemVariants} className="flex-1 min-w-[200px] mb-3">
        <label className="text-sm sm:text-base font-medium text-gray-300 mb-1 text-left flex items-center gap-1">
          {label}
          {isRequired && <span className="text-red-500">*</span>}
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full h-12 px-3 py-2 rounded-lg bg-gray-700 text-gray-100 border ${
            isEmpty ? "border-red-500" : "border-gray-600"
          } focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`}
          placeholder={`Enter ${label}`}
        />
      </motion.div>
    );
  }

  // All other fields use textarea
  return (
    <motion.div variants={itemVariants} className="flex-1 min-w-[200px] mb-3">
      <label className="text-sm sm:text-base font-medium text-gray-300 mb-1 text-left flex items-center gap-1">
        {label}
        {isRequired && <span className="text-red-500">*</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 rounded-lg bg-gray-700 text-gray-100 border ${
          isEmpty ? "border-red-500" : "border-gray-600"
        } focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[100px] resize-y`}
        placeholder={`Enter ${label}`}
      />
    </motion.div>
  );
};


  const renderNestedFields = (title: string, obj: Record<string, any>) => (
    <motion.div variants={itemVariants} className="mb-4 sm:mb-6">
      <div className="p-2 sm:p-3 bg-gray-800 rounded-lg border border-gray-600">
        <motion.div
          onClick={() => toggleAccordion(title)}
          className="cursor-pointer flex justify-between items-center"
        >
          <h4 className="text-base sm:text-lg font-semibold text-gray-100 mb-2 capitalize text-left flex items-center gap-1">
            {formatLabel(title)}
            {title.toLowerCase() === "messagetypes" && (
              <span className="text-red-500">*</span>
            )}
          </h4>

          <motion.span
            animate={{ rotate: openAccordions[title] ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="text-gray-400"
          >
            ▼
          </motion.span>
        </motion.div>
        {openAccordions[title] && (
          <div className="space-y-2 pt-2">
            {Object.entries(obj).map(([key, value]) => {
              let displayLabel = key;
              if (title.toLowerCase() === "languages") {
                displayLabel = languageLabels[key] || formatLabel(key);
              } else if (title.toLowerCase() === "dialects") {
                displayLabel = dialectLabels[key] || formatLabel(key);
              } else {
                displayLabel = formatLabel(key);
              }

              return (
                <div key={key}>
                  {renderInputField(
                    displayLabel,
                    typeof value === "string" ? value : String(value),
                    (val) => handleNestedChange(title, key, val),
                    false,
                    title.toLowerCase() === "messagetypes"
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );

  const createPrompt = async () => {
    if (!formData.gender) return setError("Please select a gender");

    const messageTypes = formData.messageTypes;
    const allMessageTypesFilled = Object.values(messageTypes).every(
      (val) => val.trim() !== ""
    );

    if (!allMessageTypesFilled) {
      setError("Please fill all Message Types before creating a prompt.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = cleanPayload(formData);

      const response = await postApi(`${URLS.createPrompt}?type=pickup`, payload);
      if (response.status === 200) {
        setSuccess("Prompt created successfully!");
        setTimeout(() => setSuccess(null), 3000);
        onCreated();
      } else {
        setError("Failed to create prompt.");
      }
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("An error occurred while creating the prompt.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-4xl bg-gray-800/90 backdrop-blur-md rounded-xl shadow-xl p-6 sm:p-8 border border-gray-700 pt-10 mt-[20px]"
    >
      {error && (
        <div className="mb-4 p-3 bg-red-600/20 border border-red-600 rounded-lg text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-600/20 border border-green-600 rounded-lg text-green-400">
          {success}
        </div>
      )}

      <h2 className="text-2xl sm:text-3xl font-bold text-gray-100 text-left mb-6 sm:mb-8">
        Create Prompt
      </h2>

      {formData.gender && (
        <>
         {renderInputField(
  "Title",
  formData.title,
  (val) => handleInputChange("title", val),
  false,
  false,
  true
)}

          </>
      )}

      {/* Gender */}
      <div className="mb-4">
        <label className="block text-sm sm:text-base font-medium text-gray-300 mb-1 text-start">
          Gender
        </label>
        <select
          value={formData.gender}
          onChange={(e) => handleInputChange("gender", e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Gender</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </select>
      </div>

      {/* Show isGenz only after gender is selected */}
      {formData.gender && (
        <div className="mb-4 flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.isGenZ}
            onChange={(e) => handleInputChange("isGenZ", e.target.checked)}
            className="w-4 h-4 accent-blue-600"
          />
          <label className="text-gray-300 font-medium">Is GenZ?</label>
        </div>
      )}

      {/* Show other fields only after gender is selected */}
      {formData.gender && (
        <>
          {renderInputField(
            "Role",
            formData.role,
            (val) => handleInputChange("role", val),
            true,
          
          )}

        
          {renderNestedFields("messageTypes", formData.messageTypes)}

          {renderNestedFields("languages", formData.languages)}
          {renderNestedFields("dialects", formData.dialects)}
          {renderNestedFields("styles", formData.styles)}

          {/* No Submission Prompt field: it is stored but never reaches the
              model on this collection, so editing it changed nothing. The
              conversation prompt keeps its own, which IS sent. */}

        </>
      )}

      <div className="flex justify-end gap-4 mt-6">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-white font-semibold bg-gray-600 hover:bg-gray-700 transition-all duration-200"
        >
          Cancel
        </button>
        <button
          onClick={createPrompt}
          disabled={loading || !formData.gender}
          className={`px-4 py-2 rounded-lg text-white font-semibold transition-all duration-200 ${
            loading
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Creating..." : "Create Prompt"}
        </button>
      </div>
    </motion.div>
  );
};

export default CreatePickupPromptForm;
