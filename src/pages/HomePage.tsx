import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { getApi, postApi } from "../utils/api";
import { URLS } from "../utils/urls";
import { toast } from "sonner";
import PromptTemplates from "./PromptTemplates";
import TypingLoader from "../utils/Lodaer";
import { createPortal } from "react-dom";
import {
  AlignJustify,
  AudioLines,
  Boxes,
  Brain,
  FileText,
  LayoutTemplate,
  MessagesSquare,
  PencilLine,
  Settings,
  SidebarOpen,
  Sparkles,
  User,
  User2,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ConvoGenerator from "./ConvoGenerator";
import ConversationPromptEditor from "../utils/ConversationPromptEditor";
import { usePromptGenerator } from "../context/PromptGeneratorContext";
import { useConvoGenerator } from "../context/ConvoGeneratorContext";
import Select, { SingleValue } from "react-select";
import PickUpPromptTemplates from "./PickUpPromptTemplates";
import AISettingsComponent from "./AiSettings";
import { useAIProvider } from "../context/AIProviderContext";
import { useTabProvider } from "../context/TabContext";
import PickupLines from "./PickupLines";

interface FullPrompt {
  role: string;
  messageType: string;
  style: string;
  language: string;
  dialect: string;
  gender: string;
  subPrmpt: string;
  systemPrompt: string;
  userInstruction: string;
  extractedChat: string | null;
  lastReplies: string[] | null;
}

interface InputPrompt {
  role: string;
  messageType: string;
  language: string;
  dialect: string;
  style: string;
  subPrmpt: string;
  userInstruction: string;
}

type DialectOption = {
  value: string;
  label: string;
};

const PromptGenerator: React.FC = () => {
  const { provider, loading: providerLoading } = useAIProvider();
  const { tabing, setTabing } = useTabProvider();
  const { settings, updateSettings, resetSettings } = usePromptGenerator();
  const { resetConvoSettings } = useConvoGenerator();

  const [activeTab, setActiveTab] = useState<
    | "generator"
    | "templates"
    | "conversation"
    | "conversation_prompt"
    | "pickup_templates"
    | "ai_Settings"
    | "pickup_lines"
  >(tabing);
  const [selectedType, setSelectedType] = useState<
    "ScreenshotReply" | "ManualReply" | "GetPickUpLine"
  >("GetPickUpLine");

  const [message, setMessage] = useState("");
  const [context, setContext] = useState("");
  const [pickupContext, setPickupContext] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [output, setOutput] = useState("");
  const [fullPrompt, setFullPrompt] = useState<FullPrompt | null>(null);
  const [responses, setResponses] = useState<string[]>([]);
  const [translatedText, setTranslatedText] = useState<string[]>([]);
  const [success, setSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [promptAccordionOpen, setPromptAccordionOpen] = useState(false);
  const [translatedAccordionOpen, setTranslatedAccordionOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [inputAccordionOpen, setInputAccordionOpen] = useState(false);
  const [outputAccordionOpen, setOutputAccordionOpen] = useState(false);
  const maleStyles = ["Conservative", "Playful", "Confident", "Flirty"];
  const femaleStyles = ["Modest", "Playful", "Sassy", "Flirty"];

  const [gender, setGender] = useState<"MALE" | "FEMALE">(settings.gender);
  const [isGenxz, setIsGenxz] = useState<boolean>(settings.isGenZ);
  const [style, setStyle] = useState<string>(settings.style);
  const [language, setLanguage] = useState<"en" | "ar" | "arbz">(
    settings.language
  );
  const [dialect, setDialect] = useState<
    | "EGYPTIAN"
    | "IRAQI"
    | "LEBANESE"
    | "PALESTINIAN"
    | "JORDANIAN"
    | "MOROCCAN"
    | "ALGERIAN"
    | "SYRIAN"
    | "SUDANESE"
    | "SOMALI"
    | "YEMENI"
    | "TUNISIAN"
    | "SAUDI"
    | "EMIRATI"
    | "KUWAITI"
    | "QATARI"
    | "BAHRAINI"
    | "OMANI"
    | "LIBYAN"
    | "MAURITANIAN"
    | "DJIBOUTIAN"
    | "COMORIAN"
    | ""
  >(settings.dialect);
  const stylesOptions =
    gender === "MALE" ? maleStyles : gender === "FEMALE" ? femaleStyles : [];

  const [gptModel, setGptModel] = useState(() => {
    if (providerLoading) return "";

    if (provider === "GEMINI") return "gemini-2.0-flash";
    if (provider === "OPENAI") return settings.gptModel || "gpt-4o-mini";
    return "gemini-2.0-flash";
  });
  const [temperature, setTemperature] = useState(settings.temperature);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [temperatureUsed, setTemperatureUsed] = useState<number | null>(null);
  const [aiInput, setAiInput] = useState<InputPrompt | null>(null);
  const [aiOutput, setAiOutput] = useState<string[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [tokenUsage, setTokenUsage] = useState<{
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost: number;
  } | null>(null);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  const adminRole = localStorage.getItem("adminRole") || "admin";

  const toggleInputAccordion = () => setInputAccordionOpen((prev) => !prev);
  const toggleOutputAccordion = () => setOutputAccordionOpen((prev) => !prev);
  const handleChange = (
    setter: React.Dispatch<React.SetStateAction<any>>,
    value: any
  ) => {
    setter(value);

    if (setter === setGptModel) updateSettings({ gptModel: value });
    if (setter === setTemperature) updateSettings({ temperature: value });
    if (setter === setLanguage) updateSettings({ language: value });
    if (setter === setDialect) updateSettings({ dialect: value });
    if (setter === setIsGenxz) updateSettings({ isGenZ: value });
    if (setter === setStyle) updateSettings({ style: value });
    if (setter === setGender) updateSettings({ gender: value });

    if (setter === setSelectedType) {
      setOutput("");
      setFullPrompt(null);
      setResponses([]);
      setTranslatedText([]);

      setSuccess(false);
      setPromptAccordionOpen(false);
      setTranslatedAccordionOpen(false);

      setImageFile(null); // Reset uploaded image
      setMessage(""); // Reset manual reply
      setContext(""); // Reset optional context
      setPickupContext("");
    } else if (setter === setGender) {
      if (value === "MALE") {
        setStyle("Conservative");
        setIsGenxz(false);
      } else if (value === "FEMALE") {
        setStyle("Modest");
        setIsGenxz(false);
      }
    } else if (setter === setLanguage) {
      const prevLanguage = language;
      const prevDialect = dialect;
      if (value === "en") {
        setDialect("");
      } else if (
        prevLanguage === "en" &&
        (value === "ar" || value === "arbz")
      ) {
        setDialect("EGYPTIAN");
      } else if (
        (prevLanguage === "ar" && value === "arbz") ||
        (prevLanguage === "arbz" && value === "ar")
      ) {
        if (prevDialect) {
          setDialect(prevDialect);
        } else {
          setDialect("EGYPTIAN");
        }
      }
    }
  };

 useEffect(() => {
    setActiveTab(tabing);
  }, [tabing]);

useEffect(() => {
  if (adminRole !== "superAdmin") {
    const allowedTabs = ["conversation", "generator", "pickup_lines"];
    if (!allowedTabs.includes(activeTab)) {
      setActiveTab("conversation");
      setTabing("conversation");
    }
  }
}, [adminRole, setTabing]);

useEffect(() => {
  if (!providerLoading && provider) {
    const defaultModel =
      provider === "GEMINI" ? "gemini-2.0-flash" : "gpt-4o-mini";

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
        provider === "GEMINI" ? "gemini-2.0-flash" : "gpt-4o-mini";

      if (
        (provider === "GEMINI" && !gptModel.includes("gemini")) ||
        (provider === "OPENAI" && !gptModel.includes("gpt"))
      ) {
        setGptModel(defaultModel);
        updateSettings({ gptModel: defaultModel });
      }
    }
  }, [provider, providerLoading]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setOutput("");
      setFullPrompt(null);
      setResponses([]);
      setTranslatedText([]);
      setSuccess(false);
      setPromptAccordionOpen(false);
      setTranslatedAccordionOpen(false);
    }
  };

  const resetGeneratorTab = () => {
    setImageFile(null); // reset uploaded image
    setMessage(""); // reset manual message
    setContext(""); // reset optional context
    setPickupContext("");
    setResponses([]); // reset API responses
    setSuccess(false); // reset success state
  };

  const handleSubmit = async () => {
    if (!selectedType) {
      toast.error("Please select a type");
      return;
    }
    if (!gender) {
      toast.error("Please select gender");
      return;
    }
    if (!style) {
      toast.error("Please select style");
      return;
    }
    if (!language) {
      toast.error("Please select a language");
      return;
    }

    if (temperature < 0 || temperature > 2) {
      toast.error("Temperature must be between 0 and 2");
      return;
    }

    if (selectedType === "ManualReply" && !message.trim()) {
      toast.error("Message cannot be empty");
      return;
    }

    if (selectedType === "ScreenshotReply" && !imageFile) {
      toast.error("Please upload an image");
      return;
    }

    setLoading(true);
    setPromptAccordionOpen(false);
    setTranslatedAccordionOpen(false);
    try {
      let response;
      const commonParams = {
        rizzType: style?.toUpperCase() ?? "",
        isGenz: isGenxz ?? false,
        language: language?.toLowerCase() ?? "",
        dialect: language === "en" ? "" : dialect ?? "",
        gender: gender ?? "",
        gptModel,
        temperature,
      };

      if (selectedType === "GetPickUpLine") {
        const query = new URLSearchParams({
          ...commonParams,
          isGenz: commonParams.isGenz.toString(),
          gptModel: gptModel,
          temperature: temperature.toString(),
        }).toString();
        response = await postApi(`${URLS.getPickUpLine}?${query}`, {
          context: pickupContext,
        });
      } else if (selectedType === "ManualReply") {
        const body = {
          ...commonParams,
          message,
          context: context || undefined,
        };
        response = await postApi(`${URLS.getManualReply}`, body);
      } else if (selectedType === "ScreenshotReply") {
        const formData = new FormData();
        if (imageFile) {
          formData.append("image", imageFile);
        }
        Object.entries(commonParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });
        response = await postApi(`${URLS.getResponseByScreenshot}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      if (response?.status === 200 && response.data.success) {
        const isInvalidScreenshot =
          selectedType === "ScreenshotReply" &&
          typeof response.data.data.reply === "string" &&
          response.data.data.reply.includes(
            "Sorry, could not extract a valid chat from this screenshot."
          );

        if (isInvalidScreenshot) {
          setSuccess(true);
          setOutput("Error: Invalid screenshot");
          setResponses([response.data.data.reply]);
          setTranslatedText([]);
          setFullPrompt(null);
        } else {
          setSuccess(true);
          if (selectedType === "GetPickUpLine") {
            setResponses(response.data.data.pickupLines || []);
            setTranslatedText(response.data.data.translatedText || []);
            setFullPrompt(response.data.data.fullPrompt || null);
            setModelUsed(response.data.data.fullPrompt?.modelUsed || null);
            setTemperatureUsed(
              response.data.data.fullPrompt?.temperatureUsed || null
            );
            setTokenUsage(response.data.data.fullPrompt?.tokenUsage || null);
            setAiInput(response.data.data.input);
            setAiOutput(response.data.data.output);
          } else if (selectedType === "ManualReply") {
            setResponses(response.data.data.reply || []);
            setTranslatedText(response.data.data.translatedText || []);
            setFullPrompt(response.data.data.fullPrompt || null);
            setModelUsed(response.data.data.fullPrompt?.modelUsed || null);
            setTemperatureUsed(
              response.data.data.fullPrompt?.temperatureUsed || null
            );
            setTokenUsage(response.data.data.fullPrompt?.tokenUsage || null);
            setAiInput(response.data.data.input);
            setAiOutput(response.data.data.output);
          } else if (selectedType === "ScreenshotReply") {
            setResponses(response.data.data.replies || []);
            setTranslatedText(response.data.data.translatedText || []);
            setFullPrompt(response.data.data.fullPrompt || null);
            setModelUsed(response.data.data.fullPrompt?.modelUsed || null);
            setTemperatureUsed(
              response.data.data.fullPrompt?.temperatureUsed || null
            );
            setTokenUsage(response.data.data.fullPrompt?.tokenUsage || null);
            setAiInput(response.data.data.input);
            setAiOutput(response.data.data.output);
          }
          setOutput("Success: Response generated");
        }
      } else {
        setOutput("Error: Failed to fetch response");
        setSuccess(false);
        setResponses([]);
        setTranslatedText([]);
        setFullPrompt(null);
      }
    } catch (error) {
      console.error("API Error:", error);
      setOutput("Error: Something went wrong");
      setSuccess(false);
      setResponses(["Error: Something went wrong"]);
      setTranslatedText([]);
      setFullPrompt(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isPreviewOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isPreviewOpen]);

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.1 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  };

  const sidebarVariants: Variants = {
    open: {
      width: 256, // w-64
      transition: { duration: 0.25, ease: "easeInOut" },
    },
    closed: {
      width: 72, // icon-only
      transition: { duration: 0.25, ease: "easeInOut" },
    },
  };

  const contentVariants: Variants = {
    open: { marginLeft: 0 },
    closed: { marginLeft: 0 },
  };

  const togglePromptAccordion = () => {
    setPromptAccordionOpen(!promptAccordionOpen);
  };

  const toggleTranslatedAccordion = () => {
    setTranslatedAccordionOpen(!translatedAccordionOpen);
  };

  const handleEditConvoPrompt = () => {
    setActiveTab("conversation_prompt");
    setTabing("conversation_prompt");
    setEditMode(true);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminRole");
    localStorage.removeItem("promptGeneratorSettings");
    resetSettings();
    resetConvoSettings();
    navigate("/");
    setIsOpen(false);
  };

  const visibleTabs =
    adminRole === "superAdmin"
      ? [
          "generator",
          "templates",
          "pickup_templates",
          "conversation",
          "ai_Settings",
          "conversation_prompt",
          "pickup_lines",
        ]
      : ["conversation","generator", "pickup_lines"];

  const handleDownloadJson = () => {
    const jsonData = {
      input: aiInput,
      output: responses,
      modelUsed,
      temperatureUsed,
      tokenUsage,
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-response-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
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

  const options: DialectOption[] = dialectOptions.map((d) => ({
    value: d.value,
    label: d.name,
  }));

  const customStyles = {
    control: (base: any, state: any) => ({
      ...base,
      padding: "2px",
      backgroundColor:
        language === "en" ? "rgba(75, 85, 99, 0.3)" : "rgba(55, 65, 81, 0.5)",
      backdropFilter: "blur(4px)",
      borderRadius: "0.5rem",
      border:
        language === "en"
          ? "1px solid rgba(75, 85, 99, 0.3)"
          : state.isFocused
          ? "1px solid rgba(59, 130, 246, 0.5)"
          : "1px solid rgba(75, 85, 99, 0.5)",
      boxShadow:
        state.isFocused && language !== "en"
          ? "0 0 0 2px rgba(59, 130, 246, 0.5)"
          : "none",
      "&:hover": {
        borderColor:
          language === "en"
            ? "rgba(75, 85, 99, 0.3)"
            : "rgba(59, 130, 246, 0.5)",
      },
      minHeight: "38px",
      cursor: language === "en" ? "not-allowed" : "pointer",
      transition: "all 0.2s",
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: "rgba(55, 65, 81, 0.95)",
      backdropFilter: "blur(8px)",
      border: "1px solid rgba(75, 85, 99, 0.5)",
      borderRadius: "0.5rem",
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
        ? "rgba(59, 130, 246, 0.2)"
        : state.isSelected
        ? "rgba(59, 130, 246, 0.5)"
        : "transparent",
      color: "#f3f4f6",
      padding: "6px 12px",
      cursor: "pointer",
      textAlign: "left",
      transition: "all 0.2s",
      "&:active": {
        backgroundColor: "rgba(59, 130, 246, 0.3)",
      },
    }),
    singleValue: (base: any) => ({
      ...base,
      color: language === "en" ? "#9ca3af" : "#f3f4f6",
    }),
    input: (base: any) => ({
      ...base,
      color: "#f3f4f6",
    }),
    placeholder: (base: any) => ({
      ...base,
      color: "#9ca3af",
    }),
    dropdownIndicator: (base: any) => ({
      ...base,
      color: language === "en" ? "#9ca3af" : "#d1d5db",
      padding: "4px",
      "&:hover": {
        color: language === "en" ? "#9ca3af" : "#60a5fa",
      },
    }),
    indicatorSeparator: () => ({
      display: "none",
    }),
  };

  type TabKey =
    | "generator"
    | "templates"
    | "pickup_templates"
    | "conversation"
    | "conversation_prompt"
    | "ai_Settings"
    | "pickup_lines";

  if (providerLoading) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
        <TypingLoader />
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gradient-to-br from-gray-800 to-gray-900 flex overflow-hidden">
      {/* Top Tabs */}

      <button
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed top-2 left-2 z-50 text-white bg-gradient-to-br from-gray-800 to-gray-900 p-2 rounded-md bg"
      >
        <AlignJustify size={22} />
      </button>

      {/* Sidebar */}
      <motion.div
        variants={sidebarVariants}
        animate={isSidebarOpen ? "open" : "closed"}
        initial={false}
        className={`
    bg-gray-900 border-r border-gray-700 flex flex-col h-screen
    fixed md:static z-50
    ${isSidebarOpen ? "left-0" : "-left-64"}
    md:left-0
  `}
      >
        {/* Header */}
        <div
          className={`flex items-center  px-4 py-4
          ${isSidebarOpen ? "justify-between" : "justify-center"}`}
        >
          {isSidebarOpen && (
            <span className="text-lg font-semibold text-white">
              Prompt Panel
            </span>
          )}

          <button
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="text-gray-300 hover:text-white transition"
          >
            {/* simple icon */}
            {isSidebarOpen ? <X /> : <AlignJustify />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col space-y-1 px-2 py-2 gap-2">
          {visibleTabs.includes("generator") && (
            <button
              onClick={() => {
               const newTab = "generator";
            setActiveTab(newTab);
            setTabing(newTab);
            resetGeneratorTab();
              }}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition
          ${
            activeTab === "generator"
              ? "bg-blue-600 text-white"
              : "text-gray-300 hover:bg-gray-700 "
          }
               ${isSidebarOpen ? "" : "justify-center"}`}
            >
              <LayoutTemplate size={21} />
              {isSidebarOpen && <span>Prompt Tester</span>}
            </button>
          )}

          {visibleTabs.includes("templates") && (
            <button
              onClick={() => {
                 const newTab = "templates";
            setActiveTab(newTab);
            setTabing(newTab);
            resetGeneratorTab();
              }}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition
          ${
            activeTab === "templates"
              ? "bg-blue-600 text-white"
              : "text-gray-300 hover:bg-gray-700"
          }
              ${isSidebarOpen ? "" : "justify-center"}
            `}
            >
              <FileText size={21} />
              {isSidebarOpen && <span>Prompt Templates</span>}
            </button>
          )}

          {visibleTabs.includes("pickup_templates") && (
            <button
              onClick={() => {
              const newTab = "pickup_templates";
            setActiveTab(newTab);
            setTabing(newTab);
            resetGeneratorTab();
              }}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition
          ${
            activeTab === "pickup_templates"
              ? "bg-blue-600 text-white"
              : "text-gray-300 hover:bg-gray-700"
          }
               ${isSidebarOpen ? "" : "justify-center"}`}
            >
              <Sparkles size={18} />
              {isSidebarOpen && <span>Pickup Templates</span>}
            </button>
          )}

          {visibleTabs.includes("pickup_lines") && (
            <button
              onClick={() => {
                 const newTab = "pickup_lines";
            setActiveTab(newTab);
            setTabing(newTab);
            resetGeneratorTab();
              }}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition
          ${
            activeTab === "pickup_lines"
              ? "bg-blue-600 text-white"
              : "text-gray-300 hover:bg-gray-700"
          }
              ${isSidebarOpen ? "" : "justify-center"}
            `}
            >
              <AudioLines  size={21} />
              {isSidebarOpen && <span>Pick Up Lines</span>}
            </button>
          )}

          {visibleTabs.includes("conversation") && (
            <button
              onClick={() => {
               const newTab = "conversation";
            setActiveTab(newTab);
            setTabing(newTab);
              }}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition
          ${
            activeTab === "conversation"
              ? "bg-blue-600 text-white"
              : "text-gray-300 hover:bg-gray-700"
          }
               ${isSidebarOpen ? "" : "justify-center"}`}
            >
              <MessagesSquare size={21} />
              {isSidebarOpen && <span>Conversation Generator</span>}
            </button>
          )}

          {visibleTabs.includes("conversation_prompt") && (
            <button
              onClick={() => {
                handleEditConvoPrompt();
              }}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition
          ${
            activeTab === "conversation_prompt"
              ? "bg-blue-600 text-white"
              : "text-gray-300 hover:bg-gray-700"
          }
               ${isSidebarOpen ? "" : "justify-center"}`}
            >
              <PencilLine size={21} />
              {isSidebarOpen && <span>Edit Conversation Prompt</span>}
            </button>
          )}

          {visibleTabs.includes("ai_Settings") && (
            <button
              onClick={() => {
                const newTab = "ai_Settings";
            setActiveTab(newTab);
            setTabing(newTab);
            resetGeneratorTab();
              }}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition
          ${
            activeTab === "ai_Settings"
              ? "bg-blue-600 text-white"
              : "text-gray-300 hover:bg-gray-700"
          }
               ${isSidebarOpen ? "" : "justify-center"}`}
            >
              <Settings size={21} />
              {isSidebarOpen && <span className="">AI Settings</span>}
            </button>
          )}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 text-red-400 hover:bg-gray-800 rounded-md transition"
          >
            <User size={21} />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </motion.div>

      <div className="flex-1 h-screen overflow-y-auto p-4 sm:p-6">
        {activeTab === "generator" && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-4xl  mt-4 bg-gray-800/90 backdrop-blur-md rounded-xl shadow-xl p-4 sm:p-6 border border-gray-700 flex flex-col m-auto"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-gray-100 text-center mb-4 sm:mb-6">
              Prompt Tester
            </h2>

            {/* Type Selection */}
            <motion.div
              variants={itemVariants}
              className="mb-4 sm:mb-6 flex flex-wrap justify-center gap-2 sm:gap-3"
            >
              {["ScreenshotReply", "ManualReply", "GetPickUpLine"].map(
                (type) => (
                  <motion.button
                    key={type}
                    variants={itemVariants}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleChange(setSelectedType, type)}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-all duration-300 min-w-[170px] ${
                      selectedType === type
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {type === "GetPickUpLine" ? "Get Pick Up Line" : type}
                  </motion.button>
                )
              )}
            </motion.div>

            <div className="space-y-4 sm:space-y-6">
              {/* GPT Model + Temperature (Top Section, half width each) */}
              <motion.div
                variants={itemVariants}
                className="grid grid-cols-2 gap-4"
              >
                {/* GPT Model Dropdown */}
                <div>
                  {provider && provider === "OPENAI" ? (
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                      GPT Model
                    </label>
                  ) : (
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                      Gemini Model
                    </label>
                  )}
                  <select
                    value={gptModel}
                    onChange={(e) => setGptModel(e.target.value)}
                    className="w-full px-3 py-1.5 sm:py-2 rounded-lg bg-gray-700 text-gray-100 border border-gray-600 
          focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                    required
                  >
                    {provider === "OPENAI" ? (
                      <>
                        <option value="gpt-5">GPT-5</option>
                        <option value="gpt-4o-mini">GPT-4o Mini</option>
                        <option value="gpt-4o">GPT-4o</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      </>
                    ) : (
                      <>
                        {" "}
                        <option value="gemini-2.0-flash">
                          Gemini 2.0 Flash
                        </option>
                        <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                        <option value="gemini-2.5-flash">
                          Gemini 2.5 Flash
                        </option>
                        <option value="gemini-3-pro-preview">
                          Gemini 3 Pro Preview
                        </option>
                        <option value="gemini-3-flash-preview">
                          Gemini 3 Flash Preview
                        </option>
                        <option value="gemini-pro-latest">
                          Gemini Pro Latest
                        </option>
                      </>
                    )}
                  </select>
                </div>

                {/* Temperature Dropdown */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                    Temperature (Use between 0 and 2)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full px-3 py-1.5 sm:py-2 rounded-lg border text-xs sm:text-sm
      focus:outline-none focus:ring-2 focus:ring-blue-500
      border-gray-600 bg-gray-700 text-gray-100 
      [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="Enter temperature (0 - 2)"
                    required
                  />
                </div>
              </motion.div>

              {/* Grid for Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Gender Selection with Gen Z Checkbox */}
                <motion.div variants={itemVariants} className="space-y-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => handleChange(setGender, e.target.value)}
                      className="w-full px-3 py-1.5 sm:py-2 rounded-lg bg-gray-700 text-gray-100 border border-gray-600 
            focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                      required
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                  </div>

                  {gender === "MALE" && (
                    <motion.div
                      variants={itemVariants}
                      className="flex items-center"
                      whileHover={{
                        scale: 1.02,
                        transition: { duration: 0.2 },
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <input
                        type="checkbox"
                        checked={isGenxz}
                        onChange={(e) =>
                          handleChange(setIsGenxz, e.target.checked)
                        }
                        id="genz-checkbox"
                        className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 bg-gray-700 border-2 border-gray-500 rounded-md 
              focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-gray-800 
              transition-all duration-200 ease-in-out cursor-pointer hover:border-blue-400"
                      />
                      <label
                        htmlFor="genz-checkbox"
                        className="ml-2 text-xs sm:text-sm font-medium text-gray-300 cursor-pointer 
              hover:text-blue-400 transition-colors duration-200"
                      >
                        Gen Z Style
                      </label>
                    </motion.div>
                  )}
                </motion.div>

                {/* Language Selection */}
                <motion.div variants={itemVariants}>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => handleChange(setLanguage, e.target.value)}
                    className="w-full px-3 py-1.5 sm:py-2 rounded-lg bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                    required
                  >
                    <option value="en">English</option>
                    <option value="ar">Arabic</option>
                    <option value="arbz">Arabizi</option>
                  </select>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                    Dialect
                  </label>
                  <Select<DialectOption>
                    value={options.find((opt) => opt.value === dialect) || null}
                    onChange={(selectedOption: SingleValue<DialectOption>) => {
                      const value = selectedOption?.value || "";
                      handleChange(setDialect, value);
                    }}
                    options={options}
                    styles={customStyles}
                    isDisabled={language === "en"}
                    isSearchable={true}
                    placeholder="Select dialect..."
                    className="text-xs sm:text-sm"
                    classNamePrefix="react-select"
                    menuPlacement="top"
                  />
                  {language === "en" && (
                    <p className="text-xs text-gray-400 mt-1">
                      Dialect is disabled for English
                    </p>
                  )}
                </motion.div>

                {/* Style Selection */}
                <motion.div variants={itemVariants}>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                    Style
                  </label>
                  <select
                    value={style}
                    onChange={(e) => handleChange(setStyle, e.target.value)}
                    className="w-full px-3 py-1.5 sm:py-2 rounded-lg bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                    required
                  >
                    {stylesOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </motion.div>
              </div>

              {selectedType === "GetPickUpLine" && (
                <div className="space-y-3 sm:space-y-4">
                  <motion.div variants={itemVariants}>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                      Context (Optional)
                    </label>
                    <textarea
                      value={pickupContext}
                      onChange={(e) => setPickupContext(e.target.value)}
                      placeholder="Enter context (optional)..."
                      className="w-full h-16 sm:h-20 px-3 py-1.5 sm:py-2 rounded-lg bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                    />
                  </motion.div>
                </div>
              )}

              {selectedType === "ScreenshotReply" && (
                <motion.div variants={itemVariants} className="mb-4 sm:mb-6">
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                    Upload Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-3 py-1.5 sm:py-2 rounded-lg bg-gray-700 text-gray-100 border border-gray-600 
        file:mr-2 file:py-1 file:px-2 sm:file:mr-3 sm:file:py-1.5 sm:file:px-3 
        file:rounded-lg file:bg-blue-600 file:text-white file:border-0 hover:file:bg-blue-700 
        text-xs sm:text-sm cursor-pointer"
                    required
                  />

                  {/* Thumbnail Preview */}
                  {imageFile && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-400 mb-1">Preview:</p>
                      <img
                        src={URL.createObjectURL(imageFile)}
                        alt="Thumbnail preview"
                        onClick={() => setIsPreviewOpen(true)}
                        className="max-h-40 rounded-lg border border-gray-600 cursor-pointer hover:opacity-80 transition"
                      />
                    </div>
                  )}

                  {/* Full Page Preview with Blurred Background */}
                  {/* Full Page Preview with Blurred Background */}
                  {isPreviewOpen &&
                    imageFile &&
                    createPortal(
                      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
                        {/* Full-page blur layer */}
                        <div
                          className="absolute inset-0 backdrop-blur-md"
                          onClick={() => setIsPreviewOpen(false)}
                        />

                        {/* Image container */}
                        <div className="relative z-50 flex items-center justify-center">
                          {/* Close button */}
                          <button
                            onClick={() => setIsPreviewOpen(false)}
                            className="absolute top-2 right-2 sm:-top-10 sm:right-0 bg-red-500 hover:bg-red-600 text-white 
                     rounded-full w-8 h-8 flex items-center justify-center text-lg shadow-lg"
                          >
                            ✕
                          </button>

                          {/* Full Image */}
                          <img
                            src={URL.createObjectURL(imageFile)}
                            alt="Full preview"
                            className="max-h-[80vh] max-w-[95vw] sm:max-h-[90vh] sm:max-w-[90vw] object-contain rounded-lg shadow-2xl"
                          />
                        </div>
                      </div>,
                      document.body // 👈 mounts overlay at <body> level
                    )}
                </motion.div>
              )}

              {selectedType === "ManualReply" && (
                <div className="space-y-3 sm:space-y-4">
                  <motion.div variants={itemVariants}>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                      Message
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Enter your message..."
                      required
                      className="w-full h-16 sm:h-20 px-3 py-1.5 sm:py-2 rounded-lg bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                    />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                      Context (Optional)
                    </label>
                    <textarea
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      placeholder="Enter context (optional)..."
                      className="w-full h-16 sm:h-20 px-3 py-1.5 sm:py-2 rounded-lg bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                    />
                  </motion.div>
                </div>
              )}

              {/* Generate Button */}
              <motion.button
                variants={itemVariants}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 0 15px rgba(59, 130, 246, 0.4)",
                }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                disabled={
                  loading ||
                  (selectedType === "ManualReply" && !message.trim()) ||
                  (selectedType === "ScreenshotReply" && !imageFile)
                }
                className={`w-full py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base shadow-md transition-all duration-300 touch-manipulation ${
                  loading
                    ? "bg-blue-400 text-white cursor-not-allowed"
                    : (selectedType === "ManualReply" && !message.trim()) ||
                      (selectedType === "ScreenshotReply" && !imageFile)
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
                title={
                  loading
                    ? "Generating..."
                    : selectedType === "ManualReply" && !message.trim()
                    ? "Please enter a message."
                    : selectedType === "ScreenshotReply" && !imageFile
                    ? "Please upload a screenshot."
                    : ""
                }
              >
                {loading ? "Generating..." : "Generate Prompt"}
              </motion.button>

              {/* API Response Display */}
              {success && (
                <motion.div
                  variants={itemVariants}
                  className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-700 rounded-lg text-gray-100 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto hide-scrollbar"
                >
                  {(aiInput || aiOutput) && (
                    <div className="mt-5 sm:mt-6">
                      {/* Input Accordion */}
                      <motion.div
                        onClick={toggleInputAccordion}
                        whileHover={{
                          backgroundColor: "rgba(55, 65, 81, 0.8)",
                        }}
                        className="cursor-pointer p-2 sm:p-3 bg-gray-800 rounded-lg border border-gray-600 hover:border-gray-500 transition-all duration-300"
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs sm:text-sm font-medium text-gray-300">
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
                            {/* Role */}
                            <div>
                              <h5 className="text-sm sm:text-base font-semibold text-gray-100 mb-1">
                                Role
                              </h5>
                              <pre className="whitespace-pre-wrap text-gray-300">
                                {aiInput.role}
                              </pre>
                            </div>

                            {/* Message Type */}
                            <div>
                              <h5 className="text-sm sm:text-base font-semibold text-gray-100 mb-1">
                                Message Type
                              </h5>
                              <pre className="whitespace-pre-wrap text-gray-300">
                                {aiInput.messageType}
                              </pre>
                            </div>

                            {/* Language */}
                            <div>
                              <h5 className="text-sm sm:text-base font-semibold text-gray-100 mb-1">
                                Language
                              </h5>
                              <pre className="whitespace-pre-wrap text-gray-300">
                                {aiInput.language}
                              </pre>
                            </div>

                            {/* Dialect */}
                            <div>
                              {aiInput.dialect && (
                                <>
                                  <h5 className="text-sm sm:text-base font-semibold text-gray-100 mb-1">
                                    Dialect
                                  </h5>
                                  <pre className="whitespace-pre-wrap text-gray-300">
                                    {aiInput.dialect || "N/A"}
                                  </pre>
                                </>
                              )}
                            </div>

                            {/* Style */}
                            <div>
                              <h5 className="text-sm sm:text-base font-semibold text-gray-100 mb-1">
                                Style
                              </h5>
                              <pre className="whitespace-pre-wrap text-gray-300">
                                {aiInput.style}
                              </pre>
                            </div>

                            {/* Submission Prompt — stored on the prompt but not
                                part of what is sent to the model, because the
                                live app has never included it. Labelled so the
                                breakdown is not read as "this text was used". */}
                            <div>
                              <h5 className="text-sm sm:text-base font-semibold text-gray-100 mb-1">
                                Submission Prompt{" "}
                                <span className="font-normal text-amber-400/90">
                                  — not sent to the model
                                </span>
                              </h5>
                              <p className="text-xs text-gray-500 mb-1">
                                Saved on the prompt, but the live app does not
                                include it, so the tester excludes it too.
                              </p>
                              <pre className="whitespace-pre-wrap text-gray-300">
                                {aiInput.subPrmpt || "—"}
                              </pre>
                            </div>

                            {/* User Instruction */}
                            {/* <div>
                          <h5 className="text-sm sm:text-base font-semibold text-gray-100 mb-1">
                            User Instruction
                          </h5>
                          <pre className="whitespace-pre-wrap text-gray-300">
                            {aiInput.userInstruction}
                          </pre>
                        </div> */}
                          </div>
                        )}
                      </motion.div>

                      {/* Output Accordion */}
                      <motion.div
                        onClick={toggleOutputAccordion}
                        whileHover={{
                          backgroundColor: "rgba(55, 65, 81, 0.8)",
                        }}
                        className="cursor-pointer p-2 sm:p-3 bg-gray-800 rounded-lg border border-gray-600 hover:border-gray-500 transition-all duration-300 mt-4"
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs sm:text-sm font-medium text-gray-300">
                            View Output
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
                        <div className="mt-3 p-3 bg-gray-800 rounded-lg text-xs sm:text-sm text-gray-200 border border-gray-700">
                          <ul className="list-none">
                            {responses.map((response, index) => (
                              <li
                                key={index}
                                className={`no-underline ${
                                  output.startsWith("Error:")
                                    ? "text-red-400"
                                    : "text-gray-100"
                                }`}
                              >
                                {response
                                  .replace(/^\s*"\d+\.\s*|\s*"$/, "")
                                  .replace(/^"|"$/g, "")
                                  .trim()}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>

                      {/* Download Button */}
                      <div className="flex justify-end mt-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={handleDownloadJson}
                          disabled={loading || !aiOutput}
                          className={`flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-3 rounded-lg font-medium text-xs sm:text-sm shadow-md transition-all duration-300 touch-manipulation mb-4 ${
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
                          <span>
                            {loading ? "Preparing..." : "Download JSON"}
                          </span>
                        </motion.button>
                      </div>
                    </div>
                  )}

                  <div className="mb-3 sm:mb-4">
                    <motion.div
                      onClick={togglePromptAccordion}
                      whileHover={{
                        backgroundColor: "rgba(55, 65, 81, 0.8)",
                      }}
                      className="cursor-pointer p-2 sm:p-3 bg-gray-800 rounded-lg border border-gray-600 hover:border-gray-500 transition-all duration-300"
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs sm:text-sm font-medium text-gray-300">
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
                      {fullPrompt && (
                        <div className="mt-3 p-3 bg-gray-800 rounded-lg space-y-5 text-xs sm:text-sm text-gray-200">
                          {/* Role */}
                          <div>
                            <h5 className="text-sm sm:text-base font-semibold text-gray-100 mb-1">
                              Role
                            </h5>
                            <pre className="whitespace-pre-wrap text-gray-300">
                              {fullPrompt.role}
                            </pre>
                          </div>

                          {/* Message Type */}
                          <div>
                            <h5 className="text-sm sm:text-base font-semibold text-gray-100 mb-1">
                              Message Type
                            </h5>
                            <pre className="whitespace-pre-wrap text-gray-300">
                              {fullPrompt.messageType}
                            </pre>
                          </div>

                          {/* Language */}
                          <div>
                            <h5 className="text-sm sm:text-base font-semibold text-gray-100 mb-1">
                              Language
                            </h5>
                            <pre className="whitespace-pre-wrap text-gray-300">
                              {fullPrompt.language}
                            </pre>
                          </div>

                          {/* Dialect */}
                          <div>
                            <h5 className="text-sm sm:text-base font-semibold text-gray-100 mb-1">
                              Dialect
                            </h5>
                            <pre className="whitespace-pre-wrap text-gray-300">
                              {fullPrompt.dialect || "N/A"}
                            </pre>
                          </div>

                          {/* Style */}
                          <div>
                            <h5 className="text-sm sm:text-base font-semibold text-gray-100 mb-1">
                              Style
                            </h5>
                            <pre className="whitespace-pre-wrap text-gray-300">
                              {fullPrompt.style}
                            </pre>
                          </div>

                          {/* Style */}
                          <div>
                            <h5 className="text-sm sm:text-base font-semibold text-gray-100 mb-1">
                              Submission Prompt
                            </h5>
                            <pre className="whitespace-pre-wrap text-gray-300">
                              {fullPrompt.subPrmpt}
                            </pre>
                          </div>

                          {/* Gender */}
                          {/* <div>
                          <h5 className="text-sm sm:text-base font-semibold text-gray-100 mb-1">
                            Gender
                          </h5>
                          <pre className="whitespace-pre-wrap text-gray-300">
                            {fullPrompt.gender}
                          </pre>
                        </div> */}

                          {/* User Instruction */}
                          {/* <div>
                          <h5 className="text-sm sm:text-base font-semibold text-gray-100 mb-1">
                            User Instruction
                          </h5>
                          <pre className="whitespace-pre-wrap text-gray-300">
                            {fullPrompt.userInstruction}
                          </pre>
                        </div> */}

                          {/* Previous Replies */}
                          {fullPrompt.lastReplies && (
                            <div>
                              <h5 className="text-sm sm:text-base font-semibold text-gray-100 mb-1">
                                Previous Replies (last convo)
                              </h5>
                              <ul className="list-decimal list-inside space-y-1 text-gray-300">
                                {fullPrompt.lastReplies.map((reply, i) => (
                                  <li key={i}>{reply}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  </div>

                  {(modelUsed || temperatureUsed || tokenUsage) && (
                    <div className="mt-5 sm:mt-6 p-4 sm:p-5 bg-gray-800 rounded-xl border border-gray-700 shadow-md hover:shadow-lg transition-all duration-300">
                      <h5 className="text-base sm:text-lg font-semibold text-gray-100 mb-4 border-b border-gray-700 pb-2">
                        ⚙️ Model & Token Details
                      </h5>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs sm:text-sm text-gray-200">
                        {modelUsed && (
                          <div className="flex justify-between items-center border-b border-gray-700 pb-1">
                            <span className="font-medium text-gray-300">
                              Model Used
                            </span>
                            <span className="text-gray-400">{modelUsed}</span>
                          </div>
                        )}

                        {temperatureUsed !== null && (
                          <div className="flex justify-between items-center border-b border-gray-700 pb-1">
                            <span className="font-medium text-gray-300">
                              Temperature
                            </span>
                            <span className="text-gray-400">
                              {temperatureUsed}
                            </span>
                          </div>
                        )}

                        {tokenUsage && (
                          <>
                            <div className="flex justify-between items-center border-b border-gray-700 pb-1">
                              <span className="font-medium text-gray-300">
                                Input Tokens
                              </span>
                              <span className="text-gray-400">
                                {tokenUsage.inputTokens}
                              </span>
                            </div>

                            <div className="flex justify-between items-center border-b border-gray-700 pb-1">
                              <span className="font-medium text-gray-300">
                                Output Tokens
                              </span>
                              <span className="text-gray-400">
                                {tokenUsage.outputTokens}
                              </span>
                            </div>

                            <div className="flex justify-between items-center border-b border-gray-700 pb-1">
                              <span className="font-medium text-gray-300">
                                Total Tokens
                              </span>
                              <span className="text-gray-400">
                                {tokenUsage.totalTokens}
                              </span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-300">
                                Estimated Cost
                              </span>
                              <span className="text-green-400 font-semibold">
                                ${tokenUsage.estimatedCost.toFixed(5)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                      Responses
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">
                      {responses.map((response, index) => (
                        <li
                          key={index}
                          className={`${
                            output.startsWith("Error:")
                              ? "text-red-400"
                              : "text-gray-100"
                          }`}
                        >
                          {response
                            .replace(/^\s*"\d+\.\s*|\s*"$/, "")
                            .replace(/^"|"$/g, "")
                            .trim()}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Translated Text Display - Only for ar and arbz languages */}
                  {(language === "ar" || language === "arbz") &&
                    translatedText.length > 0 && (
                      <div className="mt-3 sm:mt-4">
                        <motion.div
                          onClick={toggleTranslatedAccordion}
                          whileHover={{
                            backgroundColor: "rgba(55, 65, 81, 0.8)",
                          }}
                          className="cursor-pointer p-2 sm:p-3 bg-gray-800 rounded-lg border border-gray-600 hover:border-gray-500 transition-all duration-300"
                        >
                          <div className="flex justify-between items-center">
                            <h4 className="text-xs sm:text-sm font-medium text-gray-300">
                              View Translated Text (English)
                            </h4>
                            <motion.span
                              animate={{
                                rotate: translatedAccordionOpen ? 180 : 0,
                              }}
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
                            height: translatedAccordionOpen ? "auto" : 0,
                            opacity: translatedAccordionOpen ? 1 : 0,
                          }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 p-2 sm:p-3 bg-gray-800 rounded-lg">
                            <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">
                              {translatedText.map((translation, index) => (
                                <li key={index} className="text-gray-100">
                                  {translation
                                    .replace(/^\s*"\d+\.\s*|\s*"$/, "")
                                    .replace(/^"|"$/g, "")
                                    .trim()}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </motion.div>
                      </div>
                    )}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "templates" && (
          <motion.div
            variants={itemVariants}
            className="w-full max-w-5xl m-auto mt-4 text-center text-gray-300 text-sm sm:text-base"
          >
            <PromptTemplates />
          </motion.div>
        )}

    {activeTab === "pickup_lines" && (
          <motion.div
            variants={itemVariants}
            className="w-full max-w-7xl m-auto mt-4 text-center text-gray-300 text-sm sm:text-base"
          >
            <PickupLines />
          </motion.div>
        )}


        {activeTab === "pickup_templates" && (
          <motion.div
            variants={itemVariants}
            className="w-full max-w-5xl mt-4 m-auto text-center text-gray-300 text-sm sm:text-base"
          >
            <PickUpPromptTemplates />
          </motion.div>
        )}

        {activeTab === "conversation" && (
          <motion.div
            variants={itemVariants}
            className="w-full max-w-5xl m-auto text-center text-gray-300 text-sm sm:text-base"
          >
            <ConvoGenerator setGlobalLoading={setGlobalLoading} />{" "}
          </motion.div>
        )}

        {activeTab === "conversation_prompt" && (
          <motion.div
            variants={itemVariants}
            className="w-full max-w-5xl m-auto text-center text-gray-300 text-sm sm:text-base"
          >
            <ConversationPromptEditor
              keyValue="conversation_prompt_v5_1762836404699"
              handleCancel={() => {
              setEditMode(false);
              const newTab = "conversation";
              setActiveTab(newTab);
              setTabing(newTab);
            }}
              setGlobalLoading={setGlobalLoading}
            />
          </motion.div>
        )}

        {activeTab === "ai_Settings" && (
          <motion.div
            variants={itemVariants}
            className="w-full max-w-5xl m-auto text-center text-gray-300 text-sm sm:text-base"
          >
            <AISettingsComponent />
          </motion.div>
        )}

        {loading && <TypingLoader />}
        <AnimatePresence>
          {globalLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
            >
              <div className="relative z-10 pointer-events-auto">
                <TypingLoader />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PromptGenerator;
