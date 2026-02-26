import { z, ZodError, ZodType, ZodIssue } from 'zod';
import { VintraceError } from '../client/errors';
import { VintraceResult } from '../types/result';

export class VintraceValidationSchemaError extends VintraceError {
  constructor(
    message: string,
    public readonly errors: ZodIssue[],
    correlationId?: string
  ) {
    super(message, 422, correlationId);
    this.name = 'VintraceValidationSchemaError';
  }
}

export function validateResponse<T>(
  schema: ZodType<T>,
  data: unknown,
  correlationId?: string
): VintraceResult<T> {
  try {
    const validated = schema.parse(data);
    return [validated, null];
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues
        .map((e: ZodIssue) => `${e.path.join('.')}: ${e.message}`)
        .join('; ');
      return [null, new VintraceValidationSchemaError(message, error.issues, correlationId)];
    }
    return [null, new VintraceError('Response validation failed', 500, correlationId)];
  }
}

export function validateRequest<T>(
  schema: ZodType<T>,
  data: unknown,
  correlationId?: string
): VintraceResult<T> {
  try {
    const validated = schema.parse(data);
    return [validated, null];
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues
        .map((e: ZodIssue) => `${e.path.join('.')}: ${e.message}`)
        .join('; ');
      return [null, new VintraceValidationSchemaError(message, error.issues, correlationId)];
    }
    return [null, new VintraceError('Request validation failed', 500, correlationId)];
  }
}

export { z };
export type { ZodType, ZodIssue };
