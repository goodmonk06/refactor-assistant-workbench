/**
 * Notification adapter interface for multi-channel alerting
 *
 * Supports:
 * - Email (SMTP, SendGrid, etc.)
 * - Chat (Slack, Discord, Teams)
 * - Webhooks (generic HTTP callbacks)
 * - In-app notifications
 * - SMS (Twilio, etc.)
 */
export interface INotificationAdapter {
  /**
   * Adapter name (e.g., "slack", "email", "webhook")
   */
  readonly name: string;

  /**
   * Send a notification
   */
  send(notification: Notification): Promise<NotificationResult>;

  /**
   * Optional: Verify the adapter configuration is valid
   */
  verify?(): Promise<boolean>;
}

export interface Notification {
  /**
   * Notification title/subject
   */
  title: string;

  /**
   * Notification body/message (supports markdown)
   */
  message: string;

  /**
   * Severity level
   */
  level: 'info' | 'success' | 'warning' | 'error';

  /**
   * Recipients (format varies by adapter)
   * - Email: ["user@example.com"]
   * - Slack: ["#channel", "@user"]
   * - Webhook: URLs
   */
  recipients?: string[];

  /**
   * Additional metadata
   */
  metadata?: Record<string, unknown>;

  /**
   * Links or actions to include
   */
  actions?: {
    label: string;
    url: string;
  }[];
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  sentAt: Date;
}

/**
 * Notification manager for routing notifications to multiple adapters
 */
export class NotificationManager {
  private adapters: Map<string, INotificationAdapter> = new Map();

  register(adapter: INotificationAdapter): void {
    this.adapters.set(adapter.name, adapter);
  }

  get(name: string): INotificationAdapter | undefined {
    return this.adapters.get(name);
  }

  getAll(): INotificationAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Send notification via a specific adapter
   */
  async send(adapterName: string, notification: Notification): Promise<NotificationResult> {
    const adapter = this.adapters.get(adapterName);
    if (!adapter) {
      throw new Error(`Notification adapter '${adapterName}' not found`);
    }
    return adapter.send(notification);
  }

  /**
   * Broadcast notification to all registered adapters
   */
  async broadcast(notification: Notification): Promise<NotificationResult[]> {
    const results = await Promise.all(
      Array.from(this.adapters.values()).map((adapter) => adapter.send(notification))
    );
    return results;
  }

  /**
   * Send notification to specific adapters
   */
  async sendMultiple(
    adapterNames: string[],
    notification: Notification
  ): Promise<NotificationResult[]> {
    const results = await Promise.all(
      adapterNames.map((name) => this.send(name, notification))
    );
    return results;
  }
}

// Global notification manager instance
export const notificationManager = new NotificationManager();
