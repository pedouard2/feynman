import { useEffect, useRef, useState, useCallback } from 'react';
import { useFeynmanStore } from '../stores/feynman';
import { createAgent, AgentService } from '../lib/services/agent-interface';

export function useRealtimeSession() {
  const [isConnected, setIsConnected] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const agentRef = useRef<AgentService | null>(null);
  
  const { 
    addMessage, 
    setAgentState, 
    setIsConnected: setStoreConnected, 
    setIsMockMode, 
    assessGap, 
    provider 
  } = useFeynmanStore();

  const startSession = useCallback(async () => {
    setConnectionError(null);
    
    const isMock = process.env.NEXT_PUBLIC_MOCK_MODE === 'true' || provider === 'mock';
    const agentType = isMock ? 'mock' : 'openai';
    
    if (isMock) {
      setIsMockMode(true);
    }

    const createAgentConfig = (onConnectMessage?: string) => ({
      onConnect: () => {
        setIsConnected(true);
        setStoreConnected(true);
        if (onConnectMessage) {
          setConnectionError(onConnectMessage);
        } else {
          setConnectionError(null);
        }
      },
      onDisconnect: () => {
        setIsConnected(false);
        setStoreConnected(false);
        setAgentState('idle');
      },
      onMessage: (role: 'user' | 'assistant', text: string) => {
        addMessage(role, text);
        if (role === 'user') {
          assessGap();
        }
      },
      onStateChange: (state: 'idle' | 'listening' | 'thinking' | 'talking') => setAgentState(state),
      onAudioTrack: (stream: MediaStream) => {
        const audioEl = document.createElement('audio');
        audioEl.srcObject = stream;
        audioEl.autoplay = true;
      },
      onTranscriptUpdate: (text: string) => {
        setCurrentTranscript(text);
      },
      onError: (error: Error) => {
        setConnectionError(error.message);
      },
      onFallback: () => {
        setIsMockMode(true);
      }
    });

    try {
      const agent = createAgent(agentType, createAgentConfig());
      agentRef.current = agent;
      
      try {
        await agent.connect();
      } catch {
        if (agentType === 'openai') {
          setIsMockMode(true);
          
          const fallbackAgent = createAgent('local', createAgentConfig('Using offline mode - cloud connection unavailable'));
          agentRef.current = fallbackAgent;
          await fallbackAgent.connect();
        } else {
          throw new Error('Failed to connect');
        }
      }
    } catch (err) {
      setConnectionError(err instanceof Error ? err.message : 'Failed to start session');
      setIsConnected(false);
      setStoreConnected(false);
    }
  }, [provider, setIsMockMode, setStoreConnected, setAgentState, addMessage, assessGap]);

  const stopSession = useCallback(() => {
    if (agentRef.current) {
      agentRef.current.disconnect();
      agentRef.current = null;
    }
    setIsMicOn(false);
    setCurrentTranscript('');
  }, []);

  const sendMessage = useCallback((text: string) => {
    if (!agentRef.current) {
      setConnectionError('No agent available');
      return;
    }
    
    if (!isConnected) {
      setConnectionError('Agent not connected');
      return;
    }
    
    agentRef.current.send(text);
  }, [isConnected]);

  const toggleMic = useCallback(() => {
    const newState = !isMicOn;
    setIsMicOn(newState);
    
    if (agentRef.current?.setMicEnabled) {
      agentRef.current.setMicEnabled(newState);
    } else {
      setConnectionError('Microphone control not available');
    }
  }, [isMicOn]);

  const commitTurn = useCallback(() => {
    if (isMicOn) {
      setIsMicOn(false);
      agentRef.current?.commitAudioTurn?.();
    }
  }, [isMicOn]);

  useEffect(() => {
    return () => {
      if (agentRef.current) {
        agentRef.current.disconnect();
      }
    };
  }, []);

  return {
    isConnected,
    isMicOn,
    currentTranscript,
    connectionError,
    startSession,
    stopSession,
    sendMessage,
    toggleMic,
    commitTurn
  };
}
