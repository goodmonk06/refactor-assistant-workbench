# 🔧 Refactor Assistant Workbench

A comprehensive tool for planning and tracking large-scale code refactoring efforts. Analyze your codebase, identify complexity hotspots, and use AI to generate structured refactoring plans with actionable tasks.

## Features

- **📊 Codebase Scanning**: Analyze code metrics including complexity, file sizes, and dependency patterns
- **🤖 AI-Powered Planning**: Generate refactoring plans using OpenAI GPT-4 based on scan results
- **📋 Kanban Task Board**: Visual task management with drag-and-drop status updates
- **🔍 Hotspot Detection**: Automatically identify problematic code areas that need attention
- **📈 Multi-Language Support**: Works with TypeScript, JavaScript, Python, Java, Go, and more
- **🎯 Goal-Oriented**: Create plans tailored to specific refactoring objectives

## Tech Stack

**Backend:**
- Fastify (TypeScript)
- Prisma + PostgreSQL
- OpenAI API

**Frontend:**
- Next.js 14
- React
- Tailwind CSS
- SWR for data fetching

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- OpenAI API key

## Installation

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd refactor-assistant-workbench
npm install
```

### 2. Set Up Backend

```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env with your settings:
# DATABASE_URL="postgresql://user:password@localhost:5432/refactor_workbench?schema=public"
# OPENAI_API_KEY="your-openai-api-key"
# PORT=3001

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Install backend dependencies (if not done from root)
npm install
```

### 3. Set Up Frontend

```bash
cd ../frontend

# Copy environment template
cp .env.local.example .env.local

# Edit .env.local with:
# NEXT_PUBLIC_API_URL=http://localhost:3001

# Install frontend dependencies (if not done from root)
npm install
```

### 4. Start Development Servers

From the root directory:

```bash
# Start both backend and frontend
npm run dev

# Or start them separately:
npm run dev:backend  # Backend runs on http://localhost:3001
npm run dev:frontend # Frontend runs on http://localhost:3000
```

Visit http://localhost:3000 to access the application.

## Usage Guide

### 1. Add a Codebase

1. Navigate to **Codebases** page
2. Click **+ Add Codebase**
3. Fill in:
   - **Name**: Your project name
   - **Local Repository Path**: Absolute path to your code (e.g., `/Users/you/projects/my-app`)
   - **GitHub URL**: (optional) Link to the repository
   - **Main Language**: (optional) Primary programming language

### 2. Run a Scan

1. Go to your codebase detail page
2. Click **+ Run Scan**
3. Wait for the scan to complete (you'll see a "completed" status)
4. View scan results including:
   - Total files and lines of code
   - Average complexity
   - Language breakdown
   - Complexity hotspots

### 3. Generate a Refactor Plan

1. From the codebase detail page, click **+ Generate Plan**
2. Select a completed scan from the dropdown
3. Enter your **Refactor Goal** (e.g., "Modularize the authentication system to improve testability")
4. Click **Generate Plan**
5. The AI will create a structured plan with prioritized tasks

### 4. Manage Tasks on the Kanban Board

1. Click on a plan to view its kanban board
2. Tasks are organized in three columns:
   - **📋 To Do**: Pending tasks
   - **🚧 In Progress**: Currently being worked on
   - **✅ Done**: Completed tasks
3. Change task status using the dropdown in each card
4. View task details by clicking "Show details"
5. Tasks are color-coded by priority (P1-P5)

## Integration with monorepo-dependency-map-visualizer

The Refactor Assistant Workbench complements tools like [monorepo-dependency-map-visualizer](https://github.com/example/monorepo-dependency-map-visualizer). Here's how to use them together:

### Workflow

1. **Visualize Dependencies**: Use `monorepo-dependency-map-visualizer` to create visual dependency graphs
2. **Identify Issues**: Spot circular dependencies, coupling problems, or architectural issues
3. **Import to Workbench**: Add the same codebase to Refactor Assistant Workbench
4. **Scan & Analyze**: Run a scan to get complexity metrics
5. **Generate Plan**: Create an AI-powered refactoring plan targeting the issues you found
6. **Execute**: Use the kanban board to track refactoring progress
7. **Verify**: Re-run the dependency visualizer to confirm improvements

### Example: Breaking Circular Dependencies

```bash
# 1. Generate dependency graph
cd my-monorepo
npx monorepo-dependency-map-visualizer --output deps.json

