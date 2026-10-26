import type { AIProvider } from "../context/AIProviderContext";

/**
 * The catalogue speaks OpenRouter ids ("google/gemini-3.8-flash"). The direct
 * Gemini and OpenAI providers want the bare name ("gemini-3.8-flash"). These
 * translate between the two so one picker can serve every provider.
 */

const PREFIX: Record<string, string> = {
  GEMINI: "google/",
  OPENAI: "openai/",
};

/** Catalogue id -> what the active provider expects on the wire. */
export const toProviderModelId = (
  catalogId: string,
  provider: AIProvider | null,
): string => {
  if (!catalogId || !provider || provider === "OPENROUTER") return catalogId;
  const p = PREFIX[provider];
  return p && catalogId.startsWith(p) ? catalogId.slice(p.length) : catalogId;
};

/** Stored provider model -> the catalogue id, so the picker can match it. */
export const toCatalogId = (
  providerModel: string,
  provider: AIProvider | null,
): string => {
  if (!providerModel || !provider || provider === "OPENROUTER") return providerModel;
  const p = PREFIX[provider];
  return p && !providerModel.includes("/") ? p + providerModel : providerModel;
};

/** Restrict the picker to the active provider's own models. */
export const catalogPrefixFor = (provider: AIProvider | null): string | undefined =>
  provider && provider !== "OPENROUTER" ? PREFIX[provider] : undefined;

/**
 * The model to use when nothing has been chosen for a provider yet.
 *
 * "gemini-2.0-flash" was the old default and has been retired — it is not
 * offered by any provider, so the generators failed with it preselected.
 */
export const defaultModelFor = (provider: AIProvider | null): string => {
  if (provider === "OPENROUTER") return "google/gemini-3-flash-preview";
  if (provider === "GEMINI") return "gemini-3-flash-preview";
  return "gpt-4o-mini";
};

/**
 * Whether a stored model belongs to the active provider.
 *
 * OpenRouter ids are namespaced ("google/gemini-3-flash-preview"); the direct
 * providers take a bare name. Tolerates an undefined model, which is how the
 * generators used to crash: providerModels had no OPENROUTER entry, so the
 * lookup returned undefined and `.includes` threw with no error boundary,
 * blanking the whole app.
 */
export const modelMatchesProvider = (
  model: string | undefined,
  provider: AIProvider | null,
): boolean => {
  if (!model || !provider) return false;
  if (provider === "OPENROUTER") return model.includes("/");
  if (model.includes("/")) return false;
  if (provider === "GEMINI") return model.includes("gemini");
  return model.includes("gpt");
};
