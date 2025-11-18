import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/db';

const CreateTaskSchema = z.object({
  planId: z.string(),
  title: z.string().min(1),
  descriptionMarkdown: z.string().optional(),
  areaPath: z.string().optional(),
  priority: z.number().int().min(0).max(5).default(0),
  status: z.enum(['todo', 'in_progress', 'done']).default('todo'),
});

const UpdateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  descriptionMarkdown: z.string().optional(),
  areaPath: z.string().optional(),
  priority: z.number().int().min(0).max(5).optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  orderIndex: z.number().int().optional(),
});

export async function taskRoutes(fastify: FastifyInstance) {
  // Get tasks for a plan
  fastify.get<{ Params: { planId: string } }>(
    '/plans/:planId/tasks',
    async (request, reply) => {
      const { planId } = request.params;
      const tasks = await prisma.refactorTask.findMany({
        where: { planId },
        orderBy: [{ priority: 'desc' }, { orderIndex: 'asc' }],
      });
      return tasks;
    }
  );

  // Get a specific task
  fastify.get<{ Params: { id: string } }>('/tasks/:id', async (request, reply) => {
    const { id } = request.params;
    const task = await prisma.refactorTask.findUnique({
      where: { id },
      include: {
        plan: {
          include: {
            codebase: true,
          },
        },
      },
    });

    if (!task) {
      return reply.status(404).send({ error: 'Task not found' });
    }

    return task;
  });

  // Create a new task
  fastify.post('/tasks', async (request, reply) => {
    const data = CreateTaskSchema.parse(request.body);

    // Get the current max orderIndex for this plan
    const maxOrder = await prisma.refactorTask.aggregate({
      where: { planId: data.planId },
      _max: { orderIndex: true },
    });

    const task = await prisma.refactorTask.create({
      data: {
        ...data,
        orderIndex: (maxOrder._max.orderIndex || 0) + 1,
      },
    });

    return reply.status(201).send(task);
  });

  // Update a task
  fastify.patch<{ Params: { id: string } }>('/tasks/:id', async (request, reply) => {
    const { id } = request.params;
    const data = UpdateTaskSchema.parse(request.body);

    const task = await prisma.refactorTask.update({
      where: { id },
      data,
    });

    return task;
  });

  // Delete a task
  fastify.delete<{ Params: { id: string } }>('/tasks/:id', async (request, reply) => {
    const { id } = request.params;
    await prisma.refactorTask.delete({
      where: { id },
    });
    return reply.status(204).send();
  });
}
