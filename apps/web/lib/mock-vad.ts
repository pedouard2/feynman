export class MockVAD {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private intervalId: number | null = null;
  
  private isSpeaking = false;
  private silenceStart = 0;
  private readonly inputThreshold: number;
  private readonly silenceDuration: number;

  constructor(
    private onSpeechStart: () => void,
    private onSpeechEnd: () => void,
    options: { speechThreshold?: number; silenceDurationMs?: number } = {}
  ) {
    this.inputThreshold = options.speechThreshold || 0.02;
    this.silenceDuration = options.silenceDurationMs || 2000;
  }

  async start() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      this.intervalId = window.setInterval(() => {
        if (!this.analyser) return;
        this.analyser.getByteTimeDomainData(dataArray);

        // Calculate RMS (Root Mean Square) for volume
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          const x = (dataArray[i] - 128) / 128.0;
          sum += x * x;
        }
        const rms = Math.sqrt(sum / bufferLength);

        // State Machine
        if (!this.isSpeaking) {
          if (rms > this.inputThreshold) {
            this.isSpeaking = true;
            this.onSpeechStart();
          }
        } else {
          if (rms < this.inputThreshold) {
            if (this.silenceStart === 0) {
              this.silenceStart = Date.now();
            } else if (Date.now() - this.silenceStart > this.silenceDuration) {
              this.isSpeaking = false;
              this.silenceStart = 0;
              this.onSpeechEnd();
            }
          } else {
            this.silenceStart = 0; // Reset if they talk again
          }
        }
      }, 100);

    } catch { /* no-op */ }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(t => t.stop());
        this.mediaStream = null;
    }
    if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
    }
  }
}
