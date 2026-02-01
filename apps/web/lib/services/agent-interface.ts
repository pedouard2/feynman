import { webLLM } from '../web-llm';
import { PERSONA_SYSTEM_PROMPT } from '../prompts';

export interface AgentConfig {
  onConnect: () => void;
  onDisconnect: () => void;
  onMessage: (role: 'user' | 'assistant', text: string) => void;
  onStateChange: (state: 'idle' | 'listening' | 'thinking' | 'talking') => void;
  onAudioTrack?: (stream: MediaStream) => void;
  onTranscriptUpdate?: (text: string, isFinal: boolean) => void;
  onError?: (error: Error) => void;
  onFallback?: () => void;
}

export interface AgentService {
  connect(): Promise<void>;
  disconnect(): void;
  send(text: string): void;
  setMicEnabled?(enabled: boolean): void;
  commitAudioTurn?(): void;
}

const OPENAI_REALTIME_URL = process.env.NEXT_PUBLIC_OPENAI_REALTIME_URL || 'https://api.openai.com/v1/realtime';
const OPENAI_REALTIME_MODEL = process.env.NEXT_PUBLIC_OPENAI_REALTIME_MODEL || 'gpt-4o-realtime-preview-2024-12-17';

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

export class LocalAgent implements AgentService {
  private config: AgentConfig;
  private recognition: SpeechRecognitionInstance | null = null;
  private isProcessing = false;
  private isMicEnabled = false;
  private pendingTranscripts: string[] = [];

  constructor(config: AgentConfig) {
    this.config = config;
  }

  async connect() {
    this.config.onStateChange('idle');
    webLLM.initialize();

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognitionAPI) {
      this.recognition = new SpeechRecognitionAPI();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        if (!this.isProcessing && this.isMicEnabled) {
          this.config.onStateChange('listening');
        }
      };

      this.recognition.onend = () => {
        if (this.isMicEnabled && !this.isProcessing) {
          try { 
            this.recognition?.start(); 
          } catch {
            this.config.onError?.(new Error('Failed to restart speech recognition'));
          }
        }
      };

      this.recognition.onerror = (event) => {
        this.config.onError?.(new Error(`Speech recognition error: ${event.error}`));
      };

      this.recognition.onresult = (event) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        if (final && this.isMicEnabled) {
          this.pendingTranscripts.push(final);
          const fullTranscript = this.pendingTranscripts.join(' ');
          this.config.onTranscriptUpdate?.(fullTranscript, false);
        } else if (interim && this.isMicEnabled) {
          const fullInterim = [...this.pendingTranscripts, interim].join(' ');
          this.config.onTranscriptUpdate?.(fullInterim, false);
        }
      };
    } else {
      this.config.onError?.(new Error('SpeechRecognition API not available in this browser'));
    }
    
    this.config.onConnect();
  }

  setMicEnabled(enabled: boolean) {
    this.isMicEnabled = enabled;
    if (enabled) {
      this.pendingTranscripts = [];
      this.config.onStateChange('listening');
      
      if (this.recognition) {
        try { 
          this.recognition.start();
        } catch {
          this.config.onError?.(new Error('Failed to start speech recognition'));
        }
      }
      
      this.config.onTranscriptUpdate?.('', false);
    } else {
      this.config.onStateChange('idle');
      
      if (this.recognition) {
        try { 
          this.recognition.stop();
        } catch { /* no-op */ }
      }
      
      if (this.pendingTranscripts.length > 0) {
        const finalText = this.pendingTranscripts.join(' ');
        this.config.onTranscriptUpdate?.(finalText, true);
      }
    }
  }

  commitAudioTurn() {
    if (this.pendingTranscripts.length > 0) {
      const fullTranscript = this.pendingTranscripts.join(' ');
      this.pendingTranscripts = [];
      this.isMicEnabled = false;
      if (this.recognition) {
        try { 
          this.recognition.stop(); 
        } catch { /* no-op */ }
      }
      this.config.onTranscriptUpdate?.(fullTranscript, true);
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
      this.config.onError?.(e instanceof Error ? e : new Error('LocalAgent processing failed'));
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
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch { /* no-op */ }
    }
    window.speechSynthesis.cancel();
    this.config.onDisconnect();
  }

  send(text: string) {
    this.handleUserMessage(text);
  }
}

export class RealtimeAgent implements AgentService {
  private config: AgentConfig;
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioEl: HTMLAudioElement;
  private isMicEnabled = false;
  private currentTranscript = '';
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(config: AgentConfig) {
    this.config = config;
    this.audioEl = document.createElement('audio');
    this.audioEl.autoplay = true;
  }

