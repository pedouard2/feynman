import { create } from 'zustand';
import { evaluateExplanation, JudgeResult } from '../lib/judge';
import { DEFAULT_PERSONA_ID } from '../lib/personas';

type Step = 1 | 2 | 3 | 4;

const REQUEST_TIMEOUT = 30000;

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

async function fetchWithTimeout(
  url: string, 
  options: RequestInit = {}, 
  timeout = REQUEST_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

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
  personaId: string;
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
  error: string | null;
  isLoading: boolean;
  
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
  clearError: () => void;
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
  error: null,
  isLoading: false,
  
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
  clearError: () => set({ error: null }),
  setCurrentPersonaId: (personaId) => set({ currentPersonaId: personaId }),
  
  addMessage: (role, text) => {
    const message: Message = {
      id: generateId(),
      role,
      text,
      timestamp: Date.now()
    };
    
    set((state) => ({ 
      transcript: state.transcript + ' ' + text,
      messages: [...state.messages, message]
    }));
    
    get().syncMessageToApi(role, text).catch(() => {
      set({ error: 'Failed to save message. Your message may not be persisted.' });
    });
  },

  syncMessageToApi: async (role, content) => {
    const conversationId = get().currentConversationId;
    if (!conversationId || conversationId.startsWith('mock_')) return;
    
    const response = await fetchWithTimeout(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, content })
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync message');
    }
  },

  createConversation: async (personaId, title, context) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetchWithTimeout('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personaId, title, context })
      });
      
      if (!response.ok) {
        const mockId = `mock_${generateId()}`;
        const mockConversation: Conversation = {
          id: mockId,
          personaId,
          title: title || null,
          context: context || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        set((state) => ({ 
          currentConversationId: mockId,
          currentPersonaId: personaId,
          topic: context || '',
          messages: [],
          transcript: '',
          conversations: [mockConversation, ...state.conversations],
          isLoading: false
        }));
        
        return mockId;
      }
      
      const conversation = await response.json();
      set({ 
        currentConversationId: conversation.id,
        currentPersonaId: personaId,
        topic: context || '',
        messages: [],
        transcript: '',
        isLoading: false
      });
      
      await get().loadConversations();
      return conversation.id;
    } catch (error) {
      const mockId = `mock_${generateId()}`;
      const mockConversation: Conversation = {
        id: mockId,
        personaId,
        title: title || null,
        context: context || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      set((state) => ({ 
        currentConversationId: mockId,
        currentPersonaId: personaId,
        topic: context || '',
        messages: [],
        transcript: '',
        conversations: [mockConversation, ...state.conversations],
        isLoading: false,
        error: 'Using offline mode - conversation may not be saved'
      }));
      
      return mockId;
    }
  },

  loadConversations: async () => {
    set({ isLoading: true });
    
    try {
      const response = await fetchWithTimeout('/api/conversations');
      if (!response.ok) {
        set({ conversations: [], isLoading: false });
        return;
      }
      
      const data = await response.json();
      if (!Array.isArray(data)) {
        set({ conversations: [], isLoading: false });
        return;
      }
      
      const conversations: Conversation[] = data.map((c: Record<string, unknown>) => ({
        id: c.id as string,
        personaId: c.persona_id as string,
        title: c.title as string | null,
        context: c.context as string | null,
        createdAt: c.created_at as string,
        updatedAt: c.updated_at as string
      }));
      
      set({ conversations, isLoading: false });
    } catch {
      set({ conversations: [], isLoading: false });
    }
  },

  loadConversation: async (conversationId) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetchWithTimeout(`/api/conversations/${conversationId}`);
      if (!response.ok) {
        throw new Error('Failed to load conversation');
      }
      
      const data = await response.json();
      const messages: Message[] = (data.messages || []).map((m: Record<string, unknown>) => ({
        id: m.id as string,
        role: m.role as 'user' | 'assistant',
        text: m.content as string,
        timestamp: new Date(m.created_at as string).getTime()
      }));
      
      set({
        currentConversationId: conversationId,
        currentPersonaId: data.persona_id,
        topic: data.context || '',
        messages,
        transcript: messages.map(m => m.text).join(' '),
        isLoading: false
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load conversation',
        isLoading: false 
      });
      throw error;
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
       worker.onerror = () => {
          set({ error: 'Failed to analyze explanation' });
       };
       set({ worker });
    }

    if (worker) {
      worker.postMessage({ transcript, topic });
    }
    
    try {
      const mod = await import('../lib/knowledge');
      const concepts = await mod.analyzeKnowledge(topic, transcript);
      set({ concepts });
    } catch {
      set({ concepts: [] });
    }
  },

  saveSession: () => {
    const { topic, messages, sessions, currentPersonaId } = get();
    if (messages.length === 0) return;

    const newSession: Session = {
      id: generateId(),
      topic: topic || 'Untitled Session',
      date: Date.now(),
      preview: messages[messages.length - 1].text.substring(0, 50) + '...',
      personaId: currentPersonaId
    };

    set({ sessions: [newSession, ...sessions] });
  },

  loadSession: (sessionId) => {
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
