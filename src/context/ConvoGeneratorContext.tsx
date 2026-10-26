import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAIProvider } from './AIProviderContext';
import type { AIProvider } from './AIProviderContext';
import { defaultModelFor, modelMatchesProvider } from '../utils/modelId';

interface ConvoGeneratorSettings {
  gptModel: string; // This will be the currently active model based on provider
  temperature: number;
  language: string;
  dialect: string;
  tone: string;
  femaleTone: string;
  isGenZ: boolean;
  personaDirection: string;
  conversationLength: string;
  scenarioCategory: string;
}

// Separate storage for provider-specific models
interface ProviderModels {
  OPENAI: string;
  GEMINI: string;
  OPENROUTER: string;
}

interface StoredSettings extends ConvoGeneratorSettings {
  providerModels?: ProviderModels; // Store both models separately
}

interface ConvoGeneratorContextType {
  settings: ConvoGeneratorSettings;
  updateSettings: (newSettings: Partial<ConvoGeneratorSettings>) => void;
  resetConvoSettings: () => void;
}

const getDefaultModel = defaultModelFor;

const getDefaultProviderModels = (): ProviderModels => ({
  OPENAI: defaultModelFor("OPENAI"),
  GEMINI: defaultModelFor("GEMINI"),
  OPENROUTER: defaultModelFor("OPENROUTER"),
});

/**
 * Fields that hold a document id, which must not survive as a legacy slug.
 *
 * These used to be stored as values like "short" and are now ids. A browser
 * that kept the old shape sent "short" where an id was expected, so the
 * backend rejected the whole request with "Cast to ObjectId failed for value
 * \"short\"" while the dropdown showed nothing selected — the state and the
 * visible selection had drifted apart.
 */
const ID_FIELDS = ["scenarioCategory", "conversationLength"] as const;
const isObjectId = (v: unknown): v is string =>
  typeof v === "string" && /^[0-9a-f]{24}$/i.test(v);

function dropStaleIds<T extends Record<string, any>>(settings: T): T {
  const cleaned = { ...settings };
  for (const field of ID_FIELDS) {
    if (cleaned[field] && !isObjectId(cleaned[field])) {
      (cleaned as Record<string, any>)[field] = "";
    }
  }
  return cleaned;
}

const getDefaultSettings = (provider: AIProvider | null): ConvoGeneratorSettings => ({
  gptModel: getDefaultModel(provider),
  temperature: 1,
  language: 'english',
  dialect: '',
  tone: 'flirty',
  femaleTone: 'flirty',
  isGenZ: false,
  personaDirection: 'male_to_female',
  conversationLength: "short",
  scenarioCategory: "",
});

const ConvoGeneratorContext = createContext<ConvoGeneratorContextType | undefined>(undefined);

export const ConvoGeneratorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { provider, loading } = useAIProvider();
  
  // Store provider-specific models separately
  const [providerModels, setProviderModels] = useState<ProviderModels>(() => {
    const stored = localStorage.getItem('convoGeneratorSettings');
    if (stored) {
      try {
        const parsedSettings: StoredSettings = JSON.parse(stored);
        return parsedSettings.providerModels || getDefaultProviderModels();
      } catch {
        return getDefaultProviderModels();
      }
    }
    return getDefaultProviderModels();
  });
  
  const [settings, setSettings] = useState<ConvoGeneratorSettings>(() => {
    const stored = localStorage.getItem('convoGeneratorSettings');
    if (stored) {
      try {
        const parsedSettings: StoredSettings = JSON.parse(stored);
        const models = parsedSettings.providerModels || getDefaultProviderModels();
        
        // Use the stored model for the current provider if available
        return dropStaleIds({
          ...getDefaultSettings(provider),
          ...parsedSettings,
          // ?? the default: a provider with no stored entry (OPENROUTER was
          // missing from ProviderModels) otherwise left gptModel undefined.
          gptModel: provider
            ? models[provider] ?? getDefaultModel(provider)
            : parsedSettings.gptModel || getDefaultModel(provider),
        });
      } catch {
        return getDefaultSettings(provider);
      }
    }
    return getDefaultSettings(provider);
  });

  // Update gptModel when provider changes (without resetting user's choice)
  useEffect(() => {
    if (!loading && provider) {
      // Get the remembered model for this provider
      const rememberedModel = providerModels[provider];
      
      // Only update if the current model doesn't match the provider
      if (!modelMatchesProvider(settings.gptModel, provider)) {
        setSettings(prev => ({
          ...prev,
          gptModel: rememberedModel ?? getDefaultModel(provider),
        }));
      }
    }
  }, [provider, loading]);

  // Save to localStorage whenever settings or providerModels change
  useEffect(() => {
    const settingsToStore: StoredSettings = {
      ...settings,
      providerModels, // Store both provider models
    };
    localStorage.setItem('convoGeneratorSettings', JSON.stringify(settingsToStore));
  }, [settings, providerModels]);

  const updateSettings = (newSettings: Partial<ConvoGeneratorSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      
      // If gptModel is being updated, save it to the correct provider
      if (newSettings.gptModel && provider) {
        setProviderModels(prevModels => ({
          ...prevModels,
          [provider]: newSettings.gptModel!,
        }));
      }
      
      return updated;
    });
  };

  const resetConvoSettings = () => {
    const defaultModels = getDefaultProviderModels();
    setProviderModels(defaultModels);
    setSettings(getDefaultSettings(provider));
    localStorage.removeItem('convoGeneratorSettings');
  };

  return (
    <ConvoGeneratorContext.Provider value={{ settings, updateSettings, resetConvoSettings }}>
      {children}
    </ConvoGeneratorContext.Provider>
  );
};

export const useConvoGenerator = () => {
  const context = useContext(ConvoGeneratorContext);
  if (!context) {
    throw new Error('useConvoGenerator must be used within ConvoGeneratorProvider');
  }
  return context;
};