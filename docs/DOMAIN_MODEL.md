# Domain Model Documentation

## Overview

The Refactor Assistant Workbench domain model captures the concepts and workflows involved in large-scale code refactoring. The model is designed to support both individual developers and enterprise teams in planning, tracking, and executing complex refactoring efforts.

## Core Concepts

### Codebase

**Purpose**: Represents a software project or repository that can be analyzed and refactored.

**Key Attributes**:
- `name`: Human-readable identifier
- `repoPath`: Local file system path for scanning
- `githubUrl`: Optional link to remote repository
- `mainLanguage`: Primary programming language
- `description`: Project description

**Relationships**:
- Has many `ScanRuns` (historical analysis results)
- Has many `RefactorPlans` (refactoring strategies)
- Has one `CodebaseMetadata` (organizational context)
- Has many `ScanSchedules` (automated scanning)

**Lifecycle**:
```
Created → Scanned → Plans Created → Refactored → Rescanned → ...
```

**Use Cases**:
- "Add our main e-commerce app for analysis"
- "Track refactoring progress for the legacy monolith"
- "Compare code quality over time"

### CodebaseMetadata

**Purpose**: Organizational and technical context for a codebase.

**Key Attributes**:
- `tags`: Classification labels (e.g., "production", "legacy", "critical")
- `team`: Owning team name
- `costCenter`: For enterprise budget tracking
- `slaLevel`: Service level agreement (critical, high, medium, low)
- `estimatedSize`: Approximate lines of code
- `techStack`: Technologies used
- `customFields`: Flexible JSON for organization-specific needs

**Why Separate Table**:
- Keeps core Codebase model simple
- Allows optional metadata without null fields
- Easy to add organization-specific fields

**Use Cases**:
- "Show all critical SLA codebases"
- "Find codebases owned by Platform team"
- "Track refactoring by cost center"

### ScanRun

**Purpose**: A single execution of codebase analysis, capturing metrics at a point in time.

**Key Attributes**:
- `status`: "pending" | "running" | "completed" | "failed" | "cancelled"
- `startedAt`, `finishedAt`: Timing information
- `summaryJson`: Detailed metrics and findings
- `scanType`: "full" | "incremental" | "targeted"
- `filesScanned`: Count of files analyzed
- `duration`: Time taken in milliseconds
- `triggeredBy`: "manual" | "schedule" | "webhook" | "cli"

**Summary JSON Structure**:
```typescript
{
  totalFiles: number;
  totalLines: number;
  averageComplexity: number;
  languages: Record<string, number>;  // language → file count
  hotspots: FileMetrics[];            // Complex or large files
  dependencyGraph: Record<string, string[]>;  // file → imports
}
```

**Relationships**:
- Belongs to `Codebase`
- Optionally belongs to `ScanSchedule` (if auto-triggered)

**Lifecycle**:
```
Created (pending) → Running → Completed/Failed → Archived (future)
```

**Use Cases**:
- "Show me complexity trends over the last 6 months"
- "Which files are getting more complex?"
- "Did our refactoring reduce complexity?"

### ScanSchedule

**Purpose**: Automated, recurring scans for continuous code quality monitoring.

**Key Attributes**:
- `name`, `description`: Schedule identification
- `cronExpression`: When to run (e.g., "0 2 * * *" for 2 AM daily)
- `timezone`: For interpreting cron expression
- `enabled`: Can pause without deleting
- `scanType`, `scanConfig`: What to scan and how
- `lastRunAt`, `nextRunAt`: Execution tracking
- `runCount`: Total times executed

**Relationships**:
- Belongs to `Codebase`
- Has many `ScanRuns` (triggered executions)

**Use Cases**:
- "Scan our production app every night at 2 AM"
- "Monitor legacy codebase weekly for degradation"
- "Alert if complexity increases more than 10%"

### RefactorPlan

**Purpose**: A structured strategy for refactoring, containing goals, approach, and tasks.

