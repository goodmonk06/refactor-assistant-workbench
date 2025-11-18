import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/db';

const CreateCodebaseSchema = z.object({
  name: z.string().min(1),
  repoPath: z.string().optional(),
  githubUrl: z.string().url().optional(),
  mainLanguage: z.string().optional(),
});

const UpdateCodebaseSchema = z.object({
  name: z.string().min(1).optional(),
  repoPath: z.string().optional(),
  githubUrl: z.string().url().optional(),
  mainLanguage: z.string().optional(),
});

export async function codebaseRoutes(fastify: FastifyInstance) {
  // List all codebases
  fastify.get('/codebases', async (request, reply) => {
    const codebases = await prisma.codebase.findMany({
      include: {
        _count: {
          select: {
            scanRuns: true,
            refactorPlans: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return codebases;
  });

  // Get a single codebase
  fastify.get<{ Params: { id: string } }>('/codebases/:id', async (request, reply) => {
    const { id } = request.params;
    const codebase = await prisma.codebase.findUnique({
      where: { id },
      include: {
        scanRuns: {
          orderBy: { startedAt: 'desc' },
          take: 10,
        },
        refactorPlans: {
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { tasks: true },
            },
          },
        },
      },
    });

    if (!codebase) {
      return reply.status(404).send({ error: 'Codebase not found' });
    }

    return codebase;
  });

  // Create a new codebase
  fastify.post('/codebases', async (request, reply) => {
    const data = CreateCodebaseSchema.parse(request.body);
    const codebase = await prisma.codebase.create({
      data,
    });
    return reply.status(201).send(codebase);
  });

  // Update a codebase
  fastify.patch<{ Params: { id: string } }>('/codebases/:id', async (request, reply) => {
    const { id } = request.params;
    const data = UpdateCodebaseSchema.parse(request.body);

    const codebase = await prisma.codebase.update({
      where: { id },
      data,
    });

    return codebase;
  });

  // Delete a codebase
  fastify.delete<{ Params: { id: string } }>('/codebases/:id', async (request, reply) => {
    const { id } = request.params;
    await prisma.codebase.delete({
      where: { id },
    });
    return reply.status(204).send();
  });
}
