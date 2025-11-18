# 🔧 Refactor Assistant Workbench

A comprehensive platform for planning and tracking large-scale code refactoring efforts. Analyze codebases, identify complexity hotspots, and use AI to generate structured refactoring plans with actionable tasks.

## Overview

Refactor Assistant Workbench helps development teams approach large refactoring projects systematically:

1. **Scan & Analyze**: Automatically analyze codebases for metrics like complexity, dependencies, and file sizes
2. **AI-Powered Planning**: Generate refactoring plans using GPT-4 based on scan results and your specific goals
3. **Task Management**: Track progress with a Kanban board organized by todo/in-progress/done
4. **Multi-Language Support**: Works with TypeScript, JavaScript, Python, Java, Go, Ruby, PHP, and more

## Tech Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Fastify 4 (TypeScript)
- **Database**: PostgreSQL 16 with Prisma ORM
- **AI**: OpenAI GPT-4 API
- **Testing**: Vitest
- **Linting**: ESLint with TypeScript support

### Frontend
- **Framework**: Next.js 14 (React 18)
- **Styling**: Tailwind CSS
- **Data Fetching**: SWR + Axios
- **Testing**: Vitest + Testing Library
- **Markdown**: react-markdown

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Database**: PostgreSQL 16 (Alpine)
- **Development**: Hot reload for both backend and frontend

## Domain Model Summary

### Core Entities

**Codebase**
- Represents a repository or project to be analyzed
- Contains: name, repoPath (local), githubUrl (optional), mainLanguage
- Has many: ScanRuns, RefactorPlans

**ScanRun**
- A single analysis execution on a codebase
- Contains: status, startedAt, finishedAt, summaryJson
- summaryJson includes: totalFiles, totalLines, averageComplexity, hotspots, languages, dependencyGraph

**RefactorPlan**
- A structured refactoring strategy generated from scan results
- Contains: title, descriptionMarkdown, goal
- Has many: RefactorTasks

**RefactorTask**
- Individual actionable step in a refactor plan
- Contains: title, descriptionMarkdown, areaPath, status (todo/in_progress/done), priority (1-5)
- Orderable via orderIndex

### Key Relationships
```
Codebase (1) → (N) ScanRun
Codebase (1) → (N) RefactorPlan
RefactorPlan (1) → (N) RefactorTask
```

## Getting Started

### Requirements

- **Node.js** 20+ and npm
- **Docker** and Docker Compose
- **OpenAI API Key** (for AI plan generation)

### Setup Steps

#### Option 1: Docker Compose (Recommended)

This is the fastest way to get everything running:

```bash
# 1. Clone the repository
git clone <repository-url>
cd refactor-assistant-workbench

# 2. Copy environment template
cp .env.example .env

# 3. Edit .env and add your OpenAI API key
# OPENAI_API_KEY=sk-...

# 4. Start all services (PostgreSQL + Backend + Frontend)
npm run docker:up

# 5. Wait for services to start (~30 seconds)
# Watch logs: npm run docker:logs

# 6. Run database migrations
docker exec refactor_workbench_backend npx prisma migrate deploy

# 7. Seed sample data
docker exec refactor_workbench_backend npm run db:seed

# 8. Open the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
# Health Check: http://localhost:3001/health
```

#### Option 2: Local Development

For active development with hot reload:

```bash
# 1. Start PostgreSQL with Docker
docker compose up -d postgres

# 2. Install dependencies
npm install

# 3. Set up backend environment
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL and OPENAI_API_KEY

# 4. Run database migrations
npm run db:migrate

# 5. Generate Prisma client
npm run db:generate

# 6. Seed the database
npm run db:seed

# 7. Go back to root and start dev servers
cd ..
npm run dev

# Backend: http://localhost:3001
# Frontend: http://localhost:3000
```

### Environment Variables

**Root `.env`** (for Docker Compose):
```env
OPENAI_API_KEY=your-openai-api-key-here
```

**`backend/.env`** (for local development):
```env
DATABASE_URL="postgresql://refactor:refactor123@localhost:5432/refactor_workbench?schema=public"
OPENAI_API_KEY="your-openai-api-key-here"
PORT=3001
```

**`frontend/.env.local`**:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Example Flow: Codebase → Scan → Plan → Tasks

This demonstrates the complete vertical slice implemented in Phase 2:

### 1. Add a Codebase

**Via UI:**
1. Navigate to http://localhost:3000/codebases
2. Click **+ Add Codebase**
3. Fill in:
   - Name: "My E-Commerce App"
   - Repository Path: `/path/to/your/project`
   - Main Language: "TypeScript"
4. Click **Create Codebase**

**Via API:**
```bash
curl -X POST http://localhost:3001/codebases \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My E-Commerce App",
    "repoPath": "/path/to/your/project",
    "mainLanguage": "TypeScript"
  }'
```

### 2. Run a Scan

