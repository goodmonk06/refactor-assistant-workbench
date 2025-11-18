import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { connectDatabase, disconnectDatabase } from './services/db';
import { codebaseRoutes } from './routes/codebases';
import { scanRoutes } from './routes/scans';
import { planRoutes } from './routes/plans';
import { taskRoutes } from './routes/tasks';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

async function start() {
  const fastify = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
  });

  // Register CORS
  await fastify.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Register routes
  await fastify.register(codebaseRoutes);
  await fastify.register(scanRoutes);
  await fastify.register(planRoutes);
  await fastify.register(taskRoutes);

  // Error handler
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error({
      err: error,
      url: request.url,
      method: request.method,
    });

    // Zod validation errors
    if (error.name === 'ZodError') {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Validation Error',
        message: 'Invalid request data',
        details: error.issues || error.message,
      });
    }

    // Fastify validation errors
    if (error.validation) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Validation Error',
        message: error.message,
        details: error.validation,
      });
    }

    // Prisma errors
    if (error.code && error.code.startsWith('P')) {
      if (error.code === 'P2002') {
        return reply.status(409).send({
          statusCode: 409,
          error: 'Conflict',
          message: 'A record with this data already exists',
        });
      }
      if (error.code === 'P2025') {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Record not found',
        });
      }
      return reply.status(500).send({
        statusCode: 500,
        error: 'Database Error',
        message: 'A database error occurred',
      });
    }

    // Not found errors
    if (error.statusCode === 404) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: error.message || 'Resource not found',
      });
    }

    // Default error response
    const statusCode = error.statusCode || 500;
    const isServerError = statusCode >= 500;

    reply.status(statusCode).send({
      statusCode,
      error: isServerError ? 'Internal Server Error' : error.name || 'Error',
      message: isServerError
        ? 'An unexpected error occurred'
        : error.message || 'An error occurred',
      ...(process.env.NODE_ENV === 'development' && isServerError
        ? { stack: error.stack }
        : {}),
    });
  });

  try {
    // Connect to database
    await connectDatabase();

    // Start server
    await fastify.listen({ port: PORT, host: '0.0.0.0' });

    console.log(`
┌─────────────────────────────────────────┐
│                                         │
│  🚀 Refactor Assistant Workbench API   │
│                                         │
│  Server: http://localhost:${PORT}        │
│  Health: http://localhost:${PORT}/health │
│                                         │
└─────────────────────────────────────────┘
`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }

  // Graceful shutdown
  const signals = ['SIGINT', 'SIGTERM'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      console.log(`\n${signal} received, shutting down gracefully...`);
      await fastify.close();
      await disconnectDatabase();
      process.exit(0);
    });
  });
}

start();
