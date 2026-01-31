import { webLLM } from '../web-llm';
import { PERSONA_SYSTEM_PROMPT } from '../prompts';

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
  setMicEnabled?(enabled: boolean): void;
  commitAudioTurn?(): void;
}

// ------------------------------------------------------------------
// LOCAL AGENT (WebLLM + Browser SpeechSynthesis + SpeechRecognition)
// Fully offline/local - no API costs
// ------------------------------------------------------------------
export class LocalAgent implements AgentService {
  private config: AgentConfig;
  private recognition: any;
  private isProcessing = false;
  private isMicEnabled = false;
  private pendingTranscripts: string[] = [];

  constructor(config: AgentConfig) {
    this.config = config;
  }

  async connect() {
    this.config.onStateChange('idle');
    
    webLLM.initialize();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        if (!this.isProcessing && this.isMicEnabled) {
          this.config.onStateChange('listening');
        }
      };

      this.recognition.onend = () => {
        if (this.isMicEnabled && !this.isProcessing) {
          try { this.recognition.start(); } catch {}
        }
      };

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim();
        if (transcript && this.isMicEnabled) {
          this.pendingTranscripts.push(transcript);
        }
      };
    }
    
    this.config.onConnect();
  }

  setMicEnabled(enabled: boolean) {
    this.isMicEnabled = enabled;
    if (enabled) {
      this.pendingTranscripts = [];
      this.config.onStateChange('listening');
      if (this.recognition) {
        try { this.recognition.start(); } catch {}
      }
    } else {
      this.config.onStateChange('idle');
      if (this.recognition) {
        try { this.recognition.stop(); } catch {}
      }
    }
  }

  commitAudioTurn() {
    if (this.pendingTranscripts.length > 0) {
      const fullTranscript = this.pendingTranscripts.join(' ');
      this.pendingTranscripts = [];
      this.isMicEnabled = false;
      if (this.recognition) {
        try { this.recognition.stop(); } catch {}
      }
      this.handleUserMessage(fullTranscript);
    }
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
        console.error("LocalAgent Error:", e);
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
    };
    window.speechSynthesis.speak(utterance);
  }

  disconnect() {
    if (this.recognition) this.recognition.stop();
    window.speechSynthesis.cancel();
    this.config.onDisconnect();
  }

  send(text: string) {
    this.handleUserMessage(text);
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
  private isMicEnabled = false;

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

        // Add Local Mic with echo prevention
        const ms = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });
        this.pc.addTrack(ms.getTracks()[0]);

        // Data Channel
        this.dc = this.pc.createDataChannel("oai-events");
        this.dc.onopen = () => {
          this.disableServerVAD();
          this.config.onConnect();
        };
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
      if (evt.type === 'conversation.item.input_audio_transcription.completed') {
          this.config.onMessage('user', evt.transcript);
      }
      if (evt.type === 'response.function_call_arguments.done') {
           // Handle tools if needed
      }

      if (evt.type === 'response.content_part.added') {
          this.config.onStateChange('talking');
          this.updateMicTrack(false);
      }
      if (this.pc && evt.type === 'response.done') {
           this.config.onStateChange('idle');
           setTimeout(() => {
              if (this.isMicEnabled) {
                this.updateMicTrack(true);
              }
           }, 1500);
       }
  }

  private disableServerVAD() {
      if (this.dc && this.dc.readyState === 'open') {
          this.dc.send(JSON.stringify({
              type: "session.update",
              session: {
                  turn_detection: null,
                  input_audio_transcription: { model: "whisper-1" }
              }
          }));
      }
  }

  private updateMicTrack(enabled: boolean) {
      if (this.pc) {
          const senders = this.pc.getSenders();
          const audioSender = senders.find(s => s.track?.kind === 'audio');
          if (audioSender && audioSender.track) {
              audioSender.track.enabled = enabled;
          }
      }
  }

  setMicEnabled(enabled: boolean) {
      this.isMicEnabled = enabled;
      if (enabled) {
          if (this.dc && this.dc.readyState === 'open') {
              this.dc.send(JSON.stringify({ type: "input_audio_buffer.clear" }));
          }
          this.config.onStateChange('listening');
      } else {
          this.config.onStateChange('idle');
      }
      this.updateMicTrack(enabled);
  }

  commitAudioTurn() {
      if (this.dc && this.dc.readyState === 'open') {
          this.config.onStateChange('thinking');
          this.updateMicTrack(false);
          this.isMicEnabled = false;
          this.dc.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
          this.dc.send(JSON.stringify({ type: "response.create" }));
      }
  }

  disconnect() {
      this.pc?.close();
      this.pc = null;
      this.config.onDisconnect();
  }

  send(text: string) {
      if (this.dc && this.dc.readyState === 'open') {
          // Send user message
          this.dc.send(JSON.stringify({
              type: "conversation.item.create",
              item: {
                  type: "message",
                  role: "user",
                  content: [
                      { type: "input_text", text: text }
                  ]
              }
          }));

          // Trigger response generation
          this.dc.send(JSON.stringify({
              type: "response.create"
          }));
      } else {
          console.error("Data Channel not open. Cannot send text.");
      }
  }
}

// ------------------------------------------------------------------
// FACTORY
// ------------------------------------------------------------------
export function createAgent(type: 'mock' | 'local' | 'real' | 'openai', config: AgentConfig): AgentService {
    if (type === 'mock' || type === 'local') return new LocalAgent(config);
    return new RealtimeAgent(config);
}
