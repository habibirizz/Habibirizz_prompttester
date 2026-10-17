import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { deleteApi, getApi, patchApi, postApi } from "./api";
import { URLS } from "./urls";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import AddPromptModal from "./AddPromptModal";

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

interface ConversationPromptEditorProps {
  keyValue: string;
  handleCancel?: () => void;
  setGlobalLoading: (loading: boolean) => void;
}

/* ------------------------------------------------------------------ */
/*  Helper – deep clone (simple but enough for this shape)            */
/* ------------------------------------------------------------------ */
const deepClone = (obj: any): any => JSON.parse(JSON.stringify(obj));

const ConversationPromptEditor: React.FC<ConversationPromptEditorProps> = ({
  keyValue,
  handleCancel,
  setGlobalLoading,
}) => {
  const [promptData, setPromptData] = useState<any>(null);
  const [editedData, setEditedData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [dirtyFields, setDirtyFields] = useState<Record<string, any>>({});
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>(
    {}
  );
  const [parentConvoId, setParentConvoId] = useState("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<
    "scenario" | "relationshipLevel" | null
  >(null);


    const fetchPrompt = async () => {
      try {
        setLoading(true);
        setGlobalLoading(true);
        setError("");
        const res = await getApi(
          `${URLS.getConversationPrompt}?key=${keyValue}`
        );
        const data = res?.data?.data?.response;
        setParentConvoId(data._id);
        if (!data) {
          setError("No data found.");
          return;
        }

        let normalizedPersonas: Record<string, any> = {};
        if (Array.isArray(data.personaPrompts)) {
          normalizedPersonas = data.personaPrompts.reduce(
            (acc: any, p: any) => {
              acc[p.key || p.title || p._id] = p;
              return acc;
            },
            {}
          );
        } else if (
          data.personaPrompts &&
          typeof data.personaPrompts === "object"
        ) {
          Object.entries(data.personaPrompts).forEach(
            ([k, v]: [string, any]) => {
              if (typeof v === "object" && v._id) {
                normalizedPersonas[k] = v;
              }
            }
          );
        }

        const normalized = {
          ...data,
          personaPrompts: normalizedPersonas,
        };

        setPromptData(normalized);
        setEditedData(deepClone(normalized));
      } catch (err) {
        console.error("Error fetching:", err);
        toast.error("Failed to fetch conversation prompt.");
        setError("Failed to fetch prompt data.");
      } finally {
        setLoading(false);
        setGlobalLoading(false);
      }
    };

  useEffect(() => {
    if (!keyValue) return;

    fetchPrompt();
  }, [keyValue]);

  const toggleAccordion = (field: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const isObjectId = (s: string) => /^[a-fA-F0-9]{24}$/.test(String(s));

  const updateField = useCallback((path: string[], value: any) => {
    const pathKey = path.join(".");
    setDirtyFields((prev) => ({ ...prev, [pathKey]: value }));

    setEditedData((prev: any) => {
      const copy = deepClone(prev);

      if (path[0] === "personaPrompts") {
        const personaKey = path[1];
        if (!copy.personaPrompts) copy.personaPrompts = {};
        if (!copy.personaPrompts[personaKey])
          copy.personaPrompts[personaKey] = {};
        if (path.length === 2) {
          copy.personaPrompts[personaKey] = value;
        } else {
          let node = copy.personaPrompts[personaKey];
          for (let i = 2; i < path.length - 1; i++) {
            const k = path[i];
            if (node[k] == null) node[k] = {};
            node = node[k];
          }
          node[path[path.length - 1]] = value;
        }
        return copy;
      }

      if (
        path.length >= 2 &&
        isObjectId(path[1]) &&
        Array.isArray(copy[path[0]])
      ) {
        const collectionName = path[0];
        const id = path[1];
        const rest = path.slice(2);
        const arr = copy[collectionName] as any[];

        const newArr = arr.map((item) => {
          const itemIdStr = String(item._id ?? item.id ?? item._doc?._id ?? "");
          if (itemIdStr === id) {
            const updatedItem = { ...item };
            if (rest.length === 0) {
              return value;
            }
            let node = updatedItem;
            for (let i = 0; i < rest.length - 1; i++) {
              const k = rest[i];
              if (node[k] == null) node[k] = {};
              node = node[k];
            }
            node[rest[rest.length - 1]] = value;
            return updatedItem;
          }
          return item;
        });

        copy[collectionName] = newArr;
        return copy;
      }

      let node: any = copy;
      for (let i = 0; i < path.length - 1; i++) {
        const k = path[i];
        if (node[k] == null) node[k] = {};
        node = node[k];
      }
      node[path[path.length - 1]] = value;
      return copy;
    });
  }, []);

  const buildPatchPayload = (): any => {
    const grouped: Record<string, Record<string, any>> = {};
    const topLevelScalars: Record<string, any> = {};

    for (const [path, val] of Object.entries(dirtyFields)) {
      const parts = path.split(".");
      if (parts[0] === "personaPrompts") {
        const personaKey = parts[1];
        const rest = parts.slice(2);
        if (!grouped["personaPrompts"]) grouped["personaPrompts"] = {};
        if (!grouped["personaPrompts"][personaKey])
          grouped["personaPrompts"][personaKey] = {};
        if (rest.length === 0) {
          grouped["personaPrompts"][personaKey] = val;
        } else {
          let node = grouped["personaPrompts"][personaKey];
          for (let i = 0; i < rest.length - 1; i++) {
            const k = rest[i];
            if (node[k] == null) node[k] = {};
            node = node[k];
          }
          node[rest[rest.length - 1]] = val;
        }
      } else if (parts.length >= 2 && isObjectId(parts[1])) {
        const collection = parts[0];
        const id = parts[1];
        const rest = parts.slice(2);
        if (!grouped[collection]) grouped[collection] = {};
        if (!grouped[collection][id]) grouped[collection][id] = {};
        if (rest.length === 0) {
          grouped[collection][id] = val;
        } else {
          let node = grouped[collection][id];
          for (let i = 0; i < rest.length - 1; i++) {
            const k = rest[i];
            if (node[k] == null) node[k] = {};
            node = node[k];
          }
          node[rest[rest.length - 1]] = val;
        }
      } else {
        let node = topLevelScalars;
        for (let i = 0; i < parts.length - 1; i++) {
          const k = parts[i];
          if (node[k] == null) node[k] = {};
          node = node[k];
        }
        node[parts[parts.length - 1]] = val;
      }
    }

    const payload: any = { ...topLevelScalars };

    for (const [collection, map] of Object.entries(grouped)) {
      if (collection === "personaPrompts") {
        payload.personaPrompts = Object.entries(map).map(
          ([personaKey, updates]) => {
            const personaId =
              promptData?.personaPrompts?.[personaKey] ||
              editedData?.personaPrompts?.[personaKey] ||
              personaKey;

            return {
              id: personaId._id,
              updates,
            };
          }
        );
      } else {
        payload[collection] = Object.entries(map).map(([id, updates]) => ({
          id,
          updates,
        }));
      }
    }
    return payload;
  };

  const handleSave = async () => {
    if (Object.keys(dirtyFields).length === 0) {
      toast.info("No changes to save.");
      return;
    }

    setSaving(true);
          setGlobalLoading(true);

    try {
      const payload = buildPatchPayload();

      delete payload._id;
      delete payload.key;
      delete payload.createdAt;
      delete payload.updatedAt;

      const res = await patchApi(
        `${URLS.updateConversationPrompt}/${promptData._id}`,
        payload
      );

      if (res?.data?.data?.updatedPrompt) {
        const fresh = res.data.data.updatedPrompt;
        fetchPrompt()
        setPromptData(fresh);
        setEditedData(deepClone(fresh));
        setDirtyFields({});
        toast.success("Saved successfully!");
      } else {
        throw new Error("No updated document returned");
      }
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
            setGlobalLoading(false);

    }
  };

  const handleCancelMain = () => {
    setPromptData(null);
    setEditedData(null);
    setDirtyFields({});
    handleCancel?.();
  };

  /* ---------------- Delete Scenario ---------------- */
  const handleDeleteScenario = async (scenarioId: string) => {
    try {
      if (!promptData?._id) {
        toast.error("mainConvoId is missing");
        return;
      }

      const payload = { mainConvoId: promptData._id, scenarioId };

      const mainConvoId = promptData._id;

      const res = await deleteApi(
        `${URLS.deleteScenarioAndDetach}?mainConvoId=${mainConvoId}&scenarioId=${scenarioId}`
      );
      toast.success("Scenario deleted successfully!");

      // Remove from local state
      setEditedData((prev: any) => ({
        ...prev,
        scenarios: prev?.scenarios?.filter((s: any) => s._id !== scenarioId),
      }));
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to delete scenario");
    }
  };

  /* ---------------- Delete Relationship Level ---------------- */
  const handleDeleteRelationshipLevel = async (relationshipLevelId: string) => {
    try {
      if (!promptData?._id) {
        toast.error("mainConvoId is missing");
        return;
      }

      const mainConvoId = promptData._id;

      const res = await deleteApi(
        `${URLS.deleteRelationshipLevelAndDetach}?mainConvoId=${mainConvoId}&relationshipLevelId=${relationshipLevelId}`
      );
      toast.success("Relationship level deleted successfully!");

      // Remove from local state
      setEditedData((prev: any) => ({
        ...prev,
        relationshipLevels: prev?.relationshipLevels?.filter(
          (r: any) => r._id !== relationshipLevelId
        ),
      }));
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || "Failed to delete relationship level"
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-5xl bg-gray-800/90 backdrop-blur-md rounded-xl shadow-xl p-6 sm:p-8 border border-gray-700"
      >
        <p className="text-red-500 text-left">{error}</p>
      </motion.div>
    );
  }

  if (!promptData || !editedData) return null;

const {
    personaPrompts,
    relationshipLevels,
    scenarios,
    conversationLengths,
    submissionPrompt,
  } = editedData;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative w-full max-w-5xl bg-gray-800/90 backdrop-blur-md rounded-xl shadow-xl p-6 sm:p-8 border border-gray-700 pt-10 mt-[20px]"
    >
      <div className="flex flex-wrap justify-start items-center gap-4 text-sm text-gray-400 mb-6 sm:mb-8">
        <div>
          <span className="font-medium text-gray-300">Modified On:</span>{" "}
          {promptData?.updatedAt
            ? new Date(promptData.updatedAt).toLocaleString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "N/A"}
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <motion.div variants={itemVariants} className="mb-4 sm:mb-6">
          <div className="p-2 sm:p-3 bg-gray-800 rounded-lg border border-gray-600">
            <motion.div
              onClick={() => toggleAccordion("personaPrompts")}
              whileHover={{ backgroundColor: "rgba(55, 65, 81, 0.8)" }}
              className="cursor-pointer flex justify-between items-center"
            >
              <h4 className="text-base sm:text-lg font-semibold text-gray-100 capitalize text-left">
                Persona Types
              </h4>
              <motion.span
                animate={{ rotate: openAccordions["personaPrompts"] ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="text-gray-400"
              >
                ▼
              </motion.span>
            </motion.div>

            {openAccordions["personaPrompts"] && (
              <div className="space-y-3 sm:space-y-4 pt-3">
                {Object.entries(personaPrompts || {}).map(
                  ([key, persona]: [string, any]) => {
                    const isMale = persona.persona === "HABIBI";
                    const stylesToShow = isMale
                      ? ["CONSERVATIVE", "PLAYFUL", "CONFIDENT", "FLIRTY"]
                      : ["MODEST", "SASSY", "PLAYFUL", "FLIRTY"];

                    return (
                      <div
                        key={key}
                        className="p-2 bg-gray-700 rounded-lg border border-gray-600"
                      >
                        {/* PERSONA HEADER */}
                        <motion.div
                          onClick={() => toggleAccordion(`persona-${key}`)}
                          whileHover={{
                            backgroundColor: "rgba(75, 85, 99, 0.8)",
                          }}
                          className="cursor-pointer flex justify-between items-center p-2"
                        >
                          <h5 className="text-sm sm:text-base font-medium text-gray-200 text-left">
                            {promptData?.personaPrompts?.[key]?.title || key}
                          </h5>
                          <motion.span
                            animate={{
                              rotate: openAccordions[`persona-${key}`] ? 180 : 0,
                            }}
                            transition={{ duration: 0.3 }}
                            className="text-gray-400"
                          >
                            ▼
                          </motion.span>
                        </motion.div>

                        {/* PERSONA CONTENT */}
                        {openAccordions[`persona-${key}`] && (
                          <div className="space-y-3 pt-3 px-2">
                            <div className="p-2 bg-gray-600 rounded-lg border border-gray-500 mb-3">
                              <label className="block text-xs font-medium text-gray-300 mb-1 text-left">
                                Title
                              </label>
                              <input
                                type="text"
                                value={persona.title || ""}
                                onChange={(e) =>
                                  updateField(
                                    ["personaPrompts", key, "title"],
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 rounded-lg bg-gray-700 text-gray-100 border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                                placeholder="Enter persona title..."
                              />
                            </div>

                            {/* Role */}
                            <div className="p-2 bg-gray-600 rounded-lg border border-gray-500">
                              <motion.div
                                onClick={() => toggleAccordion(`role-${key}`)}
                                whileHover={{
                                  backgroundColor: "rgba(75, 85, 99, 0.6)",
                                }}
                                className="cursor-pointer flex justify-between items-center"
                              >
                                <h6 className="text-sm font-medium text-gray-200 text-left">
                                  Role
                                </h6>
                                <motion.span
                                  animate={{
                                    rotate: openAccordions[`role-${key}`] ? 180 : 0,
                                  }}
                                  transition={{ duration: 0.3 }}
                                  className="text-gray-400 text-sm"
                                >
                                  ▼
                                </motion.span>
                              </motion.div>
                              {openAccordions[`role-${key}`] && (
                                <div className="pt-2">
                                  <textarea
                                    value={persona.role || ""}
                                    onChange={(e) =>
                                      updateField(
                                        ["personaPrompts", key, "role"],
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-2 rounded-lg bg-gray-700 text-gray-100 border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm min-h-[200px] resize-y"
                                  />
                                </div>
                              )}
                            </div>

                            {/* Languages */}
                            {persona.languages &&
                              Object.keys(persona.languages).length > 0 && (
                                <div className="p-2 bg-gray-600 rounded-lg border border-gray-500">
                                  <motion.div
                                    onClick={() => toggleAccordion(`languages-${key}`)}
                                    whileHover={{
                                      backgroundColor: "rgba(75, 85, 99, 0.6)",
                                    }}
                                    className="cursor-pointer flex justify-between items-center"
                                  >
                                    <h6 className="text-sm font-medium text-gray-200 text-left">
                                      Languages
                                    </h6>
                                    <motion.span
                                      animate={{
                                        rotate: openAccordions[`languages-${key}`] ? 180 : 0,
                                      }}
                                      transition={{ duration: 0.3 }}
                                      className="text-gray-400 text-sm"
                                    >
                                      ▼
                                    </motion.span>
                                  </motion.div>
                                  {openAccordions[`languages-${key}`] && (
                                    <div className="space-y-2 pt-2">
                                      {Object.entries(persona.languages).map(
                                        ([lang, val]) => (
                                          <div key={lang}>
                                            <label className="block text-xs font-medium text-gray-300 mb-1 text-left capitalize">
                                              {lang}
                                            </label>
                                            <textarea
                                              value={String(val)}
                                              onChange={(e) =>
                                                updateField(
                                                  [
                                                    "personaPrompts",
                                                    key,
                                                    "languages",
                                                    lang,
                                                  ],
                                                  e.target.value
                                                )
                                              }
                                              className="w-full px-3 py-2 rounded-lg bg-gray-700 text-gray-100 border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm min-h-[150px] resize-y"
                                            />
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}

                            {/* Dialects */}
                            {persona.dialects &&
                              Object.keys(persona.dialects).length > 0 && (
                                <div className="p-2 bg-gray-600 rounded-lg border border-gray-500">
                                  <motion.div
                                    onClick={() => toggleAccordion(`dialects-${key}`)}
                                    whileHover={{
                                      backgroundColor: "rgba(75, 85, 99, 0.6)",
                                    }}
                                    className="cursor-pointer flex justify-between items-center"
                                  >
                                    <h6 className="text-sm font-medium text-gray-200 text-left">
                                      Dialects
                                    </h6>
                                    <motion.span
                                      animate={{
                                        rotate: openAccordions[`dialects-${key}`] ? 180 : 0,
                                      }}
                                      transition={{ duration: 0.3 }}
                                      className="text-gray-400 text-sm"
                                    >
                                      ▼
                                    </motion.span>
                                  </motion.div>
                                  {openAccordions[`dialects-${key}`] && (
                                    <div className="space-y-2 pt-2">
                                      {Object.entries(persona.dialects).map(
                                        ([dialect, val]) => (
                                          <div key={dialect}>
                                            <label className="block text-xs font-medium text-gray-300 mb-1 text-left capitalize">
                                              {dialect}
                                            </label>
                                            <textarea
                                              value={String(val)}
                                              onChange={(e) =>
                                                updateField(
                                                  [
                                                    "personaPrompts",
                                                    key,
                                                    "dialects",
                                                    dialect,
                                                  ],
                                                  e.target.value
                                                )
                                              }
                                              className="w-full px-3 py-2 rounded-lg bg-gray-700 text-gray-100 border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm min-h-[150px] resize-y"
                                            />
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}

                            {/* Styles (filtered) */}
                            {persona.styles &&
                              Object.keys(persona.styles).length > 0 && (
                                <div className="p-2 bg-gray-600 rounded-lg border border-gray-500">
                                  <motion.div
                                    onClick={() => toggleAccordion(`styles-${key}`)}
                                    whileHover={{
                                      backgroundColor: "rgba(75, 85, 99, 0.6)",
                                    }}
                                    className="cursor-pointer flex justify-between items-center"
                                  >
                                    <h6 className="text-sm font-medium text-gray-200 text-left">
                                      Styles
                                    </h6>
                                    <motion.span
                                      animate={{
                                        rotate: openAccordions[`styles-${key}`] ? 180 : 0,
                                      }}
                                      transition={{ duration: 0.3 }}
                                      className="text-gray-400 text-sm"
                                    >
                                      ▼
                                    </motion.span>
                                  </motion.div>
                                  {openAccordions[`styles-${key}`] && (
                                    <div className="space-y-2 pt-2">
                                      {Object.entries(persona.styles)
                                        .filter(([style]) => stylesToShow.includes(style))
                                        .map(([style, val]) => (
                                          <div key={style}>
                                            <label className="block text-xs font-medium text-gray-300 mb-1 text-left capitalize">
                                              {style.toLowerCase()}
                                            </label>
                                            <textarea
                                              value={String(val)}
                                              onChange={(e) =>
                                                updateField(
                                                  ["personaPrompts", key, "styles", style],
                                                  e.target.value
                                                )
                                              }
                                              className="w-full px-3 py-2 rounded-lg bg-gray-700 text-gray-100 border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm min-h-[150px] resize-y"
                                            />
                                          </div>
                                        ))}
                                    </div>
                                  )}
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Scenarios */}
        <motion.div variants={itemVariants} className="mb-4 sm:mb-6">
          <div className="p-2 sm:p-3 bg-gray-800 rounded-lg border border-gray-600">
            <motion.div
              onClick={() => toggleAccordion("scenarios")}
              whileHover={{ backgroundColor: "rgba(55, 65, 81, 0.8)" }}
              className="cursor-pointer flex justify-between items-center"
            >
              <h4 className="text-base sm:text-lg font-semibold text-gray-100 capitalize text-left">
                Scenarios
              </h4>
              <motion.span
                animate={{ rotate: openAccordions["scenarios"] ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="text-gray-400"
              >
                ▼
              </motion.span>
            </motion.div>

            {openAccordions["scenarios"] && (
              <div className="pt-3 space-y-3 sm:space-y-4">
                <button
                  onClick={() => {
                    setModalType("scenario");
                    setIsModalOpen(true);
                  }}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                >
                  + Add Scenario
                </button>

                {scenarios
                  ?.filter((s: any) => s.value !== "custom")
                  .map((s: any) => (
                    <div
                      key={s._id}
                      className="p-2 bg-gray-700 rounded-lg border border-gray-600 relative"
                    >
                      <button
                        onClick={() => handleDeleteScenario(s._id)}
                        className="absolute top-2 right-2 text-red-400 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>

                      <label className="block text-sm font-medium text-gray-300 mb-1 text-left">
                        {s.title}
                      </label>
                      <textarea
                        value={s.promptAddOn || ""}
                        onChange={(e) =>
                          updateField(["scenarios", s._id, "promptAddOn"], e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-lg bg-gray-600 text-gray-100 border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm min-h-[250px] resize-y"
                      />
                    </div>
                  ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Conversation Lengths */}
        <motion.div variants={itemVariants} className="mb-4 sm:mb-6">
          <div className="p-2 sm:p-3 bg-gray-800 rounded-lg border border-gray-600">
            <motion.div
              onClick={() => toggleAccordion("conversationLengths")}
              whileHover={{ backgroundColor: "rgba(55, 65, 81, 0.8)" }}
              className="cursor-pointer flex justify-between items-center"
            >
              <h4 className="text-base sm:text-lg font-semibold text-gray-100 capitalize text-left">
                Conversation Lengths
              </h4>
              <motion.span
                animate={{ rotate: openAccordions["conversationLengths"] ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="text-gray-400"
              >
                ▼
              </motion.span>
            </motion.div>

            {openAccordions["conversationLengths"] && (
              <div className="space-y-3 sm:space-y-4 pt-3">
                {conversationLengths?.map((c: any) => (
                  <div
                    key={c._id}
                    className="p-2 bg-gray-700 rounded-lg border border-gray-600"
                  >
                    <label className="block text-sm font-medium text-gray-300 mb-1 text-left">
                      {c.title} {c.range?.length ? `(${c.range[0]} - ${c.range[1]})` : ""}
                    </label>
                    <textarea
                      value={c.promptAddOn || ""}
                      onChange={(e) =>
                        updateField(["conversationLengths", c._id, "promptAddOn"], e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-lg bg-gray-600 text-gray-100 border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm min-h-[250px] resize-y"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Submission Prompt */}
        <motion.div variants={itemVariants} className="mb-4 sm:mb-6">
          <div className="p-2 sm:p-3 bg-gray-800 rounded-lg border border-gray-600">
            <motion.div
              onClick={() => toggleAccordion("submissionPrompt")}
              whileHover={{ backgroundColor: "rgba(55, 65, 81, 0.8)" }}
              className="cursor-pointer flex justify-between items-center"
            >
              <h4 className="text-base sm:text-lg font-semibold text-gray-100 capitalize text-left">
                Submission Prompt
              </h4>
              <motion.span
                animate={{ rotate: openAccordions["submissionPrompt"] ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="text-gray-400"
              >
                ▼
              </motion.span>
            </motion.div>

            {openAccordions["submissionPrompt"] && (
              <div className="pt-3">
                <textarea
                  value={submissionPrompt || ""}
                  onChange={(e) => updateField(["submissionPrompt"], e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm min-h-[200px] resize-y"
                />
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition w-full"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      <AddPromptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={modalType}
        mainConvoId={parentConvoId}
        setEditedData={setEditedData}
      />
    </motion.div>
  );
};

export default ConversationPromptEditor;