**Via UI:**
1. Click on your codebase
2. Click **+ Run Scan**
3. Wait for scan to complete (status changes to "completed")
4. View scan results: file counts, complexity metrics, hotspots

**Via API:**
```bash
curl -X POST http://localhost:3001/scans \
  -H "Content-Type: application/json" \
  -d '{
    "codebaseId": "your-codebase-id"
  }'

# Check scan status
curl http://localhost:3001/scans/your-scan-id
```

**What the scan analyzes:**
- Total files and lines of code
- Cyclomatic complexity per file
- Import/export statements
- Complexity hotspots (files with complexity > 20 or lines > 500)
- Language breakdown
- Dependency graph

### 3. Generate a Refactor Plan

**Via UI:**
1. From the codebase detail page, click **+ Generate Plan**
2. Select your completed scan
3. Enter a refactor goal:
   ```
   Improve modularity by extracting business logic from controllers
   into service classes
   ```
4. Click **Generate Plan**
5. Wait for AI to generate (10-30 seconds)

**Via API:**
```bash
curl -X POST http://localhost:3001/plans/generate \
  -H "Content-Type: application/json" \
  -d '{
    "codebaseId": "your-codebase-id",
    "scanId": "your-scan-id",
    "goal": "Improve modularity by extracting business logic into services"
  }'
```

**AI generates:**
- Overall refactoring strategy (markdown description)
- 5-15 prioritized tasks
- Specific code areas to modify
- Task dependencies and ordering

### 4. Manage Tasks on Kanban Board

**Via UI:**
1. Click **View Board** on your plan
2. See tasks organized in three columns:
   - 📋 **To Do**: Pending tasks
   - 🚧 **In Progress**: Currently working on
   - ✅ **Done**: Completed tasks
3. Change task status via dropdown
4. Click **Show details** to see full task descriptions
5. Tasks display:
   - Priority badge (P1-P5)
   - Area path (e.g., `src/controllers`)
   - Detailed markdown description

**Via API:**
```bash
# Update task status
curl -X PATCH http://localhost:3001/tasks/your-task-id \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress"
  }'

# List all tasks for a plan
curl http://localhost:3001/plans/your-plan-id/tasks
```

### 5. Sample Data

After running `npm run db:seed`, you'll have:

**3 Sample Codebases:**
1. **E-Commerce Platform** (TypeScript)
   - 234 files, 45K lines
   - Plan: "Payment System Refactoring"
   - 8 tasks (2 done, 1 in progress, 5 todo)

2. **Legacy Monolith** (Java)
   - 567 files, 123K lines
   - Plan: "Extract Microservices from Monolith"
   - 5 tasks (1 done, 4 todo)

3. **Analytics Microservice** (Python)
   - 89 files, 12K lines
   - Plan: "Optimize Data Pipeline Performance"
   - 3 tasks (all todo)

Access these at http://localhost:3000/codebases

## API Reference

### Codebases
```
GET    /codebases           - List all codebases
GET    /codebases/:id       - Get codebase with scans and plans
POST   /codebases           - Create new codebase
PATCH  /codebases/:id       - Update codebase
DELETE /codebases/:id       - Delete codebase
```

### Scans
```
GET    /codebases/:codebaseId/scans - List scans for codebase
GET    /scans/:id                   - Get scan details
POST   /scans                       - Create and run new scan
DELETE /scans/:id                   - Delete scan
```

### Plans
```
GET    /plans                       - List all plans
GET    /codebases/:codebaseId/plans - List plans for codebase
GET    /plans/:id                   - Get plan with all tasks
POST   /plans                       - Create plan manually
POST   /plans/generate              - Generate plan using AI
PATCH  /plans/:id                   - Update plan
DELETE /plans/:id                   - Delete plan
```

### Tasks
```
GET    /plans/:planId/tasks - List tasks for plan
GET    /tasks/:id           - Get task details
POST   /tasks               - Create new task
PATCH  /tasks/:id           - Update task (status, priority, etc.)
DELETE /tasks/:id           - Delete task
```

## Development Workflow

### Running Tests

```bash
# Run all tests
npm test

# Run backend tests only
npm run test:backend

# Run frontend tests only
npm run test:frontend

# Watch mode (auto-rerun on changes)
cd backend && npm run test:watch
```

**Test Coverage:**
- Backend: Scanner logic, code analyzer, domain models
- Frontend: API type definitions
- Target: Core business logic covered

### Linting

```bash
# Lint all code
npm run lint

# Lint and auto-fix
npm run lint:backend -- --fix
```

### Database Management

```bash
# Generate Prisma client after schema changes
npm run db:generate

# Create and apply new migration
npm run db:migrate

# Push schema changes without migration (dev only)
npm run db:push

# Seed database with sample data
npm run db:seed

# Open Prisma Studio (visual database browser)
npm run db:studio
# Then visit http://localhost:5555
```

### Docker Commands

```bash
# Start all services
npm run docker:up

# Stop all services
npm run docker:down

# Rebuild images
npm run docker:build

# View logs
npm run docker:logs

# View specific service logs
docker compose logs -f backend
docker compose logs -f postgres
```

