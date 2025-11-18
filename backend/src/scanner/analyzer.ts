import * as fs from 'fs/promises';
import * as path from 'path';
import { FileMetrics } from '../types';

export class CodeAnalyzer {
  /**
   * Analyze a single file and return metrics
   */
  async analyzeFile(filePath: string): Promise<FileMetrics | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const stats = await fs.stat(filePath);
      const language = this.detectLanguage(filePath);

      if (!language) return null;

      const lines = content.split('\n');
      const complexity = this.calculateComplexity(content, language);
      const imports = this.extractImports(content, language);
      const exports = this.extractExports(content, language);

      return {
        path: filePath,
        size: stats.size,
        lines: lines.length,
        complexity,
        imports,
        exports,
        language,
      };
    } catch (error) {
      console.error(`Error analyzing file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Detect programming language from file extension
   */
  private detectLanguage(filePath: string): string | null {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.go': 'go',
      '.rb': 'ruby',
      '.php': 'php',
      '.cs': 'csharp',
      '.cpp': 'cpp',
      '.c': 'c',
      '.rs': 'rust',
      '.swift': 'swift',
      '.kt': 'kotlin',
    };
    return languageMap[ext] || null;
  }

  /**
   * Calculate approximate cyclomatic complexity
   * Counts decision points: if, for, while, case, catch, &&, ||, ?
   */
  private calculateComplexity(content: string, language: string): number {
    let complexity = 1; // Base complexity

    // Common complexity indicators across languages
    const patterns = [
      /\bif\b/g,
      /\bfor\b/g,
      /\bwhile\b/g,
      /\bcase\b/g,
      /\bcatch\b/g,
      /\&\&/g,
      /\|\|/g,
      /\?/g,
      /\belif\b/g,
      /\belse if\b/g,
    ];

    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  /**
   * Extract import statements from code
   */
  private extractImports(content: string, language: string): string[] {
    const imports: string[] = [];

    switch (language) {
      case 'javascript':
      case 'typescript':
        // Match: import ... from '...'  or  require('...')
        const jsImportRegex = /(?:import.*from\s+['"]([^'"]+)['"]|require\(['"]([^'"]+)['"]\))/g;
        let match;
        while ((match = jsImportRegex.exec(content)) !== null) {
          imports.push(match[1] || match[2]);
        }
        break;

      case 'python':
        // Match: import ... or from ... import ...
        const pyImportRegex = /(?:^import\s+([^\s]+)|^from\s+([^\s]+)\s+import)/gm;
        while ((match = pyImportRegex.exec(content)) !== null) {
          imports.push(match[1] || match[2]);
        }
        break;

      case 'java':
        // Match: import ...;
        const javaImportRegex = /import\s+([\w.]+);/g;
        while ((match = javaImportRegex.exec(content)) !== null) {
          imports.push(match[1]);
        }
        break;

      case 'go':
        // Match: import "..." or import ( ... )
        const goImportRegex = /import\s+(?:"([^"]+)"|`([^`]+)`)/g;
        while ((match = goImportRegex.exec(content)) !== null) {
          imports.push(match[1] || match[2]);
        }
        break;
    }

    return imports;
  }

  /**
   * Extract export statements from code
   */
  private extractExports(content: string, language: string): string[] {
    const exports: string[] = [];

    switch (language) {
      case 'javascript':
      case 'typescript':
        // Match: export function/class/const name
        const jsExportRegex = /export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/g;
        let match;
        while ((match = jsExportRegex.exec(content)) !== null) {
          exports.push(match[1]);
        }
        break;

      case 'python':
        // Match: def function_name or class ClassName at module level
        const pyExportRegex = /^(?:def|class)\s+(\w+)/gm;
        while ((match = pyExportRegex.exec(content)) !== null) {
          exports.push(match[1]);
        }
        break;

      case 'java':
        // Match: public class/interface
        const javaExportRegex = /public\s+(?:class|interface)\s+(\w+)/g;
        while ((match = javaExportRegex.exec(content)) !== null) {
          exports.push(match[1]);
        }
        break;
    }

    return exports;
  }
}
