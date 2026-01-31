import { CreateMLCEngine, MLCEngineInterface, prebuiltAppConfig } from "@mlc-ai/web-llm";

// Using Llama-3.1-8B (stable ID)
const SELECTED_MODEL = "Llama-3.1-8B-Instruct-q4f32_1-MLC";

export class WebLLMService {
  private engine: MLCEngineInterface | null = null;
  private isLoading = false;
  private onProgressCallback: ((text: string) => void) | null = null;

  constructor(onProgress?: (text: string) => void) {
    this.onProgressCallback = onProgress || null;
  }

  async initialize() {
    if (this.engine || this.isLoading) return;
    
    this.isLoading = true;
    try {
      this.engine = await CreateMLCEngine(SELECTED_MODEL, {
        appConfig: prebuiltAppConfig, // Explicitly pass default config
        initProgressCallback: (report: { text: string }) => {
          if (this.onProgressCallback) {
            this.onProgressCallback(report.text);
          }
          console.log("WebLLM Init:", report.text);
        },
      });
      console.log("WebLLM Engine Loaded");
    } catch (e) {
      console.error("Failed to load WebLLM:", e);
      throw e;
    } finally {
      this.isLoading = false;
    }
  }

  async generateResponse(userMessage: string, systemPrompt: string): Promise<string> {
    if (!this.engine) {
      await this.initialize();
    }
    
    if (!this.engine) throw new Error("Engine failed to initialize");

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ];

    const reply = await this.engine.chat.completions.create({
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 150, // Keep it brief for conversation
    });

    return reply.choices[0].message.content || "";
  }
}

export const webLLM = new WebLLMService();
