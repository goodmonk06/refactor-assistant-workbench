import * as fs from 'fs/promises';
import * as path from 'path';
import { FileMetrics, ScanSummary } from '../types';
import { CodeAnalyzer } from './analyzer';

export class CodebaseScanner {
  private analyzer: CodeAnalyzer;
  private ignoredDirs = new Set([
    'node_modules',
    '.git',
    'dist',
    'build',
    '.next',
    'coverage',
    '__pycache__',
    'vendor',
    'target',
  ]);

  constructor() {
    this.analyzer = new CodeAnalyzer();
  }

  /**
   * Scan entire codebase and return summary
   */
  async scanCodebase(
    repoPath: string,
    onProgress?: (scanned: number, total: number, currentFile: string) => void
  ): Promise<ScanSummary> {
    const files = await this.getAllFiles(repoPath);
    const metrics: FileMetrics[] = [];

    let scannedCount = 0;
    for (const file of files) {
      const metric = await this.analyzer.analyzeFile(file);
      if (metric) {
        metrics.push(metric);
      }
      scannedCount++;
      if (onProgress) {
        onProgress(scannedCount, files.length, file);
      }
    }

    return this.generateSummary(metrics, repoPath);
  }

  /**
   * Recursively get all code files in directory
   */
  private async getAllFiles(dirPath: string): Promise<string[]> {
    const files: string[] = [];

    async function walk(currentPath: string, scanner: CodebaseScanner): Promise<void> {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

        if (entry.isDirectory()) {
          if (!scanner.ignoredDirs.has(entry.name)) {
            await walk(fullPath, scanner);
          }
        } else if (entry.isFile()) {
          if (scanner.isCodeFile(entry.name)) {
            files.push(fullPath);
          }
        }
      }
    }

    await walk(dirPath, this);
    return files;
  }

  /**
   * Check if file is a code file we should analyze
   */
  private isCodeFile(fileName: string): boolean {
    const codeExtensions = [
      '.js', '.jsx', '.ts', '.tsx',
      '.py', '.java', '.go', '.rb',
      '.php', '.cs', '.cpp', '.c',
      '.rs', '.swift', '.kt',
    ];
    const ext = path.extname(fileName).toLowerCase();
    return codeExtensions.includes(ext);
  }

  /**
   * Generate summary from collected metrics
   */
  private generateSummary(metrics: FileMetrics[], repoPath: string): ScanSummary {
    const totalFiles = metrics.length;
    const totalLines = metrics.reduce((sum, m) => sum + m.lines, 0);
    const averageComplexity = totalFiles > 0
      ? metrics.reduce((sum, m) => sum + m.complexity, 0) / totalFiles
      : 0;

    // Identify hotspots (high complexity or large files)
    const hotspots = metrics
      .filter(m => m.complexity > 20 || m.lines > 500)
      .sort((a, b) => b.complexity - a.complexity)
      .slice(0, 20);

    // Count files by language
    const languages: Record<string, number> = {};
    for (const metric of metrics) {
      languages[metric.language] = (languages[metric.language] || 0) + 1;
    }

    // Build dependency graph
    const dependencyGraph: Record<string, string[]> = {};
    for (const metric of metrics) {
      const relativePath = path.relative(repoPath, metric.path);
      dependencyGraph[relativePath] = metric.imports;
    }

    return {
      totalFiles,
      totalLines,
      averageComplexity: Math.round(averageComplexity * 100) / 100,
      hotspots,
      languages,
      dependencyGraph,
    };
  }
}
