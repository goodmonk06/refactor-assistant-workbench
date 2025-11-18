# Architecture Documentation

## System Overview

The Refactor Assistant Workbench is a full-stack application designed to help development teams plan, track, and execute large-scale code refactoring efforts. It combines codebase analysis, AI-powered planning, and collaborative task management into a cohesive platform.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Codebases │  │   Plans    │  │  Templates │            │
│  │    Pages   │  │   Kanban   │  │   Browser  │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST
┌────────────────────────┴────────────────────────────────────┐
│                    Backend API (Fastify)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  Route Handlers                       │  │
│  │  Codebases │ Scans │ Plans │ Tasks │ Templates │     │  │
│  │                  Comments │ Integrations              │  │
│  └──────────────────────┬────────────────────────────────┘  │
│  ┌──────────────────────┴────────────────────────────────┐  │
│  │              Services & Domain Logic                   │  │
│  │  Scanner │ LLM │ Notification │ Activity Logging      │  │
│  └──────────────────────┬────────────────────────────────┘  │
│  ┌──────────────────────┴────────────────────────────────┐  │
│  │             Adapter Layer (Pluggable)                  │  │
│  │  IScanner │ ILLMProvider │ INotification │ IMetrics   │  │
│  └──────────────────────┬────────────────────────────────┘  │
│  ┌──────────────────────┴────────────────────────────────┐  │
│  │                  Event Bus                             │  │
│  │  Domain Events → Listeners → Integrations/Logs        │  │
│  └──────────────────────┬────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│              Data Layer (Prisma + PostgreSQL)                │
│  Codebases │ Scans │ Plans │ Tasks │ Templates │ Comments  │
│  Metadata  │ Schedules │ ActivityLogs │ Integrations       │
└──────────────────────────────────────────────────────────────┘
```

## Components

### 1. Frontend (Next.js)

**Technology**: Next.js 14 with App Router, React 18, Tailwind CSS

**Responsibilities**:
- User interface for codebase management
- Scan results visualization
- Plan and task kanban boards
- Template browser
- Real-time updates via SWR

**Key Pages**:
- `/codebases` - List and manage codebases
- `/codebases/[id]` - Codebase details with scans and plans
- `/scans/[id]` - Scan results and metrics
- `/plans/[id]` - Kanban board for task management
- `/templates` - Browse and use plan templates

### 2. Backend API (Fastify)

**Technology**: Fastify 4, TypeScript, Node.js 20+

**Responsibilities**:
- RESTful API endpoints
- Request validation (Zod schemas)
- Business logic orchestration
- Background job coordination (scanning)
- Authentication/authorization (future)

**Layer Structure**:
```
src/
├── routes/          # HTTP route handlers
├── services/        # Business logic services
├── lib/
│   ├── adapters/    # Pluggable adapters
│   ├── events/      # Domain event system
│   ├── logger.ts    # Structured logging
│   └── metrics.ts   # (future) Metrics collection
├── scanner/         # Code analysis engine
└── types/           # Shared TypeScript types
```

### 3. Scanner Engine

**Responsibility**: Analyze codebases and extract metrics

**Architecture**: Adapter pattern for pluggability

```typescript
interface IScannerAdapter {
  name: string;
  supportedExtensions: string[];
  analyzeFile(path: string, content: string): Promise<FileMetrics>;
  analyzeCodebase?(path: string): Promise<ScanSummary>;
}
```

**Current Implementations**:
- **ASTScanner** (default): AST-based analysis for JS/TS/Python/Java/Go
- **Future**: SonarQube adapter, ESLint adapter, custom rules

**Metrics Collected**:
- Cyclomatic complexity
- Lines of code
- Import/export graphs
- Hotspots (high complexity or large files)
- Language distribution

### 4. LLM Integration

**Responsibility**: Generate refactoring plans using AI

**Architecture**: Provider pattern for multiple LLM backends

```typescript
interface ILLMProvider {
  name: string;
  generateRefactorPlan(request): Promise<GeneratedPlan>;
  estimateCost?(request): Promise<CostEstimate>;
}
```

**Current Implementations**:
- **OpenAI Provider**: GPT-4 (default)
- **Future**: Anthropic Claude, Azure OpenAI, local models

### 5. Event System

**Responsibility**: Decouple components via domain events

**Pattern**: Event-driven architecture with event bus

**Event Flow**:
```
Action occurs → Event published → Listeners notified → Side effects
```

**Example Events**:
- `scan.completed` → Send notification, log activity, trigger integrations
- `task.status_changed` → Update metrics, notify assignees
- `plan.generated` → Log creation, send to webhook

**Benefits**:
- Loose coupling between components
- Easy to add new features (listeners)
- Audit trail via event log
- Integration hooks for external systems

### 6. Adapter System

**Responsibility**: Make system extensible without code changes

**Adapters**:

| Adapter Type | Purpose | Implementations |
|--------------|---------|-----------------|
| IScanner | Code analysis | AST, SonarQube (future) |
| ILLMProvider | Plan generation | OpenAI, Claude (future) |
| INotification | Alerts | Email, Slack, Webhook |
| IMetrics | Observability | Prometheus (future) |

**Registration Pattern**:
```typescript
// Global registries
scannerRegistry.register(new ASTScanner(), true);
llmProviderRegistry.register(new OpenAIProvider(), true);
notificationManager.register(new SlackNotifier());
```

### 7. Data Layer (Prisma + PostgreSQL)

**Schema Design**: Relational with JSON for flexibility

**Core Entities**:
- **Codebase**: Repository to analyze
- **ScanRun**: Analysis execution
- **RefactorPlan**: Refactoring strategy
- **RefactorTask**: Actionable work items
- **PlanTemplate**: Reusable patterns

**Extended Entities (Phase 3)**:
- **CodebaseMetadata**: Tags, teams, SLA levels
- **TaskComment**: Threaded discussions
- **ScanSchedule**: Automated scanning
- **ActivityLog**: Comprehensive audit trail
- **Integration**: Webhook/notification configs

## Data Flow Examples

### Scan Execution Flow

```
1. User triggers scan via UI → POST /scans
2. API creates ScanRun record (status: "running")
3. Scanner adapter analyzes files in background
   ├── For each file: extract metrics
   ├── Aggregate into ScanSummary
   └── Detect hotspots
