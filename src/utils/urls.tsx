// const baseUrl = "http://localhost:8001/api/admin";
// const commonBaseUrl = "http://localhost:8001/api";
const baseUrl = "https://api.habibirizz.app/api/admin";
const commonBaseUrl = "https://api.habibirizz.app/api";

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
