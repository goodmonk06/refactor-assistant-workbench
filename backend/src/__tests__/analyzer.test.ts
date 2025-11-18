import { describe, it, expect } from 'vitest';
import { CodeAnalyzer } from '../scanner/analyzer';

describe('CodeAnalyzer', () => {
  const analyzer = new CodeAnalyzer();

  describe('calculateComplexity', () => {
    it('should return base complexity of 1 for simple code', () => {
      const code = `
        function hello() {
          return "world";
        }
      `;
      // @ts-expect-error - testing private method
      const complexity = analyzer.calculateComplexity(code, 'javascript');
      expect(complexity).toBe(1);
    });

    it('should count if statements', () => {
      const code = `
        function check(x) {
          if (x > 0) {
            return true;
          }
          if (x < 0) {
            return false;
          }
          return null;
        }
      `;
      // @ts-expect-error - testing private method
      const complexity = analyzer.calculateComplexity(code, 'javascript');
      expect(complexity).toBeGreaterThanOrEqual(3); // 1 base + 2 if statements
    });

    it('should count loops and logical operators', () => {
      const code = `
        function process(items) {
          for (let i = 0; i < items.length; i++) {
            if (items[i] && items[i].valid) {
              while (items[i].pending) {
                // process
              }
            }
          }
        }
      `;
      // @ts-expect-error - testing private method
      const complexity = analyzer.calculateComplexity(code, 'javascript');
      expect(complexity).toBeGreaterThanOrEqual(5); // 1 + for + if + && + while
    });
  });

  describe('extractImports', () => {
    it('should extract ES6 imports from JavaScript', () => {
      const code = `
        import { foo } from './foo';
        import bar from './bar';
        import * as baz from './baz';
      `;
      // @ts-expect-error - testing private method
      const imports = analyzer.extractImports(code, 'javascript');
      expect(imports).toContain('./foo');
      expect(imports).toContain('./bar');
      expect(imports).toContain('./baz');
      expect(imports).toHaveLength(3);
    });

    it('should extract require statements', () => {
      const code = `
        const fs = require('fs');
        const path = require('path');
      `;
      // @ts-expect-error - testing private method
      const imports = analyzer.extractImports(code, 'javascript');
      expect(imports).toContain('fs');
      expect(imports).toContain('path');
    });

    it('should extract Python imports', () => {
      const code = `
import os
import sys
from pathlib import Path
      `;
      // @ts-expect-error - testing private method
      const imports = analyzer.extractImports(code, 'python');
      expect(imports).toContain('os');
      expect(imports).toContain('sys');
      expect(imports).toContain('pathlib');
    });

    it('should extract Java imports', () => {
      const code = `
import java.util.List;
import java.util.ArrayList;
import com.example.MyClass;
      `;
      // @ts-expect-error - testing private method
      const imports = analyzer.extractImports(code, 'java');
      expect(imports).toContain('java.util.List');
      expect(imports).toContain('java.util.ArrayList');
      expect(imports).toContain('com.example.MyClass');
    });
  });

  describe('extractExports', () => {
    it('should extract JavaScript/TypeScript exports', () => {
      const code = `
        export function myFunction() {}
        export const myConst = 42;
        export class MyClass {}
        export default function defaultFunc() {}
      `;
      // @ts-expect-error - testing private method
      const exports = analyzer.extractExports(code, 'javascript');
      expect(exports).toContain('myFunction');
      expect(exports).toContain('myConst');
      expect(exports).toContain('MyClass');
      expect(exports).toContain('defaultFunc');
    });

    it('should extract Python class and function definitions', () => {
      const code = `
def my_function():
    pass

class MyClass:
    def method(self):
        pass
      `;
      // @ts-expect-error - testing private method
      const exports = analyzer.extractExports(code, 'python');
      expect(exports).toContain('my_function');
      expect(exports).toContain('MyClass');
    });

    it('should extract Java public classes', () => {
      const code = `
public class MyClass {
    public void method() {}
}

public interface MyInterface {
}
      `;
      // @ts-expect-error - testing private method
      const exports = analyzer.extractExports(code, 'java');
      expect(exports).toContain('MyClass');
      expect(exports).toContain('MyInterface');
    });
  });

  describe('detectLanguage', () => {
    it('should detect JavaScript files', () => {
      // @ts-expect-error - testing private method
      expect(analyzer.detectLanguage('file.js')).toBe('javascript');
      // @ts-expect-error - testing private method
      expect(analyzer.detectLanguage('file.jsx')).toBe('javascript');
    });

    it('should detect TypeScript files', () => {
      // @ts-expect-error - testing private method
      expect(analyzer.detectLanguage('file.ts')).toBe('typescript');
      // @ts-expect-error - testing private method
      expect(analyzer.detectLanguage('file.tsx')).toBe('typescript');
    });

    it('should detect Python files', () => {
      // @ts-expect-error - testing private method
      expect(analyzer.detectLanguage('file.py')).toBe('python');
    });

    it('should detect other languages', () => {
      // @ts-expect-error - testing private method
      expect(analyzer.detectLanguage('file.java')).toBe('java');
      // @ts-expect-error - testing private method
      expect(analyzer.detectLanguage('file.go')).toBe('go');
      // @ts-expect-error - testing private method
      expect(analyzer.detectLanguage('file.rs')).toBe('rust');
    });

    it('should return null for unknown extensions', () => {
      // @ts-expect-error - testing private method
      expect(analyzer.detectLanguage('file.txt')).toBeNull();
      // @ts-expect-error - testing private method
      expect(analyzer.detectLanguage('file.md')).toBeNull();
    });
  });
});
