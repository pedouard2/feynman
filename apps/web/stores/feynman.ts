import { create } from 'zustand';
import { evaluateExplanation, JudgeResult } from '../lib/judge';

type Step = 1 | 2 | 3 | 4;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export interface Concept {
  name: string;
  status: 'covered' | 'missing' | 'partial';
}

interface FeynmanState {
  step: Step;
  topic: string;
  transcript: string; // Keep for full context analysis
  messages: Message[];
  knowledgeDebt: number;
  concepts: Concept[];
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
  updateConcepts: (concepts: Concept[]) => void;
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
  concepts: [],

  setTopic: (topic) => set({ topic }),
  setStep: (step) => set({ step }),
  setAgentState: (agentState) => set({ agentState }),
  setIsConnected: (isConnected) => set({ isConnected }),
  setIsMockMode: (isMockMode) => set({ isMockMode }),
  updateConcepts: (concepts) => set({ concepts }),
  
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
    const { transcript, topic } = get();
    const result = await evaluateExplanation(transcript);
    
    // Analyze Knowledge Graph (Async)
    // We do this in parallel or after judge
    import('../lib/knowledge').then(async (mod) => {
       const concepts = await mod.analyzeKnowledge(topic, transcript);
       set({ concepts });
    });
    
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
