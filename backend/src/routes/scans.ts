import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/db';
import { CodebaseScanner } from '../scanner/scanner';

const CreateScanSchema = z.object({
  codebaseId: z.string(),
});

export async function scanRoutes(fastify: FastifyInstance) {
  // Get all scans for a codebase
  fastify.get<{ Params: { codebaseId: string } }>(
    '/codebases/:codebaseId/scans',
    async (request, reply) => {
      const { codebaseId } = request.params;
      const scans = await prisma.scanRun.findMany({
        where: { codebaseId },
        orderBy: { startedAt: 'desc' },
      });
      return scans;
    }
  );

  // Get a specific scan
  fastify.get<{ Params: { id: string } }>('/scans/:id', async (request, reply) => {
    const { id } = request.params;
    const scan = await prisma.scanRun.findUnique({
      where: { id },
      include: {
        codebase: true,
      },
    });

    if (!scan) {
      return reply.status(404).send({ error: 'Scan not found' });
    }

    return scan;
  });

  // Create and run a new scan
  fastify.post('/scans', async (request, reply) => {
    const { codebaseId } = CreateScanSchema.parse(request.body);

    // Get the codebase
    const codebase = await prisma.codebase.findUnique({
      where: { id: codebaseId },
    });

    if (!codebase) {
      return reply.status(404).send({ error: 'Codebase not found' });
    }

    if (!codebase.repoPath) {
      return reply.status(400).send({ error: 'Codebase must have a repoPath to scan' });
    }

    // Create scan run record
    const scanRun = await prisma.scanRun.create({
      data: {
        codebaseId,
        status: 'running',
        startedAt: new Date(),
      },
    });

    // Run scan in background
    const scanner = new CodebaseScanner();

    scanner
      .scanCodebase(codebase.repoPath, (scanned, total, currentFile) => {
        console.log(`Scanning: ${scanned}/${total} - ${currentFile}`);
      })
      .then(async (summary) => {
        await prisma.scanRun.update({
          where: { id: scanRun.id },
          data: {
            status: 'completed',
            finishedAt: new Date(),
            summaryJson: summary as any,
          },
        });
        console.log(`✓ Scan ${scanRun.id} completed`);
      })
      .catch(async (error) => {
        await prisma.scanRun.update({
          where: { id: scanRun.id },
          data: {
            status: 'failed',
            finishedAt: new Date(),
            errorMessage: error.message,
          },
        });
        console.error(`✗ Scan ${scanRun.id} failed:`, error);
      });

    return reply.status(202).send(scanRun);
  });

  // Delete a scan
  fastify.delete<{ Params: { id: string } }>('/scans/:id', async (request, reply) => {
    const { id } = request.params;
    await prisma.scanRun.delete({
      where: { id },
    });
    return reply.status(204).send();
  });
}
