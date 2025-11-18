import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  console.log('  Cleaning existing data...');
  await prisma.refactorTask.deleteMany();
  await prisma.refactorPlan.deleteMany();
  await prisma.scanRun.deleteMany();
  await prisma.codebase.deleteMany();

  // Create sample codebases
  console.log('  Creating sample codebases...');

  const ecommercePlatform = await prisma.codebase.create({
    data: {
      name: 'E-Commerce Platform',
      repoPath: '/example/ecommerce-platform',
      githubUrl: 'https://github.com/example/ecommerce-platform',
      mainLanguage: 'TypeScript',
    },
  });

  const legacyMonolith = await prisma.codebase.create({
    data: {
      name: 'Legacy Monolith',
      repoPath: '/example/legacy-system',
      mainLanguage: 'Java',
    },
  });

  const analyticsService = await prisma.codebase.create({
    data: {
      name: 'Analytics Microservice',
      repoPath: '/example/analytics-service',
      githubUrl: 'https://github.com/example/analytics',
      mainLanguage: 'Python',
    },
  });

  // Create scan runs
  console.log('  Creating scan runs...');

  const ecommerceScan = await prisma.scanRun.create({
    data: {
      codebaseId: ecommercePlatform.id,
      status: 'completed',
      startedAt: new Date('2024-01-15T10:00:00Z'),
      finishedAt: new Date('2024-01-15T10:05:00Z'),
      summaryJson: {
        totalFiles: 234,
        totalLines: 45678,
        averageComplexity: 12.5,
        languages: {
          typescript: 180,
          javascript: 45,
          css: 9,
        },
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
            imports: ['express', './services/OrderService', './validators'],
            exports: ['OrderController'],
            language: 'typescript',
          },
          {
            path: 'src/models/User.ts',
            lines: 520,
            complexity: 32,
            imports: ['mongoose', 'bcrypt', 'jsonwebtoken'],
            exports: ['UserModel', 'UserSchema'],
            language: 'typescript',
          },
        ],
        dependencyGraph: {
          'src/index.ts': ['express', './routes', './middleware'],
          'src/routes/index.ts': ['./orders', './users', './products'],
          'src/services/payment/PaymentProcessor.ts': ['stripe', 'paypal-sdk'],
        },
      },
    },
  });

  const legacyScan = await prisma.scanRun.create({
    data: {
      codebaseId: legacyMonolith.id,
      status: 'completed',
      startedAt: new Date('2024-01-16T14:00:00Z'),
      finishedAt: new Date('2024-01-16T14:12:00Z'),
      summaryJson: {
        totalFiles: 567,
        totalLines: 123456,
        averageComplexity: 18.7,
        languages: {
          java: 520,
          xml: 35,
          properties: 12,
        },
        hotspots: [
          {
            path: 'src/main/java/com/example/service/LegacyService.java',
            lines: 1200,
            complexity: 68,
            imports: ['java.util.*', 'com.example.dao.*', 'org.springframework.*'],
            exports: ['LegacyService'],
            language: 'java',
          },
          {
            path: 'src/main/java/com/example/controller/MainController.java',
            lines: 980,
            complexity: 54,
            imports: ['javax.servlet.*', 'com.example.service.*'],
            exports: ['MainController'],
            language: 'java',
          },
        ],
        dependencyGraph: {},
      },
    },
  });

  const analyticsScan = await prisma.scanRun.create({
    data: {
      codebaseId: analyticsService.id,
      status: 'completed',
      startedAt: new Date('2024-01-17T09:00:00Z'),
      finishedAt: new Date('2024-01-17T09:03:00Z'),
      summaryJson: {
        totalFiles: 89,
        totalLines: 12345,
        averageComplexity: 8.3,
        languages: {
          python: 78,
          yaml: 8,
          shell: 3,
        },
        hotspots: [
          {
            path: 'src/analytics/data_processor.py',
            lines: 420,
            complexity: 28,
            imports: ['pandas', 'numpy', 'sqlalchemy'],
            exports: ['DataProcessor', 'process_events'],
            language: 'python',
          },
        ],
        dependencyGraph: {},
      },
    },
  });

  // Create refactor plans
  console.log('  Creating refactor plans...');

  const ecommercePlan = await prisma.refactorPlan.create({
    data: {
      codebaseId: ecommercePlatform.id,
      title: 'Payment System Refactoring',
      goal: 'Modularize payment processing to support multiple providers and improve testability',
      descriptionMarkdown: `# Payment System Refactoring

## Goals
- Decouple payment providers from core business logic
- Improve unit test coverage from 45% to 85%
- Support adding new payment providers without modifying existing code

## Strategy
Use the Strategy pattern to encapsulate payment provider logic and dependency injection for better testability.

## Expected Outcomes
- Reduced coupling between payment logic and business logic
- Easier to add new payment providers
- Better error handling and retry mechanisms
- Improved monitoring and logging`,
      tasks: {
        create: [
          {
            title: 'Extract PaymentProvider interface',
            descriptionMarkdown: `Create a common interface that all payment providers must implement.

**Interface methods:**
- \`processPayment(amount, currency, metadata)\`
- \`refundPayment(transactionId)\`
- \`getPaymentStatus(transactionId)\`

This will allow us to treat all payment providers uniformly.`,
            areaPath: 'src/services/payment',
            status: 'done',
            priority: 5,
            orderIndex: 0,
          },
          {
            title: 'Implement StripeProvider adapter',
            descriptionMarkdown: `Create a concrete implementation of PaymentProvider for Stripe.

Move existing Stripe-specific code from PaymentProcessor into this adapter.
Ensure all error cases are properly handled.`,
            areaPath: 'src/services/payment/providers',
            status: 'done',
            priority: 5,
            orderIndex: 1,
          },
          {
            title: 'Implement PayPalProvider adapter',
            descriptionMarkdown: `Create a concrete implementation of PaymentProvider for PayPal.

Extract PayPal logic from PaymentProcessor.
Add proper retry logic for transient failures.`,
            areaPath: 'src/services/payment/providers',
            status: 'in_progress',
            priority: 4,
            orderIndex: 2,
          },
          {
            title: 'Create PaymentProviderFactory',
            descriptionMarkdown: `Implement a factory pattern to instantiate the correct provider based on configuration.

This will make it easy to add new providers in the future without modifying existing code.`,
            areaPath: 'src/services/payment',
            status: 'todo',
            priority: 4,
            orderIndex: 3,
          },
          {
            title: 'Refactor PaymentProcessor to use providers',
            descriptionMarkdown: `Update PaymentProcessor to work with PaymentProvider interface instead of directly calling Stripe/PayPal.

Use dependency injection to make it testable.`,
            areaPath: 'src/services/payment',
            status: 'todo',
            priority: 5,
            orderIndex: 4,
          },
          {
            title: 'Add comprehensive unit tests',
            descriptionMarkdown: `Write unit tests for:
- Each payment provider implementation
- PaymentProcessor with mocked providers
- Factory logic

Target: 85% code coverage`,
            areaPath: 'src/services/payment/__tests__',
            status: 'todo',
            priority: 3,
            orderIndex: 5,
          },
          {
            title: 'Update OrderController to use new payment flow',
            descriptionMarkdown: `Modify the order controller to work with the refactored payment system.

Ensure backward compatibility during the transition.`,
            areaPath: 'src/controllers',
            status: 'todo',
            priority: 3,
            orderIndex: 6,
          },
          {
            title: 'Add monitoring and metrics',
            descriptionMarkdown: `Implement metrics tracking for:
- Payment success/failure rates by provider
- Response times
- Retry attempts

Use Prometheus or similar.`,
            areaPath: 'src/services/payment',
            status: 'todo',
            priority: 2,
            orderIndex: 7,
          },
        ],
      },
    },
    include: {
      tasks: true,
    },
  });

  const legacyPlan = await prisma.refactorPlan.create({
    data: {
      codebaseId: legacyMonolith.id,
      title: 'Extract Microservices from Monolith',
      goal: 'Break apart the monolithic application into smaller, independently deployable microservices',
      descriptionMarkdown: `# Microservices Extraction

## Current State
The legacy monolith handles everything: user management, orders, inventory, notifications.
It's become difficult to deploy, test, and scale.

## Target Architecture
Extract distinct bounded contexts into separate services:
1. User Service
2. Order Service
3. Inventory Service
4. Notification Service

## Migration Strategy
Strangler Fig pattern - gradually extract services while keeping the monolith running.`,
      tasks: {
        create: [
          {
            title: 'Identify bounded contexts and dependencies',
            descriptionMarkdown: `Map out the current architecture and identify clear boundaries between domains.

Document dependencies between components to understand extraction order.`,
            areaPath: 'documentation',
            status: 'done',
            priority: 5,
            orderIndex: 0,
          },
          {
            title: 'Set up service mesh infrastructure',
            descriptionMarkdown: `Prepare the infrastructure for microservices:
- Service discovery
- API gateway
- Message broker
- Shared logging/monitoring`,
            areaPath: 'infrastructure',
            status: 'todo',
            priority: 5,
            orderIndex: 1,
          },
          {
            title: 'Extract User Service',
            descriptionMarkdown: `Create a standalone User Service that handles:
- Authentication
- User profiles
- Permissions

Implement API compatibility layer for gradual migration.`,
            areaPath: 'services/user-service',
            status: 'todo',
            priority: 4,
            orderIndex: 2,
          },
          {
            title: 'Implement event-driven communication',
            descriptionMarkdown: `Set up event bus for async communication between services.

Define events for:
- User created/updated
- Order placed
- Inventory changed`,
            areaPath: 'shared/events',
            status: 'todo',
            priority: 4,
            orderIndex: 3,
          },
          {
            title: 'Extract Order Service',
            descriptionMarkdown: `Create Order Service handling:
- Order creation
- Order status tracking
- Order history

Consume user events, publish order events.`,
            areaPath: 'services/order-service',
            status: 'todo',
            priority: 3,
            orderIndex: 4,
          },
        ],
      },
    },
    include: {
      tasks: true,
    },
  });

  const analyticsPlan = await prisma.refactorPlan.create({
    data: {
      codebaseId: analyticsService.id,
      title: 'Optimize Data Pipeline Performance',
      goal: 'Improve data processing throughput and reduce latency for real-time analytics',
      descriptionMarkdown: `# Data Pipeline Optimization

## Problem
Current pipeline processes 10K events/minute but needs to handle 100K events/minute.
P95 latency is 5 seconds, needs to be under 500ms.

## Approach
- Introduce async processing
- Optimize database queries
- Add caching layer
- Implement data partitioning`,
      tasks: {
        create: [
          {
            title: 'Profile current performance bottlenecks',
            descriptionMarkdown: `Use profiling tools to identify slow operations.

Focus on:
- Database query performance
- Data transformation logic
- External API calls`,
            areaPath: 'src/analytics',
            status: 'todo',
            priority: 5,
            orderIndex: 0,
          },
          {
            title: 'Implement async event processing with Celery',
            descriptionMarkdown: `Replace synchronous processing with Celery task queue.

This will allow horizontal scaling of workers.`,
            areaPath: 'src/analytics/tasks',
            status: 'todo',
            priority: 4,
            orderIndex: 1,
          },
          {
            title: 'Add Redis caching for frequent queries',
            descriptionMarkdown: `Cache aggregated results and frequently accessed data.

Implement cache invalidation strategy.`,
            areaPath: 'src/analytics/cache',
            status: 'todo',
            priority: 3,
            orderIndex: 2,
          },
        ],
      },
    },
    include: {
      tasks: true,
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`  - Created ${3} codebases`);
  console.log(`  - Created ${3} scan runs`);
  console.log(`  - Created ${3} refactor plans`);
  console.log(
    `  - Created ${ecommercePlan.tasks.length + legacyPlan.tasks.length + analyticsPlan.tasks.length} tasks`
  );
  console.log('\n🎯 Sample data:');
  console.log(`  - E-Commerce Platform (${ecommercePlatform.id})`);
  console.log(`    → Payment System Refactoring plan`);
  console.log(`  - Legacy Monolith (${legacyMonolith.id})`);
  console.log(`    → Microservices Extraction plan`);
  console.log(`  - Analytics Service (${analyticsService.id})`);
  console.log(`    → Data Pipeline Optimization plan`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