**Key Attributes**:
- `title`: Plan name
- `descriptionMarkdown`: Detailed strategy and approach
- `goal`: Original objective or prompt
- `status`: "draft" | "active" | "completed" | "archived"
- `priority`: Relative importance (higher = more important)
- `estimatedEffort`, `actualEffort`: Tracking in person-hours
- `templateId`: If created from template

**Relationships**:
- Belongs to `Codebase`
- Optionally based on `PlanTemplate`
- Has many `RefactorTasks`

**Lifecycle**:
```
Draft → Active → In Progress → Completed → Archived
         ↓
     (Tasks created, assigned, completed)
```

**Use Cases**:
- "Generate a plan to extract microservices"
- "Track progress on payment system refactoring"
- "Estimate remaining effort for TypeScript migration"

### PlanTemplate

**Purpose**: Reusable refactoring patterns to accelerate planning.

**Key Attributes**:
- `name`, `description`: Template identification
- `category`: "architecture" | "performance" | "testing" | "migration"
- `titleTemplate`, `descriptionTemplate`, `goalTemplate`: With variable placeholders
- `taskTemplates`: Array of task templates
- `tags`: Classification and search
- `usageCount`: Popularity tracking
- `isPublic`: Visibility control

**Template Variables**:
Templates support variable substitution with `{{variableName}}` syntax:
- `{{codebaseName}}`: Replaced with actual codebase name
- Custom variables provided when creating plan from template

**Relationships**:
- Has many `RefactorPlans` (created from this template)

**Built-in Templates**:
1. **Extract Service Layer**: Move business logic from controllers
2. **TypeScript Migration**: Progressive JS→TS conversion
3. **Performance Optimization**: Systematic performance improvements
4. **Microservices Extraction**: Break apart monolith
5. **Test Coverage Sprint**: Increase test coverage

**Use Cases**:
- "Create a service extraction plan for my app"
- "What are popular refactoring patterns?"
- "Save our modernization approach as a template"

### RefactorTask

**Purpose**: A single actionable work item within a refactoring plan.

**Key Attributes**:
- `title`, `descriptionMarkdown`: Task details
- `areaPath`: Code location (e.g., "src/services/payment")
- `status`: "todo" | "in_progress" | "done" | "blocked"
- `priority`: 0-5 (5 = highest)
- `orderIndex`: Display order
- `assignedTo`: Responsible person/team
- `estimatedHours`, `actualHours`: Effort tracking
- `blockedReason`: Why task is blocked
- `startedAt`, `completedAt`, `dueDate`: Timeline

**Relationships**:
- Belongs to `RefactorPlan`
- Has many `TaskComments` (discussions)

**Status Transitions**:
```
todo → in_progress → done
  ↓          ↓
blocked ←────┘
  ↓
todo (when unblocked)
```

**Use Cases**:
- "Assign task to Alice"
- "Mark task as blocked pending code review"
- "Show all overdue tasks"
- "Calculate total actual vs. estimated hours"

### TaskComment

**Purpose**: Threaded discussions on tasks for team collaboration.

**Key Attributes**:
- `content`: Comment text (markdown supported)
- `authorName`, `authorEmail`: Who wrote it
- `parentId`: For threaded replies
- `mentions`: Array of mentioned user identifiers
- `reactions`: JSON map of emoji → count
- `deletedAt`: Soft delete timestamp

**Relationships**:
- Belongs to `RefactorTask`
- Optionally has parent `TaskComment` (threading)
- Has many child `TaskComments` (replies)

**Thread Structure**:
```
Comment 1 (top-level)
├── Reply 1.1
├── Reply 1.2
│   └── Reply 1.2.1
└── Reply 1.3

Comment 2 (top-level)
└── Reply 2.1
```

**Use Cases**:
- "Ask question about implementation approach"
- "Reply to teammate's concern"
- "@mention someone for review"
- "React with 👍 to show agreement"

### ActivityLog

**Purpose**: Comprehensive audit trail of all system changes.

**Key Attributes**:
- `eventType`: "codebase.created", "scan.completed", "task.status_changed", etc.
- `entityType`, `entityId`: What was affected
- `action`: "created" | "updated" | "deleted" | "status_changed"
- `actorType`, `actorId`, `actorName`: Who did it
- `changes`: Before/after for updates (JSON)
- `metadata`: Additional context
- `timestamp`: When it happened

