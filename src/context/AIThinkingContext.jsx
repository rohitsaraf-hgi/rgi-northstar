import { createContext, useContext, useState, useCallback } from 'react';

const AIThinkingContext = createContext(null);

export function AIThinkingProvider({ children }) {
  const [isThinking, setIsThinking] = useState(false);

  const simulateThinking = useCallback(async (minMs = 800, maxMs = 1400) => {
    const delay = Math.floor(minMs + Math.random() * (maxMs - minMs));
    setIsThinking(true);
    await new Promise((resolve) => setTimeout(resolve, delay));
    setIsThinking(false);
  }, []);

  return (
    <AIThinkingContext.Provider value={{ isThinking, setIsThinking, simulateThinking }}>
      {children}
    </AIThinkingContext.Provider>
  );
}

export function useAIThinking() {
  const ctx = useContext(AIThinkingContext);
  if (!ctx) throw new Error('useAIThinking must be used within AIThinkingProvider');
  return ctx;
}
