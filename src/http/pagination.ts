import { VintraceResult } from '../types/result';
import { VintraceError, VintraceAggregateError } from '../client/errors';

export interface PaginatedResponse<T> {
  totalResults: number;
  offset: number;
  limit: number;
  first: string | null;
  previous: string | null;
  next: string | null;
  last: string | null;
  results: T[];
}

export interface PaginationOptions {
  limit?: number;
  concurrency?: number;
}

export async function* paginate<T>(
  fetchFn: (offset: number, limit: number) => Promise<VintraceResult<PaginatedResponse<T>>>,
  options: PaginationOptions = {}
): AsyncGenerator<T> {
  const limit = options.limit ?? 100;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const [response, error] = await fetchFn(offset, limit);

    if (error) {
      throw error;
    }

    if (response === null) {
      break;
    }

    for (const item of response.results) {
      yield item;
    }

    offset += limit;
    hasMore = response.next !== null;
  }
}

export async function batchGet<T>(
  ids: string[],
  fetchFn: (id: string) => Promise<VintraceResult<T>>,
  options: { concurrency?: number } = {}
): Promise<VintraceResult<T[]>> {
  const concurrency = options.concurrency ?? 5;
  const errors: VintraceError[] = [];
  const results: T[] = [];

  for (let i = 0; i < ids.length; i += concurrency) {
    const batch = ids.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(batch.map((id) => fetchFn(id)));

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        const [data, error] = result.value;
        if (error) {
          errors.push(error);
        } else if (data !== null) {
          results.push(data);
        }
      } else {
        errors.push(new VintraceError(result.reason?.message ?? 'Unknown error', 0));
      }
    }
  }

  if (errors.length > 0) {
    return [null, new VintraceAggregateError(errors)];
  }

  return [results, null];
}
