import { useEffect, useState } from "react";
import { getApi, postApi, putApi } from "../utils/api";
import { URLS } from "../utils/urls";
import { motion } from "framer-motion";
import TypingLoader from "../utils/Lodaer";
import { toast } from "sonner";

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const languageMappings: Record<string, string> = {
  en: "English",
  ar: "Arabic",
  arbz: "Arabizi",
};

const reverseLanguageMappings: Record<string, string> = {
  English: "en",
  Arabic: "ar",
  Arabizi: "arbz",
};

const excludedFields = [
  "_id",
  "key",
  "updatedAt",
  "persona",
  "generation",
  "__v",
  "createdAt",
];
interface PromptData {
  _id: string;
  key: string;
  title?: string;
  generation: string;
  persona: string;
  role: string;
  messageTypes: Record<string, string>;
  optimized: {
    role: string;
    messageTypes: Record<string, string>;
    styles: Record<string, string>;
    languages: Record<string, string>;
    dialects: Record<string, string>;
  };
  dialects: Record<string, string>;
  languages: Record<string, string>;
  styles: Record<string, string>;
  submissionPrompt?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  [key: string]: any;
}

interface PromptByIdProps {
  id: string;
  onRequestLoadToProduction: (action: () => Promise<void>) => void;
  onPromptUpdated?: () => void;
}

