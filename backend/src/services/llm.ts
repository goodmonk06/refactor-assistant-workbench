import OpenAI from 'openai';
import { ScanSummary } from '../types';

export interface GeneratePlanRequest {
  goal: string;
  scanSummary: ScanSummary;
  codebaseName: string;
}

export interface GeneratedPlan {
  title: string;
  description: string;
  tasks: {
    title: string;
    description: string;
    areaPath: string;
    priority: number;
  }[];
}

export class LLMService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Generate a refactor plan using GPT-4
   */
  async generateRefactorPlan(request: GeneratePlanRequest): Promise<GeneratedPlan> {
    const prompt = this.buildPrompt(request);

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert software architect specializing in code refactoring and technical debt management. You help developers plan large-scale refactoring efforts by analyzing codebase metrics and creating actionable task lists.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    return JSON.parse(response) as GeneratedPlan;
  }

  /**
   * Build the prompt for plan generation
   */
  private buildPrompt(request: GeneratePlanRequest): string {
    const { goal, scanSummary, codebaseName } = request;

    const hotspotsList = scanSummary.hotspots
      .slice(0, 10)
      .map(
        (h) =>
          `- ${h.path}: ${h.lines} lines, complexity ${h.complexity}, ${h.imports.length} imports`
      )
      .join('\n');

    const languagesList = Object.entries(scanSummary.languages)
      .map(([lang, count]) => `- ${lang}: ${count} files`)
      .join('\n');

    return `
# Refactoring Goal
${goal}

# Codebase: ${codebaseName}

## Summary Statistics
- Total Files: ${scanSummary.totalFiles}
- Total Lines: ${scanSummary.totalLines}
- Average Complexity: ${scanSummary.averageComplexity}

## Languages
${languagesList}

## Top Complexity Hotspots
${hotspotsList}

## Task
Based on the goal and codebase metrics above, create a comprehensive refactoring plan.

Generate a JSON response with this exact structure:
{
  "title": "Short title for the refactor plan",
  "description": "Detailed markdown description of the overall refactoring strategy, key principles, and expected outcomes",
  "tasks": [
    {
      "title": "Task title",
      "description": "Detailed markdown description of what needs to be done",
      "areaPath": "Path to the code area (e.g., 'src/core/scheduler')",
      "priority": 1-5 (5 being highest priority)
    }
  ]
}

Create 5-15 specific, actionable tasks ordered by priority and dependencies. Each task should:
- Be concrete and measurable
- Include the specific code area/path it affects
- Have a clear description of the changes needed
- Consider dependencies between tasks
- Address the stated goal and leverage insights from the metrics
`;
  }
}
