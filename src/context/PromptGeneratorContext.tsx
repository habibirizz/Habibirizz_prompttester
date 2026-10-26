import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAIProvider } from './AIProviderContext';
import type { AIProvider } from './AIProviderContext';
import { defaultModelFor, modelMatchesProvider } from '../utils/modelId';

interface PromptGeneratorSettings {
  gptModel: string; // This will be the currently active model based on provider
  temperature: number;
  language: "en" | "ar" | "arbz";
  dialect:  "EGYPTIAN"
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
  | "";
  isGenZ: boolean;
  style: string;
  gender: "MALE" | "FEMALE";
}

// Separate storage for provider-specific models
interface ProviderModels {
  OPENAI: string;
  GEMINI: string;
  OPENROUTER: string;
}

interface StoredSettings extends PromptGeneratorSettings {
  providerModels?: ProviderModels; // Store both models separately
}

interface PromptGeneratorContextType {
  settings: PromptGeneratorSettings;
  updateSettings: (newSettings: Partial<PromptGeneratorSettings>) => void;
  resetSettings: () => void;
}

const getDefaultModel = defaultModelFor;

const getDefaultProviderModels = (): ProviderModels => ({
  OPENAI: defaultModelFor("OPENAI"),
  GEMINI: defaultModelFor("GEMINI"),
  OPENROUTER: defaultModelFor("OPENROUTER"),
});

const getDefaultSettings = (provider: AIProvider | null): PromptGeneratorSettings => ({
  gptModel: getDefaultModel(provider),
  temperature: 1,
  language: 'en',
  dialect: '',
  isGenZ: false,
  style: 'Conservative',
  gender: 'MALE',
});

const PromptGeneratorContext = createContext<PromptGeneratorContextType | undefined>(undefined);

export const PromptGeneratorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { provider, loading } = useAIProvider();
  
  // Store provider-specific models separately
  const [providerModels, setProviderModels] = useState<ProviderModels>(() => {
    const stored = localStorage.getItem('promptGeneratorSettings');
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
  
  const [settings, setSettings] = useState<PromptGeneratorSettings>(() => {
    const stored = localStorage.getItem('promptGeneratorSettings');
    if (stored) {
      try {
        const parsedSettings: StoredSettings = JSON.parse(stored);
        const models = parsedSettings.providerModels || getDefaultProviderModels();
        
        // Use the stored model for the current provider if available
        return {
          ...getDefaultSettings(provider),
          ...parsedSettings,
          // ?? the default: a provider with no stored entry (OPENROUTER was
          // missing from ProviderModels) otherwise left gptModel undefined.
          gptModel: provider
            ? models[provider] ?? getDefaultModel(provider)
            : parsedSettings.gptModel || getDefaultModel(provider),
        };
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
    localStorage.setItem('promptGeneratorSettings', JSON.stringify(settingsToStore));
  }, [settings, providerModels]);

  const updateSettings = (newSettings: Partial<PromptGeneratorSettings>) => {
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

  const resetSettings = () => {
    const defaultModels = getDefaultProviderModels();
    setProviderModels(defaultModels);
    setSettings(getDefaultSettings(provider));
    localStorage.removeItem('promptGeneratorSettings');
  };

  return (
    <PromptGeneratorContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </PromptGeneratorContext.Provider>
  );
};

export const usePromptGenerator = () => {
  const context = useContext(PromptGeneratorContext);
  if (!context) {
    throw new Error('usePromptGenerator must be used within PromptGeneratorProvider');
  }
  return context;
};