// Set VITE_API_BASE_URL in .env to point at a local backend. Falls back to
// production so nothing breaks if the file is missing.
const API_ROOT = (
  import.meta.env.VITE_API_BASE_URL || "https://api.habibirizz.app"
).replace(/\/+$/, "");

const baseUrl = `${API_ROOT}/api/admin`;
const commonBaseUrl = `${API_ROOT}/api`;

export const URLS = {
  login: `${baseUrl}/login`,
  getPickUpLine: `${commonBaseUrl}/admin-pickup-line`,
  getManualReply: `${commonBaseUrl}/admin-manual-message`,
  getResponseByScreenshot: `${commonBaseUrl}/admin-get-response-by-image`,

  getAllPrompts: `${baseUrl}/all-prompts`,
  getPromptById: `${baseUrl}/prompt-byId`,
  updatePromptById: `${baseUrl}/prompt-byId`,
  loadPrompt: `${baseUrl}/sync-prompt`,

  createPrompt: `${baseUrl}/create-prompt`,
  deletePrompt: `${baseUrl}/delete-prompt`,

  promotePromptVersion: `${baseUrl}/promote-prompt`,
  promoteWebPromptVersion: `${baseUrl}/promote-web-prompt`,
  duplicatePrompt: `${baseUrl}/duplicate-prompt`,
  generateConversation: `${commonBaseUrl}/conversation/generate`,
  getConversationPrompt: `${baseUrl}/convo-prompt`,
  updateConversationPrompt: `${baseUrl}/update-convo-prompt`,
  createScenarioAndAttach: `${baseUrl}/create-scenario`,
  createRelationshipLevelAndAttach: `${baseUrl}/create-realtionship-level`,
  deleteScenarioAndDetach: `${baseUrl}/delete-scenario`,
  deleteRelationshipLevelAndDetach: `${baseUrl}/delete-relationship-level`,
  getAISettings: `${baseUrl}/ai-settings`,
  llmModels: `${baseUrl}/llm-models`,
  promptCoverage: `${baseUrl}/prompt-coverage`,
  updateAISettings: `${baseUrl}/ai-settings`,
  getMergedConvoData: `${commonBaseUrl}/get-merged-data`,

  createPickupLine: `${commonBaseUrl}/create-pickup-line`,
  adminPickupLines:`${commonBaseUrl}/all-pickup-lines`,
  userPickUpSubmissions:`${commonBaseUrl}/all-user-submissions`,
  getSinglePickupLine:`${commonBaseUrl}/pickup-line/single`,
  updatePickUpLine:`${commonBaseUrl}/pickup-lines`,
  updateUserSubmission:`${commonBaseUrl}/user-pickup-lines`,
  reviewPickUpLine:`${commonBaseUrl}/user-submissions/review`,
  deletePickupLine:`${commonBaseUrl}/pickup-lines`,

};
