import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getApi, postApi } from "../utils/api";
import ModelPicker from "../components/ModelPicker";
import { catalogPrefixFor, toCatalogId, toProviderModelId } from "../utils/modelId";
import { URLS } from "../utils/urls";
import { toast } from "sonner";
import ConversationPromptEditor from "../utils/ConversationPromptEditor";
import { useConvoGenerator } from "../context/ConvoGeneratorContext";
import { useAIProvider } from "../context/AIProviderContext";
import Select, { SingleValue } from "react-select";

interface ConvoGeneratorProps {
  setGlobalLoading: (loading: boolean) => void;
}

type DialectOption = {
  value: string;
  label: string;
};

const ConvoGenerator: React.FC<ConvoGeneratorProps> = ({
  setGlobalLoading,
}) => {
  const { provider, loading: providerLoading } = useAIProvider();
  const { settings, updateSettings } = useConvoGenerator();

  const [maleName, setMaleName] = useState("");
  const [femaleName, setFemaleName] = useState("");

  const [language, setLanguage] = useState(settings.language);
  const [dialect, setDialect] = useState(settings.dialect);
  const [tone, setTone] = useState(settings.tone);
  const [femaleTone, setFemaleTone] = useState(settings.femaleTone);
  const [isGenZ, setIsGenZ] = useState(settings.isGenZ);
  const [gptModel, setGptModel] = useState(() => {
    if (providerLoading) return "";

    if (provider === "GEMINI") return "gemini-3.8-flash";
    if (provider === "OPENAI") return settings.gptModel || "gpt-4o-mini";
    return "gemini-3.8-flash";
  });
  const [temperature, setTemperature] = useState(settings.temperature);

  const [scenarioCategory, setScenarioCategory] = useState(
    settings.scenarioCategory
  );
  const [relationshipLevel, setRelationshipLevel] = useState("");
  const [conversationLength, setConversationLength] = useState(
    settings.conversationLength
  );
  const [personaDirection, setPersonaDirection] = useState(
    settings.personaDirection
  );
  const [conversation, setConversation] = useState<string[]>([]);
  const [metaData, setMetaData] = useState<any>(null);

  const [generatedMaleName, setGeneratedMaleName] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customMin, setCustomMin] = useState("");
  const [customMax, setCustomMax] = useState("");
  const [promptAccordionOpen, setPromptAccordionOpen] = useState(false);
  const [inputAccordionOpen, setInputAccordionOpen] = useState(false);
  const [outputAccordionOpen, setOutputAccordionOpen] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiOutput, setAiOutput] = useState<any>(null);
  const [promptUsed, setPromptUsed] = useState<any>(null);
  const [customScenario, setCustomScenario] = useState("");
  const [customRelationshipLevel, setCustomRelationshipLevel] = useState("");
  const [selectedScenario, setSelectedScenario] = useState<any>(null);
  const [selectedRelationshipLevel, setSelectedRelationshipLevel] =
    useState<any>(null);
  const [selectedConversationLength, setSelectedConversationLength] =
    useState<any>(null);
  // API Data
  const [scenariosData, setScenariosData] = useState<any[]>([]);

  const [conversationLengthsData, setConversationLengthsData] = useState<any[]>(
    []
  );

  const languages = [
    { value: "english", label: "English" },
    { value: "arabic", label: "Arabic" },
    { value: "arabizi", label: "Arabizi" },
  ];

  const dialects = [
    { label: "Egyptian", value: "EGYPTIAN" },
    { label: "Iraqi", value: "IRAQI" },
    { label: "Lebanese", value: "LEBANESE" },
    { label: "Palestinian", value: "PALESTINIAN" },
    { label: "Jordanian", value: "JORDANIAN" },
    { label: "Moroccan", value: "MOROCCAN" },
    { label: "Algerian", value: "ALGERIAN" },
    { label: "Syrian", value: "SYRIAN" },
    { label: "Sudanese", value: "SUDANESE" },
    { label: "Somali", value: "SOMALI" },
    { label: "Yemeni", value: "YEMENI" },
    { label: "Tunisian", value: "TUNISIAN" },
    { label: "Saudi", value: "SAUDI" },
    { label: "Emirati", value: "EMIRATI" },
    { label: "Kuwaiti", value: "KUWAITI" },
    { label: "Qatari", value: "QATARI" },
    { label: "Bahraini", value: "BAHRAINI" },
    { label: "Omani", value: "OMANI" },
    { label: "Libyan", value: "LIBYAN" },
    { label: "Mauritanian", value: "MAURITANIAN" },
    { label: "Djiboutian", value: "DJIBOUTIAN" },
    { label: "Comorian", value: "COMORIAN" },
  ];

  const options: DialectOption[] = dialects.map((d) => ({
    value: d.value,
    label: d.label,
  }));

  const tones = ["confident", "flirty", "playful", "conservative"];

  const femaletones = ["modest", "playful", "sassy", "flirty"];

  const maleNames = [
    "Ahmed",
    "Mohammed",
    "Omar",
    "Ali",
    "Hassan",
    "Hussein",
    "Khalid",
    "Fahad",
    "Abdullah",
    "Ibrahim",
    "Youssef",
    "Ismail",
    "Tariq",
    "Sultan",
    "Rashid",
    "Amir",
    "Bilal",
    "Nasser",
    "Sami",
    "Kareem",
    "Jamal",
    "Hamza",
    "Faisal",
    "Mansoor",
    "Zaid",
    "Saif",
    "Adnan",
    "Rami",
    "Nabil",
    "Imran",
    "Farid",
    "Talal",
    "Majed",
    "Bader",
    "Anas",
    "Mahmoud",
    "Mustafa",
    "Ayoub",
    "Waleed",
    "Hadi",
    "Marwan",
    "Bassam",
    "Hazem",
    "Kamal",
    "Yahya",
    "Ayman",
    "Samir",
    "Luay",
    "Mutaz",
    "Zuhair",
    "Qasem",
    "Firas",
    "Tamer",
    "Ameen",
    "Anwar",
    "Hisham",
    "Sameer",
    "Rafik",
    "Zaki",
    "Nadim",
    "Khalil",
    "Jabir",
    "Mazin",
    "Rayan",
    "Yasser",
    "Wael",
    "Othman",
    "Salim",
    "Saeed",
    "Musa",
    "Laith",
    "Jad",
    "Fadi",
    "Munir",
    "Ashraf",
    "Rasheed",
    "Adel",
    "Jaber",
    "Ghaith",
    "Aref",
    "Hatem",
    "Qais",
    "Amer",
    "Shadi",
    "Murad",
    "Bakr",
    "Issa",
    "Alaa",
    "Fawwaz",
    "Fahim",
    "Nawaf",
    "Thamer",
    "Bashir",
    "Wissam",
    "Rabi",
    "Harith",
    "Younes",
    "Rayyan",
  ];

  const femaleNames = [
    "Aisha",
    "Fatima",
    "Zainab",
    "Khadija",
    "Maryam",
    "Huda",
    "Nour",
    "Layla",
    "Aaliyah",
    "Amira",
    "Yasmin",
    "Sara",
    "Reem",
    "Lina",
    "Hana",
    "Rania",
    "Iman",
    "Maha",
    "Ruqayya",
    "Samar",
    "Nadia",
    "Salma",
    "Noor",
    "Muna",
    "Sahar",
    "Farah",
    "Rima",
    "Amal",
    "Basma",
    "Laila",
    "Najwa",
    "Asma",
    "Dina",
    "Sumaya",
    "Rita",
    "Jana",
    "Rahaf",
    "Ahlam",
    "Razan",
    "Mariam",
    "Abeer",
    "Nouran",
    "Dalia",
    "Rowan",
    "Jumana",
    "Maysaa",
    "Mira",
    "Wafa",
    "Hanan",
    "Fajr",
    "Shaden",
    "Rawan",
    "Aseel",
    "Amani",
    "Malak",
    "Rimas",
    "Tasneem",
    "Haneen",
    "Alya",
    "Jouri",
    "Lama",
    "Doaa",
    "Dalal",
    "Samira",
    "Nawal",
    "Lubna",
    "Mona",
    "Salsabil",
    "Zahra",
    "Raya",
    "Safiya",
    "Ward",
    "Shahed",
    "Yasmina",
    "Aseela",
    "Leen",
    "Tamara",
    "Rasha",
    "Rabab",
    "Nisreen",
    "Thuraya",
    "Wijdan",
    "Rafif",
    "Reema",
    "Nourah",
    "Joud",
    "Ghada",
    "Ikram",
    "Sundus",
    "Manar",
    "Kawthar",
    "Hadeel",
    "Maram",
    "Sally",
    "Hessa",
    "Jannat",
    "Sirine",
    "Mais",
  ];

  const togglePromptAccordion = () =>
    setPromptAccordionOpen(!promptAccordionOpen);
  const toggleInputAccordion = () => setInputAccordionOpen(!inputAccordionOpen);
  const toggleOutputAccordion = () =>
    setOutputAccordionOpen(!outputAccordionOpen);

  // Sync gptModel with provider on mount and when provider changes
  useEffect(() => {
    if (!providerLoading && provider) {
      const defaultModel =
        provider === "GEMINI" ? "gemini-3.8-flash" : "gpt-4o-mini";

      if (
        !gptModel ||
        (provider === "GEMINI" && !gptModel.includes("gemini")) ||
        (provider === "OPENAI" && !gptModel.includes("gpt"))
      ) {
        setGptModel(defaultModel);
        updateSettings({ gptModel: defaultModel });
      }
    }
  }, [provider, providerLoading]);

  // Sync gptModel when provider changes
  useEffect(() => {
    if (!providerLoading && provider && gptModel) {
      const defaultModel =
        provider === "GEMINI" ? "gemini-3.8-flash" : "gpt-4o-mini";

      if (
        (provider === "GEMINI" && !gptModel.includes("gemini")) ||
        (provider === "OPENAI" && !gptModel.includes("gpt"))
      ) {
        setGptModel(defaultModel);
        updateSettings({ gptModel: defaultModel });
      }
    }
  }, [provider, providerLoading]);

  // Fetch API data on mount
  useEffect(() => {
    const fetchPromptsData = async () => {
      try {
        const res = await getApi(URLS.getMergedConvoData);
        if (res?.status === 200) {
          const data = res.data.data;
          setScenariosData(data.scenarios || []);
          setConversationLengthsData(data.conversationLengths || []);

          const defaultRelationship = data.relationshipLevels?.[0];

          if (defaultRelationship) {
            setRelationshipLevel(defaultRelationship._id);
            setSelectedRelationshipLevel(defaultRelationship);
          }
        } else {
          toast.error("Failed to fetch prompts data");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error fetching prompts data");
      }
    };

    fetchPromptsData();
  }, []);

  const generateRandomNames = () => {
    const randomMale = maleNames[Math.floor(Math.random() * maleNames.length)];
    const randomFemale =
      femaleNames[Math.floor(Math.random() * femaleNames.length)];
    setMaleName(randomMale);
    setFemaleName(randomFemale);

    // Clear conversation when names change to prevent mismatch
    if (conversation.length > 0) {
      setConversation([]);
      setMetaData(null);
      setAiInput("");
      setAiOutput(null);
      setPromptUsed(null);
      setGeneratedMaleName("");
    }
  };

  useEffect(() => {
    if (!hasSubmitted) return;

    const newErrors: Record<string, string> = {};

    if (!maleName.trim()) newErrors.maleName = "Male name is required";
    if (!femaleName.trim()) newErrors.femaleName = "Female name is required";
    if (!language) newErrors.language = "Language is required";

    if ((language === "arabic" || language === "arabizi") && !dialect)
      newErrors.dialect = "Dialect is required";

    if (!tone) newErrors.tone = "Tone is required";
    // No Female Tone field exists in this form, and the API has no such
    // parameter — only maleTone is sent. Requiring it blocked submission
    // outright for anyone without a stale value saved in their browser.
    if (!scenarioCategory) newErrors.scenarioCategory = "Scenario is required";
    if (!relationshipLevel)
      newErrors.relationshipLevel = "Relationship level is required";
    if (!conversationLength)
      newErrors.conversationLength = "Conversation length is required";

    if (
      conversationLength === "custom" ||
      selectedConversationLength?.value === "custom"
    ) {
      if (!customMin || Number(customMin) < 1)
        newErrors.customMin = "Min must be ≥ 1";
      if (!customMax || Number(customMax) < 1)
        newErrors.customMax = "Max must be ≥ 1";
      if (customMin && customMax && Number(customMax) < Number(customMin))
        newErrors.customMax = "Max must be ≥ Min";
    }

    if (selectedScenario?.value === "custom" && !customScenario.trim())
      newErrors.customScenario = "Custom scenario is required";

    if (
      selectedRelationshipLevel?.value === "custom" &&
      !customRelationshipLevel.trim()
    )
      newErrors.customRelationshipLevel =
        "Custom relationship level is required";

    setErrors(newErrors);
  }, [
    hasSubmitted,
    maleName,
    femaleName,
    language,
    dialect,
    tone,
    femaleTone,
    scenarioCategory,
    relationshipLevel,
    conversationLength,
    customMin,
    customMax,
    customScenario,
    customRelationshipLevel,
    selectedScenario,
    selectedRelationshipLevel,
    selectedConversationLength,
  ]);

  const validateForm = () => {
    setHasSubmitted(true);

    const hasErrors = Object.keys(errors).length > 0;

    if (hasErrors) {
      toast.error("Please fix all errors before generating");
      return false;
    }

    return true;
  };

  const handleGenerate = async () => {
    setHasSubmitted(true);
    if (!validateForm()) return;
    setLoading(true);
    setGlobalLoading(true);
    setConversation([]);
    setMetaData(null);
    setAiInput("");
    setAiOutput(null);
    setPromptUsed(null);
    setPromptAccordionOpen(false);
    setInputAccordionOpen(false);
    setOutputAccordionOpen(false);

    setGeneratedMaleName(maleName);

    try {
      const body = {
        maleName,
        femaleName,
        maleLanguage: language,
        femaleLanguage: language,
        maleDialect: language === "english" ? "" : dialect,
        femaleDialect: language === "english" ? "" : dialect,
        maleTone: tone,
        scenarioCategory,
        customScenario:
          selectedScenario?.value === "custom" ? customScenario : undefined,
        personaDirection,
        isGenZ,
        gptModel,
        temperature,
        conversationLength,
        ...(selectedConversationLength?.value === "custom" && {
          customMin: Number(customMin),
          customMax: Number(customMax),
        }),
      };

      const res = await postApi(URLS.generateConversation, body);
      if (res.status === 200) {
        const data = res.data.data;
        let convoArray = [];
        if (data.generatedConversation) {
          convoArray = data.generatedConversation
            .split("\n")
            .map((line: any) => line.trim())
            .filter((line: any) => {
              return (
                line.startsWith(`${maleName}:`) ||
                line.startsWith(`${femaleName}:`)
              );
            });
        }

        if (convoArray.length > 0) {
          setConversation(convoArray);
          setMetaData({
            model: data.gptModel,
            temperature: data.temperature,
            tokens: data.tokenUsage?.totalTokens,
            cost: data.tokenUsage?.estimatedCost,
          });
          setAiInput(data.input || "");
          setAiOutput(data.output || null);
          setPromptUsed(data.promptUsed || null);
          toast.success("Conversation generated successfully!");
          setHasSubmitted(false);
        } else {
          toast.error("Invalid conversation format received");
        }
      } else {
        toast.error("Failed to generate conversation");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || "Failed To Generate conversation"
      );
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };

  const handleDownloadJson = () => {
    const jsonData = {
      input: aiInput,
      output: aiOutput,
      conversation: conversation,
      metadata: {
        modelUsed: metaData?.model,
        temperatureUsed: metaData?.temperature,
        tokenUsage: {
          totalTokens: metaData?.tokens,
          estimatedCost: metaData?.cost,
        },
      },
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversation-${maleName}-${femaleName}-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (providerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-300">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full bg-gradient-to-br from-gray-800 to-gray-900 text-gray-100 rounded-3xl shadow-2xl p-6 sm:p-10 max-w-5xl mx-auto border border-gray-700/50 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-10 text-center"
        >
          <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Conversation Generator
          </h2>
          <p className="text-gray-400 text-sm">
            Create authentic conversations with AI-powered generation
          </p>
        </motion.div>

        <>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-8 flex justify-between"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={generateRandomNames}
              className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg flex items-center gap-3 text-sm"
            >
              <span>Pick Random Names</span>
            </motion.button>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.06 } },
            }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8"
          >
            {/* Gen Z Mode */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 flex items-center justify-between"
            >
              <label className="block text-sm font-medium text-gray-300 text-start">
                Gen Z Mode
              </label>
              <button
                onClick={() => {
                  setIsGenZ(!isGenZ);
                  updateSettings({ isGenZ: !isGenZ });
                }}
                className={`relative w-16 h-8 rounded-full transition-all duration-300 shadow-inner ${
                  isGenZ
                    ? "bg-gradient-to-r from-green-400 to-emerald-500"
                    : "bg-gray-600"
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-300 ${
                    isGenZ ? "translate-x-8" : "translate-x-0"
                  }`}
                />
              </button>
            </motion.div>

            {/* Direction */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-3 text-start">
                Direction
              </label>
              <select
                value={personaDirection}
                onChange={(e) => {
                  setPersonaDirection(e.target.value);
                  updateSettings({ personaDirection: e.target.value });
                }}
                className="w-full p-3 bg-gray-700/60 rounded-lg border border-gray-600 focus:ring-2 focus:ring-purple-400 focus:outline-none cursor-pointer text-sm"
              >
                <option value="male_to_female">Male to Female</option>
                <option value="female_to_male">Female to Male</option>
              </select>
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2 text-start">
                {provider && provider === "OPENAI" ? "GPT Model" : "Gemini Model"}
              </label>
              <ModelPicker
                label=""
                value={toCatalogId(gptModel, provider)}
                idPrefix={catalogPrefixFor(provider)}
                onChange={(catalogId) => {
                  const wire = toProviderModelId(catalogId, provider);
                  setGptModel(wire);
                  updateSettings({ gptModel: wire });
                }}
              />
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2 text-start">
                Temperature (0 – 2)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={temperature}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setTemperature(val);
                  updateSettings({ temperature: val });
                }}
                className="w-full p-3 bg-gray-700/50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600/50 hover:border-blue-500/50 transition-all text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                placeholder="e.g. 0.7"
                required
              />
            </motion.div>
            {/* Male Name */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2 text-start">
                Male Name
              </label>
              <input
                type="text"
                value={maleName}
                onChange={(e) => setMaleName(e.target.value)}
                className={`
  p-3 bg-gray-700/50 rounded-xl w-full outline-none
  backdrop-blur-sm transition-all
  ${
    hasSubmitted && errors.maleName
      ? "border-2 border-red-500"
      : "border border-gray-600/50 hover:border-blue-500/50 focus:ring-2 focus:ring-blue-500"
  }
`}
                placeholder="Enter Male Name"
              />
              <AnimatePresence>
                {hasSubmitted && errors.maleName && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-red-400 mt-1"
                  >
                    {errors.maleName}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Female Name */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2 text-start">
                Female Name
              </label>
              <input
                type="text"
                value={femaleName}
                onChange={(e) => setFemaleName(e.target.value)}
                className={`
  p-3 bg-gray-700/50 rounded-xl w-full outline-none
  backdrop-blur-sm transition-all
  ${
    hasSubmitted && errors.femaleName
      ? "border-2 border-red-500"
      : "border border-gray-600/50 hover:border-blue-500/50 focus:ring-2 focus:ring-blue-500"
  }
`}
                placeholder="Enter Female Name"
              />
              <AnimatePresence>
                {hasSubmitted && errors.femaleName && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-red-400 mt-1"
                  >
                    {errors.femaleName}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Language */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2 text-start">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  updateSettings({ language: e.target.value });
                }}
                className="p-3 bg-gray-700/50 rounded-xl w-full outline-none transition-all duration-300 border border-gray-600/50 hover:border-purple-500/50 focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                {languages.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2 text-start">
                Dialect
              </label>
              <Select<DialectOption>
                value={options.find((opt) => opt.value === dialect) || null}
                onChange={(selectedOption: SingleValue<DialectOption>) => {
                  const value = selectedOption?.value || "";
                  setDialect(value);
                  updateSettings({ dialect: value });
                }}
                options={options}
                styles={{
                  control: (base: any, state: any) => ({
                    ...base,
                    padding: "4px",
                    backgroundColor:
                      language === "english"
                        ? "rgba(75, 85, 99, 0.3)"
                        : "rgba(55, 65, 81, 0.5)",
                    backdropFilter: "blur(4px)",
                    borderRadius: "0.75rem",
                    border:
                      language === "english"
                        ? "1px solid rgba(75, 85, 99, 0.3)"
                        : language !== "english" &&
                          hasSubmitted &&
                          errors.femaleName
                        ? "2px solid rgb(239, 68, 68)"
                        : state.isFocused
                        ? "1px solid rgba(168, 85, 247, 0.5)"
                        : "1px solid rgba(75, 85, 99, 0.5)",
                    boxShadow:
                      state.isFocused && language !== "english"
                        ? "0 0 0 2px rgba(168, 85, 247, 0.5)"
                        : "none",
                    "&:hover": {
                      borderColor:
                        language === "english"
                          ? "rgba(75, 85, 99, 0.3)"
                          : "rgba(168, 85, 247, 0.5)",
                    },
                    minHeight: "48px",
                    cursor: language === "english" ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                  }),
                  menu: (base: any) => ({
                    ...base,
                    backgroundColor: "rgba(55, 65, 81, 0.95)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(75, 85, 99, 0.5)",
                    borderRadius: "0.75rem",
                    maxHeight: "200px",
                    overflow: "hidden",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    "&::-webkit-scrollbar": {
                      display: "none",
                    },
                  }),
                  menuList: (base: any) => ({
                    ...base,
                    maxHeight: "200px",
                    paddingTop: 0,
                    paddingBottom: 0,
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    "&::-webkit-scrollbar": {
                      display: "none",
                    },
                  }),
                  option: (base: any, state: any) => ({
                    ...base,
                    backgroundColor: state.isFocused
                      ? "rgba(168, 85, 247, 0.2)"
                      : state.isSelected
                      ? "rgba(168, 85, 247, 0.5)"
                      : "transparent",
                    color: "#d1d5db",
                    padding: "8px 12px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s",
                    "&:active": {
                      backgroundColor: "rgba(168, 85, 247, 0.3)",
                    },
                  }),
                  singleValue: (base: any) => ({
                    ...base,
                    color: language === "english" ? "#9ca3af" : "#d1d5db",
                    textAlign: "left",
                  }),
                  input: (base: any) => ({
                    ...base,
                    color: "#d1d5db",
                  }),
                  placeholder: (base: any) => ({
                    ...base,
                    color: "#9ca3af",
                  }),
                  dropdownIndicator: (base: any) => ({
                    ...base,
                    color: language === "english" ? "#9ca3af" : "#d1d5db",
                    "&:hover": {
                      color: language === "english" ? "#9ca3af" : "#a78bfa",
                    },
                  }),
                  indicatorSeparator: () => ({
                    display: "none",
                  }),
                }}
                isDisabled={language === "english"}
                isSearchable={true}
                placeholder="Select Dialect"
                classNamePrefix="react-select"
                menuPlacement="top"
              />
            </motion.div>

            {/* Tone */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2 text-start">
                Male Tone
              </label>
              <select
                value={tone}
                onChange={(e) => {
                  setTone(e.target.value);
                  updateSettings({ tone: e.target.value });
                }}
                className="p-3 bg-gray-700/50 rounded-xl w-full outline-none transition-all duration-300 border border-gray-600/50 hover:border-pink-500/50 focus:ring-2 focus:ring-pink-500 cursor-pointer"
              >
                {tones.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              className="sm:col-span-1"
            >
              <label className="block text-sm font-medium text-gray-300 mb-2 text-start">
                Scenario
              </label>

              <select
                value={scenarioCategory}
                onChange={(e) => {
                  const id = e.target.value;

                  setScenarioCategory(id);
                  updateSettings({ scenarioCategory: id });

                  const sel = scenariosData.find((s) => s._id === id);
                  setSelectedScenario(sel || null);

                  if (sel?.value !== "custom") setCustomScenario("");
                }}
                className="p-3 bg-gray-700/50 rounded-xl w-full outline-none transition-all duration-300 border border-gray-600/50 hover:border-blue-500/50 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">Select Scenario</option>
                {scenariosData.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.title}
                  </option>
                ))}
              </select>

              <AnimatePresence>
                {errors.scenarioCategory && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-red-400 mt-1"
                  >
                    {errors.scenarioCategory}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              className="sm:col-span-1"
            >
              <label className="block text-sm font-medium text-gray-300 mb-3 text-start">
                Conversation Length
              </label>

              <select
                value={conversationLength}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  setConversationLength(selectedId);
                  updateSettings({ conversationLength: selectedId });

                  const selected = conversationLengthsData.find(
                    (l) => l._id === selectedId
                  );
                  setSelectedConversationLength(selected || null);

                  if (!selected || selected.value !== "custom") {
                    setCustomMin("");
                    setCustomMax("");
                  }
                }}
                className="w-full p-3 bg-gray-700/50 rounded-xl outline-none border border-gray-600/50 hover:border-purple-500/50 focus:ring-2 focus:ring-purple-500 cursor-pointer transition-all"
              >
                <option value="">Select Length</option>
                {conversationLengthsData.map((len) => (
                  <option key={len._id} value={len._id}>
                    {len.title}
                  </option>
                ))}
              </select>

              <AnimatePresence>
                {selectedConversationLength?.value === "custom" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="mt-3 grid grid-cols-2 gap-3"
                  >
                    <input
                      type="number"
                      min="1"
                      placeholder="Min"
                      value={customMin}
                      onChange={(e) => setCustomMin(e.target.value)}
                      className="p-3 bg-gray-700/50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600/50 hover:border-blue-500/50 transition-all text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <input
                      type="number"
                      min="1"
                      placeholder="Max"
                      value={customMax}
                      onChange={(e) => setCustomMax(e.target.value)}
                      className="p-3 bg-gray-700/50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600/50 hover:border-blue-500/50 transition-all text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {hasSubmitted &&
                  (errors.conversationLength ||
                    errors.customMin ||
                    errors.customMax) && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-xs text-red-400 mt-2 text-start"
                    >
                      {errors.conversationLength || errors.customMin}{" "}
                      {errors.customMax && `• ${errors.customMax}`}
                    </motion.p>
                  )}
              </AnimatePresence>
            </motion.div>

            <AnimatePresence>
              {selectedScenario?.value === "custom" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="sm:col-span-2 mt-3"
                >
                  <textarea
                    placeholder="Enter your custom scenario..."
                    value={customScenario}
                    onChange={(e) => setCustomScenario(e.target.value)}
                    className={`
  p-3 bg-gray-700/50 rounded-xl w-full outline-none
  backdrop-blur-sm transition-all
  ${
    hasSubmitted && errors.customScenario
      ? "border-2 border-red-500"
      : "border border-gray-600/50 hover:border-blue-500/50 focus:ring-2 focus:ring-blue-500"
  }
`}
                    rows={4}
                  />

                  <AnimatePresence>
                    {hasSubmitted && errors.customScenario && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-red-400 mt-1"
                      >
                        {errors.customScenario}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.button
            onClick={handleGenerate}
            disabled={loading}
            whileHover={{
              scale: loading ? 1 : 1.05,
              boxShadow: "0 0 15px rgba(59, 130, 246, 0.4)",
            }}
            whileTap={{ scale: loading ? 1 : 0.95 }}
            className={`w-full py-4 rounded-xl font-semibold text-base shadow-md transition-all duration-300 ${
              loading
                ? "bg-blue-400 text-white cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {loading ? "Generating..." : "Generate Conversation"}
          </motion.button>

          {(aiInput || aiOutput || promptUsed) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 space-y-4"
            >
              {/* View Raw Input Accordion */}
              {aiInput && (
                <div>
                  <motion.div
                    onClick={toggleInputAccordion}
                    whileHover={{ backgroundColor: "rgba(55, 65, 81, 0.8)" }}
                    className="cursor-pointer p-2 sm:p-3 bg-gray-800 rounded-lg border border-gray-600 hover:border-gray-500 transition-all duration-300"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium text-gray-300">
                        View Input
                      </h4>
                      <motion.span
                        animate={{ rotate: inputAccordionOpen ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-gray-400"
                      >
                        ▼
                      </motion.span>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={false}
                    animate={{
                      height: inputAccordionOpen ? "auto" : 0,
                      opacity: inputAccordionOpen ? 1 : 0,
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    {aiInput && (
                      <div className="mt-3 p-3 bg-gray-800 rounded-lg space-y-5 text-xs sm:text-sm text-gray-200">
                        <div>
                          <pre className="whitespace-pre-wrap text-gray-300 text-start">
                            {aiInput}
                          </pre>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>
              )}

              {aiOutput && (
                <div>
                  <motion.div
                    onClick={toggleOutputAccordion}
                    whileHover={{ backgroundColor: "rgba(55, 65, 81, 0.8)" }}
                    className="cursor-pointer p-3 bg-gray-800 rounded-lg border border-gray-600 hover:border-gray-500 transition-all duration-300"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium text-gray-300">
                        View Raw Output
                      </h4>
                      <motion.span
                        animate={{ rotate: outputAccordionOpen ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-gray-400"
                      >
                        ▼
                      </motion.span>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={false}
                    animate={{
                      height: outputAccordionOpen ? "auto" : 0,
                      opacity: outputAccordionOpen ? 1 : 0,
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div
                      className="mt-3 p-3 bg-gray-800 rounded-lg text-xs sm:text-sm text-gray-200 border border-gray-700 max-h-96 overflow-y-auto"
                      style={{
                        scrollbarWidth: "thin",
                        scrollbarColor: "#4B5563 transparent",
                      }}
                    >
                      <pre className="whitespace-pre-wrap text-start leading-normal">
                        {typeof aiOutput === "string"
                          ? aiOutput
                          : aiOutput.output}
                      </pre>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* View Prompt Used Accordion */}
              {promptUsed && (
                <div>
                  <motion.div
                    onClick={togglePromptAccordion}
                    whileHover={{ backgroundColor: "rgba(55, 65, 81, 0.8)" }}
                    className="cursor-pointer p-3 bg-gray-800 rounded-lg border border-gray-600 hover:border-gray-500 transition-all duration-300"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium text-gray-300">
                        View Prompt Used
                      </h4>
                      <motion.span
                        animate={{ rotate: promptAccordionOpen ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-gray-400"
                      >
                        ▼
                      </motion.span>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={false}
                    animate={{
                      height: promptAccordionOpen ? "auto" : 0,
                      opacity: promptAccordionOpen ? 1 : 0,
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div
                      className="mt-3 p-3 bg-gray-800 rounded-lg space-y-5 text-xs sm:text-sm text-gray-200 max-h-96 overflow-y-auto"
                      style={{
                        scrollbarWidth: "thin",
                        scrollbarColor: "#4B5563 transparent",
                      }}
                    >
                      {/* System Prompt */}
                      {promptUsed.systemPrompt && (
                        <div className="text-start">
                          <h5 className="text-sm sm:text-base font-semibold text-gray-100 mb-2">
                            System Prompt
                          </h5>
                          <pre className="whitespace-pre-wrap text-gray-300 bg-gray-900/50 p-3 rounded-lg">
                            {promptUsed.systemPrompt}
                          </pre>
                        </div>
                      )}

                      {/* Male Persona Details */}
                      {promptUsed.male && (
                        <div className="text-start">
                          <h5 className="text-sm sm:text-base font-semibold text-gray-100 mb-2">
                            Male Persona
                          </h5>
                          <div className="space-y-3 bg-gray-900/50 p-3 rounded-lg">
                            {promptUsed.male.language && (
                              <div>
                                <h6 className="text-xs font-medium text-blue-400 mb-1">
                                  Language
                                </h6>
                                <pre className="whitespace-pre-wrap text-gray-300 text-xs">
                                  {promptUsed.male.language}
                                </pre>
                              </div>
                            )}
                            {promptUsed.male.dialect && (
                              <div>
                                <h6 className="text-xs font-medium text-blue-400 mb-1">
                                  Dialect
                                </h6>
                                <pre className="whitespace-pre-wrap text-gray-300 text-xs">
                                  {promptUsed.male.dialect}
                                </pre>
                              </div>
                            )}
                            {promptUsed.male.tone && (
                              <div>
                                <h6 className="text-xs font-medium text-blue-400 mb-1">
                                  Tone
                                </h6>
                                <pre className="whitespace-pre-wrap text-gray-300 text-xs">
                                  {promptUsed.male.tone}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}

          {(aiInput || aiOutput || promptUsed) && (
            <div className="flex justify-end mt-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleDownloadJson}
                disabled={loading || !aiOutput}
                className={`flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-3 rounded-lg font-medium text-xs sm:text-sm shadow-md transition-all duration-300 touch-manipulation ${
                  loading
                    ? "bg-blue-400 text-white cursor-not-allowed"
                    : !aiOutput
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
                title={
                  loading
                    ? "Preparing file..."
                    : !aiOutput
                    ? "No data available to download."
                    : "Click to download JSON file."
                }
              >
                <span>{loading ? "Preparing..." : "Download JSON"}</span>
              </motion.button>
            </div>
          )}

          <AnimatePresence>
            {conversation.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="mt-8 bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-2xl max-h-[500px] overflow-y-auto space-y-4"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "#4B5563 transparent",
                }}
              >
                <motion.h3
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-lg font-semibold text-center mb-4 bg-gradient-to-r from-blue-400 to-pink-400 bg-clip-text text-transparent"
                >
                  Generated Conversation
                </motion.h3>

                {/* ---- Messages ---- */}
                {conversation.map((msg, i) => {
                  const trimmed = msg.trim();
                  const isMale = msg.startsWith(`${generatedMaleName}:`);
                  const speakerName = isMale ? maleName : femaleName;
                  const messageText = trimmed.startsWith(`${speakerName}:`)
                    ? trimmed.slice(speakerName.length + 1).trim()
                    : trimmed;

                  return (
                    <motion.div
                      key={i}
                      initial={{
                        opacity: 0,
                        x: isMale ? -50 : 50,
                        scale: 0.8,
                      }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{
                        duration: 0.4,
                        delay: i * 0.1,
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                      }}
                      className={`flex ${
                        isMale ? "justify-start" : "justify-end"
                      }`}
                    >
                      <motion.div
                        whileHover={{
                          y: -2,
                          boxShadow: isMale
                            ? "0 8px 20px rgba(59, 130, 246, 0.4)"
                            : "0 8px 20px rgba(236, 72, 153, 0.4)",
                        }}
                        onClick={() => {
                          navigator.clipboard.writeText(messageText);
                          toast.success("Message copied!");
                        }}
                        className={`px-5 py-3 rounded-2xl max-w-[80%] sm:max-w-[70%] text-sm sm:text-base relative cursor-pointer select-text transition-all ${
                          isMale
                            ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-900/50"
                            : "bg-gradient-to-br from-pink-600 to-pink-700 text-white shadow-lg shadow-pink-900/50"
                        }`}
                      >
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.1 + 0.2 }}
                          className="select-text"
                        >
                          {msg}
                        </motion.div>

                        {/* Hover overlay */}
                        <div
                          className={`absolute inset-0 rounded-2xl opacity-0 hover:opacity-20 transition-opacity duration-300 pointer-events-none ${
                            isMale ? "bg-blue-400" : "bg-pink-400"
                          }`}
                        />
                      </motion.div>
                    </motion.div>
                  );
                })}

                {/* ---- Copy Full Chat Button ---- */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const fullText = conversation
                      .map((msg) => msg.trim())
                      .join("\n");
                    navigator.clipboard.writeText(fullText);
                    toast.success("Full chat copied!");
                  }}
                  className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  Copy Full Chat
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {metaData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-xs sm:text-sm text-gray-400 text-center bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/30"
            >
              <p className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                <span className="text-blue-400 font-medium">Model:</span>
                <span>{metaData.model}</span>
                <span className="text-purple-400">•</span>
                <span className="text-blue-400 font-medium">Temp:</span>
                <span>{metaData.temperature}</span>
                <span className="text-purple-400">•</span>
                <span className="text-blue-400 font-medium">Tokens:</span>
                <span>{metaData.tokens}</span>
                <span className="text-purple-400">•</span>
                <span className="text-blue-400 font-medium">Est. Cost:</span>
                <span className="text-green-400">
                  ${metaData.cost?.toFixed(6)}
                </span>
              </p>
            </motion.div>
          )}
        </>
      </motion.div>
    </div>
  );
};

export default ConvoGenerator;