## Testing

### Backend Tests

Located in `backend/src/__tests__/`:

- **`analyzer.test.ts`**: Tests for code complexity calculation, import/export extraction, language detection
- **`scanner.test.ts`**: Tests for file filtering, summary generation, hotspot identification

Run with: `cd backend && npm test`

### Frontend Tests

Located in `frontend/src/__tests__/`:

- **`api.test.ts`**: Type definition tests for API models

Run with: `cd frontend && npm test`

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker compose ps postgres

# View database logs
docker compose logs postgres

# Restart database
docker compose restart postgres

# Reset database (WARNING: deletes all data)
cd backend
npx prisma migrate reset
```

### Port Already in Use

```bash
# Find what's using port 3001 (backend)
lsof -i :3001

# Find what's using port 3000 (frontend)
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Scan Not Starting

- Verify codebase has valid `repoPath`
- Check backend logs: `npm run docker:logs` or `cd backend && npm run dev`
- Ensure path is accessible from container (if using Docker)
- Check file permissions

### OpenAI API Errors

- Verify API key is set in `.env`
- Check API key is valid: https://platform.openai.com/api-keys
- Verify account has credits: https://platform.openai.com/usage
- Ensure access to GPT-4 model (or update model in `backend/src/services/llm.ts`)

### Build Failures

```bash
# Clean and reinstall
rm -rf node_modules backend/node_modules frontend/node_modules
npm install

# Regenerate Prisma client
npm run db:generate
```

## Future Extensions

### Near-term (Next Phase)
- [ ] Real-time scan progress updates via WebSockets
- [ ] Task assignment and collaboration features
- [ ] Drag-and-drop task reordering on Kanban
- [ ] Export plans to Markdown/PDF
- [ ] GitHub integration for auto-scanning on push
- [ ] Code snippet preview in task descriptions

### Long-term Vision
- [ ] Multi-user authentication and teams
- [ ] Historical trend tracking and metrics over time
- [ ] Integration with CI/CD pipelines
- [ ] Custom scanning rules and metrics
- [ ] Refactoring impact analysis (before/after)
- [ ] Slack/Discord notifications
- [ ] VS Code extension for in-editor task tracking
- [ ] Template library for common refactoring patterns
- [ ] Cost estimation for refactoring efforts
- [ ] Integration with project management tools (Jira, Linear)

### Ecosystem Integration
- Works well with:
  - **monorepo-dependency-map-visualizer**: Visualize dependencies, then use this tool to plan fixes
  - **SonarQube**: Import code quality metrics
  - **ESLint/TSLint**: Use existing linting rules for hotspot detection
  - **Git**: Track refactoring progress via commit analysis

## Project Structure

```
refactor-assistant-workbench/
├── backend/                 # Fastify API server
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   ├── src/
│   │   ├── __tests__/      # Vitest tests
│   │   ├── routes/         # API routes (codebases, scans, plans, tasks)
│   │   ├── scanner/        # Code analysis logic
│   │   ├── services/       # LLM, database services
│   │   ├── types/          # TypeScript types
│   │   ├── index.ts        # Server entry point
│   │   └── seed.ts         # Database seeding
│   ├── Dockerfile
│   ├── vitest.config.ts
│   └── package.json
├── frontend/               # Next.js application
│   ├── src/
│   │   ├── app/           # Pages (App Router)
│   │   │   ├── codebases/ # Codebase management
│   │   │   ├── plans/     # Plan and Kanban views
│   │   │   └── scans/     # Scan results
│   │   ├── lib/           # API client
│   │   └── __tests__/     # Vitest tests
│   ├── Dockerfile
│   ├── vitest.config.ts
│   └── package.json
├── docker-compose.yml      # Multi-container setup
├── .env.example            # Environment template
├── package.json            # Root workspace config
└── README.md
```

## Contributing

Contributions are welcome! This is a Phase 2 project with a solid foundation. Areas for contribution:

1. **Core Features**: Implement items from "Future Extensions"
2. **Testing**: Increase test coverage, add integration tests
3. **Documentation**: Improve API docs, add tutorials
4. **Performance**: Optimize scanning for large codebases
5. **UI/UX**: Enhance frontend components, add visualizations

## License

MIT License - see LICENSE file for details

## Support

- **Issues**: Report bugs or request features on GitHub
- **Documentation**: Check this README and QUICKSTART.md
- **API**: Use `/health` endpoint to verify server status

---

**Phase 2 Status**: ✅ Complete
- [x] End-to-end vertical slice (Codebase → Scan → Plan → Tasks)
- [x] Standardized DX scripts (dev, build, test, lint, db:*)
- [x] Validation and error handling
- [x] Docker environment with compose
- [x] Meaningful tests for core logic
- [x] Seed data with realistic examples
- [x] Updated documentation

Built with ❤️ for better code refactoring
