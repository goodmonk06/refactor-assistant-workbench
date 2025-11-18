import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/db';
import { LLMService } from '../services/llm';
import { ScanSummary } from '../types';

const CreatePlanSchema = z.object({
  codebaseId: z.string(),
  title: z.string().min(1),
  descriptionMarkdown: z.string().optional(),
  goal: z.string().optional(),
});

const GeneratePlanSchema = z.object({
  codebaseId: z.string(),
  scanId: z.string(),
  goal: z.string().min(1),
});

const UpdatePlanSchema = z.object({
  title: z.string().min(1).optional(),
  descriptionMarkdown: z.string().optional(),
});

export async function planRoutes(fastify: FastifyInstance) {
  // List all plans
  fastify.get('/plans', async (request, reply) => {
    const plans = await prisma.refactorPlan.findMany({
      include: {
        codebase: true,
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return plans;
  });

  // Get plans for a specific codebase
  fastify.get<{ Params: { codebaseId: string } }>(
    '/codebases/:codebaseId/plans',
    async (request, reply) => {
      const { codebaseId } = request.params;
      const plans = await prisma.refactorPlan.findMany({
        where: { codebaseId },
        include: {
          _count: {
            select: { tasks: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return plans;
    }
  );

  // Get a specific plan with all tasks
  fastify.get<{ Params: { id: string } }>('/plans/:id', async (request, reply) => {
    const { id } = request.params;
    const plan = await prisma.refactorPlan.findUnique({
      where: { id },
      include: {
        codebase: true,
        tasks: {
          orderBy: [{ priority: 'desc' }, { orderIndex: 'asc' }],
        },
      },
    });

    if (!plan) {
      return reply.status(404).send({ error: 'Plan not found' });
    }

    return plan;
  });

  // Create a new plan manually
  fastify.post('/plans', async (request, reply) => {
    const data = CreatePlanSchema.parse(request.body);

    const plan = await prisma.refactorPlan.create({
      data,
    });

    return reply.status(201).send(plan);
  });

  // Generate a plan using LLM
  fastify.post('/plans/generate', async (request, reply) => {
    const { codebaseId, scanId, goal } = GeneratePlanSchema.parse(request.body);

    // Get the codebase and scan
    const codebase = await prisma.codebase.findUnique({
      where: { id: codebaseId },
    });

    if (!codebase) {
      return reply.status(404).send({ error: 'Codebase not found' });
    }

    const scan = await prisma.scanRun.findUnique({
      where: { id: scanId },
    });

    if (!scan || scan.status !== 'completed' || !scan.summaryJson) {
      return reply.status(400).send({ error: 'Valid completed scan required' });
    }

    // Generate plan using LLM
    const llmService = new LLMService();
    const generatedPlan = await llmService.generateRefactorPlan({
      goal,
      scanSummary: scan.summaryJson as ScanSummary,
      codebaseName: codebase.name,
    });

    // Create plan and tasks in database
    const plan = await prisma.refactorPlan.create({
      data: {
        codebaseId,
        title: generatedPlan.title,
        descriptionMarkdown: generatedPlan.description,
        goal,
        tasks: {
          create: generatedPlan.tasks.map((task, index) => ({
            title: task.title,
            descriptionMarkdown: task.description,
            areaPath: task.areaPath,
            priority: task.priority,
            orderIndex: index,
            status: 'todo',
          })),
        },
      },
      include: {
        tasks: true,
      },
    });

    return reply.status(201).send(plan);
  });

  // Update a plan
  fastify.patch<{ Params: { id: string } }>('/plans/:id', async (request, reply) => {
    const { id } = request.params;
    const data = UpdatePlanSchema.parse(request.body);

    const plan = await prisma.refactorPlan.update({
      where: { id },
      data,
    });

    return plan;
  });

  // Delete a plan
  fastify.delete<{ Params: { id: string } }>('/plans/:id', async (request, reply) => {
    const { id } = request.params;
    await prisma.refactorPlan.delete({
      where: { id },
    });
    return reply.status(204).send();
  });
}