**Relationships**:
- Optionally references `Codebase`, `ScanRun`, `RefactorPlan`, `RefactorTask`

**Use Cases**:
- "Show me who changed this plan"
- "Audit trail for compliance"
- "When did this task status change?"
- "Activity feed for a codebase"

### Integration

**Purpose**: Configuration for external system integrations and webhooks.

**Key Attributes**:
- `name`: Integration identifier
- `type`: "webhook" | "slack" | "email" | "github" | "jira"
- `enabled`: Can disable without deleting
- `config`: Type-specific configuration (JSON)
- `events`: Which events to listen for
- `retryCount`, `timeout`: Delivery settings
- `lastTriggeredAt`, `lastSuccess`, `lastError`: Status tracking
- `failureCount`: For circuit breaking

**Configuration Examples**:
```typescript
// Slack
{
  webhookUrl: "https://hooks.slack.com/...",
  channel: "#refactoring-updates"
}

// Webhook
{
  url: "https://api.example.com/webhook",
  secret: "webhook-secret-key",
  headers: { "X-Custom": "value" }
}

// Email
{
  smtpHost: "smtp.gmail.com",
  from: "refactoring@company.com",
  to: ["team@company.com"]
}
```

**Use Cases**:
- "Notify Slack when scans complete"
- "Send webhook to Jira when plan is created"
- "Email team when critical tasks are overdue"

## Entity Relationships Diagram

```
┌──────────────┐
│   Codebase   │
└──────┬───────┘
       │ 1
       │
       │ *
┌──────┴────────┐         ┌──────────────────┐
│    ScanRun    │◄────────│  ScanSchedule    │
└───────────────┘   0..1  └──────────────────┘
       │
       │
       │ *
┌──────┴────────────┐      ┌──────────────────┐
│  RefactorPlan     │◄─────│  PlanTemplate    │
└──────┬────────────┘ 0..1 └──────────────────┘
       │ 1
       │
       │ *
┌──────┴───────────┐
│  RefactorTask    │
└──────┬───────────┘
       │ 1
       │
       │ *
┌──────┴──────────┐
│  TaskComment    │ (self-referential for threading)
└─────────────────┘

┌──────────────────────┐
│  CodebaseMetadata    │ (1:1 with Codebase)
└──────────────────────┘

┌──────────────────────┐
│    ActivityLog       │ (relates to all entities)
└──────────────────────┘

┌──────────────────────┐
│    Integration       │ (standalone configuration)
└──────────────────────┘
```

## Workflows

### Workflow 1: Initial Setup & First Scan

```
1. User creates Codebase
   ├→ CodebaseMetadata created
   └→ ActivityLog: codebase.created

2. User triggers Scan
   ├→ ScanRun created (status: running)
   ├→ ActivityLog: scan.started
   ├→ Scanner analyzes files
   ├→ ScanRun updated (status: completed, summaryJson)
   ├→ ActivityLog: scan.completed
   └→ Event: scan.completed
       ├→ Notifications sent
       └→ Integrations triggered

3. User views results
   └→ Identifies hotspots, metrics
```

### Workflow 2: Generate Plan from Template

```
1. User browses PlanTemplates
   └→ Filters by category, tags

2. User selects template
   ├→ Optionally provides variable values
   └→ Clicks "Create from Template"

3. System creates Plan
   ├→ Substitutes {{variables}} in template
   ├→ RefactorPlan created
   ├→ RefactorTasks created (from task templates)
   ├→ Template.usageCount incremented
   ├→ ActivityLog: plan.created, template.used
   └→ Event: plan.created
       └→ Notifications sent

4. User views Plan
   └→ Kanban board with tasks
```

### Workflow 3: Task Collaboration

