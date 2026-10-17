import React, { createContext, useContext, useEffect, useState } from "react";
import { getApi } from "../utils/api";
import { URLS } from "../utils/urls";

export type AIProvider = "OPENAI" | "GEMINI" | "OPENROUTER";

interface AIProviderContextType {
  provider: AIProvider | null;
  loading: boolean;
  setProvider: (provider: AIProvider) => void;
  refreshProvider: () => Promise<void>;
}

const AIProviderContext = createContext<AIProviderContextType | undefined>(
  undefined
);

export const AIProviderProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [provider, setProviderState] = useState<AIProvider | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchProvider = async () => {
    // This endpoint needs an admin token. On the login screen there isn't one
    // yet, so firing it anyway produced two 401s in the console on every first
    // load and looked like a broken app.
    if (!localStorage.getItem("token")) return;

    try {
      setLoading(true);
      const response = await getApi(URLS.getAISettings);
      if (response.status === 200) {
        setProviderState(response.data?.data?.activeProvider);
      }
    } catch (error) {
      console.error("Failed to fetch AI provider", error);
    } finally {
      setLoading(false);
    }
  };

  const setProvider = (provider: AIProvider) => {
    setProviderState(provider);
  };

  useEffect(() => {
    fetchProvider();
  }, []);

  return (
    <AIProviderContext.Provider
      value={{
        provider,
        loading,
        setProvider,
        refreshProvider: fetchProvider,
      }}
    >
      {children}
    </AIProviderContext.Provider>
  );
};

export const useAIProvider = () => {
  const context = useContext(AIProviderContext);
  if (!context) {
    throw new Error("useAIProvider must be used within AIProviderProvider");
  }
  return context;
};
