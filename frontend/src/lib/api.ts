import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface Codebase {
  id: string;
  name: string;
  repoPath?: string;
  githubUrl?: string;
  mainLanguage?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    scanRuns: number;
    refactorPlans: number;
  };
}

export interface ScanRun {
  id: string;
  codebaseId: string;
  startedAt: string;
  finishedAt?: string;
  status: string;
  summaryJson?: any;
  errorMessage?: string;
}

export interface RefactorPlan {
  id: string;
  codebaseId: string;
  title: string;
  descriptionMarkdown?: string;
  goal?: string;
  createdAt: string;
  updatedAt: string;
  tasks?: RefactorTask[];
  codebase?: Codebase;
  _count?: {
    tasks: number;
  };
}

export interface RefactorTask {
  id: string;
  planId: string;
  title: string;
  descriptionMarkdown?: string;
  areaPath?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: number;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

// API functions
export const codebaseApi = {
  list: () => api.get<Codebase[]>('/codebases'),
  get: (id: string) => api.get<Codebase>(`/codebases/${id}`),
  create: (data: Partial<Codebase>) => api.post<Codebase>('/codebases', data),
  update: (id: string, data: Partial<Codebase>) => api.patch<Codebase>(`/codebases/${id}`, data),
  delete: (id: string) => api.delete(`/codebases/${id}`),
};

export const scanApi = {
  list: (codebaseId: string) => api.get<ScanRun[]>(`/codebases/${codebaseId}/scans`),
  get: (id: string) => api.get<ScanRun>(`/scans/${id}`),
  create: (codebaseId: string) => api.post<ScanRun>('/scans', { codebaseId }),
  delete: (id: string) => api.delete(`/scans/${id}`),
};

export const planApi = {
  list: () => api.get<RefactorPlan[]>('/plans'),
  listForCodebase: (codebaseId: string) => api.get<RefactorPlan[]>(`/codebases/${codebaseId}/plans`),
  get: (id: string) => api.get<RefactorPlan>(`/plans/${id}`),
  create: (data: Partial<RefactorPlan>) => api.post<RefactorPlan>('/plans', data),
  generate: (data: { codebaseId: string; scanId: string; goal: string }) =>
    api.post<RefactorPlan>('/plans/generate', data),
  update: (id: string, data: Partial<RefactorPlan>) => api.patch<RefactorPlan>(`/plans/${id}`, data),
  delete: (id: string) => api.delete(`/plans/${id}`),
};

export const taskApi = {
  list: (planId: string) => api.get<RefactorTask[]>(`/plans/${planId}/tasks`),
  get: (id: string) => api.get<RefactorTask>(`/tasks/${id}`),
  create: (data: Partial<RefactorTask>) => api.post<RefactorTask>('/tasks', data),
  update: (id: string, data: Partial<RefactorTask>) => api.patch<RefactorTask>(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
};
