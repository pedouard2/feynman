import { webLLM } from '../web-llm';
import { PERSONA_SYSTEM_PROMPT } from '../prompts';
import { useFeynmanStore } from '../../stores/feynman';

export interface AgentConfig {
  onConnect: () => void;
  onDisconnect: () => void;
  onMessage: (role: 'user' | 'assistant', text: string) => void;
  onStateChange: (state: 'idle' | 'listening' | 'thinking' | 'talking') => void;
  onAudioTrack?: (stream: MediaStream) => void;
}

export interface AgentService {
  connect(): Promise<void>;
  disconnect(): void;
  send(text: string): void;
}

// ------------------------------------------------------------------
// MOCK AGENT (WebLLM + SpeechSynthesis + SpeechRecognition)
// ------------------------------------------------------------------
export class MockAgent implements AgentService {
  private config: AgentConfig;
  private recognition: any;
  private isProcessing = false;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  async connect() {
    this.config.onStateChange('idle');
    
    // Initialize LLM
    webLLM.initialize();

    // Initialize STT
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        if (!this.isProcessing) this.config.onStateChange('listening');
      };

      this.recognition.onend = () => {
        if (!this.isProcessing) {
            try { this.recognition.start(); } catch {}
        }
      };

      this.recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.handleUserMessage(transcript);
      };

      this.recognition.start();
    }
    
    this.config.onConnect();
  }

  processText(text: string) {
      // Manual text input entry point
      this.handleUserMessage(text);
  }

  private async handleUserMessage(text: string) {
    this.isProcessing = true;
    this.config.onStateChange('thinking');
    this.config.onMessage('user', text);

    try {
        const response = await webLLM.generateResponse(text, PERSONA_SYSTEM_PROMPT);
        this.config.onMessage('assistant', response);
        this.speak(response);
    } catch (e) {
        console.error("Mock Agent Error:", e);
        this.config.onStateChange('idle');
        this.isProcessing = false;
    }
  }

  private speak(text: string) {
    this.config.onStateChange('talking');
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.onend = () => {
        this.config.onStateChange('idle');
        this.isProcessing = false;
        try { this.recognition.start(); } catch {}
    };
    window.speechSynthesis.speak(utterance);
  }

  disconnect() {
    if (this.recognition) this.recognition.stop();
    window.speechSynthesis.cancel();
    this.config.onDisconnect();
  }

  send(text: string) {
    this.processText(text);
  }
}

// ------------------------------------------------------------------
// REAL AGENT (OpenAI Realtime WebRTC)
// ------------------------------------------------------------------
export class RealtimeAgent implements AgentService {
  private config: AgentConfig;
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioEl: HTMLAudioElement;

  constructor(config: AgentConfig) {
    this.config = config;
    this.audioEl = document.createElement('audio');
    this.audioEl.autoplay = true;
  }

  async connect() {
    try {
        const tokenResponse = await fetch('/api/session', { method: 'POST' });
        const data = await tokenResponse.json();

        if (data.mock) {
            throw new Error("Backend returned mock mode, but RealtimeAgent was requested.");
        }

        const EPHEMERAL_KEY = data.client_secret.value;
        this.pc = new RTCPeerConnection();

        // Audio Handling
        this.pc.ontrack = (e) => {
            this.audioEl.srcObject = e.streams[0];
            if (this.config.onAudioTrack) this.config.onAudioTrack(e.streams[0]);
        };

        // Add Local Mic
        const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.pc.addTrack(ms.getTracks()[0]);

        // Data Channel
        this.dc = this.pc.createDataChannel("oai-events");
        this.dc.onopen = () => this.config.onConnect();
        this.dc.onmessage = (e) => this.handleEvent(JSON.parse(e.data));

        // Offer/Answer
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);

        const baseUrl = "https://api.openai.com/v1/realtime";
        const model = "gpt-4o-realtime-preview-2024-12-17";
        const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
            method: "POST",
            body: offer.sdp,
            headers: {
                Authorization: `Bearer ${EPHEMERAL_KEY}`,
                "Content-Type": "application/sdp"
            },
        });

        const answer: RTCSessionDescriptionInit = {
            type: "answer",
            sdp: await sdpResponse.text(),
        };
        await this.pc.setRemoteDescription(answer);

    } catch (e) {
        console.error("Realtime Connection Failed", e);
        this.config.onDisconnect();
    }
  }

  private handleEvent(evt: any) {
      if (evt.type === 'response.audio_transcript.done') {
          this.config.onMessage('assistant', evt.transcript);
      }
      if (evt.type === 'response.function_call_arguments.done') {
           // Handle tools if needed
      }
      // Simple state mapping (approximate)
      if (evt.type === 'input_audio_buffer.speech_started') this.config.onStateChange('listening');
      if (evt.type === 'input_audio_buffer.speech_stopped') this.config.onStateChange('thinking');
      if (evt.type === 'response.content_part.added') this.config.onStateChange('talking');
      if (evt.type === 'response.done') this.config.onStateChange('idle');
  }

  disconnect() {
      this.pc?.close();
      this.pc = null;
      this.config.onDisconnect();
  }

  send(text: string) {
      // Realtime API text injection (optional)
      // For now we assume voice only primary
      console.warn("Text sending not yet implemented for Realtime Agent");
  }
}

// ------------------------------------------------------------------
// FACTORY
// ------------------------------------------------------------------
export function createAgent(type: 'mock' | 'real', config: AgentConfig): AgentService {
    if (type === 'mock') return new MockAgent(config);
    return new RealtimeAgent(config);
}
