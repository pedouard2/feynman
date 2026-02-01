import { CreateMLCEngine, MLCEngineInterface, prebuiltAppConfig, ChatCompletionMessageParam } from "@mlc-ai/web-llm";

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
        appConfig: prebuiltAppConfig,
        initProgressCallback: (report: { text: string }) => {
          this.onProgressCallback?.(report.text);
        },
      });
    } catch (e) {
      this.isLoading = false;
      throw e;
    }
    this.isLoading = false;
  }

  async generateResponse(userMessage: string, systemPrompt: string): Promise<string> {
    if (!this.engine) {
      await this.initialize();
    }
    
    if (!this.engine) throw new Error("Engine failed to initialize");

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ];

    const reply = await this.engine.chat.completions.create({
      messages,
      temperature: 0.7,
      max_tokens: 150,
    });

    return reply.choices?.[0]?.message?.content || "";
  }
}

export const webLLM = new WebLLMService();
