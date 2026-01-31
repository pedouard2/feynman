import { create } from 'zustand';
import { evaluateExplanation, JudgeResult } from '../lib/judge';
import { DEFAULT_PERSONA_ID } from '../lib/personas';

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

export interface Session {
  id: string;
  topic: string;
  date: number;
  preview: string;
}

export interface Conversation {
  id: string;
  personaId: string;
  title: string | null;
  context: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FeynmanState {
  step: Step;
  topic: string;
  transcript: string;
  messages: Message[];
  knowledgeDebt: number;
  concepts: Concept[];
  isRecording: boolean;
  feedback: string | null;
  agentState: 'idle' | 'listening' | 'thinking' | 'talking';
  isConnected: boolean;
  isMockMode: boolean;
  provider: 'openai' | 'mock';
  sessions: Session[];
  worker: Worker | null;
  
  currentPersonaId: string;
  currentConversationId: string | null;
  conversations: Conversation[];
  
  setTopic: (topic: string) => void;
  setStep: (step: Step) => void;
  addMessage: (role: 'user' | 'assistant', text: string) => void;
  assessGap: () => Promise<void>;
  reset: () => void;
  setAgentState: (state: 'idle' | 'listening' | 'thinking' | 'talking') => void;
  setIsConnected: (connected: boolean) => void;
  setIsMockMode: (isMock: boolean) => void;
  setProvider: (provider: 'openai' | 'mock') => void;
  updateConcepts: (concepts: Concept[]) => void;
  clearFeedback: () => void;
  saveSession: () => void;
  loadSession: (sessionId: string) => void;
  
  setCurrentPersonaId: (personaId: string) => void;
  createConversation: (personaId: string, title?: string, context?: string) => Promise<string | null>;
  loadConversations: () => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;
  syncMessageToApi: (role: 'user' | 'assistant', content: string) => Promise<void>;
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
  provider: 'openai',
  concepts: [],
  sessions: [],
  worker: null,
  
  currentPersonaId: DEFAULT_PERSONA_ID,
  currentConversationId: null,
  conversations: [],

  setTopic: (topic) => set({ topic }),
  setStep: (step) => set({ step }),
  setAgentState: (agentState) => set({ agentState }),
  setIsConnected: (isConnected) => set({ isConnected }),
  setIsMockMode: (isMockMode) => set({ isMockMode, provider: isMockMode ? 'mock' : 'openai' }),
  setProvider: (provider) => set({ provider }),
  updateConcepts: (concepts) => set({ concepts }),
  clearFeedback: () => set({ feedback: null }),
  setCurrentPersonaId: (personaId) => set({ currentPersonaId: personaId }),
  
  addMessage: (role, text) => {
    const message: Message = {
      id: Math.random().toString(36).substring(7),
      role,
      text,
      timestamp: Date.now()
    };
    
    set((state) => ({ 
      transcript: state.transcript + ' ' + text,
      messages: [...state.messages, message]
    }));
    
    get().syncMessageToApi(role, text);
  },

  syncMessageToApi: async (role, content) => {
    const conversationId = get().currentConversationId;
    if (!conversationId) return;
    
    try {
      await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, content })
      });
    } catch (error) {
      console.error('Failed to sync message to API:', error);
    }
  },

  createConversation: async (personaId, title, context) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personaId, title, context })
      });
      
      if (!response.ok) throw new Error('Failed to create conversation');
      
      const conversation = await response.json();
      set({ 
        currentConversationId: conversation.id,
        currentPersonaId: personaId,
        topic: context || '',
        messages: [],
        transcript: ''
      });
      
      get().loadConversations();
      return conversation.id;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      return null;
    }
  },

  loadConversations: async () => {
    try {
      const response = await fetch('/api/conversations');
      if (!response.ok) throw new Error('Failed to load conversations');
      
      const data = await response.json();
      const conversations: Conversation[] = data.map((c: Record<string, unknown>) => ({
        id: c.id,
        personaId: c.persona_id,
        title: c.title,
        context: c.context,
        createdAt: c.created_at,
        updatedAt: c.updated_at
      }));
      
      set({ conversations });
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  },

  loadConversation: async (conversationId) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`);
      if (!response.ok) throw new Error('Failed to load conversation');
      
      const data = await response.json();
      const messages: Message[] = (data.messages || []).map((m: Record<string, unknown>) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        text: m.content,
        timestamp: new Date(m.created_at as string).getTime()
      }));
      
      set({
        currentConversationId: conversationId,
        currentPersonaId: data.persona_id,
        topic: data.context || '',
        messages,
        transcript: messages.map(m => m.text).join(' ')
      });
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  },

  assessGap: async () => {
    const { transcript, topic } = get();
    
    let worker = get().worker;
    if (!worker && typeof window !== 'undefined') {
       worker = new Worker(new URL('../workers/judge.worker.ts', import.meta.url));
       worker.onmessage = (e) => {
          const result = e.data;
          set({ 
            knowledgeDebt: result.knowledgeDebt, 
            feedback: result.feedback || null 
          });
       };
       set({ worker });
    }

    if (worker) {
      worker.postMessage({ transcript, topic });
    }
    
    import('../lib/knowledge').then(async (mod) => {
       const concepts = await mod.analyzeKnowledge(topic, transcript);
       set({ concepts });
    });
  },

  saveSession: () => {
    const { topic, messages, sessions } = get();
    if (messages.length === 0) return;

    const newSession: Session = {
      id: Math.random().toString(36).substring(7),
      topic: topic || 'Untitled Session',
      date: Date.now(),
      preview: messages[messages.length - 1].text.substring(0, 50) + '...'
    };

    set({ sessions: [newSession, ...sessions] });
  },

  loadSession: (sessionId) => {
    console.log(`Loading session ${sessionId}`);
    get().loadConversation(sessionId);
  },

  reset: () => {
    get().saveSession();
    set({ 
      step: 1, 
      topic: '', 
      transcript: '', 
      messages: [],
      knowledgeDebt: 0, 
      feedback: null,
      concepts: [],
      currentConversationId: null
    });
  }
}));