# 2. Identify circular dependencies in the visualization

# 3. In Refactor Workbench, scan the codebase
#    Goal: "Break circular dependencies between packages A, B, and C"

# 4. AI generates tasks like:
#    - Extract shared interfaces to common package
#    - Move domain logic from B to A
#    - Remove direct imports between A and C
#    - Update import paths across affected files

# 5. Execute tasks using the kanban board

# 6. Re-run dependency visualizer to verify fixes
npx monorepo-dependency-map-visualizer --output deps-after.json
```

## Database Schema

### Codebase
Stores information about code repositories being analyzed.

### ScanRun
Records of scanning operations with metrics and results.

### RefactorPlan
High-level refactoring strategies linked to codebases.

### RefactorTask
Individual actionable tasks within a plan, with status tracking.

## API Endpoints

### Codebases
- `GET /codebases` - List all codebases
- `GET /codebases/:id` - Get codebase details
- `POST /codebases` - Create new codebase
- `PATCH /codebases/:id` - Update codebase
- `DELETE /codebases/:id` - Delete codebase

### Scans
- `GET /codebases/:codebaseId/scans` - List scans for a codebase
- `GET /scans/:id` - Get scan details
- `POST /scans` - Create and run new scan
- `DELETE /scans/:id` - Delete scan

### Plans
- `GET /plans` - List all plans
- `GET /codebases/:codebaseId/plans` - List plans for a codebase
- `GET /plans/:id` - Get plan with tasks
- `POST /plans` - Create plan manually
- `POST /plans/generate` - Generate plan using AI
- `PATCH /plans/:id` - Update plan
- `DELETE /plans/:id` - Delete plan

### Tasks
- `GET /plans/:planId/tasks` - List tasks for a plan
- `GET /tasks/:id` - Get task details
- `POST /tasks` - Create new task
- `PATCH /tasks/:id` - Update task (including status)
- `DELETE /tasks/:id` - Delete task

## Development

### Run Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Database Management

```bash
cd backend

# Open Prisma Studio to view/edit data
npm run prisma:studio

# Create a new migration
npm run prisma:migrate

# Reset database (warning: deletes all data!)
npx prisma migrate reset
```

### Build for Production

```bash
# Build both backend and frontend
npm run build

# Start production server
npm start
```

## Environment Variables

### Backend (.env)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/refactor_workbench?schema=public"
OPENAI_API_KEY="sk-..."
PORT=3001
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Scanning Algorithm

The scanner analyzes code files and calculates:

1. **Complexity**: Cyclomatic complexity based on decision points (if, for, while, case, catch, &&, ||, ?)
2. **File Metrics**: Lines of code, file size in bytes
3. **Dependencies**: Import and export statements
4. **Language Detection**: Based on file extensions
5. **Hotspots**: Files with complexity > 20 or lines > 500

Supported languages: JavaScript, TypeScript, Python, Java, Go, Ruby, PHP, C#, C++, C, Rust, Swift, Kotlin

## AI Plan Generation

The LLM service uses GPT-4 to:
- Analyze scan metrics and hotspots
- Consider your specific refactoring goal
- Generate a structured plan with:
  - Overall strategy description (markdown)
  - 5-15 prioritized tasks
  - Specific code areas to address
  - Dependencies between tasks

## Troubleshooting

### Database Connection Failed
- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in .env
- Ensure database exists: `createdb refactor_workbench`

### Scan Not Starting
- Verify the codebase has a valid `repoPath`
- Check file permissions on the repository path
- Look for errors in backend logs

### OpenAI API Errors
- Verify your API key is valid
- Check your OpenAI account has credits
- Ensure you have access to GPT-4 (or update model in `backend/src/services/llm.ts`)

### Frontend Can't Connect to Backend
- Verify backend is running on port 3001
- Check NEXT_PUBLIC_API_URL in frontend/.env.local
- Check for CORS issues in browser console

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Roadmap

- [ ] GitHub repository cloning support
- [ ] Git integration for automatic commit tracking
- [ ] Custom metrics and rules
- [ ] Export plans to markdown/PDF
- [ ] Team collaboration features
- [ ] Integration with CI/CD pipelines
- [ ] Code diff visualization
- [ ] Refactoring impact analysis
- [ ] Historical trend tracking
- [ ] Slack/Discord notifications

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review API endpoint examples

---

Built with ❤️ for better code refactoring
