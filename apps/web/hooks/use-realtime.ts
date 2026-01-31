import { useEffect, useRef, useState } from 'react';
import { useFeynmanStore } from '../stores/feynman';
import { createAgent, AgentService } from '../lib/services/agent-interface';

export function useRealtimeSession() {
  const [isConnected, setIsConnected] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const agentRef = useRef<AgentService | null>(null);
  
  const { addMessage, setAgentState, setIsConnected: setStoreConnected, setIsMockMode, assessGap, provider, setProvider } = useFeynmanStore();

  const startSession = async () => {
    try {
      // 1. Determine Mode (Mock vs Real vs OpenAI TTS)
      let currentProvider = provider;
      let isMock = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

      if (isMock) {
          currentProvider = 'mock';
          setIsMockMode(true);
      } else if (currentProvider === 'mock') {
          // If store says mock but env doesn't force it, user selected mock
          isMock = true;
      }

      // 2. Initialize Agent via Factory
      const agent = createAgent(currentProvider, {
        onConnect: () => {
            setIsConnected(true);
            setStoreConnected(true);
        },
        onDisconnect: () => {
             setIsConnected(false);
             setStoreConnected(false);
             setAgentState('idle');
        },
        onMessage: (role, text) => {
            addMessage(role, text);
            // Trigger feedback assessment if user finished a thought
            if (role === 'user') {
                assessGap();
            }
        },
        onStateChange: (state) => setAgentState(state),
        onAudioTrack: (stream) => {
             // Basic audio playback for Realtime API
             // For OpenAI TTS (Track A), playback is handled inside the agent.
             // If using Realtime API, this stream is used.
            const audioEl = document.createElement('audio');
            audioEl.srcObject = stream;
            audioEl.autoplay = true;
        } 
      });

      agentRef.current = agent;
      await agent.connect();

    } catch (err) {
      console.error('Failed to start session:', err);
      setIsConnected(false);
      setStoreConnected(false);
    }
  };

  const stopSession = () => {
    if (agentRef.current) {
      agentRef.current.disconnect();
      agentRef.current = null;
    }
  };

  const sendMessage = (text: string) => {
    agentRef.current?.send(text);
  };

  const toggleMic = () => {
    const newState = !isMicOn;
    setIsMicOn(newState);
    agentRef.current?.setMicEnabled?.(newState);
  };

  const commitTurn = () => {
    if (isMicOn) {
      setIsMicOn(false);
      agentRef.current?.commitAudioTurn?.();
    }
  };

  return {
    isConnected,
    isMicOn,
    startSession,
    stopSession,
    sendMessage,
    toggleMic,
    commitTurn
  };
}
