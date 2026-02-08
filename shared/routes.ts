import { z } from 'zod';
import { repositories, scans, fileAnalyses, createRepoRequestSchema } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  repos: {
    create: {
      method: 'POST' as const,
      path: '/api/repos' as const,
      input: createRepoRequestSchema,
      responses: {
        201: z.custom<typeof repositories.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/repos' as const,
      responses: {
        200: z.array(z.custom<typeof repositories.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/repos/:id' as const,
      responses: {
        200: z.custom<typeof repositories.$inferSelect>(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/repos/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
  },
  scans: {
    create: {
      method: 'POST' as const,
      path: '/api/repos/:id/scan' as const,
      responses: {
        201: z.custom<typeof scans.$inferSelect>(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/repos/:id/scans' as const,
      responses: {
        200: z.array(z.custom<typeof scans.$inferSelect>()),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/scans/:id' as const,
      responses: {
        200: z.object({
          scan: z.custom<typeof scans.$inferSelect>(),
          files: z.array(z.custom<typeof fileAnalyses.$inferSelect>()),
        }),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
