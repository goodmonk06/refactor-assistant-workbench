import { FileMetrics, ScanSummary } from '../../types';

/**
 * Scanner adapter interface for pluggable code analysis tools
 *
 * Implementations can use different analysis strategies:
 * - AST-based parsing (current default)
 * - External tools (SonarQube, ESLint, Semgrep)
 * - Cloud-based analyzers (CodeQL, Snyk)
 * - Custom business rules
 */
export interface IScannerAdapter {
  /**
   * Unique identifier for this scanner
   */
  readonly name: string;

  /**
   * Supported file extensions or languages
   */
  readonly supportedExtensions: string[];

  /**
   * Analyze a single file and return metrics
   */
  analyzeFile(filePath: string, content: string): Promise<FileMetrics | null>;

  /**
   * Optional: Analyze entire codebase at once (for tools that work better in batch)
   */
  analyzeCodebase?(repoPath: string): Promise<ScanSummary>;

  /**
   * Optional: Configure the scanner with custom rules or settings
   */
  configure?(config: Record<string, unknown>): void;
}

/**
 * Scanner registry for managing multiple scanner implementations
 */
export class ScannerRegistry {
  private scanners: Map<string, IScannerAdapter> = new Map();
  private defaultScanner?: IScannerAdapter;

  register(scanner: IScannerAdapter, isDefault = false): void {
    this.scanners.set(scanner.name, scanner);
    if (isDefault || !this.defaultScanner) {
      this.defaultScanner = scanner;
    }
  }

  get(name: string): IScannerAdapter | undefined {
    return this.scanners.get(name);
  }

  getDefault(): IScannerAdapter {
    if (!this.defaultScanner) {
      throw new Error('No default scanner registered');
    }
    return this.defaultScanner;
  }

  getAll(): IScannerAdapter[] {
    return Array.from(this.scanners.values());
  }

  getSupportedExtensions(): string[] {
    const extensions = new Set<string>();
    for (const scanner of this.scanners.values()) {
      scanner.supportedExtensions.forEach((ext) => extensions.add(ext));
    }
    return Array.from(extensions);
  }
}

// Global registry instance
export const scannerRegistry = new ScannerRegistry();
