# Quick Start Guide

Get up and running with Refactor Assistant Workbench in 5 minutes!

## Prerequisites

- Node.js 18+
- Docker (for PostgreSQL)
- OpenAI API key

## Setup Steps

### 1. Start the Database

```bash
# Start PostgreSQL with Docker
docker-compose up -d

# Wait for database to be ready (about 10 seconds)
docker-compose logs -f postgres
# Look for "database system is ready to accept connections"
```

### 2. Configure Environment

```bash
# Backend: Edit your OpenAI API key
nano backend/.env
# Replace "your-openai-api-key-here" with your actual key

# Frontend is already configured for local development
```

### 3. Install Dependencies

```bash
# Install all dependencies (backend + frontend)
npm install
```

### 4. Setup Database

```bash
cd backend

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

cd ..
```

### 5. Start the Application

```bash
# Start both backend and frontend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## First Steps

### 1. Add Your First Codebase

1. Open http://localhost:3000
2. Navigate to **Codebases**
3. Click **+ Add Codebase**
4. Fill in:
   - Name: "My Project"
   - Repository Path: (absolute path to a local project, e.g., `/Users/you/code/my-app`)
5. Click **Create Codebase**

### 2. Run Your First Scan

1. Click on your newly created codebase
2. Click **+ Run Scan**
3. Wait for the scan to complete (status will change to "completed")
4. Click **View** to see scan results

### 3. Generate Your First Refactor Plan

1. From the codebase page, click **+ Generate Plan**
2. Select the completed scan
3. Enter a goal, for example:
   ```
   Improve code modularity by extracting business logic from controllers
   ```
4. Click **Generate Plan**
5. Wait for AI to generate the plan (about 10-30 seconds)
6. Click **View Board** to see your tasks!

## Troubleshooting

### Database won't start
```bash
# Stop and restart
docker-compose down
docker-compose up -d
```

### Port already in use
```bash
# Check what's using port 3001 (backend)
lsof -i :3001

# Check what's using port 3000 (frontend)
lsof -i :3000

# Kill the process or change ports in .env files
```

### Prisma errors
```bash
cd backend
npx prisma generate
npx prisma migrate deploy
```

### OpenAI API errors
- Make sure your API key is valid
- Check you have credits: https://platform.openai.com/usage
- Verify access to GPT-4 model

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Explore the API at http://localhost:3001/health
- Check out the Prisma Studio: `cd backend && npm run prisma:studio`
- View your database: http://localhost:5555 (after running prisma:studio)

## Stopping the Application

```bash
# Stop dev servers (Ctrl+C in the terminal where npm run dev is running)

# Stop database
docker-compose down

# To remove all data
docker-compose down -v
```

## Common Commands

```bash
# View logs
docker-compose logs -f postgres  # Database logs
npm run dev                       # Start everything
npm run dev:backend              # Backend only
npm run dev:frontend             # Frontend only

# Database management
cd backend
npm run prisma:studio            # Visual database browser
npm run prisma:migrate          # Create new migration

# Production build
npm run build                    # Build everything
npm start                        # Start production server
```

Happy refactoring! 🔧