```
1. User selects task
   └→ Views details, comments

2. User adds comment
   ├→ TaskComment created
   ├→ Mentions parsed (@username)
   ├→ ActivityLog: task.commented
   └→ Event: task.commented
       └→ Mentioned users notified

3. Teammate replies
   ├→ TaskComment created (parentId set)
   └→ Thread structure built

4. User updates task status
   ├→ RefactorTask updated
   ├→ ActivityLog: task.status_changed
   └→ Event: task.status_changed
       ├→ Metrics updated
       └→ Assignee notified
```

### Workflow 4: Automated Scanning

```
1. ScanSchedule created
   ├→ cronExpression: "0 2 * * *"
   └→ nextRunAt calculated

2. Scheduler daemon runs
   ├→ Checks for due schedules
   └→ Finds schedule where nextRunAt < now

3. Scan triggered automatically
   ├→ ScanRun created (triggeredBy: "schedule")
   ├→ Analysis runs
   ├→ ScanRun completed
   ├→ ScanSchedule updated
   │   ├→ lastRunAt = now
   │   ├→ nextRunAt = now + cron interval
   │   └→ runCount++
   └→ Event: scan.completed (scheduled: true)
       └→ If metrics degraded → alert
```

## Design Patterns

### 1. Template Pattern (Plan Templates)

**Problem**: Teams repeat similar refactoring patterns
**Solution**: PlanTemplate with variable substitution
**Benefits**: Consistency, speed, knowledge sharing

### 2. Event Sourcing Lite (Activity Log)

**Problem**: Need audit trail and event history
**Solution**: ActivityLog captures all mutations
**Benefits**: Compliance, debugging, analytics

### 3. Adapter Pattern (Pluggable Components)

**Problem**: Want to support multiple scanners, LLMs, notifiers
**Solution**: Interface-based adapters with registries
**Benefits**: Extensibility without core changes

### 4. Soft Delete (Comments)

**Problem**: Want to hide deleted comments but preserve thread structure
**Solution**: `deletedAt` timestamp instead of hard delete
**Benefits**: Maintain referential integrity, allow undelete

### 5. JSON for Flexibility (Metadata, Config)

**Problem**: Organizations have different metadata needs
**Solution**: `customFields` JSON column
**Benefits**: No schema changes for custom fields

## Constraints & Business Rules

### Codebase

- Must have either `repoPath` OR `githubUrl` (or both)
- `name` must be unique per organization (future multi-tenancy)
- Cannot delete if has active plans (status = "active")

### ScanRun

- Cannot manually change status from "running" to "completed"
- `finishedAt` must be after `startedAt`
- Only one "running" scan per codebase at a time

### RefactorPlan

- Cannot have tasks from multiple codebases
- `actualEffort` must be ≤ sum of task actual hours
- Cannot delete template if plans exist (set to null instead)

### RefactorTask

- `completedAt` required when status = "done"
- `blockedReason` required when status = "blocked"
- Cannot have both `parentId` and be a different task type

### TaskComment

- Cannot reply to deleted comment
- Soft delete: set `deletedAt`, don't hard delete
- Mentions must be valid user identifiers (future: validate)

### Integration

- Webhook URL must be HTTPS in production
- Events must be valid event types
- Disabled integrations don't execute but preserve config

## Future Extensions

### Multi-Tenancy

```typescript
model Organization {
  id: string;
  name: string;
  codebases: Codebase[];
  users: User[];
}

model User {
  id: string;
  email: string;
  organizationId: string;
  role: "admin" | "editor" | "viewer";
}
```

### Advanced Scheduling

```typescript
model ScanSchedule {
  // Add conditional triggers
  triggerConditions?: Json;  // e.g., "only if >100 files changed"
  skipIfRecent?: number;      // Skip if last scan within N hours
}
```

### Task Dependencies

```typescript
model RefactorTask {
  dependsOn: string[];  // Array of task IDs
  blocksIds: string[];  // Reverse relationship
}
```

### Cost Tracking

```typescript
model CostEstimate {
  planId: string;
  category: string;  // "development", "testing", "deployment"
  estimatedCost: number;
  actualCost?: number;
  currency: string;
}
```

This domain model is designed to grow with your needs while maintaining a clean, understandable core.
