import { useEffect, useRef, useState } from 'react';
import { useFeynmanStore } from '../stores/feynman';
import { createAgent, AgentService } from '../lib/services/agent-interface';

export function useRealtimeSession() {
  const [isConnected, setIsConnected] = useState(false);
  const agentRef = useRef<AgentService | null>(null);
  
  const { addMessage, setAgentState, setIsConnected: setStoreConnected, setIsMockMode, assessGap } = useFeynmanStore();

  const startSession = async () => {
    try {
      // 1. Determine Mode (Mock vs Real)
      // Check env var first, then API
      let isMock = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
      let ephemeralKey: string | undefined;

      if (!isMock) {
        const tokenRes = await fetch('/api/session', { method: 'POST' });
        const data = await tokenRes.json();
        
        if (data.mock) {
            isMock = true;
            console.log('API returned mock mode (No API Key)');
        } else {
            ephemeralKey = data.client_secret.value;
        }
      } else {
          console.log('Forced Mock Mode via Env Var');
      }

      setIsMockMode(isMock);
      if (isMock) {
         addMessage('assistant', 'System: Mock mode enabled (Local WebLLM + STT). Speak to start.');
      }

      // 2. Initialize Agent via Factory
      const agent = createAgent(isMock ? 'mock' : 'real', {
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

  return {
    isConnected,
    startSession,
    stopSession
  };
}