4. Update ScanRun (status: "completed", summaryJson)
5. Publish scan.completed event
6. Event listeners:
   ├── Log activity
   ├── Send notifications
   └── Trigger integrations
7. UI polls or receives update → displays results
```

### Plan Generation Flow

```
1. User provides goal + selects scan → POST /plans/generate
2. API retrieves scan summary from database
3. LLM provider generates structured plan
   ├── Overall strategy (markdown)
   ├── 5-15 prioritized tasks
   └── Task details (area, description, priority)
4. Create RefactorPlan + RefactorTasks in database
5. Publish plan.generated event
6. Return plan to UI → display kanban board
```

### Template Usage Flow

```
1. User browses templates → GET /templates
2. User selects template → POST /plans/from-template
3. API retrieves template and codebase
4. Substitute variables in template
   - {{codebaseName}} → actual codebase name
   - Custom variables from user input
5. Create plan with tasks from template
6. Increment template usage count
7. Publish template.used event
8. Return plan to UI
```

## Scaling Considerations

### Current (MVP Scale)

- Single server deployment
- Synchronous scanning
- In-memory job queue
- Suitable for: <100 codebases, <10 concurrent users

### Phase 4 (Growth Scale)

- **Background Jobs**: Redis + Bull for async scanning
- **Horizontal Scaling**: Stateless API servers behind load balancer
- **Caching**: Redis for scan results, plan summaries
- **Database**: Read replicas for reports
- Suitable for: <1000 codebases, <100 concurrent users

### Enterprise Scale

- **Distributed Scanning**: Kubernetes jobs for parallel analysis
- **Message Queue**: RabbitMQ/Kafka for event processing
- **Multi-Tenancy**: Schema-per-tenant or row-level security
- **CDN**: Static assets and API responses
- **Observability**: Prometheus, Grafana, distributed tracing
- Suitable for: 10,000+ codebases, 1000+ concurrent users

## Security Architecture

### Current Security

- CORS protection
- Input validation (Zod schemas)
- SQL injection prevention (Prisma)
- XSS prevention (React escaping)

### Future Security (Phase 4)

- **Authentication**: JWT tokens, OAuth 2.0
- **Authorization**: RBAC (admin, editor, viewer)
- **API Keys**: For programmatic access
- **Rate Limiting**: Prevent abuse
- **Audit Logging**: All mutations logged
- **Encryption**: Data at rest (PostgreSQL), data in transit (TLS)

## Deployment Architecture

### Development

```
docker-compose.yml:
  - postgres (database)
  - backend (API server, hot reload)
  - frontend (Next.js dev server)
