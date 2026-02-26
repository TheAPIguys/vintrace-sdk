import { DEFAULT_OPTIONS } from '../client/config';
import {
  VintraceError,
  VintraceAuthenticationError,
  VintraceRateLimitError,
  VintraceNotFoundError,
  VintraceValidationError,
  VintraceServerError,
  isRetryableStatus,
} from '../client/errors';
import { VintraceResult } from '../types/result';
import { ZodType } from 'zod';
import { validateRequest, validateResponse } from '../validation';

export interface RequestOptions<T = unknown> {
  timeout?: number;
  maxRetries?: number;
  validateResponse?: boolean;
  validateRequest?: boolean;
  responseSchema?: ZodType<T>;
  requestSchema?: ZodType<unknown>;
}

function generateCorrelationId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getRetryAfterFromHeaders(headers: Headers): number | undefined {
  const retryAfter = headers.get('retry-after');
  if (retryAfter) {
    const parsed = parseInt(retryAfter, 10);
    return isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

export class VintraceFetchError extends VintraceError {
  constructor(message: string, status: number, correlationId?: string, body?: unknown) {
    super(message, status, correlationId, body);
    this.name = 'VintraceFetchError';
  }
}

export async function vintraceFetch<T = unknown>(
  baseUrl: string,
  organization: string,
  token: string,
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  options: RequestOptions = {},
  body?: unknown
): Promise<VintraceResult<T>> {
  const timeout = options.timeout ?? DEFAULT_OPTIONS.timeout;
  const maxRetries = options.maxRetries ?? DEFAULT_OPTIONS.maxRetries;

  const isBodylessMethod = method === 'GET' || method === 'DELETE';
  let url = `${baseUrl}/${organization}/api/${endpoint}`;
  const correlationId = generateCorrelationId();

  if (isBodylessMethod && body && typeof body === 'object') {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    }
    const qs = params.toString();
    if (qs) url = `${url}?${qs}`;
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'correlation-id': correlationId,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (options.validateRequest && options.requestSchema && body) {
    const [validatedBody, requestError] = validateRequest(
      options.requestSchema,
      body,
      correlationId
    );
    if (requestError) {
      return [null, requestError];
    }
    body = validatedBody;
  }

  try {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          method,
          headers,
          body: isBodylessMethod ? undefined : body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseCorrelationId = response.headers.get('correlation-id') || correlationId;

        if (!response.ok) {
          let responseBody: unknown;
          const contentType = response.headers.get('content-type');
          try {
            if (contentType?.includes('application/json')) {
              responseBody = await response.json();
            } else {
              responseBody = await response.text();
            }
          } catch {
            // ignore body parse failure
          }

          const retryAfter = getRetryAfterFromHeaders(response.headers);
          let error: VintraceError;

          if (response.status === 401) {
            error = new VintraceAuthenticationError(
              'Authentication failed',
              responseCorrelationId,
              responseBody
            );
          } else if (response.status === 404) {
            error = new VintraceNotFoundError(
              'Resource not found',
              responseCorrelationId,
              responseBody
            );
          } else if (response.status === 429) {
            error = new VintraceRateLimitError(
              'Rate limit exceeded',
              retryAfter,
              responseCorrelationId,
              responseBody
            );
          } else if (response.status >= 400 && response.status < 500) {
            error = new VintraceValidationError(
              'Request validation failed',
              response.status,
              responseCorrelationId,
              responseBody
            );
          } else if (response.status >= 500) {
            error = new VintraceServerError(
              'Server error',
              response.status,
              responseCorrelationId,
              responseBody
            );
          } else {
            error = new VintraceError(
              `Request failed with status ${response.status}`,
              response.status,
              responseCorrelationId,
              responseBody
            );
          }

          if (error instanceof VintraceRateLimitError && attempt < maxRetries) {
            const delay = error.retryAfter ?? Math.pow(2, attempt) * 1000;
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
          if (error instanceof VintraceAuthenticationError) {
            return [null, error];
          }
          if (isRetryableStatus(error.status) && attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }

          return [null, error];
        }

        if (response.status === 204) {
          return [null, null];
        }

        const data = (await response.json()) as T;

        if (options.validateResponse && options.responseSchema) {
          const [validatedData, responseError] = validateResponse(
            options.responseSchema,
            data,
            responseCorrelationId
          );
          if (responseError) {
            return [null, responseError];
          }
          return [validatedData as T, null];
        }

        return [data, null];
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof VintraceError) {
          throw error;
        }

        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            if (attempt < maxRetries) {
              const delay = Math.pow(2, attempt) * 1000;
              await new Promise((resolve) => setTimeout(resolve, delay));
              continue;
            }
            return [null, new VintraceError('Request timeout', 408, correlationId)];
          }
          return [null, new VintraceFetchError(error.message, 0, correlationId)];
        }

        return [null, new VintraceFetchError('Unknown error', 0, correlationId)];
      }
    }

    return [null, new VintraceError('Max retries exceeded', 0, correlationId)];
  } catch (error) {
    if (error instanceof VintraceError) {
      return [null, error];
    }
    return [
      null,
      new VintraceFetchError(
        error instanceof Error ? error.message : 'Unknown error',
        0,
        correlationId
      ),
    ];
  }
}