function PromptById({
  id,
  onRequestLoadToProduction,
  onPromptUpdated,
}: PromptByIdProps) {
  const [loading, setLoading] = useState(false);
  const [promptData, setPromptData] = useState<PromptData | null>(null);
  const [formData, setFormData] = useState<PromptData | null>(null);
  const [originalData, setOriginalData] = useState<PromptData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>(
    {}
  );
  const [isModified, setIsModified] = useState(false);

  const getPromptById = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getApi(`${URLS.getPromptById}/${id}`);
      if (response.status === 200) {
        const data = response?.data?.data?.prompt || {};
        // Transform language/dialect codes and styles to lowercase
        const transformedData = {
          ...data,
          languages: Object.fromEntries(
            Object.entries(data.languages || {}).map(([key, value]) => [
              languageMappings[key] || key,
              value,
            ])
          ),
          dialects: Object.fromEntries(
            Object.entries(data.dialects || {}).map(([key, value]) => [
              key.charAt(0).toUpperCase() + key.slice(1).toLowerCase(),
              value,
            ])
          ),
          styles: Object.fromEntries(
            Object.entries(data.styles || {}).map(([key, value]) => [
              key.toLowerCase(),
              value,
            ])
          ),
          optimized: data.optimized
            ? {
                ...data.optimized,
                languages: Object.fromEntries(
                  Object.entries(data.optimized?.languages || {}).map(
                    ([key, value]) => [languageMappings[key] || key, value]
                  )
                ),
                dialects: Object.fromEntries(
                  Object.entries(data.optimized?.dialects || {}).map(
                    ([key, value]) => [
                      key.charAt(0).toUpperCase() + key.slice(1).toLowerCase(),
                      value,
                    ]
                  )
                ),
                styles: Object.fromEntries(
                  Object.entries(data.optimized?.styles || {}).map(
                    ([key, value]) => [key.toLowerCase(), value]
                  )
                ),
              }
            : undefined,
        };
        setPromptData(transformedData as PromptData);
        setFormData(transformedData as PromptData);
        setOriginalData(transformedData);
      } else {
        setError("Failed to fetch prompt details.");
      }
    } catch (error) {
      console.log(error);
      setError("An error occurred while fetching prompt details.");
    } finally {
      setLoading(false);
    }
  };

  const updatePrompt = async () => {
    if (!formData) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    const restrictedKeys = [
      "isActive",
      "_id",
      "createdAt",
      "updatedAt",
      "isActiveWeb",
    ];

    const dataToSend = {
      ...Object.fromEntries(
        Object.entries(formData).filter(
          ([key]) =>
            !excludedFields.includes(key) && !restrictedKeys.includes(key)
        )
      ),
      languages: Object.fromEntries(
        Object.entries(formData.languages || {}).map(([key, value]) => [
          reverseLanguageMappings[key] || key,
          value,
        ])
      ),
      dialects: Object.fromEntries(
        Object.entries(formData.dialects || {}).map(([key, value]) => [
          key.toUpperCase(),
          value,
        ])
      ),
      styles: Object.fromEntries(
        Object.entries(formData.styles || {}).map(([key, value]) => [
          key.toUpperCase(),
          value,
        ])
      ),
      optimized: formData.optimized
        ? {
            ...Object.fromEntries(
              Object.entries(formData.optimized).filter(
                ([key]) =>
                  !excludedFields.includes(key) && !restrictedKeys.includes(key)
              )
            ),
            languages: Object.fromEntries(
              Object.entries(formData.optimized?.languages || {}).map(
                ([key, value]) => [reverseLanguageMappings[key] || key, value]
              )
            ),
            dialects: Object.fromEntries(
              Object.entries(formData.optimized?.dialects || {}).map(
                ([key, value]) => [key.toUpperCase(), value]
              )
            ),
            styles: Object.fromEntries(
              Object.entries(formData.optimized?.styles || {}).map(
                ([key, value]) => [key.toUpperCase(), value]
              )
            ),
          }
        : undefined,
    };

    try {
      const response = await putApi(
        `${URLS.updatePromptById}/${id}`,
        dataToSend
      );
      if (response.status === 200) {
        setSuccess("Prompt updated successfully!");
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
        setIsModified(false);
        setOriginalData(formData);
        await getPromptById();
        if (onPromptUpdated) {
          onPromptUpdated();
        }
      } else {
        setError("Failed to update prompt.");
        toast.error("Failed");
      }
    } catch (error: any) {
      console.log(error);
      setError(error.response.data.message);
      toast.error(error.response.data.message);
    } finally {
      setLoading(false);
    }
  };

  const promotePrompt = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await postApi(`${URLS.promotePromptVersion}`, {
        versionId: id,
      });
      if (response.status === 200) {
        setSuccess("Prompt successfully promoted to production!");
        toast.success("Prompt successfully promoted to production!");

        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to promote prompt.");
        toast.error("Failed to promote prompt.");
      }
    } catch (error) {
      console.error(error);
      setError("An error occurred while promoting the prompt.");
      toast.error("An error occurred while promoting the prompt.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (id) {
      getPromptById();
    }
  }, [id]);

  useEffect(() => {
    if (!originalData || !formData) return;
    const changed = JSON.stringify(formData) !== JSON.stringify(originalData);
    setIsModified(changed);
  }, [formData, originalData]);

  const promotePromptWeb = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await postApi(`${URLS.promoteWebPromptVersion}`, {
        versionId: id,
      });
      if (response.status === 200) {
        setSuccess("Prompt successfully promoted to Site!");
        toast.success("Prompt successfully promoted to Site!");

        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to promote prompt.");
        toast.error("Failed to promote prompt.");
      }
    } catch (error) {
      console.error(error);
      setError("An error occurred while promoting the prompt.");
      toast.error("An error occurred while promoting the prompt.");
    } finally {
      setLoading(false);
    }
  };
  const handleInputChange = (field: string, value: string) => {
    if (!formData || excludedFields.includes(field)) return;
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleNestedChange = (
    parentField: string,
    childField: string,
    value: string
  ) => {
    if (!formData) return;
    setFormData({
      ...formData,
      [parentField]: {
        ...(formData[parentField] as Record<string, any>),
        [childField]: value,
      },
    });
  };

  const handleDeepNestedChange = (
    parentField: string,
    childField: string,
    grandChildField: string,
    value: string
  ) => {
    if (!formData) return;
    const parentObj = formData[parentField] as any;
    setFormData({
      ...formData,
      [parentField]: {
        ...parentObj,
        [childField]: {
          ...(parentObj[childField] || {}),
          [grandChildField]: value,
        },
      },
    });
  };

  const toggleAccordion = (field: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const renderInputField = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    isTextarea: boolean = false,
    isReadOnly: boolean = false,
    hideLabel = false
  ) => (
    <motion.div variants={itemVariants} className="flex-1 min-w-[200px]">
      {!hideLabel && (
        <label className="block text-sm sm:text-base font-medium text-gray-300 mb-1 capitalize text-left">
          {label
            .replace(/([A-Z])/g, " $1")
            .replace(/_/g, " ")
            .trim()}
        </label>
      )}

      {isTextarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={isReadOnly}
          className={`w-full px-3 py-1.5 sm:py-2 rounded-lg bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm min-h-[250px] resize-y hide-scrollbar transition-all duration-200 ${
            isReadOnly ? "cursor-not-allowed opacity-70" : ""
          }`}
          placeholder={
            isReadOnly
              ? ""
              : `Enter ${label
                  .replace(/([A-Z])/g, " $1")
                  .replace(/_/g, " ")
                  .trim()
                  .toLowerCase()}`
          }
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={isReadOnly}
          className={`w-full px-3 py-1.5 sm:py-2 rounded-lg bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm transition-all duration-200 ${
            isReadOnly ? "cursor-not-allowed opacity-70" : ""
          }`}
          placeholder={
            isReadOnly
              ? ""
              : `Enter ${label
                  .replace(/([A-Z])/g, " $1")
                  .replace(/_/g, " ")
                  .trim()
                  .toLowerCase()}`
          }
        />
      )}
    </motion.div>
  );

  const renderNestedFields = (
    title: string,
    obj: Record<string, any>,
    isAccordion: boolean = true
  ) => (
    <motion.div variants={itemVariants} className="mb-4 sm:mb-6">
      <div className="p-2 sm:p-3 bg-gray-800 rounded-lg border border-gray-600">
        <motion.div
          onClick={() => toggleAccordion(title)}
          whileHover={{ backgroundColor: "rgba(55, 65, 81, 0.8)" }}
          className="cursor-pointer"
        >
          <div className="flex justify-between items-center">
            <h4 className="text-base sm:text-lg font-semibold text-gray-100 capitalize text-left">
              {title
                .replace(/([A-Z])/g, " $1")
                .replace(/_/g, " ")
                .trim()}
            </h4>
            <motion.span
              animate={{ rotate: openAccordions[title] ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="text-gray-400"
            >
              ▼
            </motion.span>
          </div>
        </motion.div>

        {openAccordions[title] && (
          <div className="space-y-3 sm:space-y-4 pt-3">
            {Object.entries(obj).map(([key, value]) => {
              const lcKey = String(key).toLowerCase();
              const isSimpleField = [
                "title",
                "key",
                "generation",
                "persona",
              ].includes(lcKey);

              return (
                <div key={key}>
                  {renderInputField(
                    key,
                    typeof value === "string" ? value : JSON.stringify(value),
                    (newValue) => handleNestedChange(title, key, newValue),
                    !isSimpleField // textarea for all except the four simple fields
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderDeepNestedFields = (parentTitle: string, parentObj: any) => (
    <motion.div variants={itemVariants} className="mb-4 sm:mb-6">
      <div className="p-2 sm:p-3 bg-gray-800 rounded-lg border border-gray-600">
        <motion.div
          onClick={() => toggleAccordion(parentTitle)}
          whileHover={{ backgroundColor: "rgba(55, 65, 81, 0.8)" }}
          className="cursor-pointer"
        >
          <div className="flex justify-between items-center">
            <h4 className="text-lg sm:text-xl font-semibold text-gray-100 capitalize text-left">
              {parentTitle
                .replace(/([A-Z])/g, " $1")
                .replace(/_/g, " ")
                .trim()}
            </h4>
            <motion.span
              animate={{ rotate: openAccordions[parentTitle] ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="text-gray-400"
            >
              ▼
            </motion.span>
          </div>
        </motion.div>

        {openAccordions[parentTitle] && (
          <div className="space-y-3 sm:space-y-4 pt-3">
            {Object.entries(parentObj).map(([key, value]) => {
              const lcKeyLevel1 = String(key).toLowerCase();
              const isSimpleFieldLevel1 = [
                "title",
                "key",
                "generation",
                "persona",
              ].includes(lcKeyLevel1);

              return (
                <div key={key}>
                  {typeof value === "object" && value !== null ? (
                    <div className="mb-3">
                      <h5 className="text-sm sm:text-base font-medium text-gray-300 mb-2 capitalize text-left">
                        {key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/_/g, " ")
                          .trim()}
                      </h5>

                      <div className="space-y-3">
                        {Object.entries(value).map(([subKey, subValue]) => {
                          const lcSubKey = String(subKey).toLowerCase();
                          const isSimpleField = [
                            "title",
                            "key",
                            "generation",
                            "persona",
                          ].includes(lcSubKey);

                          return (
                            <div key={subKey}>
                              {renderInputField(
                                subKey,
                                typeof subValue === "string"
                                  ? subValue
                                  : JSON.stringify(subValue),
                                (newValue) =>
                                  handleDeepNestedChange(
                                    parentTitle,
                                    key,
                                    subKey,
                                    newValue
                                  ),
                                !isSimpleField // textarea except the four
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    renderInputField(
                      key,
                      typeof value === "string" ? value : JSON.stringify(value),
                      (newValue) =>
                        handleNestedChange(parentTitle, key, newValue),
                      !isSimpleFieldLevel1 // textarea except the four
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );

  if (error) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-4xl bg-gray-800/90 backdrop-blur-md rounded-xl shadow-xl p-6 sm:p-8 border border-gray-700 pt-10 mt-[20px]"
      >
        <p className="text-red-500 text-left">{error}</p>
      </motion.div>
    );
  }

  if (!promptData || !formData) {
    return (
      <>
        {loading ? (
          <TypingLoader />
        ) : (
          <>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="w-full max-w-4xl bg-gray-800/90 backdrop-blur-md rounded-xl shadow-xl p-6 sm:p-8 border border-gray-700 pt-10 mt-[20px]"
            >
              <TypingLoader />
            </motion.div>
          </>
        )}
      </>
    );
  }

  const simpleFields = ["title", "key", "generation", "persona"];
  const textareaFields = ["role"];
  // submissionPrompt is intentionally not editable here. It is stored on the
  // prompt but never reaches the model on this collection: admin-service reads
  // it only to return it in the inspector payload, and prompt-builder's
  // includeSubmissionPrompt defaults to false with no caller enabling it.
  // Editing it had no effect on output, which wasted time and invited the
  // assumption that it was tuning something.
  //
  // The conversation prompt is different — ConversationPromptEditor still
  // exposes its submissionPrompt, because that one IS interpolated into the
  // generated prompt (admin-service "- Submission Prompt ${subPrmpt}").

  const accordionFields = ["messageTypes", "languages", "dialects", "styles"];

  return (
    <>
      {loading ? (
        <TypingLoader />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-4xl bg-gray-800/90 backdrop-blur-md rounded-xl shadow-xl p-6 sm:p-8 border border-gray-700 pt-10 mt-[20px]"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-100 text-left mb-6 sm:mb-8">
            Prompt Details
          </h2>

          <div className="flex flex-wrap justify-start items-center gap-4 text-sm text-gray-400 mb-6 sm:mb-8">
            <div>
              <span className="font-medium text-gray-300">Created On:</span>{" "}
              {promptData?.createdAt
                ? new Date(promptData.createdAt).toLocaleString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "N/A"}
            </div>
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

          {success && (
            <motion.div
              variants={itemVariants}
              className="mb-4 p-3 bg-green-600/20 border border-green-600 rounded-lg text-green-400 text-left"
            >
              {success}
            </motion.div>
          )}
          <div className="space-y-4 sm:space-y-6">
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap gap-3 sm:gap-4"
            >
              {simpleFields.map((field) => (
                <div key={field} className="flex-1 min-w-[200px]">
                  {renderInputField(
                    field,
                    formData[field] || "",
                    (value) => handleInputChange(field, value),
                    false,
                    excludedFields.includes(field) // Mark excluded fields as read-only
                  )}
                </div>
              ))}
            </motion.div>

            {textareaFields.map((field) => (
              <motion.div key={field} variants={itemVariants}>
                {renderInputField(
                  field,
                  formData[field] || "",
                  (value) => handleInputChange(field, value),
                  true,
                  excludedFields.includes(field) // Mark excluded fields as read-only
                )}
              </motion.div>
            ))}

            {accordionFields.map((field) => (
              <motion.div key={field} variants={itemVariants}>
                {formData[field] &&
                  (field === "optimized"
                    ? renderDeepNestedFields(field, formData[field])
                    : renderNestedFields(
                        field,
                        formData[field] as Record<string, any>,
                        true
                      ))}
              </motion.div>
            ))}


            <div className="flex flex-row justify-between">
              {isModified ? (
                // ✅ Show only Update button when something is changed
                <motion.div
                  variants={itemVariants}
                  className="flex justify-end mt-6"
                >
                  <button
                    onClick={updatePrompt}
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg text-white font-semibold transition-all duration-200 ${
                      loading
                        ? "bg-gray-600 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {loading ? "Updating..." : "Update Prompt"}
                  </button>
                </motion.div>
              ) : (
                // ✅ Show Load buttons only when nothing is modified
                <>
                  <motion.div
                    variants={itemVariants}
                    className="flex justify-end mt-6"
                  >
                    <button
                      onClick={promotePromptWeb}
                      disabled={loading}
                      className={`px-4 py-2 rounded-lg text-white font-semibold transition-all duration-200 ${
                        loading
                          ? "bg-gray-600 cursor-not-allowed"
                          : "bg-purple-600 hover:bg-purple-700"
                      }`}
                    >
                      {loading ? "Promoting..." : "Load to Prompt Tester Site"}
                    </button>
                  </motion.div>

                  <motion.div
                    variants={itemVariants}
                    className="flex justify-end mt-6"
                  >
                    <button
                      onClick={promotePrompt}
                      disabled={loading}
                      className={`px-4 py-2 rounded-lg text-white font-semibold transition-all duration-200 ${
                        loading
                          ? "bg-gray-600 cursor-not-allowed"
                          : "bg-orange-600 hover:bg-orange-700"
                      }`}
                    >
                      {loading ? "Promoting..." : "Load to Production (App)"}
                    </button>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}

export default PromptById;
