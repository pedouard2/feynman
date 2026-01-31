import { useEffect, useRef, useState } from 'react';
import { useFeynmanStore } from '../stores/feynman';
import { MockVAD } from '../lib/mock-vad';

export function useRealtimeSession() {
  const [isConnected, setIsConnected] = useState(false);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const vadRef = useRef<MockVAD | null>(null);
  
  const { knowledgeDebt } = useFeynmanStore();

  useEffect(() => {
    // Audit audio element
    if (!audioElRef.current) {
      audioElRef.current = document.createElement('audio');
      audioElRef.current.autoplay = true;
    }
  }, []);

  const startSession = async () => {
    try {
      // 1. Get ephemeral token
      const tokenRes = await fetch('/api/session', { method: 'POST' });
      const data = await tokenRes.json();
      
      if (data.error) throw new Error(data.error);

      // MOCK MODE HANDLE
      if (data.mock) {
        console.log('Starting MOCK session (No OpenAI Connection)');
        setIsConnected(true);
        useFeynmanStore.getState().setIsConnected(true);
        useFeynmanStore.getState().setIsMockMode(true);
        useFeynmanStore.getState().addMessage('assistant', 'System: Mock mode enabled. Speak into your mic to test states.');
        
        // Start Mock VAD
        const vad = new MockVAD(
            () => {
                // Speech Started
                console.log('VAD: Speech Started');
                useFeynmanStore.getState().setAgentState('listening');
            },
            () => {
                // Speech Ended
                console.log('VAD: Speech Ended -> Thinking');
                useFeynmanStore.getState().setAgentState('thinking');
                
                // Simulate Agent Reply after a delay
                setTimeout(() => {
                    useFeynmanStore.getState().setAgentState('talking');
                    
                    // Respond with dummy text
                    useFeynmanStore.getState().addMessage('assistant', 'Mock: I heard you! (Simulated Response)');
                    
                    // Go back to idle after "talking"
                    setTimeout(() => {
                         useFeynmanStore.getState().setAgentState('idle');
                    }, 3000); // Talk for 3s
                    
                }, 1500); // Think for 1.5s
            },
            { silenceDurationMs: 2000, speechThreshold: 0.03 } // Tweakable config
        );
        vadRef.current = vad;
        vad.start();
        return;
      }

      // 2. Init WebRTC
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Handle remote audio
      pc.ontrack = (event) => {
        if (audioElRef.current) {
          audioElRef.current.srcObject = event.streams[0];
        }
      };

      // Data channel for events
      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;
      
      dc.onmessage = (e) => {
        const event = JSON.parse(e.data);
        
        // Handle State Transitions
        if (event.type === 'input_audio_buffer.speech_started') {
            useFeynmanStore.getState().setAgentState('listening');
        } else if (event.type === 'input_audio_buffer.speech_stopped') {
            useFeynmanStore.getState().setAgentState('thinking');
        } else if (event.type === 'response.audio.delta') {
            useFeynmanStore.getState().setAgentState('talking');
        } else if (event.type === 'response.done') {
            useFeynmanStore.getState().setAgentState('idle');
        }

        // Handle Transcripts
        if (event.type === 'response.audio_transcript.done') {
          useFeynmanStore.getState().addMessage('assistant', event.transcript);
        }
        if (event.type === 'conversation.item.input_audio_transcription.completed') {
             useFeynmanStore.getState().addMessage('user', event.transcript);
             // Trigger assessment
             useFeynmanStore.getState().assessGap();
        }
      };

      // 3. Offer/Answer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const baseUrl = 'https://api.openai.com/v1/realtime';
      const model = 'gpt-4o-realtime-preview-2024-12-17';
      
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${data.client_secret.value}`,
          'Content-Type': 'application/sdp',
        },
      });

      const answerSdp = await sdpResponse.text();
      await pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp,
      });

      setIsConnected(true);
      useFeynmanStore.getState().setIsConnected(true);
    } catch (err) {
      console.error('Failed to start session:', err);
      setIsConnected(false);
      useFeynmanStore.getState().setIsConnected(false);
    }
  };

  const stopSession = () => {
    if (vadRef.current) {
      vadRef.current.stop();
      vadRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    setIsConnected(false);
    useFeynmanStore.getState().setIsConnected(false);
    useFeynmanStore.getState().setAgentState('idle');
  };

  return {
    isConnected,
    startSession,
    stopSession
  };
}
