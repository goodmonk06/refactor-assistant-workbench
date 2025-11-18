import { describe, it, expect } from 'vitest';
import { Codebase, RefactorPlan, RefactorTask } from '@/lib/api';

describe('API Type Definitions', () => {
  describe('Codebase', () => {
    it('should have correct structure', () => {
      const codebase: Codebase = {
        id: 'test-id',
        name: 'Test Codebase',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(codebase.id).toBeDefined();
      expect(codebase.name).toBeDefined();
      expect(codebase.createdAt).toBeDefined();
      expect(codebase.updatedAt).toBeDefined();
    });

    it('should allow optional fields', () => {
      const codebase: Codebase = {
        id: 'test-id',
        name: 'Test Codebase',
        repoPath: '/path/to/repo',
        githubUrl: 'https://github.com/test/repo',
        mainLanguage: 'typescript',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _count: {
          scanRuns: 5,
          refactorPlans: 3,
        },
      };

      expect(codebase.repoPath).toBe('/path/to/repo');
      expect(codebase.githubUrl).toBe('https://github.com/test/repo');
      expect(codebase.mainLanguage).toBe('typescript');
      expect(codebase._count?.scanRuns).toBe(5);
    });
  });

  describe('RefactorPlan', () => {
    it('should have correct structure', () => {
      const plan: RefactorPlan = {
        id: 'plan-id',
        codebaseId: 'codebase-id',
        title: 'Refactor Plan',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(plan.id).toBeDefined();
      expect(plan.codebaseId).toBeDefined();
      expect(plan.title).toBeDefined();
    });

    it('should allow optional fields', () => {
      const plan: RefactorPlan = {
        id: 'plan-id',
        codebaseId: 'codebase-id',
        title: 'Refactor Plan',
        descriptionMarkdown: '# Description',
        goal: 'Improve modularity',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tasks: [],
        _count: {
          tasks: 10,
        },
      };

      expect(plan.descriptionMarkdown).toBe('# Description');
      expect(plan.goal).toBe('Improve modularity');
      expect(plan.tasks).toEqual([]);
    });
  });

  describe('RefactorTask', () => {
    it('should have correct structure', () => {
      const task: RefactorTask = {
        id: 'task-id',
        planId: 'plan-id',
        title: 'Task Title',
        status: 'todo',
        priority: 3,
        orderIndex: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(task.id).toBeDefined();
      expect(task.planId).toBeDefined();
      expect(task.title).toBeDefined();
      expect(task.status).toBe('todo');
    });

    it('should enforce status enum', () => {
      const task1: RefactorTask = {
        id: 'task-id',
        planId: 'plan-id',
        title: 'Task',
        status: 'todo',
        priority: 1,
        orderIndex: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const task2: RefactorTask = {
        ...task1,
        status: 'in_progress',
      };

      const task3: RefactorTask = {
        ...task1,
        status: 'done',
      };

      expect(task1.status).toBe('todo');
      expect(task2.status).toBe('in_progress');
      expect(task3.status).toBe('done');
    });
  });
});
