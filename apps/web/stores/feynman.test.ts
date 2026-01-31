import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useFeynmanStore } from './feynman';

global.fetch = vi.fn();

describe('Feynman Store', () => {
  beforeEach(() => {
    useFeynmanStore.setState({
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
      currentPersonaId: 'eli5',
      currentConversationId: null,
      conversations: [],
    });
    vi.clearAllMocks();
  });

  it('has correct initial state', () => {
    const state = useFeynmanStore.getState();
    expect(state.step).toBe(1);
    expect(state.topic).toBe('');
    expect(state.messages).toHaveLength(0);
    expect(state.agentState).toBe('idle');
    expect(state.isConnected).toBe(false);
    expect(state.currentPersonaId).toBe('eli5');
    expect(state.currentConversationId).toBeNull();
  });

  it('setTopic updates the topic', () => {
    useFeynmanStore.getState().setTopic('React Hooks');
    expect(useFeynmanStore.getState().topic).toBe('React Hooks');
  });

  it('setAgentState updates agent state', () => {
    useFeynmanStore.getState().setAgentState('listening');
    expect(useFeynmanStore.getState().agentState).toBe('listening');
    
    useFeynmanStore.getState().setAgentState('thinking');
    expect(useFeynmanStore.getState().agentState).toBe('thinking');
    
    useFeynmanStore.getState().setAgentState('talking');
    expect(useFeynmanStore.getState().agentState).toBe('talking');
  });

  it('addMessage adds a message and updates transcript', () => {
    useFeynmanStore.getState().addMessage('user', 'Hello there');
    
    const state = useFeynmanStore.getState();
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0].role).toBe('user');
    expect(state.messages[0].text).toBe('Hello there');
    expect(state.transcript).toContain('Hello there');
  });

  it('addMessage preserves existing messages', () => {
    useFeynmanStore.getState().addMessage('user', 'First message');
    useFeynmanStore.getState().addMessage('assistant', 'Second message');
    
    const state = useFeynmanStore.getState();
    expect(state.messages).toHaveLength(2);
    expect(state.messages[0].text).toBe('First message');
    expect(state.messages[1].text).toBe('Second message');
  });

  it('setCurrentPersonaId updates persona', () => {
    useFeynmanStore.getState().setCurrentPersonaId('expert');
    expect(useFeynmanStore.getState().currentPersonaId).toBe('expert');
  });

  it('setIsConnected updates connection state', () => {
    useFeynmanStore.getState().setIsConnected(true);
    expect(useFeynmanStore.getState().isConnected).toBe(true);
  });

  it('setProvider updates provider', () => {
    useFeynmanStore.getState().setProvider('openai');
    expect(useFeynmanStore.getState().provider).toBe('openai');
  });

  it('setIsMockMode updates mock mode and provider', () => {
    useFeynmanStore.getState().setIsMockMode(true);
    const state = useFeynmanStore.getState();
    expect(state.isMockMode).toBe(true);
    expect(state.provider).toBe('mock');
  });

  it('reset clears conversation state', () => {
    useFeynmanStore.getState().setTopic('Test Topic');
    useFeynmanStore.getState().addMessage('user', 'Test message');
    useFeynmanStore.getState().reset();
    
    const state = useFeynmanStore.getState();
    expect(state.topic).toBe('');
    expect(state.messages).toHaveLength(0);
    expect(state.transcript).toBe('');
    expect(state.currentConversationId).toBeNull();
  });

  it('updateConcepts updates concepts array', () => {
    const concepts = [
      { name: 'Variables', status: 'covered' as const },
      { name: 'Functions', status: 'partial' as const }
    ];
    useFeynmanStore.getState().updateConcepts(concepts);
    expect(useFeynmanStore.getState().concepts).toEqual(concepts);
  });

  it('clearFeedback clears feedback', () => {
    useFeynmanStore.setState({ feedback: 'Some feedback' });
    useFeynmanStore.getState().clearFeedback();
    expect(useFeynmanStore.getState().feedback).toBeNull();
  });
});
