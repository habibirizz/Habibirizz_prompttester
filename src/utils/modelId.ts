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
