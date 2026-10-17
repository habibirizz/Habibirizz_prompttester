import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getApi, patchApi } from "../utils/api";
import { URLS } from "../utils/urls";
import TypingLoader from "../utils/Lodaer";
import { Bot, Sparkle, Route } from "lucide-react";
import { useAIProvider, AIProvider } from "../context/AIProviderContext";
import ModelPicker from "../components/ModelPicker";
import { catalogPrefixFor, toCatalogId, toProviderModelId } from "../utils/modelId";

/**
 * AI provider and model settings.
 *
 * This screen used to switch provider and nothing else — the model was
 * hardcoded at every call site, so the choice made here had no effect on what
 * users received. It now also selects the model, per flow, and shows what each
 * one costs per month at this app's measured usage.
 */

interface ProviderConfig {
  model: string;
  temperature: number;
  flows?: Partial<Record<Flow, string>>;
}

type Flow =
  | "screenshotOcr"
  | "screenshotReply"
  | "manualReply"
  | "pickupLine"
  | "translation";

/** Flows that send an image and so need a model that can read one. */
const FLOWS: Array<{ key: Flow; label: string; hint: string; vision: boolean }> = [
  { key: "screenshotOcr", label: "Screenshot — reading", hint: "Pulls the text out of an uploaded chat. A cheap model is usually enough.", vision: true },
  { key: "screenshotReply", label: "Screenshot — replies", hint: "Writes the replies. Worth a stronger model.", vision: true },
  { key: "manualReply", label: "Manual message replies", hint: "Replies to a message typed in by hand.", vision: false },
  { key: "pickupLine", label: "Pickup lines", hint: "Generates pickup lines.", vision: false },
  { key: "translation", label: "Translation", hint: "Back-translates Arabic replies into English.", vision: false },
];

interface AISettings {
  _id: string;
  activeProvider: AIProvider;
  openai: ProviderConfig;
  gemini: ProviderConfig;
  openrouter?: ProviderConfig;
  updatedAt: string;
}

const PROVIDERS: Array<{ id: AIProvider; label: string; icon: React.ReactNode; blurb: string }> = [
  { id: "OPENAI", label: "OpenAI", icon: <Bot className="w-7 h-7" />, blurb: "GPT models, direct" },
  { id: "GEMINI", label: "Gemini", icon: <Sparkle className="w-7 h-7" />, blurb: "Google models, direct" },
  { id: "OPENROUTER", label: "OpenRouter", icon: <Route className="w-7 h-7" />, blurb: "One key, 470+ models" },
];

