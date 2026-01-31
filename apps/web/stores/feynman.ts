import { create } from 'zustand';
import { evaluateExplanation, JudgeResult } from '../lib/judge';

type Step = 1 | 2 | 3 | 4;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

interface FeynmanState {
  step: Step;
  topic: string;
  transcript: string; // Keep for full context analysis
  messages: Message[];
  knowledgeDebt: number;
  isRecording: boolean;
  feedback: string | null;
  agentState: 'idle' | 'listening' | 'thinking' | 'talking';
  isConnected: boolean;
  isMockMode: boolean;
  
  // Actions
  setTopic: (topic: string) => void;
  setStep: (step: Step) => void;
  addMessage: (role: 'user' | 'assistant', text: string) => void;
  assessGap: () => Promise<JudgeResult>;
  reset: () => void;
  setAgentState: (state: 'idle' | 'listening' | 'thinking' | 'talking') => void;
  setIsConnected: (connected: boolean) => void;
  setIsMockMode: (isMock: boolean) => void;
}

export const useFeynmanStore = create<FeynmanState>((set, get) => ({
  step: 1,
  topic: '',
  transcript: '',
  messages: [],
  knowledgeDebt: 0,
  isRecording: false,
  feedback: null,
  agentState: 'idle',
  isConnected: false,
  isMockMode: false,

  setTopic: (topic) => set({ topic }),
  setStep: (step) => set({ step }),
  setAgentState: (agentState) => set({ agentState }),
  setIsConnected: (isConnected) => set({ isConnected }),
  setIsMockMode: (isMockMode) => set({ isMockMode }),
  
  addMessage: (role, text) => set((state) => ({ 
    transcript: state.transcript + ' ' + text,
    messages: [...state.messages, {
      id: Math.random().toString(36).substring(7),
      role,
      text,
      timestamp: Date.now()
    }]
  })),

  assessGap: async () => {
    const { transcript } = get();
    const result = await evaluateExplanation(transcript);
    
    set({ 
      knowledgeDebt: result.knowledgeDebt,
      feedback: result.feedback || null
    });
    
    return result;
  },

  reset: () => set({ 
    step: 1, 
    topic: '', 
    transcript: '', 
    knowledgeDebt: 0, 
    feedback: null 
  })
}));
