import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type TabType =
  | "generator"
  | "templates"
  | "conversation"
  | "conversation_prompt"
  | "pickup_templates"
  | "pickup_lines"
  | "ai_Settings";


interface TabContextType {
  tabing: TabType;
  setTabing: (tab: TabType) => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

// Helper to get initial tab from localStorage
const getInitialTab = (): TabType => {
  try {
    const stored = localStorage.getItem('activeTab');
    if (stored && ['generator', 'templates', 'conversation', 'conversation_prompt', 'pickup_templates', 'ai_Settings' , 'pickup_lines'].includes(stored)) {
      return stored as TabType;
    }
  } catch (error) {
    console.error('Error reading activeTab from localStorage:', error);
  }
  return "conversation";
};

export const TabProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tabing, setTabingState] = useState<TabType>(getInitialTab);

  // Persist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('activeTab', tabing);
  }, [tabing]);

  const setTabing = (tab: TabType) => {
    setTabingState(tab);
  };

  return (
    <TabContext.Provider value={{ tabing, setTabing }}>
      {children}
    </TabContext.Provider>
  );
};

export const useTabProvider = () => {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error('useTabProvider must be used within TabProvider');
  }
  return context;
};