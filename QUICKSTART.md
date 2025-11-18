# Quick Start Guide

Get Refactor Assistant Workbench running in **5 minutes**!

## Prerequisites

- **Docker** and **Docker Compose** installed
- **OpenAI API key** ([Get one here](https://platform.openai.com/api-keys))

## One-Command Setup

```bash
# 1. Clone and enter directory
git clone <repository-url>
cd refactor-assistant-workbench

# 2. Set up environment
cp .env.example .env
# Edit .env and add: OPENAI_API_KEY=sk-your-key-here

# 3. Start everything with Docker Compose
npm run docker:up

# Wait ~30 seconds for services to start...

# 4. Set up database (in a new terminal)
docker exec refactor_workbench_backend npx prisma migrate deploy
docker exec refactor_workbench_backend npm run db:seed

# 5. Open your browser
# 🎉 http://localhost:3000
```

That's it! You now have:
- Frontend running on http://localhost:3000
- Backend API on http://localhost:3001
- PostgreSQL database with sample data

## Explore the Sample Data

After seeding, you'll see 3 pre-configured projects:

1. **E-Commerce Platform** (TypeScript)
   - 234 files, 45K lines of code
   - Has a "Payment System Refactoring" plan with 8 tasks
   - 2 done, 1 in progress, 5 todo

2. **Legacy Monolith** (Java)
   - 567 files, 123K lines
   - "Extract Microservices" plan with 5 tasks

3. **Analytics Microservice** (Python)
   - 89 files, 12K lines
   - "Optimize Data Pipeline" plan

### Try These Features

**View the Kanban Board:**
1. Go to http://localhost:3000/codebases
2. Click on "E-Commerce Platform"
3. Under "Refactor Plans", click "Payment System Refactoring"
4. See tasks in To Do / In Progress / Done columns
5. Click "Show details" on any task to see full description
6. Change task status using the dropdown

**Explore Scan Results:**
1. Click on any codebase
2. Under "Scans", click "View" on a completed scan
3. See metrics: total files, complexity, hotspots
4. Review the "Complexity Hotspots" section

## Local Development (Alternative)

For active development with hot-reload:

```bash
# 1. Start only PostgreSQL
docker compose up -d postgres

# 2. Install dependencies
npm install

# 3. Set up backend
cd backend
cp .env.example .env
# Edit .env with DATABASE_URL and OPENAI_API_KEY

# 4. Set up database
npm run db:migrate
npm run db:generate
npm run db:seed

# 5. Start dev servers (from root)
cd ..
npm run dev

# Backend: http://localhost:3001
# Frontend: http://localhost:3000
```

## Verify Everything Works

### Check Health
```bash
# API health check
curl http://localhost:3001/health
# Should return: {"status":"ok","timestamp":"..."}

# List codebases
curl http://localhost:3001/codebases
# Should return array of 3 codebases
```

### Test the Complete Flow

**1. Create a codebase:**
```bash
curl -X POST http://localhost:3001/codebases \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Test Project",
    "repoPath": "/tmp/test",
    "mainLanguage": "TypeScript"
  }'
```

**2. View it in the UI:**
- Go to http://localhost:3000/codebases
- You should see "My Test Project" listed

## Common Commands

```bash
# View logs
npm run docker:logs

# Stop everything
npm run docker:down

# Restart services
npm run docker:down && npm run docker:up

# Run tests
npm test

# Access database directly
npm run db:studio
# Then visit http://localhost:5555
```

## Troubleshooting

### Services won't start
```bash
# Check if ports are already in use
lsof -i :3000  # Frontend
lsof -i :3001  # Backend
lsof -i :5432  # PostgreSQL

# Kill any conflicting processes
kill -9 <PID>

# Try again
npm run docker:down
npm run docker:up
```

### Database migration fails
```bash
# Reset and retry
docker compose down -v
docker compose up -d
docker exec refactor_workbench_backend npx prisma migrate deploy
docker exec refactor_workbench_backend npm run db:seed
```

### Can't see seed data
```bash
# Check backend logs
docker logs refactor_workbench_backend

# Re-run seed
docker exec refactor_workbench_backend npm run db:seed
```

### OpenAI errors when generating plans
- Verify your API key is set in `.env`
- Check you have credits: https://platform.openai.com/usage
- Ensure access to GPT-4 (or edit `backend/src/services/llm.ts` to use GPT-3.5)

## Next Steps

1. **Read the full README.md** for detailed documentation
2. **Try generating a plan:**
   - Create a codebase with a real repository path
   - Run a scan
   - Generate an AI plan with a specific goal
3. **Explore the API**: http://localhost:3001/health
4. **Run tests**: `npm test`
5. **Check database**: `npm run db:studio`

## Project Structure at a Glance

```
refactor-assistant-workbench/
├── backend/          # Fastify API (TypeScript)
│   ├── src/
│   │   ├── routes/  # API endpoints
│   │   ├── scanner/ # Code analysis
│   │   ├── services/# LLM, database
│   │   └── seed.ts  # Sample data
│   └── prisma/      # Database schema
├── frontend/        # Next.js UI
│   └── src/app/    # Pages (codebases, plans, scans)
└── docker-compose.yml
```

## Stop the Application

```bash
# Stop containers but keep data
npm run docker:down

# Stop and remove all data (fresh start)
docker compose down -v
```

---

**Quick Reference**

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Web UI |
| Backend | http://localhost:3001 | REST API |
| Health Check | http://localhost:3001/health | API status |
| Prisma Studio | http://localhost:5555 | Database browser |

Happy refactoring! 🔧

For more details, see [README.md](./README.md)
