import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/db';
import { eventBus, createEvent } from '../lib/events/domain-events';

const CreateCommentSchema = z.object({
  taskId: z.string(),
  content: z.string().min(1),
  authorName: z.string().min(1),
  authorEmail: z.string().email().optional(),
  parentId: z.string().optional(),
  mentions: z.array(z.string()).default([]),
});

const UpdateCommentSchema = z.object({
  content: z.string().min(1).optional(),
});

const AddReactionSchema = z.object({
  emoji: z.string().min(1).max(10),
});

export async function commentRoutes(fastify: FastifyInstance) {
  // Get comments for a task
  fastify.get<{ Params: { taskId: string } }>(
    '/tasks/:taskId/comments',
    async (request, reply) => {
      const { taskId } = request.params;
      const { includeDeleted } = request.query as any;

      const where: any = { taskId };
      if (!includeDeleted) {
        where.deletedAt = null;
      }

      const comments = await prisma.taskComment.findMany({
        where,
        include: {
          replies: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'asc' },
          },
          _count: {
            select: { replies: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      // Filter to only top-level comments (no parent)
      const topLevelComments = comments.filter((c) => !c.parentId);

      return topLevelComments;
    }
  );

  // Get a specific comment with its thread
  fastify.get<{ Params: { id: string } }>('/comments/:id', async (request, reply) => {
    const { id } = request.params;

    const comment = await prisma.taskComment.findUnique({
      where: { id },
      include: {
        task: true,
        parent: true,
        replies: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!comment) {
      return reply.status(404).send({ error: 'Comment not found' });
    }

    return comment;
  });

  // Create a comment
  fastify.post('/comments', async (request, reply) => {
    const data = CreateCommentSchema.parse(request.body);

    // Verify task exists
    const task = await prisma.refactorTask.findUnique({
      where: { id: data.taskId },
      include: { plan: true },
    });

    if (!task) {
      return reply.status(404).send({ error: 'Task not found' });
    }

    // If parentId is provided, verify it exists
    if (data.parentId) {
      const parentComment = await prisma.taskComment.findUnique({
        where: { id: data.parentId },
      });

      if (!parentComment) {
        return reply.status(404).send({ error: 'Parent comment not found' });
      }

      if (parentComment.taskId !== data.taskId) {
        return reply.status(400).send({ error: 'Parent comment belongs to a different task' });
      }
    }

    const comment = await prisma.taskComment.create({
      data,
    });

    await eventBus.publish(
      createEvent('task.commented', {
        commentId: comment.id,
        taskId: data.taskId,
        planId: task.planId,
        authorName: data.authorName,
        content: data.content,
        mentions: data.mentions,
      })
    );

    return reply.status(201).send(comment);
  });

  // Update a comment
  fastify.patch<{ Params: { id: string } }>('/comments/:id', async (request, reply) => {
    const { id } = request.params;
    const data = UpdateCommentSchema.parse(request.body);

    const comment = await prisma.taskComment.update({
      where: { id },
      data,
    });

    return comment;
  });

  // Soft delete a comment
  fastify.delete<{ Params: { id: string } }>('/comments/:id', async (request, reply) => {
    const { id } = request.params;

    const comment = await prisma.taskComment.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return reply.status(204).send();
  });

  // Add reaction to a comment
  fastify.post<{ Params: { id: string } }>(
    '/comments/:id/reactions',
    async (request, reply) => {
      const { id } = request.params;
      const { emoji } = AddReactionSchema.parse(request.body);

      const comment = await prisma.taskComment.findUnique({
        where: { id },
      });

      if (!comment) {
        return reply.status(404).send({ error: 'Comment not found' });
      }

      // Get current reactions or initialize
      const reactions = (comment.reactions as Record<string, number>) || {};

      // Increment reaction count
      reactions[emoji] = (reactions[emoji] || 0) + 1;

      const updated = await prisma.taskComment.update({
        where: { id },
        data: {
          reactions,
        },
      });

      return updated;
    }
  );

  // Remove reaction from a comment
  fastify.delete<{ Params: { id: string; emoji: string } }>(
    '/comments/:id/reactions/:emoji',
    async (request, reply) => {
      const { id, emoji } = request.params;

      const comment = await prisma.taskComment.findUnique({
        where: { id },
      });

      if (!comment) {
        return reply.status(404).send({ error: 'Comment not found' });
      }

      const reactions = (comment.reactions as Record<string, number>) || {};

      if (reactions[emoji] && reactions[emoji] > 0) {
        reactions[emoji]--;
        if (reactions[emoji] === 0) {
          delete reactions[emoji];
        }

        await prisma.taskComment.update({
          where: { id },
          data: {
            reactions,
          },
        });
      }

      return reply.status(204).send();
    }
  );
}
