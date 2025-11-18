/**
 * Domain events for the refactor assistant workbench
 *
 * Events enable loose coupling between components and make it easy to:
 * - Send notifications when important things happen
 * - Track activity for audit logs
 * - Trigger integrations/webhooks
 * - Implement eventual consistency patterns
 */

export type DomainEventType =
  // Codebase events
  | 'codebase.created'
  | 'codebase.updated'
  | 'codebase.deleted'
  // Scan events
  | 'scan.started'
  | 'scan.progress'
  | 'scan.completed'
  | 'scan.failed'
  // Plan events
  | 'plan.created'
  | 'plan.updated'
  | 'plan.generated'
  | 'plan.status_changed'
  // Task events
  | 'task.created'
  | 'task.updated'
  | 'task.status_changed'
  | 'task.assigned'
  | 'task.commented'
  // Schedule events
  | 'schedule.created'
  | 'schedule.triggered'
  // Template events
  | 'template.created'
  | 'template.used';

export interface DomainEvent<T = unknown> {
  id: string;
  type: DomainEventType;
  timestamp: Date;
  data: T;
  metadata?: {
    actorId?: string;
    actorName?: string;
    actorType?: 'user' | 'system' | 'api';
    correlationId?: string;
    [key: string]: unknown;
  };
}

// ============================================================================
// SPECIFIC EVENT TYPES
// ============================================================================

export interface CodebaseCreatedEvent extends DomainEvent<{
  codebaseId: string;
  name: string;
  repoPath?: string;
}> {
  type: 'codebase.created';
}

export interface ScanCompletedEvent extends DomainEvent<{
  scanId: string;
  codebaseId: string;
  status: 'completed' | 'failed';
  summary?: {
    totalFiles: number;
    totalLines: number;
    averageComplexity: number;
  };
  duration?: number;
  error?: string;
}> {
  type: 'scan.completed';
}

export interface PlanGeneratedEvent extends DomainEvent<{
  planId: string;
  codebaseId: string;
  title: string;
  taskCount: number;
  goal?: string;
}> {
  type: 'plan.generated';
}

export interface TaskStatusChangedEvent extends DomainEvent<{
  taskId: string;
  planId: string;
  oldStatus: string;
  newStatus: string;
  title: string;
}> {
  type: 'task.status_changed';
}

export interface TaskCommentedEvent extends DomainEvent<{
  commentId: string;
  taskId: string;
  planId: string;
  authorName: string;
  content: string;
  mentions: string[];
}> {
  type: 'task.commented';
}

// ============================================================================
// EVENT HANDLER
// ============================================================================

export type EventHandler<T = unknown> = (event: DomainEvent<T>) => void | Promise<void>;

/**
 * Event bus for publishing and subscribing to domain events
 */
export class EventBus {
  private handlers: Map<DomainEventType, Set<EventHandler>> = new Map();
  private wildcardHandlers: Set<EventHandler> = new Set();

  /**
   * Subscribe to a specific event type
   */
  on(eventType: DomainEventType, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  /**
   * Subscribe to all events
   */
  onAny(handler: EventHandler): () => void {
    this.wildcardHandlers.add(handler);
    return () => {
      this.wildcardHandlers.delete(handler);
    };
  }

  /**
   * Publish an event
   */
  async publish<T>(event: DomainEvent<T>): Promise<void> {
    const handlers = this.handlers.get(event.type) || new Set();
    const allHandlers = [...Array.from(handlers), ...Array.from(this.wildcardHandlers)];

    // Execute all handlers (don't wait for them to complete to avoid blocking)
    const promises = allHandlers.map((handler) =>
      Promise.resolve(handler(event)).catch((error) => {
        console.error(`Error in event handler for ${event.type}:`, error);
      })
    );

    await Promise.all(promises);
  }

  /**
   * Remove all handlers for an event type
   */
  removeAllListeners(eventType?: DomainEventType): void {
    if (eventType) {
      this.handlers.delete(eventType);
    } else {
      this.handlers.clear();
      this.wildcardHandlers.clear();
    }
  }

  /**
   * Get count of handlers for an event type
   */
  listenerCount(eventType?: DomainEventType): number {
    if (eventType) {
      return (this.handlers.get(eventType)?.size || 0) + this.wildcardHandlers.size;
    }
    let total = this.wildcardHandlers.size;
    for (const handlers of this.handlers.values()) {
      total += handlers.size;
    }
    return total;
  }
}

// Global event bus instance
export const eventBus = new EventBus();

// ============================================================================
// EVENT FACTORY HELPERS
// ============================================================================

export function createEvent<T>(type: DomainEventType, data: T, metadata?: DomainEvent['metadata']): DomainEvent<T> {
  return {
    id: generateEventId(),
    type,
    timestamp: new Date(),
    data,
    metadata,
  };
}

function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
