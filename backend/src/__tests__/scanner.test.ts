import { describe, it, expect, beforeEach } from 'vitest';
import { CodebaseScanner } from '../scanner/scanner';

describe('CodebaseScanner', () => {
  let scanner: CodebaseScanner;

  beforeEach(() => {
    scanner = new CodebaseScanner();
  });

  describe('isCodeFile', () => {
    it('should identify JavaScript files', () => {
      // @ts-expect-error - testing private method
      expect(scanner.isCodeFile('index.js')).toBe(true);
      // @ts-expect-error - testing private method
      expect(scanner.isCodeFile('component.jsx')).toBe(true);
    });

    it('should identify TypeScript files', () => {
      // @ts-expect-error - testing private method
      expect(scanner.isCodeFile('index.ts')).toBe(true);
      // @ts-expect-error - testing private method
      expect(scanner.isCodeFile('component.tsx')).toBe(true);
    });

    it('should identify Python files', () => {
      // @ts-expect-error - testing private method
      expect(scanner.isCodeFile('main.py')).toBe(true);
    });

    it('should reject non-code files', () => {
      // @ts-expect-error - testing private method
      expect(scanner.isCodeFile('README.md')).toBe(false);
      // @ts-expect-error - testing private method
      expect(scanner.isCodeFile('data.json')).toBe(false);
      // @ts-expect-error - testing private method
      expect(scanner.isCodeFile('styles.css')).toBe(false);
      // @ts-expect-error - testing private method
      expect(scanner.isCodeFile('image.png')).toBe(false);
    });
  });

  describe('generateSummary', () => {
    it('should generate correct summary for empty metrics', () => {
      // @ts-expect-error - testing private method
      const summary = scanner.generateSummary([], '/test/path');

      expect(summary.totalFiles).toBe(0);
      expect(summary.totalLines).toBe(0);
      expect(summary.averageComplexity).toBe(0);
      expect(summary.hotspots).toHaveLength(0);
      expect(summary.languages).toEqual({});
    });

    it('should calculate correct totals', () => {
      const metrics = [
        {
          path: '/test/file1.ts',
          size: 1000,
          lines: 100,
          complexity: 10,
          imports: ['a', 'b'],
          exports: ['x'],
          language: 'typescript',
        },
        {
          path: '/test/file2.ts',
          size: 2000,
          lines: 200,
          complexity: 20,
          imports: ['c'],
          exports: ['y', 'z'],
          language: 'typescript',
        },
      ];

      // @ts-expect-error - testing private method
      const summary = scanner.generateSummary(metrics, '/test');

      expect(summary.totalFiles).toBe(2);
      expect(summary.totalLines).toBe(300);
      expect(summary.averageComplexity).toBe(15);
      expect(summary.languages).toEqual({ typescript: 2 });
    });

    it('should identify hotspots based on complexity', () => {
      const metrics = [
        {
          path: '/test/simple.ts',
          size: 100,
          lines: 50,
          complexity: 5,
          imports: [],
          exports: [],
          language: 'typescript',
        },
        {
          path: '/test/complex.ts',
          size: 2000,
          lines: 300,
          complexity: 50,
          imports: [],
          exports: [],
          language: 'typescript',
        },
      ];

      // @ts-expect-error - testing private method
      const summary = scanner.generateSummary(metrics, '/test');

      expect(summary.hotspots).toHaveLength(1);
      expect(summary.hotspots[0].path).toBe('/test/complex.ts');
      expect(summary.hotspots[0].complexity).toBe(50);
    });

    it('should identify hotspots based on file size', () => {
      const metrics = [
        {
          path: '/test/small.ts',
          size: 100,
          lines: 50,
          complexity: 5,
          imports: [],
          exports: [],
          language: 'typescript',
        },
        {
          path: '/test/large.ts',
          size: 10000,
          lines: 600,
          complexity: 10,
          imports: [],
          exports: [],
          language: 'typescript',
        },
      ];

      // @ts-expect-error - testing private method
      const summary = scanner.generateSummary(metrics, '/test');

      expect(summary.hotspots).toHaveLength(1);
      expect(summary.hotspots[0].path).toBe('/test/large.ts');
      expect(summary.hotspots[0].lines).toBe(600);
    });

    it('should build dependency graph', () => {
      const metrics = [
        {
          path: '/test/src/a.ts',
          size: 100,
          lines: 50,
          complexity: 5,
          imports: ['./b', './c'],
          exports: [],
          language: 'typescript',
        },
        {
          path: '/test/src/b.ts',
          size: 100,
          lines: 50,
          complexity: 5,
          imports: ['./c'],
          exports: [],
          language: 'typescript',
        },
      ];

      // @ts-expect-error - testing private method
      const summary = scanner.generateSummary(metrics, '/test');

      expect(summary.dependencyGraph['src/a.ts']).toEqual(['./b', './c']);
      expect(summary.dependencyGraph['src/b.ts']).toEqual(['./c']);
    });

    it('should count files by language', () => {
      const metrics = [
        {
          path: '/test/file1.ts',
          size: 100,
          lines: 50,
          complexity: 5,
          imports: [],
          exports: [],
          language: 'typescript',
        },
        {
          path: '/test/file2.ts',
          size: 100,
          lines: 50,
          complexity: 5,
          imports: [],
          exports: [],
          language: 'typescript',
        },
        {
          path: '/test/file3.py',
          size: 100,
          lines: 50,
          complexity: 5,
          imports: [],
          exports: [],
          language: 'python',
        },
      ];

      // @ts-expect-error - testing private method
      const summary = scanner.generateSummary(metrics, '/test');

      expect(summary.languages).toEqual({
        typescript: 2,
        python: 1,
      });
    });
  });
});