  async connect() {
    try {
      const tokenResponse = await fetch('/api/session', { method: 'POST' });
      
      if (!tokenResponse.ok) {
        throw new Error(`Session API error: ${tokenResponse.status}`);
      }
      
      const data = await tokenResponse.json();

      if (data.mock) {
        throw new Error('Backend returned mock mode');
      }

      if (!data.client_secret?.value) {
        throw new Error('No client_secret received from session endpoint');
      }

      const EPHEMERAL_KEY = data.client_secret.value;
      this.pc = new RTCPeerConnection();

      this.pc.ontrack = (e) => {
        this.audioEl.srcObject = e.streams[0];
        this.config.onAudioTrack?.(e.streams[0]);
      };

      const ms = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      this.pc.addTrack(ms.getTracks()[0]);

      this.dc = this.pc.createDataChannel('oai-events');
      this.dc.onopen = () => {
        this.disableServerVAD();
        this.config.onConnect();
      };
      this.dc.onerror = () => {
        this.config.onError?.(new Error('Data channel error'));
      };
      this.dc.onclose = () => {
        this.config.onDisconnect();
      };
      this.dc.onmessage = (e) => {
        try {
          this.handleEvent(JSON.parse(e.data));
        } catch {
          this.config.onError?.(new Error('Failed to parse data channel message'));
        }
      };

      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      const sdpResponse = await fetch(`${OPENAI_REALTIME_URL}?model=${OPENAI_REALTIME_MODEL}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          'Content-Type': 'application/sdp'
        },
      });

      if (!sdpResponse.ok) {
        throw new Error(`SDP exchange failed: ${sdpResponse.status}`);
      }

      const answer: RTCSessionDescriptionInit = {
        type: 'answer',
        sdp: await sdpResponse.text(),
      };
      await this.pc.setRemoteDescription(answer);

    } catch (e) {
      this.config.onDisconnect();
      throw e;
    }
  }

  private handleEvent(evt: { type: string; delta?: string; transcript?: string }) {
    switch (evt.type) {
      case 'conversation.item.input_audio_transcription.delta':
        if (evt.delta) {
          this.currentTranscript += evt.delta;
          this.config.onTranscriptUpdate?.(this.currentTranscript, false);
        }
        break;
        
      case 'conversation.item.input_audio_transcription.completed':
        if (evt.transcript) {
          this.config.onMessage('user', evt.transcript);
          this.config.onTranscriptUpdate?.(evt.transcript, true);
        }
        this.currentTranscript = '';
        break;
        
      case 'response.audio_transcript.done':
        if (evt.transcript) {
          this.config.onMessage('assistant', evt.transcript);
        }
        break;
        
      case 'response.content_part.added':
        this.config.onStateChange('talking');
        this.updateMicTrack(false);
        break;
        
      case 'response.done':
        this.config.onStateChange('idle');
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
        }
        this.reconnectTimeout = setTimeout(() => {
          if (this.isMicEnabled) {
            this.updateMicTrack(true);
          }
        }, 1500);
        break;
    }
  }

  private disableServerVAD() {
    if (this.dc?.readyState === 'open') {
      this.dc.send(JSON.stringify({
        type: 'session.update',
        session: {
          turn_detection: null,
          input_audio_transcription: { model: 'whisper-1' }
        }
      }));
    }
  }

  private updateMicTrack(enabled: boolean) {
    if (this.pc) {
      const senders = this.pc.getSenders();
      const audioSender = senders.find(s => s.track?.kind === 'audio');
      if (audioSender?.track) {
        audioSender.track.enabled = enabled;
      }
    }
  }

  setMicEnabled(enabled: boolean) {
    if (enabled) {
      this.isMicEnabled = enabled;
      this.currentTranscript = '';
      if (this.dc?.readyState === 'open') {
        this.dc.send(JSON.stringify({ type: 'input_audio_buffer.clear' }));
        this.dc.send(JSON.stringify({
          type: 'session.update',
          session: {
            input_audio_transcription: { model: 'whisper-1' }
          }
        }));
      }
      this.config.onStateChange('listening');
      this.config.onTranscriptUpdate?.('', false);
      this.updateMicTrack(enabled);
    } else {
      this.commitAudioTurn();
    }
  }

  commitAudioTurn() {
    if (this.dc?.readyState === 'open') {
      this.updateMicTrack(false);
      this.isMicEnabled = false;
      this.dc.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
      this.config.onStateChange('idle');
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.pc?.close();
    this.pc = null;
    this.config.onDisconnect();
  }

  send(text: string) {
    if (this.dc?.readyState === 'open') {
      this.config.onMessage('user', text);
      
      this.dc.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [
            { type: 'input_text', text: text }
          ]
        }
      }));

      this.dc.send(JSON.stringify({
        type: 'response.create'
      }));
    } else {
      this.config.onError?.(new Error('Cannot send: data channel not open'));
    }
  }
}

export function createAgent(type: 'mock' | 'local' | 'real' | 'openai', config: AgentConfig): AgentService {
  if (type === 'mock' || type === 'local') return new LocalAgent(config);
  return new RealtimeAgent(config);
}
