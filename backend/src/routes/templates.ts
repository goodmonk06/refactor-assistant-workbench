import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/db';
import { eventBus, createEvent } from '../lib/events/domain-events';

const CreateTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  titleTemplate: z.string().min(1),
  descriptionTemplate: z.string().optional(),
  goalTemplate: z.string().optional(),
  taskTemplates: z.array(
    z.object({
      title: z.string(),
      description: z.string().optional(),
      areaPath: z.string().optional(),
      priority: z.number().int().min(0).max(5).default(0),
      orderIndex: z.number().int().default(0),
      estimatedHours: z.number().int().optional(),
    })
  ),
  tags: z.array(z.string()).default([]),
  isPublic: z.boolean().default(true),
});

const UpdateTemplateSchema = CreateTemplateSchema.partial();

const CreatePlanFromTemplateSchema = z.object({
  codebaseId: z.string(),
  templateId: z.string(),
  variables: z.record(z.string()).optional(), // For template variable substitution
});

export async function templateRoutes(fastify: FastifyInstance) {
  // List all templates
  fastify.get('/templates', async (request, reply) => {
    const { category, isPublic, search } = request.query as any;

    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (isPublic !== undefined) {
      where.isPublic = isPublic === 'true';
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const templates = await prisma.planTemplate.findMany({
      where,
      orderBy: [{ usageCount: 'desc' }, { createdAt: 'desc' }],
    });

    return templates;
  });

  // Get template categories
  fastify.get('/templates/categories', async (request, reply) => {
    const categories = await prisma.planTemplate.findMany({
      where: { category: { not: null } },
      select: { category: true },
      distinct: ['category'],
    });

    return categories.map((c) => c.category).filter(Boolean);
  });

  // Get a specific template
  fastify.get<{ Params: { id: string } }>('/templates/:id', async (request, reply) => {
    const { id } = request.params;

    const template = await prisma.planTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: { plans: true },
        },
      },
    });

    if (!template) {
      return reply.status(404).send({ error: 'Template not found' });
    }

    return template;
  });

  // Create a new template
  fastify.post('/templates', async (request, reply) => {
    const data = CreateTemplateSchema.parse(request.body);

    const template = await prisma.planTemplate.create({
      data: {
        ...data,
        taskTemplates: data.taskTemplates as any,
      },
    });

    await eventBus.publish(
      createEvent('template.created', {
        templateId: template.id,
        name: template.name,
        category: template.category,
      })
    );

    return reply.status(201).send(template);
  });

  // Update a template
  fastify.patch<{ Params: { id: string } }>('/templates/:id', async (request, reply) => {
    const { id } = request.params;
    const data = UpdateTemplateSchema.parse(request.body);

    const template = await prisma.planTemplate.update({
      where: { id },
      data: {
        ...data,
        ...(data.taskTemplates ? { taskTemplates: data.taskTemplates as any } : {}),
      },
    });

    return template;
  });

  // Delete a template
  fastify.delete<{ Params: { id: string } }>('/templates/:id', async (request, reply) => {
    const { id } = request.params;

    await prisma.planTemplate.delete({
      where: { id },
    });

    return reply.status(204).send();
  });

  // Create a plan from a template
  fastify.post('/plans/from-template', async (request, reply) => {
    const { codebaseId, templateId, variables } = CreatePlanFromTemplateSchema.parse(request.body);

    // Get the template
    const template = await prisma.planTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return reply.status(404).send({ error: 'Template not found' });
    }

    // Get the codebase
    const codebase = await prisma.codebase.findUnique({
      where: { id: codebaseId },
    });

    if (!codebase) {
      return reply.status(404).send({ error: 'Codebase not found' });
    }

    // Apply variable substitution
    const substitutedTitle = substituteVariables(template.titleTemplate, {
      codebaseName: codebase.name,
      ...(variables || {}),
    });
    const substitutedDescription = template.descriptionTemplate
      ? substituteVariables(template.descriptionTemplate, {
          codebaseName: codebase.name,
          ...(variables || {}),
        })
      : undefined;
    const substitutedGoal = template.goalTemplate
      ? substituteVariables(template.goalTemplate, {
          codebaseName: codebase.name,
          ...(variables || {}),
        })
      : undefined;

    // Create the plan with tasks
    const plan = await prisma.refactorPlan.create({
      data: {
        codebaseId,
        templateId,
        title: substitutedTitle,
        descriptionMarkdown: substitutedDescription,
        goal: substitutedGoal,
        status: 'draft',
        tasks: {
          create: (template.taskTemplates as any[]).map((taskTemplate, index) => ({
            title: substituteVariables(taskTemplate.title, {
              codebaseName: codebase.name,
              ...(variables || {}),
            }),
            descriptionMarkdown: taskTemplate.description
              ? substituteVariables(taskTemplate.description, {
                  codebaseName: codebase.name,
                  ...(variables || {}),
                })
              : undefined,
            areaPath: taskTemplate.areaPath,
            priority: taskTemplate.priority || 0,
            orderIndex: taskTemplate.orderIndex !== undefined ? taskTemplate.orderIndex : index,
            estimatedHours: taskTemplate.estimatedHours,
            status: 'todo',
          })),
        },
      },
      include: {
        tasks: true,
      },
    });

    // Increment template usage count
    await prisma.planTemplate.update({
      where: { id: templateId },
      data: {
        usageCount: { increment: 1 },
      },
    });

    await eventBus.publish(
      createEvent('template.used', {
        templateId: template.id,
        planId: plan.id,
        codebaseId,
      })
    );

    await eventBus.publish(
      createEvent('plan.created', {
        planId: plan.id,
        codebaseId,
        title: plan.title,
        taskCount: plan.tasks.length,
        fromTemplate: true,
      })
    );

    return reply.status(201).send(plan);
  });
}

/**
 * Simple variable substitution in templates
 * Replaces {{variableName}} with values from the variables object
 */
function substituteVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}
