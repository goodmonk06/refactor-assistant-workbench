export interface FileMetrics {
  path: string;
  size: number;
  lines: number;
  complexity: number;
  imports: string[];
  exports: string[];
  language: string;
}

export interface ScanSummary {
  totalFiles: number;
  totalLines: number;
  averageComplexity: number;
  hotspots: FileMetrics[];
  languages: Record<string, number>;
  dependencyGraph: Record<string, string[]>;
}

export interface ScanProgress {
  scannedFiles: number;
  totalFiles: number;
  currentFile?: string;
}
