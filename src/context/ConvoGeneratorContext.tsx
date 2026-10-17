import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAIProvider } from './AIProviderContext';

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
}

interface StoredSettings extends ConvoGeneratorSettings {
  providerModels?: ProviderModels; // Store both models separately
}

interface ConvoGeneratorContextType {
  settings: ConvoGeneratorSettings;
  updateSettings: (newSettings: Partial<ConvoGeneratorSettings>) => void;
  resetConvoSettings: () => void;
}

const getDefaultModel = (provider: "OPENAI" | "GEMINI" | null): string => {
  if (provider === "GEMINI") return "gemini-2.0-flash";
  return "gpt-4o-mini";
};

const getDefaultProviderModels = (): ProviderModels => ({
  OPENAI: "gpt-4o-mini",
  GEMINI: "gemini-2.0-flash",
});

const getDefaultSettings = (provider: "OPENAI" | "GEMINI" | null): ConvoGeneratorSettings => ({
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
        return {
          ...getDefaultSettings(provider),
          ...parsedSettings,
          gptModel: provider ? models[provider] : parsedSettings.gptModel || getDefaultModel(provider),
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
      const isCorrectProvider = 
        (provider === "GEMINI" && settings.gptModel.includes("gemini")) ||
        (provider === "OPENAI" && settings.gptModel.includes("gpt"));
      
      if (!isCorrectProvider) {
        setSettings(prev => ({
          ...prev,
          gptModel: rememberedModel,
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