const AISettingsComponent: React.FC = () => {
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string>("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { setProvider } = useAIProvider();

  /** Which settings row: the live app, or admin/tester traffic. */
  const [audience, setAudience] = useState<"admin" | "user">("admin");

  const url = (base: string) =>
    audience === "user" ? `${base}?audience=user` : base;

  const fetchSettings = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getApi(url(URLS.getAISettings));
      setSettings(res.data?.data ?? null);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Could not load AI settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audience]);

  const save = async (patch: Record<string, unknown>, what: string) => {
    setSaving(what);
    setError("");
    setSuccess("");
    try {
      const res = await patchApi(url(URLS.updateAISettings), patch);
      setSettings(res.data?.data ?? settings);
      setSuccess(`${what} saved`);
      if (patch.activeProvider && audience === "admin") {
        setProvider(patch.activeProvider as AIProvider);
      }
      setTimeout(() => setSuccess(""), 2500);
    } catch (e: any) {
      // The API refuses a text-only model on a screenshot flow, which would
      // otherwise break that feature silently. Surface its reason.
      setError(e?.response?.data?.message || `Could not save ${what}`);
    } finally {
      setSaving("");
    }
  };

  if (loading && !settings) return <TypingLoader />;

  const active = settings?.activeProvider ?? null;
  const block: ProviderConfig | undefined = settings
    ? active === "GEMINI"
      ? settings.gemini
      : active === "OPENROUTER"
        ? settings.openrouter
        : settings.openai
    : undefined;

  const providerKey =
    active === "GEMINI" ? "gemini" : active === "OPENROUTER" ? "openrouter" : "openai";

  const saveModel = (flow: Flow | "default", catalogId: string) => {
    const wire = toProviderModelId(catalogId, active);
    const patch =
      flow === "default"
        ? { [providerKey]: { model: wire } }
        : { [providerKey]: { flows: { [flow]: wire } } };
    save(patch, flow === "default" ? "Default model" : "Model");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-100">AI Provider Settings</h2>
        <p className="text-sm text-gray-400 mt-1">
          Costs are per month, estimated from this app's real usage.
        </p>
      </div>

      {/* Two independent settings rows: the live app and admin traffic. Keeping
          them apart is what lets the tester try a model without touching users. */}
      <div className="flex gap-2 justify-center">
        {([
          ["admin", "Admin & tester"],
          ["user", "Live mobile app"],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setAudience(k)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              audience === k ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-red-900/40 border border-red-700 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-emerald-900/40 border border-emerald-700 px-4 py-3 text-sm text-emerald-200">
          {success}
        </div>
      )}

      {/* Provider */}
      <section className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Provider</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              disabled={!!saving}
              onClick={() => save({ activeProvider: p.id }, "Provider")}
              className={`rounded-xl p-4 border text-center transition ${
                active === p.id
                  ? "bg-blue-600/20 border-blue-500 text-blue-200"
                  : "bg-gray-800/60 border-gray-700 text-gray-300 hover:border-gray-500"
              }`}
            >
              <div className="flex justify-center mb-2">{p.icon}</div>
              <div className="font-semibold">{p.label}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">{p.blurb}</div>
              {active === p.id && (
                <div className="text-xs mt-1 text-blue-300">✓ Active</div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Default model */}
      <section className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-300">Default model</h3>
          <p className="text-xs text-gray-500">
            Used by any flow without its own model set below.
          </p>
        </div>
        <ModelPicker
          label=""
          value={toCatalogId(block?.model ?? "", active)}
          idPrefix={catalogPrefixFor(active)}
          onChange={(id) => saveModel("default", id)}
          disabled={!!saving}
        />
        <div>
          <label className="block text-sm text-gray-300 mb-1">
            Temperature — {block?.temperature ?? 1}
          </label>
          <input
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={block?.temperature ?? 1}
            onChange={(e) =>
              setSettings((s) =>
                s ? { ...s, [providerKey]: { ...block, temperature: Number(e.target.value) } } as AISettings : s,
              )
            }
            onMouseUp={(e) =>
              save(
                { [providerKey]: { temperature: Number((e.target as HTMLInputElement).value) } },
                "Temperature",
              )
            }
            className="w-full"
          />
          <p className="text-xs text-gray-500">
            Lower is more predictable, higher is more varied.
          </p>
        </div>
      </section>

      {/* Per-flow models */}
      <section className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-300">Model per feature</h3>
          <p className="text-xs text-gray-500">
            Optional. Reading a screenshot and writing the replies have very
            different costs, so they do not have to use the same model.
          </p>
        </div>

        {FLOWS.map((f) => (
          <div key={f.key} className="border-t border-gray-800 pt-4 first:border-0 first:pt-0">
            <ModelPicker
              label={f.label}
              needsVision={f.vision}
              value={toCatalogId(block?.flows?.[f.key] ?? "", active)}
              idPrefix={catalogPrefixFor(active)}
              onChange={(id) => saveModel(f.key, id)}
              disabled={!!saving}
            />
            <p className="text-[11px] text-gray-500 mt-1">
              {f.hint}
              {!block?.flows?.[f.key] && " Currently using the default."}
            </p>
          </div>
        ))}
      </section>

      <button
        onClick={fetchSettings}
        className="w-full py-3 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm"
      >
        Refresh
      </button>
    </motion.div>
  );
};

export default AISettingsComponent;