```

### Production

```
Infrastructure:
  - Frontend: Vercel/Netlify (serverless)
  - Backend: Docker container on cloud (AWS ECS, GCP Cloud Run)
  - Database: Managed PostgreSQL (RDS, Cloud SQL)
  - Monitoring: CloudWatch/Stackdriver
```

### CI/CD Pipeline

```
1. Git push → GitHub Actions triggered
2. Run tests (backend + frontend)
3. Run linters
4. Build Docker images
5. Push to container registry
6. Deploy to staging
7. Run smoke tests
8. Manual approval → Deploy to production
9. Run database migrations
10. Health check verification
```

## Extension Points

For developers building on this platform:

### 1. Custom Scanners

```typescript
class CustomScanner implements IScannerAdapter {
  name = 'custom-scanner';
  supportedExtensions = ['.custom'];

  async analyzeFile(path, content) {
    // Custom analysis logic
  }
}

scannerRegistry.register(new CustomScanner());
```

### 2. Event Listeners

```typescript
eventBus.on('scan.completed', async (event) => {
  // Custom logic when scan completes
  await sendCustomNotification(event.data);
});
```

### 3. Notification Adapters

```typescript
class TeamsNotifier implements INotificationAdapter {
  name = 'teams';

  async send(notification) {
    // Send to Microsoft Teams
  }
}

notificationManager.register(new TeamsNotifier());
```

### 4. Custom Metrics

```typescript
metrics.incrementCounter('custom.metric', {
  codebase: codebaseId,
  type: 'custom-scan'
});
```

## Performance Characteristics

### Response Times (P95)

- List codebases: <50ms
- Get plan details: <100ms
- Create plan from template: <200ms
- Generate AI plan: 5-30s (depends on LLM)
- Scan small codebase (<1000 files): 10-30s
- Scan large codebase (>5000 files): 2-5 minutes

### Resource Usage

- API server: ~200MB RAM, <5% CPU (idle)
- During scan: +500MB RAM, 50-80% CPU (1 core)
- Database: ~100MB for 100 codebases with history

## Monitoring & Observability

### Logs

- Structured JSON logs in production
- Pretty console logs in development
- Correlation IDs for request tracking

### Metrics (Future)

- Request latency histograms
- Error rates by endpoint
- Scan performance (files/sec, avg complexity)
- LLM token usage and costs
- Active tasks by status

### Traces (Future)

- Distributed tracing with OpenTelemetry
- Span for each major operation
- Integration with Jaeger/Zipkin

## Future Architecture Evolution

### Phase 4: Enterprise Features

- Multi-tenancy with team workspaces
- Real-time collaboration (WebSockets)
- Advanced scheduling (cron expressions)
- Git integration (auto-trigger on push)
- Export/import (JSON, CSV, Jira format)

### Phase 5: Ecosystem Integration

- IDE plugins (VS Code, JetBrains)
- CI/CD integration (GitHub Actions, GitLab CI)
- APM integration (New Relic, DataDog)
- Project management sync (Jira, Linear, Asana)
- Code quality platforms (SonarQube, CodeClimate)

### Phase 6: AI Enhancements

- Code snippet suggestions
- Automated refactoring PRs
- Impact analysis predictions
- Smart task routing based on expertise
- Natural language queries
