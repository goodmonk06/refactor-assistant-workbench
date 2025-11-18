import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Phase 3 Seeding database...');

  // Clean existing data
  console.log('  Cleaning existing data...');
  await prisma.taskComment.deleteMany();
  await prisma.refactorTask.deleteMany();
  await prisma.refactorPlan.deleteMany();
  await prisma.planTemplate.deleteMany();
  await prisma.scanSchedule.deleteMany();
  await prisma.scanRun.deleteMany();
  await prisma.codebaseMetadata.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.integration.deleteMany();
  await prisma.codebase.deleteMany();

  // ============================================================================
  // 1. CREATE PLAN TEMPLATES
  // ============================================================================
  console.log('  Creating plan templates...');

  const extractServiceTemplate = await prisma.planTemplate.create({
    data: {
      name: 'Extract Service Layer',
      description: 'Standard pattern for extracting business logic from controllers into service classes',
      category: 'architecture',
      titleTemplate: 'Extract Service Layer for {{codebaseName}}',
      descriptionTemplate: `# Service Layer Extraction

## Goal
Separate business logic from controllers to improve testability and maintainability.

## Strategy
1. Identify business logic currently in controllers
2. Create service classes for each domain concept
3. Move logic to services with dependency injection
4. Update controllers to use services
5. Add comprehensive tests for services`,
      goalTemplate: 'Extract business logic from controllers into testable service classes',
      taskTemplates: [
        {
          title: 'Audit current controller logic',
          description: 'Review all controllers and identify business logic that should move to services',
          areaPath: 'src/controllers',
          priority: 5,
          orderIndex: 0,
          estimatedHours: 4,
        },
        {
          title: 'Create service layer structure',
          description: 'Set up /src/services directory with base interfaces and dependency injection',
          areaPath: 'src/services',
          priority: 5,
          orderIndex: 1,
          estimatedHours: 2,
        },
        {
          title: 'Extract user management logic',
          description: 'Create UserService and move authentication, profile management logic',
          areaPath: 'src/services',
          priority: 4,
          orderIndex: 2,
          estimatedHours: 6,
        },
        {
          title: 'Extract data processing logic',
          description: 'Create DataService for complex data transformations and aggregations',
          areaPath: 'src/services',
          priority: 4,
          orderIndex: 3,
          estimatedHours: 8,
        },
        {
          title: 'Update controllers to use services',
          description: 'Refactor controllers to delegate to services, keeping only HTTP concerns',
          areaPath: 'src/controllers',
          priority: 3,
          orderIndex: 4,
          estimatedHours: 10,
        },
        {
          title: 'Add service layer tests',
          description: 'Write unit tests for all services with mocked dependencies',
          areaPath: 'src/services/__tests__',
          priority: 5,
          orderIndex: 5,
          estimatedHours: 12,
        },
      ],
      tags: ['architecture', 'testing', 'best-practices'],
      isPublic: true,
    },
  });

  const migrateToTypeScriptTemplate = await prisma.planTemplate.create({
    data: {
      name: 'Migrate JavaScript to TypeScript',
      description: 'Progressive migration from JavaScript to TypeScript with minimal disruption',
      category: 'migration',
      titleTemplate: 'TypeScript Migration for {{codebaseName}}',
      descriptionTemplate: `# TypeScript Migration Strategy

## Approach
Incremental migration using allowJs and progressive type coverage.

## Benefits
- Type safety
- Better IDE support
- Fewer runtime errors
- Improved documentation`,
      goalTemplate: 'Migrate codebase from JavaScript to TypeScript while maintaining functionality',
      taskTemplates: [
        {
          title: 'Set up TypeScript configuration',
          description: 'Install TypeScript, configure tsconfig.json with allowJs',
          areaPath: 'root',
          priority: 5,
          orderIndex: 0,
        },
        {
          title: 'Migrate type definitions',
          description: 'Create .d.ts files for existing JavaScript modules',
          areaPath: 'src/types',
          priority: 4,
          orderIndex: 1,
        },
        {
          title: 'Convert utility functions',
          description: 'Start with pure utility functions (easiest to type)',
          areaPath: 'src/utils',
          priority: 4,
          orderIndex: 2,
        },
        {
          title: 'Convert models and types',
          description: 'Convert data models to TypeScript interfaces/classes',
          areaPath: 'src/models',
          priority: 5,
          orderIndex: 3,
        },
        {
          title: 'Convert services layer',
          description: 'Migrate business logic services to TypeScript',
          areaPath: 'src/services',
          priority: 4,
          orderIndex: 4,
        },
        {
          title: 'Convert API routes',
          description: 'Migrate route handlers with proper request/response typing',
          areaPath: 'src/routes',
          priority: 3,
          orderIndex: 5,
        },
        {
          title: 'Enable strict mode',
          description: 'Gradually enable TypeScript strict flags and fix issues',
          areaPath: 'root',
          priority: 2,
          orderIndex: 6,
        },
      ],
      tags: ['migration', 'typescript', 'modernization'],
      isPublic: true,
    },
  });

  const performanceOptimizationTemplate = await prisma.planTemplate.create({
    data: {
      name: 'Performance Optimization Sprint',
      description: 'Systematic approach to identifying and fixing performance bottlenecks',
      category: 'performance',
      titleTemplate: 'Performance Optimization for {{codebaseName}}',
      descriptionTemplate: `# Performance Optimization

## Methodology
1. Measure current baseline
2. Identify bottlenecks via profiling
3. Optimize hot paths
4. Verify improvements

## Targets
- Reduce P95 latency by 50%
- Improve throughput by 2x
- Reduce memory usage by 30%`,
      goalTemplate: 'Improve application performance across latency, throughput, and resource usage',
      taskTemplates: [
        {
          title: 'Establish performance baseline',
          description: 'Set up monitoring and record current metrics',
          areaPath: 'monitoring',
          priority: 5,
          orderIndex: 0,
        },
        {
          title: 'Profile application under load',
          description: 'Use profiling tools to identify CPU and memory hotspots',
          areaPath: 'tests/performance',
          priority: 5,
          orderIndex: 1,
        },
        {
          title: 'Optimize database queries',
          description: 'Add indexes, optimize N+1 queries, implement query caching',
          areaPath: 'src/database',
          priority: 4,
          orderIndex: 2,
        },
        {
          title: 'Implement caching layer',
          description: 'Add Redis caching for frequently accessed data',
          areaPath: 'src/cache',
          priority: 4,
          orderIndex: 3,
        },
        {
          title: 'Optimize critical code paths',
          description: 'Refactor algorithms, reduce allocations in hot loops',
          areaPath: 'src',
          priority: 3,
          orderIndex: 4,
        },
        {
          title: 'Load testing and verification',
          description: 'Run comprehensive load tests and verify targets met',
          areaPath: 'tests/performance',
          priority: 5,
          orderIndex: 5,
        },
      ],
      tags: ['performance', 'optimization', 'scalability'],
      isPublic: true,
    },
  });

  // ============================================================================
  // 2. CREATE CODEBASES WITH METADATA
  // ============================================================================
  console.log('  Creating codebases with metadata...');

  const ecommerce = await prisma.codebase.create({
    data: {
      name: 'E-Commerce Platform',
      description: 'Full-stack e-commerce application with React frontend and Node backend',
      repoPath: '/projects/ecommerce-platform',
      githubUrl: 'https://github.com/acme-corp/ecommerce-platform',
      mainLanguage: 'TypeScript',
      metadata: {
        create: {
          tags: ['production', 'customer-facing', 'high-traffic'],
          team: 'Platform Engineering',
          costCenter: 'CC-1001',
          slaLevel: 'critical',
          estimatedSize: 45000,
          techStack: ['react', 'typescript', 'node', 'postgres', 'redis'],
          customFields: {
            deploymentRegions: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
            monthlyActiveUsers: 500000,
            averageRevenuePerUser: 125.50,
          },
        },
      },
    },
  });

  const legacyMonolith = await prisma.codebase.create({
    data: {
      name: 'Legacy Monolith',
      description: 'Aging Java Spring Boot monolith requiring modernization',
      repoPath: '/projects/legacy-system',
      mainLanguage: 'Java',
      metadata: {
        create: {
          tags: ['legacy', 'technical-debt', 'monolith'],
          team: 'Backend Team',
          costCenter: 'CC-1002',
          slaLevel: 'high',
          estimatedSize: 150000,
          techStack: ['java', 'spring-boot', 'mysql', 'jsp'],
          customFields: {
            deploymentMode: 'on-premise',
            javaVersion: '11',
            lastMajorRefactor: '2019-03-15',
          },
        },
      },
    },
  });

  const mobileBFF = await prisma.codebase.create({
    data: {
      name: 'Mobile BFF Service',
      description: 'Backend-for-frontend service for mobile apps',
      repoPath: '/projects/mobile-bff',
      githubUrl: 'https://github.com/acme-corp/mobile-bff',
      mainLanguage: 'Go',
      metadata: {
        create: {
          tags: ['microservice', 'mobile', 'api'],
          team: 'Mobile Platform',
          costCenter: 'CC-1003',
          slaLevel: 'high',
          estimatedSize: 12000,
          techStack: ['go', 'grpc', 'postgres', 'redis'],
        },
      },
    },
  });

  // ============================================================================
  // 3. CREATE SCAN SCHEDULES
  // ============================================================================
  console.log('  Creating scan schedules...');

  await prisma.scanSchedule.create({
    data: {
      codebaseId: ecommerce.id,
      name: 'Daily Scan',
      description: 'Automated daily scan to track code quality trends',
      cronExpression: '0 2 * * *', // 2 AM daily
      timezone: 'UTC',
      enabled: true,
      scanType: 'full',
      nextRunAt: new Date(Date.now() + 86400000), // tomorrow
    },
  });

  await prisma.scanSchedule.create({
    data: {
      codebaseId: legacyMonolith.id,
      name: 'Weekly Deep Scan',
      description: 'Comprehensive weekly scan for legacy codebase',
      cronExpression: '0 3 * * 0', // 3 AM on Sundays
      timezone: 'UTC',
      enabled: true,
      scanType: 'full',
    },
  });

  // ============================================================================
  // 4. CREATE SCANS WITH DETAILED METRICS
  // ============================================================================
  console.log('  Creating scans...');

  const ecommerceScan = await prisma.scanRun.create({
    data: {
      codebaseId: ecommerce.id,
      status: 'completed',
      startedAt: new Date('2024-01-15T10:00:00Z'),
      finishedAt: new Date('2024-01-15T10:05:23Z'),
      scanType: 'full',
      filesScanned: 234,
      duration: 323000,
      triggeredBy: 'manual',
      summaryJson: {
        totalFiles: 234,
        totalLines: 45678,
        averageComplexity: 12.5,
        languages: { typescript: 180, javascript: 45, css: 9 },
        hotspots: [
          {
            path: 'src/services/payment/PaymentProcessor.ts',
            lines: 850,
            complexity: 45,
            imports: ['stripe', 'paypal-sdk', './validators'],
            exports: ['PaymentProcessor'],
            language: 'typescript',
          },
          {
            path: 'src/controllers/OrderController.ts',
            lines: 650,
            complexity: 38,
            imports: ['express', './services/OrderService'],
            exports: ['OrderController'],
            language: 'typescript',
          },
        ],
        dependencyGraph: {},
      },
    },
  });

  // ============================================================================
  // 5. CREATE PLANS WITH TEMPLATES
  // ============================================================================
  console.log('  Creating refactor plans...');

  const ecommercePlan = await prisma.refactorPlan.create({
    data: {
      codebaseId: ecommerce.id,
      templateId: extractServiceTemplate.id,
      title: 'Extract Service Layer for E-Commerce Platform',
      status: 'active',
      priority: 5,
      estimatedEffort: 42,
      actualEffort: 16,
      goal: 'Extract business logic from controllers into testable service classes',
      descriptionMarkdown: `# Service Layer Extraction

## Current State
Controllers contain business logic mixed with HTTP handling.

## Target State
Clean separation with controllers handling HTTP, services handling logic.

## Approach
Gradual extraction starting with payment and order management.`,
    },
  });

  const legacyPlan = await prisma.refactorPlan.create({
    data: {
      codebaseId: legacyMonolith.id,
      title: 'Microservices Extraction',
      status: 'active',
      priority: 5,
      estimatedEffort: 320,
      goal: 'Extract microservices from monolith using strangler fig pattern',
      descriptionMarkdown: `# Microservices Extraction

Extract independent microservices while keeping monolith running.`,
    },
  });

  // ============================================================================
  // 6. CREATE TASKS WITH COMMENTS
  // ============================================================================
  console.log('  Creating tasks with comments...');

  const task1 = await prisma.refactorTask.create({
    data: {
      planId: ecommercePlan.id,
      title: 'Audit current controller logic',
      descriptionMarkdown: 'Review all controllers and identify business logic that should move to services',
      areaPath: 'src/controllers',
      status: 'done',
      priority: 5,
      orderIndex: 0,
      assignedTo: 'alice@acme.com',
      estimatedHours: 4,
      actualHours: 3,
      startedAt: new Date('2024-01-16T09:00:00Z'),
      completedAt: new Date('2024-01-16T12:00:00Z'),
    },
  });

  const task2 = await prisma.refactorTask.create({
    data: {
      planId: ecommercePlan.id,
      title: 'Create service layer structure',
      descriptionMarkdown: 'Set up /src/services directory with base interfaces and dependency injection',
      areaPath: 'src/services',
      status: 'in_progress',
      priority: 5,
      orderIndex: 1,
      assignedTo: 'bob@acme.com',
      estimatedHours: 2,
      startedAt: new Date('2024-01-17T10:00:00Z'),
    },
  });

  const task3 = await prisma.refactorTask.create({
    data: {
      planId: ecommercePlan.id,
      title: 'Extract user management logic',
      descriptionMarkdown: 'Create UserService and move authentication, profile management logic',
      areaPath: 'src/services',
      status: 'todo',
      priority: 4,
      orderIndex: 2,
      assignedTo: 'alice@acme.com',
      estimatedHours: 6,
      dueDate: new Date('2024-01-25T00:00:00Z'),
    },
  });

  // Add comments to demonstrate collaboration
  const comment1 = await prisma.taskComment.create({
    data: {
      taskId: task2.id,
      content: 'Started working on the base service interface. Should we use dependency injection with a container or just constructor injection?',
      authorName: 'Bob Developer',
      authorEmail: 'bob@acme.com',
    },
  });

  await prisma.taskComment.create({
    data: {
      taskId: task2.id,
      parentId: comment1.id,
      content: '@bob Let\'s keep it simple with constructor injection for now. We can add a DI container later if needed.',
      authorName: 'Alice Senior',
      authorEmail: 'alice@acme.com',
      mentions: ['bob@acme.com'],
    },
  });

  await prisma.taskComment.create({
    data: {
      taskId: task2.id,
      content: 'I\'ve pushed the base interfaces to the feature branch. Please review when you get a chance.',
      authorName: 'Bob Developer',
      authorEmail: 'bob@acme.com',
      reactions: { '👍': 2, '🎉': 1 },
    },
  });

  await prisma.taskComment.create({
    data: {
      taskId: task3.id,
      content: 'Quick question: Should UserService handle both authentication and authorization, or should those be separate services?',
      authorName: 'Alice Senior',
      authorEmail: 'alice@acme.com',
    },
  });

  // ============================================================================
  // 7. CREATE INTEGRATIONS
  // ============================================================================
  console.log('  Creating integrations...');

  await prisma.integration.create({
    data: {
      name: 'Slack Notifications',
      type: 'slack',
      enabled: true,
      config: {
        webhookUrl: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX',
        channel: '#refactoring-updates',
      },
      events: ['scan.completed', 'plan.generated', 'task.status_changed'],
    },
  });

  await prisma.integration.create({
    data: {
      name: 'GitHub Webhook',
      type: 'webhook',
      enabled: false,
      config: {
        url: 'https://api.example.com/refactor-webhook',
        secret: 'webhook-secret-key',
      },
      events: ['plan.created', 'task.completed'],
    },
  });

  console.log('✅ Phase 3 Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`  - Created ${3} plan templates (Extract Service, TypeScript Migration, Performance)`);
  console.log(`  - Created ${3} codebases with metadata`);
  console.log(`  - Created ${2} scan schedules`);
  console.log(`  - Created ${1} scan run`);
  console.log(`  - Created ${2} refactor plans`);
  console.log(`  - Created ${3} tasks with assignments and dates`);
  console.log(`  - Created ${4} comments demonstrating collaboration`);
  console.log(`  - Created ${2} integrations`);
  console.log('\n🎯 Demonstrates:');
  console.log(`  - Template system for reusable refactoring patterns`);
  console.log(`  - Codebase metadata (tags, teams, SLA levels)`);
  console.log(`  - Automated scan scheduling`);
  console.log(`  - Task collaboration with threaded comments and reactions`);
  console.log(`  - Integration webhooks for external systems`);
  console.log(`  - Realistic project tracking (hours, assignments, dates)`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
