import React, { useEffect, useMemo, useRef, useState } from "react";
import { getApi } from "../utils/api";
import { URLS } from "../utils/urls";

/**
 * Searchable model picker.
 *
 * The model list used to be typed into the page — five OpenAI entries and a
 * handful of Gemini ones. It went stale: gemini-2.0-flash was still offered
 * long after it had been retired, and selecting it produced a generic 500 with
 * no indication why. This reads the live catalogue instead, so a retired model
 * simply stops being listed.
 *
 * At ~470 models a plain dropdown is unusable, hence search. Each row carries
 * the cost of running that model for a month at this app's measured usage,
 * which is far easier to judge than a per-token price.
 */

export interface CatalogModel {
  id: string;
  name: string;
  contextLength: number;
  promptCostPerToken: number;
  completionCostPerToken: number;
  supportsImages: boolean;
  maxCompletionTokens?: number;
}

interface Usage {
  days: number;
  requests: number;
  inputTokens: number;
  outputTokens: number;
}

interface Props {
  value: string;
  onChange: (modelId: string) => void;
  /** Screenshot flows need a model that can read images. */
  needsVision?: boolean;
  label?: string;
  /** Narrows the list, e.g. "google/" while the Gemini provider is active. */
  idPrefix?: string;
  disabled?: boolean;
}

// One fetch shared by every picker on the page.
let catalogPromise: Promise<{ models: CatalogModel[]; usage: Usage }> | null = null;

const loadCatalog = () => {
  if (!catalogPromise) {
    catalogPromise = getApi(URLS.llmModels)
      .then((r) => ({
        models: (r.data?.data?.models ?? []) as CatalogModel[],
        usage: r.data?.data?.usage as Usage,
      }))
      .catch((e) => {
        catalogPromise = null; // let a later mount retry
        throw e;
      });
  }
  return catalogPromise;
};

const money = (n: number) =>
  n === 0 ? "free" : n < 0.01 ? "<$0.01" : `$${n.toFixed(2)}`;

export const ModelPicker: React.FC<Props> = ({
  value,
  onChange,
  needsVision = false,
  label = "Model",
  idPrefix,
  disabled = false,
}) => {
  const [models, setModels] = useState<CatalogModel[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    loadCatalog()
      .then(({ models, usage }) => {
        if (!alive) return;
        setModels(models);
        setUsage(usage);
      })
      .catch((e) =>
        alive &&
        setError(e?.response?.data?.message || "Could not load the model list"),
      )
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  // Close when clicking away.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  /** Monthly cost of this model at measured usage. */
  const costOf = (m: CatalogModel) => {
    if (!usage) return null;
    const { inputTokens, outputTokens, days } = usage;
    if (!inputTokens && !outputTokens) return null;
    const perPeriod =
      inputTokens * m.promptCostPerToken + outputTokens * m.completionCostPerToken;
    return (perPeriod / days) * 30;
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return models
      .filter((m) => (needsVision ? m.supportsImages : true))
      .filter((m) => (idPrefix ? m.id.startsWith(idPrefix) : true))
      .filter((m) => !q || m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const ac = costOf(a) ?? Infinity;
        const bc = costOf(b) ?? Infinity;
        return ac - bc;
      })
      .slice(0, 60);
  }, [models, query, needsVision, idPrefix, usage]);

  const selected = models.find((m) => m.id === value);

  return (
    <div ref={boxRef} className="relative">
      <label className="block text-sm text-gray-300 mb-1">
        {label}
        {needsVision && (
          <span className="ml-2 text-xs text-sky-400">reads images</span>
        )}
      </label>

      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 disabled:opacity-50"
      >
        {loading ? (
          "Loading models…"
        ) : selected ? (
          <span className="flex justify-between gap-3">
            <span className="truncate">{selected.name}</span>
            <span className="text-gray-400 shrink-0">
              {(() => {
                const c = costOf(selected);
                return c === null ? "" : `${money(c)}/mo`;
              })()}
            </span>
          </span>
        ) : (
          <span className="text-amber-400">
            {value ? `${value} — not in the catalogue` : "Select a model"}
          </span>
        )}
      </button>

      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}

      {/* A model saved before it was retired still shows, flagged, rather than
          silently appearing valid. This is what gemini-2.0-flash needed. */}
      {!loading && value && !selected && !error && (
        <p className="mt-1 text-xs text-amber-400">
          {value} is no longer offered by any provider. Pick a current model.
        </p>
      )}

      {open && !loading && (
        <div className="absolute z-50 mt-1 w-full rounded-lg bg-gray-900 border border-gray-700 shadow-xl">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${models.length} models…`}
            className="w-full px-3 py-2 bg-gray-800 text-gray-100 rounded-t-lg outline-none"
          />
          <div className="max-h-72 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="px-3 py-3 text-sm text-gray-400">No match.</p>
            )}
            {filtered.map((m) => {
              const c = costOf(m);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    onChange(m.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-800 ${
                    m.id === value ? "bg-gray-800" : ""
                  }`}
                >
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-100 text-sm truncate">{m.name}</span>
                    <span className="text-xs shrink-0 text-gray-300">
                      {c === null ? "—" : `${money(c)}/mo`}
                    </span>
                  </div>
                  <div className="flex gap-2 text-[11px] text-gray-500">
                    <span className="truncate">{m.id}</span>
                    {m.supportsImages && <span className="text-sky-400">vision</span>}
                    {m.promptCostPerToken === 0 && (
                      <span className="text-emerald-400">free</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {usage && (
            <p className="px-3 py-2 text-[11px] text-gray-500 border-t border-gray-800">
              Cost estimated from the last {usage.days} days: {usage.requests}{" "}
              requests, {(usage.inputTokens + usage.outputTokens).toLocaleString()}{" "}
              tokens.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ModelPicker;
