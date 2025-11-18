import { ScanSummary } from '../../types';

/**
 * LLM provider interface for AI-powered plan generation
 *
 * Supports multiple LLM backends:
 * - OpenAI (GPT-4, GPT-3.5)
 * - Anthropic Claude
 * - Azure OpenAI
 * - Local models (via Ollama, LM Studio)
 * - Custom fine-tuned models
 */
export interface ILLMProvider {
  /**
   * Provider name (e.g., "openai", "claude", "azure-openai")
   */
  readonly name: string;

  /**
   * Generate refactoring plan based on scan results and goal
   */
  generateRefactorPlan(request: GeneratePlanRequest): Promise<GeneratedPlan>;

  /**
   * Optional: Check if the provider is configured and accessible
   */
  isAvailable?(): Promise<boolean>;

  /**
   * Optional: Estimate cost for a plan generation request
   */
  estimateCost?(request: GeneratePlanRequest): Promise<CostEstimate>;
}

export interface GeneratePlanRequest {
  goal: string;
  scanSummary: ScanSummary;
  codebaseName: string;
  additionalContext?: string;
  temperature?: number;
  maxTasks?: number;
}

export interface GeneratedPlan {
  title: string;
  description: string;
  tasks: {
    title: string;
    description: string;
    areaPath: string;
    priority: number;
    estimatedHours?: number;
  }[];
  metadata?: {
    model?: string;
    tokensUsed?: number;
    cost?: number;
  };
}

export interface CostEstimate {
  estimatedTokens: number;
  estimatedCost: number;
  currency: string;
}

/**
 * LLM provider registry
 */
export class LLMProviderRegistry {
  private providers: Map<string, ILLMProvider> = new Map();
  private defaultProvider?: ILLMProvider;

  register(provider: ILLMProvider, isDefault = false): void {
    this.providers.set(provider.name, provider);
    if (isDefault || !this.defaultProvider) {
      this.defaultProvider = provider;
    }
  }

  get(name: string): ILLMProvider | undefined {
    return this.providers.get(name);
  }

  getDefault(): ILLMProvider {
    if (!this.defaultProvider) {
      throw new Error('No default LLM provider registered');
    }
    return this.defaultProvider;
  }

  getAll(): ILLMProvider[] {
    return Array.from(this.providers.values());
  }

  async getAvailableProviders(): Promise<ILLMProvider[]> {
    const providers = this.getAll();
    const results = await Promise.all(
      providers.map(async (provider) => ({
        provider,
        available: provider.isAvailable ? await provider.isAvailable() : true,
      }))
    );
    return results.filter((r) => r.available).map((r) => r.provider);
  }
}

// Global registry instance
export const llmProviderRegistry = new LLMProviderRegistry();
