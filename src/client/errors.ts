export class VintraceError extends Error {
  public readonly status: number;
  public readonly correlationId?: string;
  public readonly body?: unknown;

  constructor(message: string, status: number, correlationId?: string, body?: unknown) {
    super(message);
    this.name = 'VintraceError';
    this.status = status;
    this.correlationId = correlationId;
    this.body = body;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class VintraceAuthenticationError extends VintraceError {
  constructor(message = 'Authentication failed', correlationId?: string, body?: unknown) {
    super(message, 401, correlationId, body);
    this.name = 'VintraceAuthenticationError';
  }
}

export class VintraceRateLimitError extends VintraceError {
  public readonly retryAfter?: number;

  constructor(
    message = 'Rate limit exceeded',
    retryAfter?: number,
    correlationId?: string,
    body?: unknown
  ) {
    super(message, 429, correlationId, body);
    this.name = 'VintraceRateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class VintraceNotFoundError extends VintraceError {
  constructor(message = 'Resource not found', correlationId?: string, body?: unknown) {
    super(message, 404, correlationId, body);
    this.name = 'VintraceNotFoundError';
  }
}

export class VintraceValidationError extends VintraceError {
  constructor(message = 'Validation failed', status = 400, correlationId?: string, body?: unknown) {
    super(message, status, correlationId, body);
    this.name = 'VintraceValidationError';
  }
}

export class VintraceServerError extends VintraceError {
  constructor(message = 'Server error', status: number, correlationId?: string, body?: unknown) {
    super(message, status, correlationId, body);
    this.name = 'VintraceServerError';
  }
}

export class VintraceAggregateError extends VintraceError {
  public readonly errors: VintraceError[];

  constructor(errors: VintraceError[]) {
    const message =
      errors.length === 1
        ? errors[0].message
        : `${errors.length} errors occurred: ${errors.map((e) => e.message).join('; ')}`;
    super(
      message,
      errors[0]?.status ?? 0,
      errors[0]?.correlationId,
      errors.map((e) => e.body)
    );
    this.name = 'VintraceAggregateError';
    this.errors = errors;
  }
}

export function isRetryableStatus(status: number): boolean {
  return [408, 429, 500, 502, 503, 504].includes(status);
}
